import { useMemo } from "react";

const CRITERIA = [
  {
    key: "images",
    label: "Images",
    weight: 25,
    check: (form) => {
      const count = form.images?.length || form.previewCount || 0;
      if (count >= 5) return { score: 100, detail: `${count} high-quality images` };
      if (count >= 3) return { score: 70, detail: `${count} images (add 2 more for best results)` };
      if (count >= 1) return { score: 30, detail: `${count} image (add at least 3)` };
      return { score: 0, detail: "No images uploaded" };
    },
  },
  {
    key: "title",
    label: "Title",
    weight: 20,
    check: (form) => {
      const len = form.title?.length || 0;
      if (len >= 40) return { score: 100, detail: "Great title length" };
      if (len >= 20) return { score: 60, detail: `${len} chars (aim for 40+)` };
      if (len > 0) return { score: 30, detail: "Too short, add more detail" };
      return { score: 0, detail: "Title is required" };
    },
  },
  {
    key: "description",
    label: "Description",
    weight: 20,
    check: (form) => {
      const len = form.description?.length || 0;
      if (len >= 200) return { score: 100, detail: "Detailed description" };
      if (len >= 100) return { score: 70, detail: `${len} chars (aim for 200+)` };
      if (len >= 50) return { score: 40, detail: "Add more details about condition and history" };
      if (len > 0) return { score: 15, detail: "Very short description" };
      return { score: 0, detail: "Description is empty" };
    },
  },
  {
    key: "specs",
    label: "Item Specifics",
    weight: 15,
    check: (form) => {
      const specifics = form.item_specifics || {};
      const filled = Object.values(specifics).filter((v) => v && v !== "").length;
      const total = Object.keys(specifics).length;
      if (total === 0) return { score: 0, detail: "No specs added" };
      const pct = filled / total;
      if (pct >= 0.8) return { score: 100, detail: `${filled}/${total} specs filled` };
      if (pct >= 0.5) return { score: 60, detail: `${filled}/${total} specs filled` };
      return { score: 30, detail: `Only ${filled}/${total} specs filled` };
    },
  },
  {
    key: "pricing",
    label: "Pricing",
    weight: 10,
    check: (form) => {
      const hasPrice = form.price && parseFloat(form.price) > 0;
      const hasShipping = form.shipping_fee !== "" || form.shipping_type === "free" || form.shipping_type === "contact";
      if (hasPrice && hasShipping) return { score: 100, detail: "Price & shipping set" };
      if (hasPrice) return { score: 50, detail: "Price set, add shipping" };
      return { score: 0, detail: "Set a price" };
    },
  },
  {
    key: "category",
    label: "Category + Condition",
    weight: 10,
    check: (form) => {
      if (form.category_id && form.condition_code) return { score: 100, detail: "Category & condition set" };
      if (form.category_id) return { score: 50, detail: "Select condition" };
      return { score: 0, detail: "Select a category" };
    },
  },
];

const TIERS = [
  { min: 90, label: "Platinum", color: "text-slate-300", bg: "bg-gradient-to-r from-slate-300 to-slate-100", bar: "bg-slate-400" },
  { min: 70, label: "Gold", color: "text-gold", bg: "bg-gradient-to-r from-gold/20 to-gold/5", bar: "bg-gold" },
  { min: 40, label: "Silver", color: "text-slate-400", bg: "bg-gradient-to-r from-slate-300/10 to-slate-400/5", bar: "bg-slate-300" },
  { min: 0, label: "Bronze", color: "text-amber-700", bg: "bg-gradient-to-r from-amber-700/10 to-amber-700/5", bar: "bg-amber-600" },
];

export default function ListingQualityScore({ formData, images, previews }) {
  const previewCount = images?.length || previews?.length || 0;

  const results = useMemo(() => {
    return CRITERIA.map((c) => ({
      ...c,
      result: c.check({ ...formData, previewCount }),
    }));
  }, [formData, previewCount]);

  const total = useMemo(() => {
    const maxWeight = results.reduce((s, r) => s + r.weight, 0);
    const score = results.reduce((s, r) => s + (r.result.score * r.weight) / 100, 0);
    return Math.round(score);
  }, [results]);

  const tier = TIERS.find((t) => total >= t.min) || TIERS[TIERS.length - 1];

  return (
    <div className="bg-surface border border-border p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted">Listing Strength</h3>
        <span className={`text-xs font-black uppercase tracking-widest ${tier.color}`}>
          {tier.label} &middot; {total}%
        </span>
      </div>

      <div className="h-2 bg-background border border-border mb-4">
        <div
          className={`h-full ${tier.bar} transition-all duration-500`}
          style={{ width: `${total}%` }}
        />
      </div>

      <div className="space-y-2">
        {results.map((c) => (
          <div key={c.key} className="flex items-center gap-2 text-xs">
            <div className={`w-3 h-3 flex-shrink-0 flex items-center justify-center border ${
              c.result.score >= 70 ? "bg-emerald-500 border-emerald-500 text-white" :
              c.result.score >= 40 ? "bg-amber-400 border-amber-400 text-white" :
              "bg-background border-border text-muted"
            }`}>
              {c.result.score >= 70 ? (
                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-[7px] font-black">{c.result.score}</span>
              )}
            </div>
            <span className="font-bold text-muted uppercase tracking-wider flex-shrink-0 w-16">{c.label}</span>
            <span className="text-muted truncate">{c.result.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
