import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCw, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ZANDO Pro Runtime Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('zando_pro_')) {
          localStorage.removeItem(key);
        }
      }
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset storage:', e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Une interruption inattendue est survenue
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                ZANDO Pro a intercepté une erreur d'exécution pour empêcher l'affichage d'une page blanche. Vos données commerciales stockées sont préservées.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                <span className="font-bold text-slate-400 block mb-1">Message d'erreur :</span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xs"
              >
                <RotateCw className="w-4 h-4" />
                <span>Actualiser l'application</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetData}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-600"
                title="Restaure les données de démonstration d'origine si les données locales sont corrompues"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Réparer les données locales</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
              ZANDO Pro · Logiciel de Gestion Commerciale
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
