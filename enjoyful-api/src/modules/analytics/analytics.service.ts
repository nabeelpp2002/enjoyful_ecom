import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Event, EventDocument, EventType } from './schemas/event.schema';
import { TrackEventDto } from './dto/track-event.dto';

export interface TopProduct {
  productId: string;
  productName: string;
  count: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopRevenueProduct {
  name: string;
  revenue: number;
  units: number;
}

export interface RevenueStats {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  revenueByDay: RevenueByDay[];
  topProducts: TopRevenueProduct[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel('Order') private orderModel: Model<Document>,
  ) {}

  async track(dto: TrackEventDto, headers: Record<string, string | string[] | undefined>) {
    const userAgent = String(headers['user-agent'] ?? '');
    await this.eventModel.create({
      type: dto.type as EventType,
      sessionId: dto.sessionId,
      productId: dto.productId && Types.ObjectId.isValid(dto.productId)
        ? new Types.ObjectId(dto.productId)
        : null,
      productName: dto.productName ?? '',
      path: dto.path ?? '',
      query: dto.query ?? '',
      referrer: dto.referrer ?? '',
      device: dto.device ?? this.detectDevice(userAgent),
      userAgent,
      metadata: dto.metadata ?? {},
    });
    return { tracked: true };
  }

  async dashboard(daysBack = 7) {
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const previousSince = new Date(Date.now() - 2 * daysBack * 24 * 60 * 60 * 1000);

    const [
      currentTotals,
      previousTotals,
      uniqueVisitors,
      previousUniqueVisitors,
      topViewed,
      topClicked,
      topAddedToCart,
      topSearches,
      timeSeries,
      deviceBreakdown,
      recentEvents,
    ] = await Promise.all([
      this.aggregateCounts(since),
      this.aggregateCounts(previousSince, since),
      this.countUniqueVisitors(since),
      this.countUniqueVisitors(previousSince, since),
      this.topProducts('product_view', since, 5),
      this.topProducts('product_click', since, 5),
      this.topProducts('add_to_cart', since, 5),
      this.topSearchQueries(since, 10),
      this.dailyTimeSeries(since),
      this.deviceBreakdown(since),
      this.eventModel.find({ createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
    ]);

    const totals = {
      visitors: uniqueVisitors,
      pageViews: currentTotals.page_view ?? 0,
      productViews: currentTotals.product_view ?? 0,
      productClicks: currentTotals.product_click ?? 0,
      addToCart: currentTotals.add_to_cart ?? 0,
      addToWishlist: currentTotals.add_to_wishlist ?? 0,
      searches: currentTotals.search ?? 0,
      checkouts: currentTotals.checkout_initiated ?? 0,
    };

    const previous = {
      visitors: previousUniqueVisitors,
      pageViews: previousTotals.page_view ?? 0,
      productViews: previousTotals.product_view ?? 0,
      productClicks: previousTotals.product_click ?? 0,
      addToCart: previousTotals.add_to_cart ?? 0,
    };

    const clickThroughRate = totals.productViews
      ? +(totals.productClicks / totals.productViews * 100).toFixed(1)
      : 0;
    const cartConversionRate = totals.productViews
      ? +(totals.addToCart / totals.productViews * 100).toFixed(1)
      : 0;

    return {
      windowDays: daysBack,
      totals,
      previous,
      derived: { clickThroughRate, cartConversionRate },
      topViewed,
      topClicked,
      topAddedToCart,
      topSearches,
      timeSeries,
      deviceBreakdown,
      recentEvents,
    };
  }

  async getRevenueStats(daysBack = 30): Promise<RevenueStats> {
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const matchStage = {
      status: { $ne: 'cancelled' },
      createdAt: { $gte: since },
    };

    const [totalResult, byDay, topProducts] = await Promise.all([
      // (1) Total revenue, order count, average order value
      this.orderModel.aggregate<{
        _id: null;
        totalRevenue: number;
        orderCount: number;
        averageOrderValue: number;
      }>([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            orderCount: { $sum: 1 },
            averageOrderValue: { $avg: '$total' },
          },
        },
      ]),

      // (2) Revenue by day
      this.orderModel.aggregate<{ _id: string; revenue: number; orders: number }>([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // (3) Top 5 products by revenue
      this.orderModel.aggregate<{ _id: string; revenue: number; units: number }>([
        { $match: matchStage },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            units: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const summary = totalResult[0];

    return {
      totalRevenue: summary ? +summary.totalRevenue.toFixed(2) : 0,
      orderCount: summary ? summary.orderCount : 0,
      averageOrderValue: summary ? +summary.averageOrderValue.toFixed(2) : 0,
      revenueByDay: byDay.map(r => ({
        date: r._id,
        revenue: +r.revenue.toFixed(2),
        orders: r.orders,
      })),
      topProducts: topProducts.map(r => ({
        name: r._id,
        revenue: +r.revenue.toFixed(2),
        units: r.units,
      })),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async aggregateCounts(from: Date, until?: Date): Promise<Record<string, number>> {
    const match: Record<string, unknown> = { createdAt: { $gte: from, ...(until ? { $lt: until } : {}) } };
    const rows = await this.eventModel.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map(r => [r._id, r.count]));
  }

  private async countUniqueVisitors(from: Date, until?: Date): Promise<number> {
    const match: Record<string, unknown> = { createdAt: { $gte: from, ...(until ? { $lt: until } : {}) } };
    const rows = await this.eventModel.aggregate<{ _id: null; count: number }>([
      { $match: match },
      { $group: { _id: '$sessionId' } },
      { $count: 'count' },
    ]);
    return rows[0]?.count ?? 0;
  }

  private async topProducts(type: string, from: Date, limit: number): Promise<TopProduct[]> {
    const rows = await this.eventModel.aggregate<{ _id: string; productName: string; count: number }>([
      { $match: { type, createdAt: { $gte: from }, productId: { $ne: null } } },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
    return rows.map(r => ({
      productId: String(r._id ?? ''),
      productName: r.productName,
      count: r.count,
    }));
  }

  private async topSearchQueries(from: Date, limit: number): Promise<Array<{ query: string; count: number }>> {
    const rows = await this.eventModel.aggregate<{ _id: string; count: number }>([
      { $match: { type: 'search', createdAt: { $gte: from }, query: { $nin: ['', null] } } },
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
    return rows.map(r => ({ query: r._id, count: r.count }));
  }

  private async dailyTimeSeries(from: Date): Promise<TimeSeriesPoint[]> {
    const rows = await this.eventModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return rows.map(r => ({ date: r._id, count: r.count }));
  }

  private async deviceBreakdown(from: Date): Promise<Array<{ device: string; count: number }>> {
    const rows = await this.eventModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: { $ifNull: ['$device', 'unknown'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return rows.map(r => ({ device: r._id, count: r.count }));
  }

  private detectDevice(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile';
    if (/ipad|tablet/.test(ua)) return 'tablet';
    return 'desktop';
  }
}
