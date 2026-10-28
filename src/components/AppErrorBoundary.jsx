import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Hermes failed to render the interface.', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <section className="w-full max-w-xl rounded-3xl border border-rose-200 bg-white p-7 shadow-xl dark:border-rose-900 dark:bg-slate-900" role="alert">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-rose-600 dark:text-rose-400">Erro ao abrir o painel</p>
          <h1 className="mt-2 text-2xl font-semibold">A interface encontrou um problema.</h1>
          <p className="mt-3 break-words text-sm text-slate-600 dark:text-slate-300">{this.state.error.message || 'Erro inesperado ao renderizar a página.'}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">Recarregar interface</button>
        </section>
      </main>;
    }
    return this.props.children;
  }
}
