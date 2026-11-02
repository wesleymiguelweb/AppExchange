import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';

const InspectorContext = createContext(null);

function safeQuery(id) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return `[data-view-id="${CSS.escape(id)}"]`;
  }
  return `[data-view-id="${String(id).replace(/"/g, '\\"')}"]`;
}

export function describeElement(element) {
  if (!element || !(element instanceof Element)) return null;
  const rect = element.getBoundingClientRect();

  return {
    id: element.dataset.viewId,
    name: element.dataset.viewName || element.dataset.viewId,
    component: element.dataset.viewComponent || element.tagName.toLowerCase(),
    tag: element.tagName.toLowerCase(),
    role: element.getAttribute('role') || '',
    ariaLabel: element.getAttribute('aria-label') || '',
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    visible: rect.width > 0 && rect.height > 0,
    className: typeof element.className === 'string' ? element.className : '',
  };
}

function findByViewId(id) {
  if (!id) return null;
  const candidates = [...document.querySelectorAll(safeQuery(id))];
  return candidates.find((element) => element.getBoundingClientRect().width > 0) ?? candidates[0] ?? null;
}

/**
 * Inspetor de views no espírito do Layout Inspector do Android Studio /
 * `findViewById`: destaca qualquer elemento com `data-view-id`, mostra a
 * hierarquia, as medidas e os atributos, e permite localizar por id.
 */
export function InspectorProvider({ children }) {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [finderOpen, setFinderOpen] = useState(false);

  const readTarget = useCallback((target) => {
    if (!(target instanceof Element)) return null;
    if (target.closest('[data-inspector-ui]')) return null;
    const element = target.closest('[data-view-id]');
    return element ? describeElement(element) : null;
  }, []);

  const enable = useCallback(() => setEnabled(true), []);
  const disable = useCallback(() => {
    setEnabled(false);
    setHovered(null);
    setSelected(null);
    setFinderOpen(false);
  }, []);
  const toggle = useCallback(() => {
    setEnabled((current) => {
      if (current) {
        setHovered(null);
        setSelected(null);
        setFinderOpen(false);
      }
      return !current;
    });
  }, []);

  const selectView = useCallback((id) => {
    const element = findByViewId(id);
    if (!element) return false;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    });
    setSelected(describeElement(element));
    return true;
  }, []);

  const listViews = useCallback(() => {
    const seen = new Set();
    return [...document.querySelectorAll('[data-view-id]')]
      .map((element) => describeElement(element))
      .filter((view) => {
        if (!view?.id || seen.has(view.id)) return false;
        seen.add(view.id);
        return true;
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.inspector = enabled ? 'on' : 'off';
    return () => {
      document.documentElement.dataset.inspector = 'off';
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handlePointerOver = (event) => {
      const info = readTarget(event.target);
      setHovered((current) => (current?.id === info?.id ? current : info));
    };

    const handleClick = (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-inspector-ui]')) return;

      const info = readTarget(event.target);
      if (!info) return;

      event.preventDefault();
      event.stopPropagation();
      setSelected(info);
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setSelected((current) => {
        if (current) return null;
        return current;
      });
    };

    document.addEventListener('pointerover', handlePointerOver, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerover', handlePointerOver, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, readTarget]);

  // Mantém a caixa alinhada ao rolar/redimensionar.
  useEffect(() => {
    if (!enabled) return undefined;

    const refresh = () => {
      const update = (current) => {
        if (!current) return current;
        const element = findByViewId(current.id);
        return element ? describeElement(element) : current;
      };
      setHovered(update);
      setSelected(update);
    };

    window.addEventListener('scroll', refresh, true);
    window.addEventListener('resize', refresh);
    return () => {
      window.removeEventListener('scroll', refresh, true);
      window.removeEventListener('resize', refresh);
    };
  }, [enabled]);

  // Ao navegar, referências antigas deixam de existir.
  useEffect(() => {
    const handleHash = () => setSelected(null);
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      hovered,
      selected,
      finderOpen,
      enable,
      disable,
      toggle,
      selectView,
      listViews,
      openFinder: () => setFinderOpen(true),
      closeFinder: () => setFinderOpen(false),
      clearSelected: () => setSelected(null),
    }),
    [enabled, hovered, selected, finderOpen, enable, disable, toggle, selectView, listViews],
  );

  return <InspectorContext.Provider value={value}>{children}</InspectorContext.Provider>;
}

InspectorProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useInspector() {
  const context = useContext(InspectorContext);
  if (!context) {
    throw new Error('useInspector precisa estar dentro de <InspectorProvider>.');
  }
  return context;
}
