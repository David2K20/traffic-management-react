import React from 'react';
import { FaExclamationTriangle, FaRedo, FaWifi, FaExclamationCircle } from 'react-icons/fa';
import Button from './ui/Button';
import Card from './ui/Card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isOnline: navigator.onLine
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, retryCount, isOnline } = this.state;
    
    if (hasError) {
      const isNetworkError = error && (
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.name === 'NetworkError'
      );

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Something went wrong
              </h3>
              
              {isNetworkError && (
                <div className="mb-4">
                  <div className="flex items-center justify-center mb-2">
                    {isOnline ? (
                      <FaWifi className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <FaExclamationCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {isOnline ? 'Connection restored' : 'No internet connection'}
                    </span>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-500 mb-4">
                {isNetworkError 
                  ? 'There was a problem connecting to our servers. Please check your internet connection and try again.'
                  : 'An unexpected error occurred. We apologize for the inconvenience.'
                }
              </p>
              
              {retryCount > 0 && (
                <p className="text-xs text-gray-400 mb-4">
                  Retry attempt: {retryCount}
                </p>
              )}
              
              <div className="space-y-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center"
                  disabled={!isOnline && isNetworkError}
                >
                  <FaRedo className="mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-gray-400 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                    {error && error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
