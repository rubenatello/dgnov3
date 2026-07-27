import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PublicErrorBoundaryProps {
  children: ReactNode;
}

interface PublicErrorBoundaryState {
  failed: boolean;
}

export default class PublicErrorBoundary extends Component<
  PublicErrorBoundaryProps,
  PublicErrorBoundaryState
> {
  state: PublicErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): PublicErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, details: ErrorInfo) {
    console.error('Public route render failed', error, details.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section className="mx-auto min-h-[70dvh] max-w-3xl px-4 py-16 sm:px-6" role="alert">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">DGNO encountered an error</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
          This page could not be displayed
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-muted">
          The rest of DGNO is still available. Reload this page once, or return to the latest reporting while the problem is reviewed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-11 items-center rounded-full bg-accent-strong px-5 py-2.5 font-bold text-white hover:bg-accent-dark"
          >
            Reload page
          </button>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-full border border-stone px-5 py-2.5 font-bold text-ink hover:bg-stone-light"
          >
            Return home
          </Link>
        </div>
      </section>
    );
  }
}
