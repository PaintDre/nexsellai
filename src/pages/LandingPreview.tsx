import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import LandingRenderer from "@/components/landing/LandingRenderer";
import { themes, type LandingTheme } from "@/components/landing/themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface PreviewData {
  blocks: any[];
  product: {
    name: string;
    category: string;
    price: number;
    target_audience: string;
    description: string | null;
  };
  imagePreview?: string | null;
}

const LandingPreview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<PreviewData | null>(null);
  const [theme, setTheme] = useState<LandingTheme>("clean");

  useEffect(() => {
    const stored = localStorage.getItem("nexsell_preview_data");
    if (stored) setData(JSON.parse(stored));
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">{t("landingPreview.noData")}</p>
        <Button variant="outline" onClick={() => navigate("/#demo")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("landingPreview.backToGenerator")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-12 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/#demo")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("landingPreview.backAndEdit")}
          </Button>
          <div className="flex items-center gap-3">
            <Select value={theme} onValueChange={(v) => setTheme(v as LandingTheme)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-xs">{t("landingPreview.demoBadge")}</Badge>
          </div>
        </div>
      </div>

      <LandingRenderer
        blocks={data.blocks}
        product={data.product}
        imagePreview={data.imagePreview}
        theme={theme}
      />

      <section className="py-12 bg-muted/50 border-t">
        <div className="container mx-auto px-4 max-w-xl text-center space-y-4">
          <p className="text-muted-foreground">{t("landingPreview.exportGate")}</p>
          <Button size="lg" asChild>
            <Link to="/register">
              <ArrowRight className="h-4 w-4 mr-2" /> {t("landingPreview.createAndExport")}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPreview;
