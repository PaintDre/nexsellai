export type DiagnosticLogLevel = "log" | "info" | "warn" | "error";

export interface DiagnosticLogEntry {
  id: string;
  level: DiagnosticLogLevel;
  message: string;
  timestamp: string;
  source: "console" | "window" | "react";
}

const MAX_LOGS = 80;
const listeners = new Set<() => void>();
const logs: DiagnosticLogEntry[] = [];
let installed = false;

const serialize = (value: unknown): string => {
  if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack ?? ""}`.trim();
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const addDiagnosticLog = (
  level: DiagnosticLogLevel,
  source: DiagnosticLogEntry["source"],
  parts: unknown[],
) => {
  logs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    level,
    source,
    timestamp: new Date().toISOString(),
    message: parts.map(serialize).join(" "),
  });
  logs.splice(MAX_LOGS);
  listeners.forEach((listener) => listener());
};

export const getDiagnosticLogs = () => [...logs];

export const subscribeDiagnosticLogs = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const installDiagnosticsCapture = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  (["log", "info", "warn", "error"] as DiagnosticLogLevel[]).forEach((level) => {
    const original = console[level];
    console[level] = (...args: unknown[]) => {
      addDiagnosticLog(level, "console", args);
      original.apply(console, args as never);
    };
  });

  window.addEventListener("error", (event) => {
    addDiagnosticLog("error", "window", [event.message, event.error]);
  });

  window.addEventListener("unhandledrejection", (event) => {
    addDiagnosticLog("error", "window", ["Unhandled promise rejection", event.reason]);
  });
};