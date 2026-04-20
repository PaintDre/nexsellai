import { useState, useEffect } from "react";
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
import { Loader2, Store, CheckCircle, Unlink } from "lucide-react";
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
  const [connecting, setConnecting] = useState(false);
  const [existingConnection, setExistingConnection] = useState<{ store_domain: string; shop_name: string | null } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const check = async () => {
      const { data } = await supabase
        .from("shopify_connections_safe" as any)
        .select("store_domain, shop_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setExistingConnection(data as any);
    };
    check();
  }, [open, user]);

  const cleanDomain = (domain: string) => {
    let d = domain.trim();
    d = d.replace(/^https?:\/\//, "");
    d = d.replace(/\/+$/, "");
    if (!d.includes(".myshopify.com") && !d.includes(".")) {
      d = `${d}.myshopify.com`;
    }
    return d;
  };

  const handleConnect = async () => {
    if (!storeDomain) return;
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("shopify-export", {
        body: {
          action: "oauth-start",
          storeDomain: cleanDomain(storeDomain),
        },
      });
      if (error || data?.error) {
        toast({
          title: t("shopify.connectError"),
          description: data?.error || error?.message,
          variant: "destructive",
        });
        setConnecting(false);
        return;
      }
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      toast({ title: t("shopify.connectError"), variant: "destructive" });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("shopify-export", {
        body: { action: "disconnect" },
      });
      if (error || data?.error) {
        toast({ title: t("common.error"), variant: "destructive" });
      } else {
        setExistingConnection(null);
        toast({ title: t("shopify.disconnected") });
        onConnected();
      }
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setDisconnecting(false);
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

        {existingConnection ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {t("shopify.connectedTo", { domain: existingConnection.shop_name || existingConnection.store_domain })}
                </p>
                <p className="text-xs text-muted-foreground">{existingConnection.store_domain}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Unlink className="h-4 w-4 mr-1" />}
                {t("shopify.disconnect")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-domain">{t("shopify.enterDomain")}</Label>
              <Input
                id="store-domain"
                placeholder="mystore.myshopify.com"
                value={storeDomain}
                onChange={(e) => setStoreDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p>{t("shopify.oauthExplanation")}</p>
            </div>

            <DialogFooter>
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting || !storeDomain}
                className="bg-[#96bf48] hover:bg-[#7ea63d] text-white"
              >
                {connecting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Store className="h-4 w-4 mr-1" />}
                {t("shopify.connectWithOAuth")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShopifyConnectDialog;
