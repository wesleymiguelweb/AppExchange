/**
 * Fontes disponíveis para a interface. Todas são carregadas pelo Google Fonts
 * com `display=swap`; a escolha é aplicada em `data-font` no <html>.
 */
export const FONT_OPTIONS = [
  { id: 'inter', label: 'Inter', noteKey: 'settings.fonts.inter' },
  { id: 'manrope', label: 'Manrope', noteKey: 'settings.fonts.manrope' },
  { id: 'sora', label: 'Sora', noteKey: 'settings.fonts.sora' },
  { id: 'grotesk', label: 'Space Grotesk', noteKey: 'settings.fonts.grotesk' },
  { id: 'plex', label: 'IBM Plex Sans', noteKey: 'settings.fonts.plex' },
  { id: 'outfit', label: 'Outfit', noteKey: 'settings.fonts.outfit' },
];

export const DEFAULT_FONT = 'inter';

const FONT_IDS = new Set(FONT_OPTIONS.map((font) => font.id));

export function isFontId(value) {
  return FONT_IDS.has(value);
}

export function findFont(id) {
  return FONT_OPTIONS.find((font) => font.id === id) ?? FONT_OPTIONS[0];
}
