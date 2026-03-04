import { Truck, ShieldCheck, Lock, CreditCard } from "lucide-react";

interface TrustBadgesProps {
  className?: string;
  colorClass?: string;
  extraItems?: string[];
}

const TrustBadges = ({ className = "", colorClass = "text-gray-400", extraItems = [] }: TrustBadgesProps) => {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs ${colorClass} ${className}`}>
      <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Envío seguro</span>
      <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Compra protegida</span>
      <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Pago 100% seguro</span>
      <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Tarjetas aceptadas</span>
      {extraItems.map((item, i) => (
        <span key={i}>{item}</span>
      ))}
    </div>
  );
};

export default TrustBadges;
