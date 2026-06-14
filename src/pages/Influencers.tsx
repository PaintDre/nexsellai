import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mic2, Sparkles, Download, Trash2, Loader2, Plus, Play, AlertCircle, Upload,
} from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

interface InfluencerVideo {
  id: string;
  source_image_url: string;
  script: string | null;
  audio_url?: string | null;
  voice_id: string;
  language: string;
  status: string;
  video_url: string | null;
  thumbnail_url: string | null;
  storage_path: string | null;
  duration_sec: number | null;
  credits_charged: number;
  error_message: string | null;
  created_at: string;
}

const VOICES = [
  { id: "spanish_female", label: "Voz femenina · Español", lang: "es" },
  { id: "spanish_male",   label: "Voz masculina · Español", lang: "es" },
  { id: "english_female", label: "Female voice · English", lang: "en" },
  { id: "english_male",   label: "Male voice · English", lang: "en" },
  { id: "portuguese_female", label: "Voz feminina · Português", lang: "pt" },
  { id: "portuguese_male",   label: "Voz masculina · Português", lang: "pt" },
];

const COST = 60;

const Influencers = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<InfluencerVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [voiceId, setVoiceId] = useState<string>("spanish_female");
  const [submitting, setSubmitting] = useState(false);

  const fetchVideos = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("ai_influencers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setVideos((data ?? []) as InfluencerVideo[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => { setLoading(true); await fetchVideos(); setLoading(false); })();
  }, [user, fetchVideos]);

  useEffect(() => {
    const pending = videos.filter((v) => v.status === "queued" || v.status === "in_progress");
    if (pending.length === 0) return;
    const interval = setInterval(async () => {
      for (const v of pending) {
        try { await supabase.functions.invoke("check-influencer-video", { body: { video_id: v.id } }); }
        catch (e) { console.error("poll error", e); }
      }
      await fetchVideos();
    }, 8000);
    return () => clearInterval(interval);
  }, [videos, fetchVideos]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/source-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error("No se pudo subir la imagen", { description: error.message });
      setUploading(false); return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const handleAudioUpload = async (file: File) => {
    if (!user) return;
    setUploadingAudio(true);
    const ext = file.name.split(".").pop() ?? "mp3";
    const path = `${user.id}/audio-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error("No se pudo subir el audio", { description: error.message });
      setUploadingAudio(false); return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setAudioUrl(data.publicUrl);
    setUploadingAudio(false);
  };

  const handleSubmit = async () => {
    if (!imageUrl) { toast.error("Sube una foto del avatar primero"); return; }
    if (!audioUrl) { toast.error("Sube el audio (mp3/wav) que dirá tu influencer"); return; }
    const voice = VOICES.find((v) => v.id === voiceId);
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("generate-influencer-video", {
      body: {
        image_url: imageUrl,
        audio_url: audioUrl,
        prompt: prompt.trim() || undefined,
        voice_id: voiceId,
        language: voice?.lang ?? "es",
      },
    });
    setSubmitting(false);
    if (error || data?.error) {
      const msg = (data as any)?.error ?? error?.message ?? "error";
      if (msg === "insufficient_credits") {
        toast.error("Créditos insuficientes", { description: "Mejora tu plan para generar más influencers." });
      } else {
        toast.error("Error generando video", { description: String(msg) });
      }
      return;
    }
    toast.success("Video en cola", { description: "Tu influencer IA estará listo en 90-240s." });
    setOpen(false);
    setPrompt(""); setImageUrl(""); setImageFile(null); setAudioUrl("");
    await fetchVideos();
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("ai_influencers").delete().eq("id", id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    toast.success("Video eliminado");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Mic2 className="h-6 w-6 text-primary" />
            Influencers IA
            <Badge className="bg-amber/15 text-amber border-amber/30">Beta</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Convierte una foto en un avatar hablando con lipsync. Ideal para anuncios UGC y reseñas.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="lg">
          <Plus className="h-4 w-4" /> Crear influencer
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title="Aún no tienes influencers IA"
          description={`Sube una foto + escribe el guion y la IA generará un video con lipsync (${COST} créditos).`}
          action={{ label: "Crear primer influencer", onClick: () => setOpen(true), icon: Plus }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <div className="relative bg-muted aspect-[9/16]">
                {v.status === "completed" && v.video_url ? (
                  <video src={v.video_url} poster={v.thumbnail_url ?? v.source_image_url ?? undefined} controls className="w-full h-full object-cover" />
                ) : v.status === "failed" || v.status === "nsfw" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-xs text-muted-foreground">{v.error_message ?? "Generación fallida. Créditos devueltos."}</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <img src={v.source_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-3 relative" />
                    <p className="text-xs font-medium text-foreground relative">{v.status === "queued" ? "En cola..." : "Generando lipsync..."}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 relative">~90-240s</p>
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                {v.script && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">"{v.script}"</p>
                )}
                <div className="flex items-center gap-2 text-[11px]">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="font-medium">{VOICES.find((vv) => vv.id === v.voice_id)?.label ?? v.voice_id}</span>
                </div>
                <div className="flex gap-2">
                  {v.status === "completed" && v.video_url && (
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <a href={v.video_url} download={`nexsell-influencer-${v.id}.mp4`} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5" /> MP4
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Crear influencer IA
            </DialogTitle>
            <DialogDescription>
              Sube una foto frontal del rostro y el audio (mp3/wav) que dirá tu avatar. Costo: {COST} créditos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Foto del avatar (frontal, buena luz)</Label>
              {imageUrl ? (
                <div className="relative">
                  <img src={imageUrl} alt="" className="w-full h-40 object-cover rounded-lg" />
                  <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={() => { setImageUrl(""); setImageFile(null); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Subir JPG/PNG</span>
                    </>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setImageFile(f); handleUpload(f); }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Audio del guion (mp3 / wav, máx ~60s)</Label>
              {audioUrl ? (
                <div className="flex items-center gap-2">
                  <audio src={audioUrl} controls className="flex-1 h-10" />
                  <Button variant="ghost" size="sm" onClick={() => setAudioUrl("")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadingAudio ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Subir audio (mp3, wav, m4a)</span>
                    </>
                  )}
                  <Input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAudioUpload(f);
                    }}
                  />
                </label>
              )}
              <p className="text-[10px] text-muted-foreground">Tip: graba el audio en tu celular o usa cualquier TTS (ElevenLabs, etc.).</p>
            </div>

            <div className="space-y-1.5">
              <Label>Idioma (referencia)</Label>
              <Select value={voiceId} onValueChange={setVoiceId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VOICES.map((v) => (<SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Descripción visual (opcional)</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 300))}
                placeholder="Mujer joven sonriente, mirando a cámara, fondo desenfocado tipo cafetería, luz natural cálida…"
                rows={3}
              />
              <p className="text-[10px] text-muted-foreground">Describe la escena/expresión. El audio define lo que dice.</p>
            </div>

            <Button onClick={handleSubmit} disabled={submitting || !imageUrl || !audioUrl} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4" /> Generar ({COST} créditos)</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Influencers;