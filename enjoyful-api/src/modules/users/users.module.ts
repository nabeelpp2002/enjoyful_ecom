import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';

@Module({
  imports: [
    AuthModule,    // re-exports User model
    OrdersModule,  // re-exports Order model
    // Reviews module owns the Review model — re-register here so UsersService can inject it.
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    ReviewsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
