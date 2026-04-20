import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/dropi/ProductCard";
import EmptyState from "@/components/EmptyState";
import { Search, Package } from "lucide-react";

interface DropiProduct {
  id: string;
  name: string;
  image_main: string | null;
  category: string | null;
}

/** Normalize for comparison: lowercase + strip accents. */
const normalizeKey = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Display version: title-case, original accents preserved by picking the first occurrence. */
const titleCase = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const Dropi = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<DropiProduct[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("dropi_products")
        .select("id, name, image_main, category")
        .order("created_at", { ascending: false });
      setProducts((data as DropiProduct[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  /**
   * Dedup categories by normalized key (case- and accent-insensitive).
   * Keeps the prettiest version: prefers entries WITH accents over without.
   */
  const categories = useMemo(() => {
    const map = new Map<string, string>(); // normKey -> displayLabel
    for (const p of products) {
      if (!p.category) continue;
      const key = normalizeKey(p.category);
      if (!key) continue;
      const display = titleCase(p.category.trim());
      const existing = map.get(key);
      // Prefer the version with diacritics (length > normalized length suggests accents)
      if (!existing || display.length > existing.length) {
        map.set(key, display);
      }
    }
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [products]);

  const filtered = useMemo(() => {
    const searchNorm = normalizeKey(search);
    return products.filter((p) => {
      const matchSearch = !searchNorm || normalizeKey(p.name).includes(searchNorm);
      const matchCat = !category || (p.category && normalizeKey(p.category) === category);
      return matchSearch && matchCat;
    });
  }, [products, search, category]);

  return (
    <div className="page-in p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </span>
          DROPI
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 ml-12">{t("dropi.subtitle")}</p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 sm:h-10 bg-card/70 backdrop-blur-md border-border/60 focus-visible:ring-primary/30"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all press-on-active ${
                !category
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t("dropi.all")}
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all press-on-active ${
                  category === c.key
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("dropi.noProducts")}
          description={search || category ? t("dropi.noProductsHint") : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropi;
