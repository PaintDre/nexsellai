import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, ExternalLink, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

interface ShopifyConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

const ShopifyConnectDialog = ({ open, onOpenChange, onConnected }: ShopifyConnectDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [storeDomain, setStoreDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const cleanDomain = (domain: string) => {
    let d = domain.trim();
    d = d.replace(/^https?:\/\//, "");
    d = d.replace(/\/+$/, "");
    if (!d.includes(".myshopify.com") && !d.includes(".")) {
      d = `${d}.myshopify.com`;
    }
    return d;
  };

  const handleTestConnection = async () => {
    if (!storeDomain || !accessToken) return;
    setTesting(true);
    setTestSuccess(false);
    try {
      const { data, error } = await supabase.functions.invoke("shopify-export", {
        body: {
          action: "test-connection",
          storeDomain: cleanDomain(storeDomain),
          accessToken: accessToken.trim(),
        },
      });
      if (error || data?.error) {
        toast({
          title: t("shopify.testFailed"),
          description: data?.error || error?.message,
          variant: "destructive",
        });
      } else {
        setTestSuccess(true);
        toast({ title: `✅ ${t("shopify.testSuccess")}${data?.shopName ? `: ${data.shopName}` : ""}` });
      }
    } catch {
      toast({ title: t("shopify.testFailed"), variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!user || !storeDomain || !accessToken) return;
    setSaving(true);
    try {
      const domain = cleanDomain(storeDomain);
      // Upsert connection
      const { error } = await supabase
        .from("shopify_connections" as any)
        .upsert(
          { user_id: user.id, store_domain: domain, access_token: accessToken.trim() } as any,
          { onConflict: "user_id" }
        );
      if (error) throw error;
      toast({ title: t("shopify.connected") });
      onConnected();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t("shopify.connectTitle")}
          </DialogTitle>
          <DialogDescription>{t("shopify.connectDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-domain">{t("shopify.storeDomain")}</Label>
            <Input
              id="store-domain"
              placeholder="mystore.myshopify.com"
              value={storeDomain}
              onChange={(e) => { setStoreDomain(e.target.value); setTestSuccess(false); }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-token">{t("shopify.accessToken")}</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="shpat_xxxxx..."
              value={accessToken}
              onChange={(e) => { setAccessToken(e.target.value); setTestSuccess(false); }}
            />
          </div>

          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">{t("shopify.howToGetToken")}</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>{t("shopify.step1")}</li>
              <li>{t("shopify.step2")}</li>
              <li>{t("shopify.step3")}</li>
              <li>{t("shopify.step4")}</li>
            </ol>
            <a
              href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
            >
              {t("shopify.learnMore")} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing || !storeDomain || !accessToken}
          >
            {testing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : testSuccess ? <CheckCircle className="h-4 w-4 mr-1 text-green-500" /> : null}
            {t("shopify.testConnection")}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !storeDomain || !accessToken}
          >
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {t("shopify.saveConnection")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShopifyConnectDialog;
