import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';
      const pageName = this.props.pageName;

      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-background text-foreground" data-testid="error-boundary">
          <div className="max-w-md w-full border border-border bg-secondary p-8">
            <h1 className="text-xl font-semibold text-foreground mb-2">
              {pageName ? `${pageName} failed to load` : 'Something went wrong'}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {pageName
                ? `An unexpected error occurred in ${pageName}. You can retry, reload the page, or go back to the dashboard.`
                : 'An unexpected error occurred. You can try reloading the page or navigating back to the dashboard.'}
            </p>
            {isDev && this.state.error && (
              <pre className="text-xs text-muted-foreground bg-background border border-border p-3 mb-6 overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90"
                data-testid="error-retry-btn"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
              >
                Reload
              </button>
              <a
                href="/dashboard"
                className="border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background inline-flex items-center"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
