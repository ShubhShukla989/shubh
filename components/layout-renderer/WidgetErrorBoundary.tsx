'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  widgetType?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('Widget Error Boundary caught an error:', error, errorInfo);
      console.error('Widget type:', this.props.widgetType);
      console.error('Error stack:', error.stack);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    
    // Force component re-render without page reload
    // The component will re-mount naturally
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-red-600">⚠️</div>
            <h4 className="text-red-800 font-medium">Widget Error</h4>
          </div>
          <p className="text-red-700 text-sm mb-2">
            {this.props.widgetType ? `Widget "${this.props.widgetType}" failed to render` : 'Widget failed to render'}
          </p>
          {this.state.error && (
            <details className="text-xs text-red-600">
              <summary className="cursor-pointer">Error details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleRetry}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}