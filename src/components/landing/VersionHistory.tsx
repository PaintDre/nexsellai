import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";

interface Version {
  id: string;
  landing_id: string;
  user_id: string;
  blocks: any;
  theme: string;
  version_number: number;
  created_at: string;
  label: string | null;
}

interface VersionHistoryProps {
  landingId: string;
  userId: string;
  onRestore: (blocks: any[], theme: string) => void;
}

const VersionHistory = ({ landingId, userId, onRestore }: VersionHistoryProps) => {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadVersions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("landing_versions")
      .select("*")
      .eq("landing_id", landingId)
      .order("created_at", { ascending: false })
      .limit(20);
    setVersions((data as unknown as Version[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadVersions();
  }, [open, landingId]);

  const handleRestore = async (version: Version) => {
    setRestoring(version.id);
    try {
      onRestore(version.blocks as any[], version.theme);
      setOpen(false);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{t("versionHistory.button")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> {t("versionHistory.title")}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              {t("versionHistory.empty")}
            </p>
          ) : (
            versions.map((v, i) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {t("versionHistory.version")} {v.version_number}
                    </span>
                    {i === 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {t("versionHistory.latest")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {v.label && (
                    <p className="text-xs text-muted-foreground italic">{v.label}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleRestore(v)}
                  disabled={restoring === v.id}
                >
                  {restoring === v.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <><RotateCcw className="h-3 w-3 mr-1" /> {t("versionHistory.restore")}</>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VersionHistory;
