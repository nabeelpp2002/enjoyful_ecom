'use client';
import { useEffect, useState, FormEvent } from 'react';
import { adminApi } from '@/lib/admin-api';

interface Category {
  _id: string;
  name: string;
  slug: string;
  tintColor?: string;
  description?: string;
  isActive?: boolean;
}

interface EditState {
  name: string;
  slug: string;
  tintColor: string;
  description: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    name: '',
    slug: '',
    tintColor: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New category form
  const [showNew, setShowNew] = useState(false);
  const [newState, setNewState] = useState<EditState>({
    name: '',
    slug: '',
    tintColor: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data ?? res ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(cat: Category) {
    setEditId(cat._id);
    setEditState({
      name: cat.name,
      slug: cat.slug,
      tintColor: cat.tintColor ?? '',
      description: cat.description ?? '',
    });
    setError('');
  }

  function closeEdit() {
    setEditId(null);
    setError('');
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.updateCategory(editId, editState);
      setSuccessMsg('Category updated.');
      setTimeout(() => setSuccessMsg(''), 3000);
      closeEdit();
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await adminApi.deleteCategory(id);
      load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await adminApi.createCategory(newState);
      setNewState({ name: '', slug: '', tintColor: '', description: '' });
      setShowNew(false);
      load();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} total</p>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          {showNew ? 'Cancel' : 'New Category'}
        </button>
      </div>

      {successMsg && (
        <p className="text-green-700 text-sm mb-4 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
          {successMsg}
        </p>
      )}

      {/* New category form */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Create Category
          </h2>
          {createError && (
            <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">
              {createError}
            </p>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newState.name}
                onChange={(e) => setNewState((s) => ({ ...s, name: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={newState.slug}
                onChange={(e) => setNewState((s) => ({ ...s, slug: e.target.value }))}
                placeholder="auto-generated if empty"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tint Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newState.tintColor || '#ffffff'}
                  onChange={(e) =>
                    setNewState((s) => ({ ...s, tintColor: e.target.value }))
                  }
                  className="w-10 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={newState.tintColor}
                  onChange={(e) =>
                    setNewState((s) => ({ ...s, tintColor: e.target.value }))
                  }
                  placeholder="#ffffff"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newState.description}
                onChange={(e) =>
                  setNewState((s) => ({ ...s, description: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Tint Color
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Description
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <>
                  <tr key={cat._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {cat.slug}
                    </td>
                    <td className="px-4 py-3">
                      {cat.tintColor ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded border border-gray-200"
                            style={{ backgroundColor: cat.tintColor }}
                          />
                          <span className="text-gray-500 font-mono text-xs">
                            {cat.tintColor}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {cat.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id, cat.name)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {/* Inline edit row */}
                  {editId === cat._id && (
                    <tr key={`${cat._id}-edit`}>
                      <td colSpan={5} className="px-4 py-4 bg-blue-50 border-b border-blue-100">
                        <form onSubmit={handleSave}>
                          <p className="text-sm font-semibold text-gray-800 mb-3">
                            Edit: {cat.name}
                          </p>
                          {error && (
                            <p className="text-red-600 text-xs mb-3 bg-red-50 px-3 py-1.5 rounded-lg">
                              {error}
                            </p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                value={editState.name}
                                onChange={(e) =>
                                  setEditState((s) => ({ ...s, name: e.target.value }))
                                }
                                required
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Slug
                              </label>
                              <input
                                type="text"
                                value={editState.slug}
                                onChange={(e) =>
                                  setEditState((s) => ({ ...s, slug: e.target.value }))
                                }
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Tint Color
                              </label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={editState.tintColor || '#ffffff'}
                                  onChange={(e) =>
                                    setEditState((s) => ({
                                      ...s,
                                      tintColor: e.target.value,
                                    }))
                                  }
                                  className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
                                />
                                <input
                                  type="text"
                                  value={editState.tintColor}
                                  onChange={(e) =>
                                    setEditState((s) => ({
                                      ...s,
                                      tintColor: e.target.value,
                                    }))
                                  }
                                  placeholder="#ffffff"
                                  className={inputClass}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                value={editState.description}
                                onChange={(e) =>
                                  setEditState((s) => ({
                                    ...s,
                                    description: e.target.value,
                                  }))
                                }
                                className={inputClass}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={saving}
                              className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={closeEdit}
                              className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
