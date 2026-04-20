import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Smartphone, Tablet, Monitor, Frame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import DeviceFrame from "./DeviceFrame";

interface ResizablePreviewProps {
  children: ReactNode;
  editable?: boolean;
}

const PRESETS = [
  { label: "Móvil", icon: Smartphone, width: 390 },
  { label: "Tablet", icon: Tablet, width: 768 },
  { label: "Desktop", icon: Monitor, width: 0 }, // 0 = full width
];

/** Copies all stylesheets and <style> tags from the parent document into the iframe */
const copyStyles = (sourceDoc: Document, targetDoc: Document) => {
  // Copy <link rel="stylesheet"> elements
  const links = sourceDoc.querySelectorAll('link[rel="stylesheet"]');
  links.forEach((link) => {
    const clone = targetDoc.createElement("link");
    clone.rel = "stylesheet";
    clone.href = (link as HTMLLinkElement).href;
    targetDoc.head.appendChild(clone);
  });

  // Copy inline <style> tags
  const styles = sourceDoc.querySelectorAll("style");
  styles.forEach((style) => {
    const clone = targetDoc.createElement("style");
    clone.textContent = style.textContent;
    targetDoc.head.appendChild(clone);
  });

  // Copy root classes (dark mode etc)
  targetDoc.documentElement.className = sourceDoc.documentElement.className;
};

/** Renders children inside an iframe so CSS media queries respond to iframe width */
const IframePreview = ({ children, width }: { children: ReactNode; width: number }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState(600);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Reset iframe body
      doc.body.style.margin = "0";
      doc.body.style.padding = "0";
      doc.body.style.overflow = "hidden";

      // Copy all styles from parent
      copyStyles(document, doc);

      // Create a mount div
      let mount = doc.getElementById("iframe-root");
      if (!mount) {
        mount = doc.createElement("div");
        mount.id = "iframe-root";
        doc.body.appendChild(mount);
      }
      setMountNode(mount);
    };

    // Trigger on initial load
    iframe.addEventListener("load", handleLoad);
    // Also try immediately for srcdoc
    handleLoad();

    return () => iframe.removeEventListener("load", handleLoad);
  }, []);

  // Observe content height to auto-size the iframe
  useEffect(() => {
    if (!mountNode) return;
    const doc = mountNode.ownerDocument;
    
    const updateHeight = () => {
      const h = doc.body.scrollHeight;
      if (h > 0) setIframeHeight(h);
    };

    const observer = new MutationObserver(updateHeight);
    observer.observe(mountNode, { childList: true, subtree: true, attributes: true });

    // Also update on images loading
    const handleResize = () => updateHeight();
    const win = doc.defaultView;
    win?.addEventListener("resize", handleResize);

    // Initial measurement with delay for styles to load
    const timer = setTimeout(updateHeight, 300);
    const timer2 = setTimeout(updateHeight, 1000);

    return () => {
      observer.disconnect();
      win?.removeEventListener("resize", handleResize);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [mountNode]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc="<!DOCTYPE html><html><head></head><body></body></html>"
      style={{
        width: `${width}px`,
        height: `${iframeHeight}px`,
        border: "none",
        display: "block",
        maxWidth: "100%",
      }}
      title="Landing Preview"
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
};

const ResizablePreview = ({ children, editable = false }: ResizablePreviewProps) => {
  const [previewWidth, setPreviewWidth] = useState(0); // 0 = full
  const [isDragging, setIsDragging] = useState(false);
  const [showFrame, setShowFrame] = useState(true);
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

  const useIframe = previewWidth > 0 && !editable;

  // Choose device frame: iPhone for mobile width, MacBook for desktop, none for tablet/custom or editable
  const frameDevice: "iphone" | "macbook" | "none" =
    !showFrame || editable
      ? "none"
      : previewWidth === 390
        ? "iphone"
        : previewWidth === 0
          ? "macbook"
          : "none";

  const frameApplied = frameDevice !== "none";

  return (
    <div className="flex flex-col" ref={containerRef}>
      {/* Device preset bar */}
      <div className="flex items-center justify-center gap-1 py-2 bg-muted/50 border-b flex-wrap">
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
            {preset.width > 0 && (
              <span className="text-[10px] text-muted-foreground ml-1 opacity-70">{preset.width}px</span>
            )}
          </Button>
        ))}
        {previewWidth > 0 && previewWidth !== 390 && previewWidth !== 768 && (
          <span className="text-xs text-muted-foreground ml-2">{Math.round(previewWidth)}px</span>
        )}
        {!editable && (previewWidth === 0 || previewWidth === 390) && (
          <>
            <span className="mx-2 h-4 w-px bg-border" />
            <Toggle
              size="sm"
              pressed={showFrame}
              onPressedChange={setShowFrame}
              className="h-7 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              aria-label="Toggle device frame"
            >
              <Frame className="h-3.5 w-3.5 mr-1" />
              Mockup
            </Toggle>
          </>
        )}
      </div>

      {/* Content with resize handles */}
      <div className={`relative flex justify-center ${frameApplied ? "py-8 bg-gradient-to-b from-muted/40 to-muted/10" : ""}`}>
        <div
          className={`relative ${isDragging ? "" : "transition-[width] duration-200 ease-out"}`}
          style={{
            width: previewWidth > 0 ? `${previewWidth}px` : "100%",
            maxWidth: "100%",
          }}
        >
          {frameApplied ? (
            <DeviceFrame device={frameDevice}>
              {useIframe ? (
                <IframePreview width={previewWidth || 1280}>{children}</IframePreview>
              ) : (
                children
              )}
            </DeviceFrame>
          ) : useIframe ? (
            <IframePreview width={previewWidth}>{children}</IframePreview>
          ) : (
            children
          )}

          {/* Right drag handle (hidden when device frame is on for cleaner look) */}
          {previewWidth > 0 && !frameApplied && (
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

  const useIframe = previewWidth > 0 && !editable;

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
            {preset.width > 0 && (
              <span className="text-[10px] text-muted-foreground ml-1 opacity-70">{preset.width}px</span>
            )}
          </Button>
        ))}
        {previewWidth > 0 && previewWidth !== 375 && previewWidth !== 768 && (
          <span className="text-xs text-muted-foreground ml-2">{Math.round(previewWidth)}px</span>
        )}
      </div>

      {/* Content with resize handles */}
      <div className="relative flex justify-center">
        <div
          className={`relative ${isDragging ? "" : "transition-[width] duration-200 ease-out"}`}
          style={{
            width: previewWidth > 0 ? `${previewWidth}px` : "100%",
            maxWidth: "100%",
          }}
        >
          {useIframe ? (
            <IframePreview width={previewWidth}>
              {children}
            </IframePreview>
          ) : (
            children
          )}

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
