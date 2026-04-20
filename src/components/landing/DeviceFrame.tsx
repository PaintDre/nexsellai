import type { ReactNode } from "react";

interface DeviceFrameProps {
  device: "iphone" | "macbook" | "none";
  children: ReactNode;
}

/**
 * Realistic device mockup frames (CSS-only, no external lib).
 * - iPhone: notch, rounded bezel, side buttons, ~390px viewport.
 * - MacBook: lid + base, rounded display, 1280px viewport.
 */
const DeviceFrame = ({ device, children }: DeviceFrameProps) => {
  if (device === "none") return <>{children}</>;

  if (device === "iphone") {
    return (
      <div className="mx-auto" style={{ width: "fit-content" }}>
        <div
          className="relative bg-neutral-900 rounded-[3rem] p-3 shadow-2xl"
          style={{
            width: "calc(390px + 1.5rem)",
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.05) inset",
          }}
        >
          {/* Side buttons */}
          <span className="absolute left-[-3px] top-24 w-[3px] h-8 bg-neutral-800 rounded-l" />
          <span className="absolute left-[-3px] top-40 w-[3px] h-12 bg-neutral-800 rounded-l" />
          <span className="absolute left-[-3px] top-56 w-[3px] h-12 bg-neutral-800 rounded-l" />
          <span className="absolute right-[-3px] top-32 w-[3px] h-16 bg-neutral-800 rounded-r" />

          {/* Screen */}
          <div className="relative bg-white rounded-[2.25rem] overflow-hidden" style={{ width: 390 }}>
            {/* Dynamic Island / notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-28 h-7 bg-black rounded-full pointer-events-none" />
            <div className="overflow-y-auto" style={{ maxHeight: "780px" }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MacBook
  return (
    <div className="mx-auto w-full" style={{ maxWidth: 1340 }}>
      {/* Lid */}
      <div
        className="relative mx-auto bg-neutral-900 rounded-t-2xl p-3"
        style={{
          width: "100%",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.04) inset",
        }}
      >
        {/* Camera dot */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-neutral-700 rounded-full" />
        {/* Screen */}
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight: "720px" }}>
            {children}
          </div>
        </div>
      </div>
      {/* Base / hinge */}
      <div className="relative mx-auto" style={{ width: "104%", marginLeft: "-2%" }}>
        <div className="h-3 bg-gradient-to-b from-neutral-300 to-neutral-400 rounded-b-xl" />
        <div className="mx-auto w-32 h-1.5 bg-neutral-400 rounded-b-xl" />
      </div>
    </div>
  );
};

export default DeviceFrame;
