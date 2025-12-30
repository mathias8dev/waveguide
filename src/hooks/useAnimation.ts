import { useEffect, useRef, useCallback } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';

/**
 * Hook pour gérer l'animation de la propagation
 */
export function useAnimation() {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const isAnimating = useSimulationStore((state) => state.isAnimating);
  const setTime = useSimulationStore((state) => state.setTime);
  const frequency = useSimulationStore((state) => state.frequency);

  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000; // Convertir en secondes
      lastTimeRef.current = timestamp;

      // Mettre à jour le temps de simulation
      // On utilise un facteur pour ralentir l'animation visible
      const timeScale = 1 / frequency; // Plus la fréquence est haute, plus on ralentit
      setTime((prevTime) => prevTime + delta * timeScale * 1e10);

      frameRef.current = requestAnimationFrame(animate);
    },
    [setTime, frequency]
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
    reset: () => setTime(0),
  };
}
