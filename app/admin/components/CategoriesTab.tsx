"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from "lucide-react";
import ConfirmDialog from "../../../components/ConfirmDialog";

export default function CategoriesTab({ categories: initialCategories, tabLoading, API_URL, getHeaders, showToast, onRefresh }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [activeSection, setActiveSection] = useState("categories");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: "", category_id: "" });
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    setCategories(Array.isArray(initialCategories) ? initialCategories : []);
    fetchBrands();
  }, [initialCategories]);

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_URL}/products/brands`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBrands(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  const handleCreateCategory = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast("Category created", "success");
        setForm({ name: "", description: "" });
        setShowForm(false);
        onRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create", "error");
      }
    } catch { showToast("Network error", "error"); }
    setSaving(false);
  };

  const handleUpdateCategory = async () => {
    if (!form.name.trim() || !editing) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/categories/${editing}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast("Category updated", "success");
        setForm({ name: "", description: "" });
        setEditing(null);
        setShowForm(false);
        onRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update", "error");
      }
    } catch { showToast("Network error", "error"); }
    setSaving(false);
  };

  const handleDeleteCategory = async (id) => {
    setConfirmDialog({
      title: "Delete category?",
      message: "Delete this category? Products in this category will become uncategorized.",
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/admin/categories/${id}`, {
            method: "DELETE",
            headers: getHeaders()
          });
          if (res.ok) {
            showToast("Category deleted", "success");
            onRefresh();
          } else {
            const err = await res.json();
            showToast(err.error || "Failed to delete", "error");
          }
        } catch { showToast("Network error", "error"); }
      }
    });
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || "" });
    setEditing(cat.id);
    setShowForm(true);
  };

  const handleCreateBrand = async () => {
    if (!brandForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/brands`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name: brandForm.name, category_id: brandForm.category_id || null })
      });
      if (res.ok) {
        showToast("Brand created", "success");
        setBrandForm({ name: "", category_id: "" });
        setShowBrandForm(false);
        fetchBrands();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create", "error");
      }
    } catch { showToast("Network error", "error"); }
    setSaving(false);
  };

  const handleDeleteBrand = async (name) => {
    setConfirmDialog({
      title: "Delete brand?",
      message: `Delete brand "${name}"?`,
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/admin/brands/${encodeURIComponent(name)}`, {
            method: "DELETE",
            headers: getHeaders()
          });
          if (res.ok) {
            showToast("Brand deleted", "success");
            fetchBrands();
          } else {
            const err = await res.json();
            showToast(err.error || "Failed to delete", "error");
          }
        } catch { showToast("Network error", "error"); }
      }
    });
  };

  return (
    <div>
      {/* Section Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection("categories")}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
            activeSection === "categories" ? "bg-primary text-white" : "bg-background border border-border text-muted hover:border-gold"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveSection("brands")}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
            activeSection === "brands" ? "bg-primary text-white" : "bg-background border border-border text-muted hover:border-gold"
          }`}
        >
          Brands
        </button>
      </div>

      {activeSection === "categories" && (
        <div className="bg-background border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">All Categories</h3>
            <button
              onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", description: "" }); }}
              className="gold-sweep px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Add Category
            </button>
          </div>

          {showForm && (
            <div className="p-4 border-b border-border bg-surface/50">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-background border border-border p-2.5 text-sm focus:border-gold outline-none transition-colors"
                    placeholder="e.g. Pre-Owned Watches"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-background border border-border p-2.5 text-sm focus:border-gold outline-none transition-colors"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={editing ? handleUpdateCategory : handleCreateCategory} disabled={saving} className="gold-sweep px-5 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Save className="w-3 h-3" /> {editing ? "Update" : "Save"}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 border border-border text-muted hover:text-foreground text-xs font-bold uppercase tracking-widest">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-border">
            {tabLoading ? (
              <div className="p-10 text-center text-muted text-sm">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="p-10 text-center text-muted text-sm">No categories found</div>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-4 hover:bg-surface/50 transition-colors">
                  <div>
                    <p className="font-bold text-foreground text-sm">{cat.name}</p>
                    {cat.description && <p className="text-sm text-muted mt-0.5">{cat.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="p-1.5 text-muted hover:text-gold transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-muted hover:text-rose-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSection === "brands" && (
        <div className="bg-background border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">All Brands</h3>
            <button
              onClick={() => { setShowBrandForm(true); setEditingBrand(null); setBrandForm({ name: "", category_id: "" }); }}
              className="gold-sweep px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Add Brand
            </button>
          </div>

          {showBrandForm && (
            <div className="p-4 border-b border-border bg-surface/50">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    className="w-full bg-background border border-border p-2.5 text-sm focus:border-gold outline-none transition-colors"
                    placeholder="e.g. Rolex"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Category (optional)</label>
                  <select
                    value={brandForm.category_id}
                    onChange={(e) => setBrandForm({ ...brandForm, category_id: e.target.value })}
                    className="w-full bg-background border border-border p-2.5 text-sm focus:border-gold outline-none transition-colors"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateBrand} disabled={saving} className="gold-sweep px-5 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Save className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => { setShowBrandForm(false); }} className="px-5 py-2.5 border border-border text-muted hover:text-foreground text-xs font-bold uppercase tracking-widest">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-border">
            {tabLoading ? (
              <div className="p-10 text-center text-muted text-sm">Loading...</div>
            ) : brands.length === 0 ? (
              <div className="p-10 text-center text-muted text-sm">No brands found</div>
            ) : (
              brands.map((name, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-surface/50 transition-colors">
                  <div>
                    <p className="font-bold text-foreground text-sm capitalize">{name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDeleteBrand(name)} className="p-1.5 text-muted hover:text-rose-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || "Confirm"}
        message={confirmDialog?.message || "Are you sure?"}
        confirmText={confirmDialog?.confirmText || "Delete"}
        cancelText="Cancel"
        variant={confirmDialog?.variant || "danger"}
      />
    </div>
  );
}
