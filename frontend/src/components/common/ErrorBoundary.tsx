import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorMessage } from './ErrorMessage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow mt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
          <ErrorMessage message={this.state.error?.message || 'An unexpected application error occurred.'} />
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 transition"
            >
              Start Over
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
