import PropTypes from 'prop-types';
import Icon from './Icon.jsx';

export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return <button type="button" onClick={onToggle} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300" aria-label={`Ativar tema ${dark ? 'claro' : 'escuro'}`} aria-pressed={dark}>
    <Icon name={dark ? 'sun' : 'moon'} size={16} />
    <span>{dark ? 'Claro' : 'Escuro'}</span>
  </button>;
}

ThemeToggle.propTypes = { theme: PropTypes.oneOf(['light', 'dark']).isRequired, onToggle: PropTypes.func.isRequired };
