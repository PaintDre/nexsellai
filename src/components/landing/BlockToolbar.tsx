import { ArrowUp, ArrowDown, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockToolbarProps {
  blockType: string;
  blockTitle?: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

const BlockToolbar = ({
  blockType,
  blockTitle,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
}: BlockToolbarProps) => {
  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 bg-card/95 backdrop-blur-sm border border-border/60 rounded-lg shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab" />
      <span className="text-[11px] font-medium text-muted-foreground px-1.5 capitalize select-none">
        {blockTitle || blockType}
      </span>
      <div className="h-4 w-px bg-border/50 mx-0.5" />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-muted/80"
        onClick={onMoveUp}
        disabled={index === 0}
      >
        <ArrowUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-muted/80"
        onClick={onMoveDown}
        disabled={index === total - 1}
      >
        <ArrowDown className="h-3 w-3" />
      </Button>
      <div className="h-4 w-px bg-border/50 mx-0.5" />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default BlockToolbar;
