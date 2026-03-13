import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: string;
  used: number;
  limit: number;
}

export const UpgradeModal = ({ open, onOpenChange, resource, used, limit }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-lg font-bold font-display">
            {t("upgrade.limitReached")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t("upgrade.limitDesc", { used, limit, resource })}
          </p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t("common.close")}
            </Button>
            <Button className="flex-1" onClick={() => { onOpenChange(false); navigate("/pricing"); }}>
              {t("upgrade.viewPlans")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
