"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, ChevronRight } from "lucide-react";
import ConfirmDialog from "../../../components/ConfirmDialog";

export default function CategoriesTab({ categories: initialCategories, tabLoading, API_URL, getHeaders, showToast, onRefresh }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [activeSection, setActiveSection] = useState("categories");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", parent_id: "" });
  const [saving, setSaving] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: "", category_id: "" });
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    // Flatten tree for local display: initialCategories is already a tree from API
    // We store the flat list + tree for rendering
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

  // Flatten tree to a flat list for dropdowns (parent selection)
  const flatCategories = (tree: any[], depth = 0): any[] => {
    const result: any[] = [];
    (tree || []).forEach(cat => {
      result.push({ ...cat, _depth: depth });
      if (cat.children && cat.children.length > 0) {
        result.push(...flatCategories(cat.children, depth + 1));
      }
    });
    return result;
  };

  // Only top-level (super) categories can be parents
  const superCategories = categories.filter(c => !c.parent_id);

  const handleCreateCategory = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          parent_id: form.parent_id || null
        })
      });
      if (res.ok) {
        showToast("Category created", "success");
        setForm({ name: "", description: "", parent_id: "" });
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
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          parent_id: form.parent_id || null
        })
      });
      if (res.ok) {
        showToast("Category updated", "success");
        setForm({ name: "", description: "", parent_id: "" });
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

  const handleDeleteCategory = async (id, name) => {
    setConfirmDialog({
      title: "Delete category?",
      message: `Delete "${name}"? Sub-categories will become top-level. Products in this category will become uncategorized.`,
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
    setForm({ name: cat.name, description: cat.description || "", parent_id: cat.parent_id ? cat.parent_id.toString() : "" });
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

  // Recursive tree renderer
  const renderCategoryTree = (cats, depth = 0) => {
    if (!cats || cats.length === 0) return null;
    return cats.map((cat) => (
      <div key={cat.id}>
        <div
          className="flex items-center justify-between p-4 hover:bg-surface/50 transition-colors border-b border-border/50"
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          <div className="flex items-center gap-2">
            {depth > 0 && <ChevronRight className="w-3 h-3 text-gold flex-shrink-0" />}
            <div>
              <p className={`font-bold text-foreground ${depth === 0 ? "text-sm" : "text-xs"}`}>{cat.name}</p>
              {cat.description && <p className="text-xs text-muted mt-0.5">{cat.description}</p>}
              {depth === 0 && cat.children?.length > 0 && (
                <p className="text-[10px] text-gold font-bold uppercase tracking-widest mt-0.5">
                  {cat.children.length} sub-categor{cat.children.length === 1 ? "y" : "ies"}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => startEdit(cat)} className="p-1.5 text-muted hover:text-gold transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-1.5 text-muted hover:text-rose-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Render children recursively */}
        {cat.children && cat.children.length > 0 && renderCategoryTree(cat.children, depth + 1)}
      </div>
    ));
  };

  const allFlat = flatCategories(categories);

  return (
    <div>
      {/* Section Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection("categories")}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${activeSection === "categories" ? "bg-primary text-white" : "bg-background border border-border text-muted hover:border-gold"}`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveSection("brands")}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${activeSection === "brands" ? "bg-primary text-white" : "bg-background border border-border text-muted hover:border-gold"}`}
        >
          Brands
        </button>
      </div>

      {activeSection === "categories" && (
        <div className="bg-background border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground text-sm">Category Hierarchy</h3>
              <p className="text-[10px] text-muted mt-0.5 uppercase tracking-widest">Top-level = Super Category · Nested = Sub-Category</p>
            </div>
            <button
              onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", description: "", parent_id: "" }); }}
              className="gold-sweep px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Add Category
            </button>
          </div>

          {/* Category Form */}
          {showForm && (
            <div className="p-4 border-b border-border bg-surface/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">
                {editing ? "Edit Category" : "New Category"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-background border border-border p-2.5 text-sm focus:border-gold outline-none transition-colors"
                    placeholder="e.g. Dress Watches"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-background border border-border p-2.5 text-sm focus:border-gold outline-none transition-colors"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              {/* Parent category dropdown — the key new field */}
              <div className="mb-3">
                <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">
                  Parent Category <span className="text-gold">(leave blank = Super Category)</span>
                </label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                  className="w-full bg-background border border-border p-2.5 text-sm focus:border-gold outline-none transition-colors"
                >
                  <option value="">— None (This is a Super Category) —</option>
                  {/* Only show top-level cats as possible parents to avoid deep nesting */}
                  {categories
                    .filter(c => !c.parent_id && (!editing || c.id !== editing))
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <p className="text-[10px] text-muted mt-1">
                  {form.parent_id
                    ? `This will be a Sub-Category under "${categories.find(c => c.id === parseInt(form.parent_id))?.name || ""}"`
                    : "This will appear as a top-level nav item in the Navbar."}
                </p>
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
          )}

          {/* Category Tree */}
          <div className="divide-y-0">
            {tabLoading ? (
              <div className="p-10 text-center text-muted text-sm">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="p-10 text-center text-muted text-sm">
                No categories yet. Add your first Super Category above.
              </div>
            ) : (
              renderCategoryTree(categories)
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
                    {allFlat.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c._depth > 0 ? `  ↳ ${c.name}` : c.name}
                      </option>
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
                  <p className="font-bold text-foreground text-sm capitalize">{name}</p>
                  <button onClick={() => handleDeleteBrand(name)} className="p-1.5 text-muted hover:text-rose-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
