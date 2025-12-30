import { useEffect, useRef, useCallback } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';

/**
 * Vitesse d'animation: combien de cycles d'onde complets par seconde
 * Une valeur de 0.5 signifie que l'onde fait un demi-cycle visible par seconde
 */
const ANIMATION_CYCLES_PER_SECOND = 0.5;

/**
 * Hook pour gérer l'animation de la propagation
 *
 * Le temps stocké est une "phase normalisée" (en radians) qui évolue
 * à un rythme visible, indépendamment de la fréquence réelle de l'onde.
 */
export function useAnimation() {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);

  const isAnimating = useSimulationStore((state) => state.isAnimating);
  const setTime = useSimulationStore((state) => state.setTime);

  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000; // Convertir en secondes
      lastTimeRef.current = timestamp;

      // Incrémenter la phase à un rythme visible
      // La phase augmente de 2π * ANIMATION_CYCLES_PER_SECOND par seconde
      const phaseIncrement = delta * 2 * Math.PI * ANIMATION_CYCLES_PER_SECOND;
      phaseRef.current += phaseIncrement;

      // Garder la phase dans [0, 2π] pour éviter les problèmes de précision
      if (phaseRef.current > 2 * Math.PI) {
        phaseRef.current -= 2 * Math.PI;
      }

      // Le temps stocké est directement la phase (en radians)
      setTime(phaseRef.current);

      frameRef.current = requestAnimationFrame(animate);
    },
    [setTime]
  );

  useEffect(() => {
    if (isAnimating) {
      lastTimeRef.current = 0;
      frameRef.current = requestAnimationFrame(animate);
    } else {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isAnimating, animate]);

  return {
    isAnimating,
    toggle: useSimulationStore((state) => state.toggleAnimation),
    reset: () => {
      phaseRef.current = 0;
      setTime(0);
    },
  };
}
