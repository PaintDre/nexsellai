import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import AudienceSelector from "@/components/AudienceSelector";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("home");
  const [price, setPrice] = useState("");
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !user) return;
    supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single().then(({ data, error }) => {
      if (error || !data) { navigate("/products"); return; }
      setName(data.name);
      setCategory(data.category);
      setPrice(data.price.toString());
      setDescription(data.description || "");
      setImages(data.images);
      if (data.target_audience) {
        setSelectedAudiences(data.target_audience.split(",").map((s: string) => s.trim()).filter(Boolean));
      }
    });
  }, [id, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user || images.length >= 4) return;
    const files = Array.from(e.target.files).slice(0, 4 - images.length);
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (images.length === 0) {
      toast.error("Se requiere al menos 1 imagen");
      return;
    }
    if (selectedAudiences.length === 0) {
      toast.error("Selecciona al menos 1 público objetivo");
      return;
    }
    setSaving(true);

    const productData = {
      name,
      category: category as any,
      price: parseInt(price),
      target_audience: selectedAudiences.join(", "),
      description: description || null,
      images,
      user_id: user.id,
    };

    let productId = id;

    if (isEdit) {
      const { error } = await supabase.from("products").update(productData).eq("id", id);
      if (error) { toast.error("Error al actualizar", { description: error.message }); setSaving(false); return; }
    } else {
      const { data: newProduct, error } = await supabase.from("products").insert(productData).select("id").single();
      if (error) { toast.error("Error al crear", { description: error.message }); setSaving(false); return; }
      productId = newProduct.id;
    }

    toast.success(isEdit ? "Producto actualizado" : "Producto creado");
    navigate(isEdit ? `/products/${productId}` : `/products/${productId}`);
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
      </Button>

      <h1 className="text-3xl font-bold font-display tracking-tight mb-6">
        {isEdit ? "Editar Producto" : "Nuevo Producto"}
      </h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Images */}
            <div className="space-y-2">
              <Label>Imágenes (1-4) *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < 4 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-input flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                    <span className="text-xs text-muted-foreground mt-1">Subir</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del producto *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Masajeador Cervical Pro" required />
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
              <Label htmlFor="price">Precio CLP *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input id="price" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} className="pl-7" placeholder="19990" required />
              </div>
            </div>

            <AudienceSelector selected={selectedAudiences} onChange={setSelectedAudiences} />

            <div className="space-y-2">
              <Label htmlFor="desc">Descripción (opcional)</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles adicionales del producto..." rows={3} />
            </div>

            <Button type="submit" className="w-full min-h-[44px]" disabled={saving}>
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default ProductForm;
