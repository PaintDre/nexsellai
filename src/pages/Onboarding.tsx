import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, Loader2, Sparkles, Rocket, ArrowRight } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const loadingMessages = [
  "Analizando tu producto...",
  "Creando textos de venta...",
  "Diseñando la estructura...",
  "Optimizando para conversión...",
  "Generando tu landing...",
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  

  // Product form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("gadget");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [generating]);

  // Animate progress
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 8));
    }, 800);
    return () => clearInterval(interval);
  }, [generating]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user || images.length >= 1) return;
    const file = e.target.files[0];
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setImages([urlData.publicUrl]);
    } else {
      toast.error("Error al subir imagen", { description: error.message });
    }
    setUploading(false);
  };

  const handleCreateAndGenerate = async () => {
    if (!user || !profile) return;

    if (!name.trim() || !price) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    if (images.length === 0) {
      toast.error("Sube al menos 1 imagen de tu producto");
      return;
    }

    setStep(3);
    setGenerating(true);
    setProgress(5);

    try {
      // 1. Create product
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          user_id: user.id,
          name: name.trim(),
          price: parseInt(price),
          category: category as any,
          description: description.trim() || null,
          images,
          target_audience: "General",
        })
        .select()
        .single();

      if (productError) throw productError;
      setProgress(25);

      // 2. Generate landing
      const { data: landingData, error: genError } = await supabase.functions.invoke("generate-landing", {
        body: {
          product,
          mode: "aida",
          intensity: "medium",
          hasOffer: false,
          guarantee: "Garantía de satisfacción de 30 días",
          plan: profile.plan,
          currency: (profile as any)?.currency || "USD",
          country_code: (profile as any)?.country_code || null,
        },
      });

      if (genError) throw genError;
      setProgress(70);

      // 3. Save landing
      const { error: insertError } = await supabase.from("landings").insert({
        user_id: user.id,
        product_id: product.id,
        name: product.name,
        mode: "aida" as any,
        intensity: "medium" as any,
        has_offer: false,
        guarantee: "Garantía de satisfacción de 30 días",
        blocks: landingData.blocks,
        theme: "clean",
      } as any);

      if (insertError) throw insertError;

      // 4. Increment landings_used
      await supabase
        .from("profiles")
        .update({ landings_used: (profile.landings_used || 0) + 1 })
        .eq("user_id", user.id);

      setProgress(100);

      toast.success("¡Tu primera landing está lista!");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err: any) {
      toast.error("Error al generar", { description: err.message });
      setStep(2);
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`h-0.5 w-8 rounded-full transition-colors ${step > s ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card>
            <CardContent className="flex flex-col items-center text-center space-y-6 py-10 px-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl overflow-hidden">
                <img src="/logo-ns.png" alt="Nexsell" className="h-20 w-20 object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold font-display tracking-tight">
                  ¡Bienvenido a Nexsell!
                </h1>
                <p className="text-muted-foreground max-w-sm">
                  Con Nexsell puedes crear páginas de venta profesionales para tus productos de dropshipping en minutos, usando inteligencia artificial.
                </p>
              </div>
              <div className="space-y-2 text-left w-full max-w-xs">
                <div className="flex items-start gap-3">
                  <Rocket className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">Sube tu producto y genera una landing al instante</p>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">Textos persuasivos creados por IA para maximizar ventas</p>
                </div>
              </div>
              <Button size="lg" className="w-full max-w-xs min-h-[44px]" onClick={() => setStep(2)}>
                Comenzar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Product form */}
        {step === 2 && (
          <Card>
            <CardContent className="space-y-5 py-6 px-5">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold font-display">Agrega tu primer producto</h2>
                <p className="text-sm text-muted-foreground">Con esta info generaremos tu primera landing de venta</p>
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label>Imagen del producto *</Label>
                {images.length > 0 ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted w-full max-w-[200px]">
                    <img src={images[0]} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-input cursor-pointer hover:border-primary transition-colors">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground mt-1">Subir imagen</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-name">Nombre del producto *</Label>
                <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Masajeador Cervical Pro" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-price">Precio {(profile as any)?.currency || "USD"} *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input id="ob-price" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} className="pl-7" placeholder="19990" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-desc">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Textarea id="ob-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles del producto..." rows={3} />
              </div>

              <Button
                size="lg"
                className="w-full min-h-[44px]"
                onClick={handleCreateAndGenerate}
                disabled={generating}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Crear producto y generar landing
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Loading */}
        {step === 3 && (
          <Card>
            <CardContent className="flex flex-col items-center text-center space-y-6 py-12 px-6">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-display">
                  {progress >= 100 ? "¡Listo!" : "Generando tu landing..."}
                </h2>
                <p className="text-muted-foreground text-sm min-h-[20px] transition-opacity">
                  {progress >= 100 ? "Redirigiendo al dashboard..." : loadingMessages[messageIndex]}
                </p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
