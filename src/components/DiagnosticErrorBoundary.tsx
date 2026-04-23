import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDiagnosticLog } from "@/lib/diagnostics";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class DiagnosticErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    addDiagnosticLog("error", "react", [error, errorInfo.componentStack]);
    this.setState({ errorInfo });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground">
        <section className="mx-auto flex max-w-3xl flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">Diagnóstico del preview</h1>
              <p className="mt-1 text-sm text-muted-foreground">La app encontró un error de render y evitó la pantalla en blanco.</p>
            </div>
          </div>
          <pre className="max-h-[45vh] overflow-auto rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">
            {this.state.error.name}: {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
            {"\n"}
            {this.state.errorInfo?.componentStack}
          </pre>
          <Button onClick={() => window.location.reload()} className="w-fit">
            <RefreshCw className="h-4 w-4" />
            Recargar preview
          </Button>
        </section>
      </main>
    );
  }
}