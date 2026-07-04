const BASE = '/api';

async function adminFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Request failed');
  return data;
}

export const adminApi = {
  getProducts: (params = '') => adminFetch(`/products?${params}`),
  createProduct: (body: unknown) => adminFetch('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: string, body: unknown) => adminFetch(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteProduct: (id: string) => adminFetch(`/products/${id}`, { method: 'DELETE' }),
  bulkImportJson: (products: unknown[]) => adminFetch('/products/bulk-import/json', { method: 'POST', body: JSON.stringify({ products }) }),

  getCategories: () => adminFetch('/categories'),
  createCategory: (body: unknown) => adminFetch('/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: unknown) => adminFetch(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id: string) => adminFetch(`/categories/${id}`, { method: 'DELETE' }),

  getOrders: (params = '') => adminFetch(`/orders?${params}`),
  getOrder: (id: string) => adminFetch(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    adminFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getBanners: () => adminFetch('/banners'),
  createBanner: (body: unknown) => adminFetch('/banners', { method: 'POST', body: JSON.stringify(body) }),
  updateBanner: (id: string, body: unknown) => adminFetch(`/banners/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBanner: (id: string) => adminFetch(`/banners/${id}`, { method: 'DELETE' }),
  reorderBanners: (ids: string[]) =>
    adminFetch('/banners/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) }),

  getRevenue: (daysBack = 30) =>
    adminFetch(`/admin/analytics/revenue?daysBack=${daysBack}`),
};
