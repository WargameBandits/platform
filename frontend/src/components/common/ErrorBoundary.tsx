import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
          <h1 className="font-pixel text-2xl text-destructive">
            [SYSTEM_ERROR]
          </h1>
          <p className="mt-4 font-retro text-lg text-muted-foreground">
            Something went wrong. Please try again.
          </p>
          <pre className="mt-4 max-w-lg overflow-auto border-2 border-border bg-muted p-4 font-mono text-sm text-foreground">
            {this.state.error?.message}
          </pre>
          <button
            onClick={this.handleReset}
            className="mt-6 border-2 border-border bg-neon px-6 py-2 font-semibold uppercase text-black shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg"
          >
            Go Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;