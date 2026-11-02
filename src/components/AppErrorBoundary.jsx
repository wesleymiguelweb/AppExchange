import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Última linha de defesa da interface: se algum componente lançar erro de
 * renderização, o usuário vê uma mensagem em vez de uma tela em branco.
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[Hermes] erro de renderização', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: '80px 24px',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#172b24',
          }}
        >
          <h1 style={{ fontSize: 28, letterSpacing: '-0.02em' }}>Algo saiu do previsto.</h1>
          <p style={{ marginTop: 12, color: 'rgba(23, 43, 36, 0.7)' }}>
            Recarregue a página para tentar novamente. Se o problema persistir, verifique se a
            Frankfurter está acessível na sua rede.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24,
              padding: '12px 20px',
              borderRadius: 10,
              border: 0,
              background: '#172b24',
              color: '#f7f7f5',
              fontWeight: 600,
            }}
          >
            Recarregar
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

AppErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
