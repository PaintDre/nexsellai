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
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-card border rounded-lg shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground px-1 capitalize">
        {blockTitle || blockType}
      </span>
      <div className="h-4 w-px bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onMoveUp}
        disabled={index === 0}
      >
        <ArrowUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onMoveDown}
        disabled={index === total - 1}
      >
        <ArrowDown className="h-3 w-3" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default BlockToolbar;
