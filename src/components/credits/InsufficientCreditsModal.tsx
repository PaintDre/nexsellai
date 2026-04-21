import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCredits } from "@/hooks/useCredits";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  required?: number;
  action?: string;
}

export const InsufficientCreditsModal = ({ open, onOpenChange, required, action }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { balance, allowance } = useCredits();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
            <Coins className="h-7 w-7 text-warning" />
          </div>
          <DialogTitle className="text-lg font-bold font-display">
            {t("credits.insufficientTitle", "No tienes suficientes créditos")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t("credits.insufficientDesc", "Esta acción cuesta {{required}} créditos y solo tienes {{balance}} disponibles de {{allowance}}.", { required: required ?? 0, balance, allowance })}
          </p>
          {action && (
            <p className="text-xs text-muted-foreground/80">
              {t("credits.action", "Acción")}: <span className="font-mono">{action}</span>
            </p>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t("common.close", "Cerrar")}
            </Button>
            <Button className="flex-1" onClick={() => { onOpenChange(false); navigate("/pricing"); }}>
              {t("credits.upgradePlan", "Mejorar plan")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
