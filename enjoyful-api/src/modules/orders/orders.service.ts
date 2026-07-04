import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
  ) {}

  async createFromCart(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    const cart = await this.cartModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('items.product', 'price name image deletedAt');

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const items = cart.items.map((item) => {
      // After populate, a live product is a document (has _id); a missing or
      // hard-deleted reference comes back as null. Soft-deleted products still
      // populate, so we check deletedAt explicitly. Reject either case so an
      // order can never be created against a product that no longer exists.
      const product = item.product as any;
      const isLiveDoc = product && !(product instanceof Types.ObjectId) && product._id;
      if (!isLiveDoc) {
        throw new BadRequestException(
          `A product in your cart is no longer available${item.nameSnapshot ? ` ("${item.nameSnapshot}")` : ''}. Please remove it and try again.`,
        );
      }
      if (product.deletedAt) {
        throw new BadRequestException(
          `"${product.name ?? item.nameSnapshot}" is no longer available. Please remove it from your cart.`,
        );
      }
      // Use the live price from the populated product document as source of
      // truth to prevent stale-snapshot exploitation. Fall back to the stored
      // snapshot only when the live value is not available (should not happen
      // for an active product but handles edge cases gracefully).
      const price = product.price ?? item.priceSnapshot ?? 0;
      const quantity = item.quantity;
      return {
        product: product._id,
        name: item.nameSnapshot ?? product.name ?? '',
        image: item.imageSnapshot ?? product.image ?? '',
        price,
        quantity,
        subtotal: price * quantity,
      };
    });

    // Recompute subtotal and total from live prices so the stored snapshots
    // can never be used to manufacture an artificially low order total.
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingCost = 0;
    const total = subtotal + shippingCost;

    if (total <= 0) {
      throw new BadRequestException(
        'Order total must be greater than zero. Please check that all products have valid prices.',
      );
    }

    const orderNumber = await this.generateOrderNumber();

    const order = await this.orderModel.create({
      orderNumber,
      user: new Types.ObjectId(userId),
      items,
      shippingAddress: dto.shippingAddress,
      subtotal,
      shippingCost,
      total,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
    });

    await this.cartModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { $set: { items: [] } },
    );

    return order;
  }

  async findAll(
    userId: string,
    role: string,
    query: { page?: number; limit?: number },
  ): Promise<{ data: OrderDocument[]; meta: Record<string, number> }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> =
      role === 'admin' ? {} : { user: new Types.ObjectId(userId) };

    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      data: data as unknown as OrderDocument[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string, role: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name image slug')
      .lean();

    if (!order) throw new NotFoundException('Order not found');

    if (role !== 'admin' && order.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order as unknown as OrderDocument;
  }

  async updateStatus(id: string, status: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .lean();
    if (!order) throw new NotFoundException('Order not found');
    return order as unknown as OrderDocument;
  }

  async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const countToday = await this.orderModel.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const sequence = String(countToday + 1).padStart(4, '0');
    return `EJL-${dateStr}-${sequence}`;
  }
}
