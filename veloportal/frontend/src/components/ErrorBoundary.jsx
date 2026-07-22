import React from 'react';

/**
 * Catches any render-time crash in the component tree below it and shows a
 * recoverable screen instead of a blank white page. This is the single
 * biggest defence against "blank screen" bugs — whatever the underlying
 * cause (a bad API response shape, a null reference, etc.), the user always
 * sees something actionable instead of nothing.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('VeloPortal render error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 text-center dark:bg-[#0A0F0C]">
          <span className="text-6xl">🚲💥</span>
          <h1 className="mt-6 font-display text-2xl font-bold text-ink dark:text-white">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-400 dark:text-white/50">
            This page hit an unexpected error. Your data is safe — try going back home.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-xl bg-black/5 p-4 text-left text-xs text-red-600 dark:bg-white/5 dark:text-red-400">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
          <button onClick={this.handleReset} className="btn-primary mt-6">Go back home</button>
        </div>
      );
    }
    return this.props.children;
  }
}
