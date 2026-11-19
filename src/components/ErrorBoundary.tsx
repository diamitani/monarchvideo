import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const raw = error instanceof Error ? error.message : String(error);
    return { hasError: true, message: raw };
  }

  componentDidCatch(error: unknown) {
    console.error('Monarch Video ErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAFBFD] p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2 text-[#102D69]">
              <ShieldAlert className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="font-display text-base font-semibold">Workspace Recovery</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              An unexpected error interrupted this view. Your saved projects remain intact.
            </p>
            <pre className="mt-3 max-h-36 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-700">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white hover:bg-[#091A3E]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload Studio</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
