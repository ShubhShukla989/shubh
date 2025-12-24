'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  widgetType: string;
  widgetTitle?: string;
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

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`Widget Error [${this.props.widgetType}]:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">×</span>
            </div>
            <p className="text-red-800 text-sm font-medium">
              {this.props.widgetTitle || this.props.widgetType} Widget Error
            </p>
          </div>
          <p className="text-red-600 text-xs mt-1">
            Widget failed to render. Check console for details.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}