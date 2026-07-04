import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import { BrevoService } from '../email/brevo.service';

export class ContactDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  subject?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}

@Controller('contact')
export class ContactController {
  constructor(private readonly brevo: BrevoService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async submit(@Body() dto: ContactDto): Promise<{ ok: boolean }> {
    await this.brevo.sendContactForm(dto.name, dto.email, dto.subject, dto.message);
    return { ok: true };
  }
}
