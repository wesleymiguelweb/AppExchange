/**
 * Fundo ambiente da RIA: aurora líquida, grade sutil e ruído.
 * Puramente decorativo — `aria-hidden`, sem eventos e atrás de todo o conteúdo.
 */
export default function LiquidBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      data-view-id="app.background"
    >
      <div className="aurora-blob aurora-a" />
      <div className="aurora-blob aurora-b" />
      <div className="aurora-blob aurora-c" />
      <div className="liquid-grid absolute inset-0 opacity-60" />
      <div className="noise absolute inset-0 opacity-[0.035] mix-blend-soft-light" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--bg)] to-transparent" />
    </div>
  );
}
