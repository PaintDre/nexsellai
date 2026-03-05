import { useState, useRef, useCallback, type ReactNode } from "react";
import { Smartphone, Tablet, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResizablePreviewProps {
  children: ReactNode;
}

const PRESETS = [
  { label: "Móvil", icon: Smartphone, width: 375 },
  { label: "Tablet", icon: Tablet, width: 768 },
  { label: "Desktop", icon: Monitor, width: 0 }, // 0 = full width
];

const ResizablePreview = ({ children }: ResizablePreviewProps) => {
  const [previewWidth, setPreviewWidth] = useState(0); // 0 = full
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const newHalfWidth = Math.abs(ev.clientX - centerX);
      const newWidth = Math.max(320, Math.min(newHalfWidth * 2, rect.width));
      setPreviewWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  const activePreset = PRESETS.find(p => p.width === previewWidth) 
    || (previewWidth === 0 ? PRESETS[2] : null);

  return (
    <div className="flex flex-col" ref={containerRef}>
      {/* Device preset bar */}
      <div className="flex items-center justify-center gap-1 py-2 bg-muted/50 border-b">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant={activePreset === preset ? "default" : "ghost"}
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => setPreviewWidth(preset.width)}
          >
            <preset.icon className="h-3.5 w-3.5 mr-1" />
            {preset.label}
          </Button>
        ))}
        {previewWidth > 0 && previewWidth !== 375 && previewWidth !== 768 && (
          <span className="text-xs text-muted-foreground ml-2">{Math.round(previewWidth)}px</span>
        )}
      </div>

      {/* Content with resize handles */}
      <div className="relative flex justify-center">
        <div
          className="relative transition-[width] duration-200 ease-out"
          style={{
            width: previewWidth > 0 ? `${previewWidth}px` : "100%",
            maxWidth: "100%",
          }}
        >
          {children}

          {/* Right drag handle */}
          {previewWidth > 0 && (
            <div
              className="absolute top-0 -right-3 w-6 h-full flex items-center justify-center cursor-col-resize z-10 group"
              onMouseDown={handleMouseDown}
            >
              <div className={`w-1.5 h-12 rounded-full transition-colors ${
                isDragging ? "bg-primary" : "bg-border group-hover:bg-primary/60"
              }`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResizablePreview;
