import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Parallax 3D por ponteiro. O card inclina alguns graus na direção do cursor e
 * um brilho especular acompanha a posição. Toque e movimento reduzido ficam
 * estáticos; as variáveis CSS são atualizadas fora do React para não re-renderizar.
 */
export default function TiltCard({
  as: Tag = 'div',
  max = 7,
  lift = 3,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null);

  const handlePointerMove = useCallback(
    (event) => {
      const element = ref.current;
      if (!element || event.pointerType === 'touch' || prefersReducedMotion()) return;

      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const px = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      const py = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

      element.style.setProperty('--tilt-x', `${((0.5 - py) * max * 2).toFixed(2)}deg`);
      element.style.setProperty('--tilt-y', `${((px - 0.5) * max * 2).toFixed(2)}deg`);
      element.style.setProperty('--tilt-lift', `${-lift}px`);
      element.style.setProperty('--tilt-glow-x', `${(px * 100).toFixed(1)}%`);
      element.style.setProperty('--tilt-glow-y', `${(py * 100).toFixed(1)}%`);
    },
    [lift, max],
  );

  const reset = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty('--tilt-x', '0deg');
    element.style.setProperty('--tilt-y', '0deg');
    element.style.setProperty('--tilt-lift', '0px');
  }, []);

  return (
    <Tag
      ref={ref}
      className={`tilt-card ${className}`.trim()}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      {...rest}
    >
      {children}
    </Tag>
  );
}

TiltCard.propTypes = {
  as: PropTypes.elementType,
  max: PropTypes.number,
  lift: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
