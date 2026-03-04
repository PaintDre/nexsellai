import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Pencil, Sparkles, ImageIcon } from "lucide-react";

type Product = Tables<"products">;

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setProducts(data || []));
  }, [user]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display tracking-tight">Productos</h1>
        <Button asChild>
          <Link to="/products/new"><Plus className="h-4 w-4 mr-2" /> Nuevo</Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">Aún no tienes productos</p>
            <Button asChild><Link to="/products/new"><Plus className="h-4 w-4 mr-2" /> Crear producto</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-md transition-shadow">
              <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/40" /></div>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <Badge variant="secondary" className="capitalize text-xs">{product.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">${product.price.toLocaleString("es-CL")}</p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/products/${product.id}/edit`}><Pencil className="h-3 w-3 mr-1" /> Editar</Link>
                    </Button>
                    <Button size="sm" asChild className="flex-1">
                      <Link to={`/products/${product.id}/generate`}><Sparkles className="h-3 w-3 mr-1" /> Landing</Link>
                    </Button>
                  </div>
                  <Button variant="secondary" size="sm" asChild className="w-full">
                    <Link to={`/products/${product.id}/banner`}><ImageIcon className="h-3 w-3 mr-1" /> Generar Banner</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
