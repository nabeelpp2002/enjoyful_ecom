import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { OtpToken, OtpTokenDocument } from './schemas/otp-token.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BrevoService } from '../email/brevo.service';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(OtpToken.name) private otpModel: Model<OtpTokenDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
    private brevo: BrevoService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ email: dto.email.toLowerCase() }).lean();
    if (exists) throw new ConflictException('Email already registered');

    const user = await this.userModel.create(dto);
    const tokens = await this.generateTokens(user.id as string, user.email, user.role);
    await this.storeRefreshToken(user.id as string, tokens.refreshToken);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password')
      .lean();

    if (!user || !user.password || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) throw new UnauthorizedException('Account deactivated');

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async adminLogin(dto: LoginDto) {
    const result = await this.login(dto);
    if (result.user.role !== 'admin') {
      throw new ForbiddenException('Admin access only');
    }
    return result;
  }

  async refreshTokens(userId: string, incomingToken: string) {
    const user = await this.userModel
      .findById(userId)
      .select('+refreshToken')
      .lean();

    if (!user?.refreshToken) throw new UnauthorizedException('Access denied');
    if (!user.isActive) throw new UnauthorizedException('Account deactivated');

    const tokenMatches = await bcrypt.compare(incomingToken, user.refreshToken);
    if (!tokenMatches) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens(userId, user.email, user.role);
    await this.storeRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { $unset: { refreshToken: '' } });
  }

  async getMe(userId: string) {
    return this.userModel.findById(userId).lean();
  }

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const hashed = await bcrypt.hash(token, 10);
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashed });
  }

  private sanitizeUser(user: UserDocument | Record<string, unknown>) {
    const { password: _p, refreshToken: _r, ...safe } = user as Record<string, unknown>;
    return safe;
  }

  // ─── OTP (passwordless email) ─────────────────────────────────────────

  /** Step 1 — generate, hash, store, email. Never reveals whether an account exists. */
  async requestOtp(emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Valid email required');
    }

    // Resend cooldown: reject if a token was created < 60s ago.
    const recent = await this.otpModel
      .findOne({ email, usedAt: null })
      .sort({ createdAt: -1 })
      .lean();
    if (recent) {
      const createdAt = (recent as unknown as { createdAt: Date }).createdAt;
      const ageSec = (Date.now() - new Date(createdAt).getTime()) / 1000;
      if (ageSec < OTP_RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - ageSec);
        throw new BadRequestException(`Please wait ${wait}s before requesting another code`);
      }
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.otpModel.create({ email, codeHash, expiresAt });

    try {
      await this.brevo.sendOtp(email, code, OTP_TTL_MINUTES);
    } catch (err) {
      this.logger.error(`Failed to send OTP to ${email}: ${(err as Error).message}`);
      // Still return ok=true to avoid leaking whether the email is configured.
    }

    return { ok: true, ttlMinutes: OTP_TTL_MINUTES };
  }

  /** Step 2 — verify code, upsert user, issue tokens. */
  async verifyOtp(emailRaw: string, code: string) {
    const email = emailRaw.trim().toLowerCase();
    if (!email || !code || !/^\d{6}$/.test(code)) {
      throw new BadRequestException('Email and 6-digit code required');
    }

    const token = await this.otpModel
      .findOne({ email, usedAt: null })
      .sort({ createdAt: -1 });

    if (!token) throw new UnauthorizedException('No active code — request a new one');
    if (token.expiresAt < new Date()) throw new UnauthorizedException('Code expired — request a new one');
    if (token.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many attempts — request a new code');
    }

    const ok = await bcrypt.compare(code, token.codeHash);
    if (!ok) {
      token.attempts += 1;
      await token.save();
      throw new UnauthorizedException('Incorrect code');
    }

    token.usedAt = new Date();
    await token.save();

    // Upsert user (create on first OTP sign-in)
    let user = await this.userModel.findOne({ email }).lean();
    if (!user) {
      const created = await this.userModel.create({
        email,
        firstName: '',
        lastName: '',
        emailVerified: true,
        providers: ['otp'],
        role: 'customer',
      });
      user = created.toObject();
    } else {
      const providers = new Set(user.providers ?? []);
      providers.add('otp');
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { emailVerified: true, providers: Array.from(providers) } },
      );
    }

    if (!user.isActive) throw new UnauthorizedException('Account deactivated');

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────

  /** Verifies Google ID token via tokeninfo endpoint, upserts user, issues tokens. */
  async googleLogin(idToken: string) {
    if (!idToken) throw new BadRequestException('Missing Google ID token');

    const expectedClientId = this.config.get<string>('GOOGLE_CLIENT_ID', '');

    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) throw new UnauthorizedException('Invalid Google token');
    const payload = (await res.json()) as {
      aud?: string; email?: string; email_verified?: string | boolean;
      sub?: string; name?: string; given_name?: string; family_name?: string; picture?: string;
    };

    if (expectedClientId && payload.aud !== expectedClientId) {
      throw new UnauthorizedException('Google token audience mismatch');
    }
    if (!payload.email || !payload.sub) {
      throw new UnauthorizedException('Google token missing email or sub');
    }
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
    if (!emailVerified) throw new UnauthorizedException('Google account email not verified');

    const email = payload.email.toLowerCase();
    let user = await this.userModel.findOne({ email }).lean();
    if (!user) {
      const created = await this.userModel.create({
        email,
        firstName: payload.given_name ?? '',
        lastName: payload.family_name ?? '',
        emailVerified: true,
        providers: ['google'],
        googleSub: payload.sub,
        avatarUrl: payload.picture ?? '',
        role: 'customer',
      });
      user = created.toObject();
    } else {
      const providers = new Set(user.providers ?? []);
      providers.add('google');
      await this.userModel.updateOne(
        { _id: user._id },
        {
          $set: {
            emailVerified: true,
            providers: Array.from(providers),
            googleSub: payload.sub,
            ...(user.avatarUrl ? {} : { avatarUrl: payload.picture ?? '' }),
            ...(user.firstName ? {} : { firstName: payload.given_name ?? '' }),
            ...(user.lastName ? {} : { lastName: payload.family_name ?? '' }),
          },
        },
      );
    }

    if (!user.isActive) throw new UnauthorizedException('Account deactivated');

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);
    return { ...tokens, user: this.sanitizeUser(user) };
  }
}
