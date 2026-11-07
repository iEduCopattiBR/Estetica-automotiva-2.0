import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#070709',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '400px',
            backgroundColor: '#18181b',
            border: '1px solid #dc2626',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(220, 38, 38, 0.2)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171', marginBottom: '8px' }}>
              Schmitt Detailer
            </h2>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '16px' }}>
              Ocorreu uma falha ao carregar a interface:
            </p>
            <div style={{
              fontSize: '11px',
              color: '#fca5a5',
              backgroundColor: '#000000',
              padding: '10px',
              borderRadius: '8px',
              textAlign: 'left',
              wordBreak: 'break-word',
              marginBottom: '16px',
              fontFamily: 'monospace'
            }}>
              {this.state.error?.message || 'Erro desconhecido'}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
