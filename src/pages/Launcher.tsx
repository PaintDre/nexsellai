import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket, Package, CheckCircle2, Image as ImageIcon, Video, User, Download } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Link } from "react-router-dom";

type Product = Tables<"products">;

const STEPS = [
  { key: "product", label: "Producto", icon: Package },
  { key: "banners", label: "Banners", icon: ImageIcon },
  { key: "video", label: "Video", icon: Video },
  { key: "influencer", label: "Influencer", icon: User },
  { key: "kit", label: "Kit", icon: Download },
];

export default function Launcher() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="page-in p-5 md:p-8 lg:p-10 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            Agente Lanzador
          </h1>
          <p className="text-sm text-muted-foreground">
            Genera todo el kit de campaña en un solo flujo: banners, video, influencer y descarga.
          </p>
        </div>
      </div>

      {/* Stepper preview */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-center gap-1.5 min-w-[70px]">
                  <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">1. Elige un producto</h2>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No tienes productos aún"
            description="Crea un producto para poder lanzar una campaña."
            action={{ label: "Crear producto", to: "/products/new" }}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const isSelected = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`text-left rounded-xl border-2 transition-all overflow-hidden bg-card hover:border-primary/50 ${
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                  }`}
                >
                  <div className="aspect-video bg-muted relative">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.description || "Sin descripción"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              {selected.images?.[0] && (
                <img
                  src={selected.images[0]}
                  alt={selected.name}
                  className="h-20 w-20 rounded-lg object-contain bg-background"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase text-primary font-semibold tracking-wide">
                  Producto seleccionado
                </p>
                <h3 className="font-semibold text-lg truncate">{selected.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selected.description}
                </p>
              </div>
            </div>
            <Button size="lg" className="w-full" disabled>
              <Rocket className="h-4 w-4 mr-2" />
              Lanzar campaña (próximo paso)
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Sub-fase 5.1 completa. El botón se activa en la sub-fase 5.2.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}