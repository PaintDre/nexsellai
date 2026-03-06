import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface LandingPreview {
  name: string;
  slug: string | null;
  blocks: any[];
  category?: string;
}

const fallbackExamples = [
  { name: "Masajeador Cervical Pro", cat: "Fitness", gradient: "from-primary/20 to-primary/5" },
  { name: "Sérum Vitamina C", cat: "Beauty", gradient: "from-accent/20 to-accent/5" },
  { name: "Cama Ortopédica Mascota", cat: "Pets", gradient: "from-secondary to-muted" },
];

export const LandingExamplesGallery = () => {
  const [landings, setLandings] = useState<LandingPreview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("landings")
      .select("name, slug, blocks, products(category)")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLandings(
            data.map((l: any) => ({
              name: l.name,
              slug: l.slug,
              blocks: Array.isArray(l.blocks) ? l.blocks : [],
              category: l.products?.category,
            }))
          );
        }
        setLoaded(true);
      });
  }, []);

  const getHeroImage = (blocks: any[]) => {
    const hero = blocks.find((b: any) => b.type === "hero");
    return hero?.image_url || null;
  };

  if (!loaded) return null;

  return (
    <div className="mt-16">
      <h3 className="text-xl font-display font-bold text-center mb-6">Ejemplos de landings generadas</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        {landings.length > 0
          ? landings.map((landing) => {
              const heroImg = getHeroImage(landing.blocks);
              return (
                <Link
                  key={landing.slug || landing.name}
                  to={landing.slug ? `/p/${landing.slug}` : "#"}
                >
                  <Card className="overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                      {heroImg ? (
                        <img src={heroImg} alt={landing.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center">
                          <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                          <Badge variant="outline" className="text-xs">Vista previa</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="font-medium text-sm">{landing.name}</p>
                      {landing.category && (
                        <p className="text-xs text-muted-foreground capitalize">{landing.category}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          : fallbackExamples.map((ex) => (
              <Card key={ex.name} className="overflow-hidden group hover:shadow-md transition-shadow">
                <div className={`h-32 bg-gradient-to-br ${ex.gradient} flex items-center justify-center`}>
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                    <Badge variant="outline" className="text-xs">Vista previa</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">{ex.cat}</p>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
};
