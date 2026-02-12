import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex items-center justify-center min-h-[400px] p-6">
                    <Card className="max-w-md w-full p-6 border-red-200 bg-red-50 shadow-lg">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="bg-red-100 p-3 rounded-full">
                                <AlertTriangle className="w-10 h-10 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-red-900">Something went wrong</h2>
                            <p className="text-sm text-red-700">
                                The application encountered an unexpected error.
                                <br />
                                <span className="font-mono text-xs mt-2 block bg-red-100 p-2 rounded">
                                    {this.state.error?.message}
                                </span>
                            </p>
                            <Button
                                onClick={() => window.location.reload()}
                                className="bg-red-600 hover:bg-red-700 text-white gap-2 w-full"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reload Application
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
