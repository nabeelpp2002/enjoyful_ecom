import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { SanitizeMiddleware } from './common/middleware/sanitize.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { BannersModule } from './modules/banners/banners.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MediaModule } from './modules/media/media.module';
import { CarouselModule } from './modules/carousel/carousel.module';
import { CategoryBannersModule } from './modules/category-banners/category-banners.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EmailModule } from './modules/email/email.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UsersModule } from './modules/users/users.module';
import { ContactModule } from './modules/contact/contact.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 100 },
    ]),

    AuthModule,
    CategoriesModule,
    ProductsModule,
    BannersModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    MediaModule,
    CarouselModule,
    CategoryBannersModule,
    AnalyticsModule,
    EmailModule,
    ReviewsModule,
    UsersModule,
    ContactModule,
    FeedbackModule,
    SettingsModule,
  ],
  providers: [
    // ThrottlerGuard runs first so rate-limit rejections happen before auth.
    // All @Throttle() decorators on controllers are now enforced.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Strip MongoDB operator keys ($gt, $where, etc.) and dot-notation keys
    // from every request body and query string before they reach any controller.
    consumer.apply(SanitizeMiddleware).forRoutes('*');
  }
}
