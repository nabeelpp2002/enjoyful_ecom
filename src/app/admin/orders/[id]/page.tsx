'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { adminApi } from '@/lib/admin-api';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

interface OrderItem {
  product?: { name: string; image?: string } | string;
  name?: string;
  image?: string;
  quantity: number;
  price: number;
  currency?: string;
}

interface OrderAddress {
  fullName?: string;
  street?: string;
  city?: string;
  country?: string;
  phone?: string;
}

interface Order {
  _id: string;
  orderNumber?: string;
  createdAt: string;
  user?: { email: string; name?: string } | string;
  items: OrderItem[];
  total: number;
  currency?: string;
  status: OrderStatus;
  shippingAddress?: OrderAddress;
  notes?: string;
}

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    adminApi
      .getOrder(id)
      .then((res) => setOrder(res.data ?? res))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusUpdate(newStatus: string) {
    if (!order) return;
    setUpdating(true);
    setUpdateMsg('');
    try {
      await adminApi.updateOrderStatus(id, newStatus);
      setOrder((prev) => prev ? { ...prev, status: newStatus as OrderStatus } : prev);
      setUpdateMsg('Status updated.');
      setTimeout(() => setUpdateMsg(''), 3000);
    } catch (e) {
      setUpdateMsg((e as Error).message);
    } finally {
      setUpdating(false);
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-AE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getEmail = (user: Order['user']) => {
    if (!user) return '—';
    if (typeof user === 'string') return user;
    return user.email ?? '—';
  };

  const getItemName = (item: OrderItem) => {
    if (item.name) return item.name;
    if (typeof item.product === 'object' && item.product) return item.product.name;
    return 'Unknown product';
  };

  const getItemImage = (item: OrderItem) => {
    if (item.image) return item.image;
    if (typeof item.product === 'object' && item.product) return item.product.image;
    return null;
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8">
        <p className="text-red-600 text-sm">{error || 'Order not found.'}</p>
        <Link href="/admin/orders" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-gray-700">
          Orders
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">
          {order.orderNumber ?? order._id.slice(-8).toUpperCase()}
        </span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.orderNumber ?? order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
            STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Customer */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Customer</h2>
          <p className="text-sm text-gray-600">{getEmail(order.user)}</p>
          {typeof order.user === 'object' && order.user?.name && (
            <p className="text-sm text-gray-500 mt-1">{order.user.name}</p>
          )}
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Shipping Address
          </h2>
          {order.shippingAddress ? (
            <div className="text-sm text-gray-600 space-y-0.5">
              {order.shippingAddress.fullName && (
                <p>{order.shippingAddress.fullName}</p>
              )}
              {order.shippingAddress.street && (
                <p>{order.shippingAddress.street}</p>
              )}
              {order.shippingAddress.city && <p>{order.shippingAddress.city}</p>}
              {order.shippingAddress.country && (
                <p>{order.shippingAddress.country}</p>
              )}
              {order.shippingAddress.phone && (
                <p className="text-gray-500">{order.shippingAddress.phone}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No address provided</p>
          )}
        </div>

        {/* Update Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h2>
          <select
            value={order.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            disabled={updating}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          {updateMsg && (
            <p className="text-xs mt-2 text-green-600">{updateMsg}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm font-medium text-yellow-800">Order Notes</p>
          <p className="text-sm text-yellow-700 mt-0.5">{order.notes}</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            Items ({order.items.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-12"></th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Unit Price
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item, i) => {
              const img = getItemImage(item);
              return (
                <tr key={i}>
                  <td className="px-4 py-3">
                    {img ? (
                      <Image
                        src={img}
                        alt={getItemName(item)}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover w-10 h-10"
                        unoptimized
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {getItemName(item)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {item.price} {item.currency ?? order.currency ?? 'AED'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {(item.price * item.quantity).toFixed(2)}{' '}
                    {item.currency ?? order.currency ?? 'AED'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-gray-200 bg-gray-50">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">
                Total
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">
                {order.total} {order.currency ?? 'AED'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
