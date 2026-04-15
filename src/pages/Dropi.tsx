import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/dropi/ProductCard";

import { Search, Package } from "lucide-react";

interface DropiProduct {
  id: string;
  name: string;
  image_main: string | null;
  category: string | null;
}

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

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            DROPI
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dropi.subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t("dropi.all")}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">{t("dropi.noProducts")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        )}
    </div>
  );
};

export default Dropi;
