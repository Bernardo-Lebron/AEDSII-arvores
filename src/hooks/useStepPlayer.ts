import { useEffect, useRef, useState } from 'react';
import type { OperationStep } from '../core/steps';

export interface StepPlayerControls<TSnapshot> {
  steps: OperationStep<TSnapshot>[];
  currentIndex: number;
  currentStep: OperationStep<TSnapshot> | null;
  isPlaying: boolean;
  speed: number;
  setSteps: (steps: OperationStep<TSnapshot>[]) => void;
  goToStart: () => void;
  goToEnd: () => void;
  goPrevious: () => void;
  goNext: () => void;
  play: () => void;
  pause: () => void;
  restart: () => void;
  setSpeed: (speed: number) => void;
}

const BASE_INTERVAL_MS = 1000;

/** Controla a reprodução (manual ou automática) de uma trilha de OperationStep. */
export function useStepPlayer<TSnapshot>(): StepPlayerControls<TSnapshot> {
  const [steps, setStepsState] = useState<OperationStep<TSnapshot>[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function setSteps(newSteps: OperationStep<TSnapshot>[]): void {
    setStepsState(newSteps);
    setCurrentIndex(newSteps.length > 0 ? 0 : -1);
    setIsPlaying(false);
  }

  function goToStart(): void {
    setIsPlaying(false);
    setCurrentIndex(steps.length > 0 ? 0 : -1);
  }

  function goToEnd(): void {
    setIsPlaying(false);
    setCurrentIndex(steps.length - 1);
  }

  function goPrevious(): void {
    setIsPlaying(false);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function goNext(): void {
    setCurrentIndex((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        setIsPlaying(false);
        return i;
      }
      return next;
    });
  }

  function play(): void {
    if (steps.length === 0) return;
    if (currentIndex >= steps.length - 1) setCurrentIndex(0);
    setIsPlaying(true);
  }

  function pause(): void {
    setIsPlaying(false);
  }

  function restart(): void {
    setIsPlaying(false);
    setCurrentIndex(steps.length > 0 ? 0 : -1);
  }

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      goNext();
    }, BASE_INTERVAL_MS / speed);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed, steps.length]);

  return {
    steps,
    currentIndex,
    currentStep: currentIndex >= 0 && currentIndex < steps.length ? steps[currentIndex] : null,
    isPlaying,
    speed,
    setSteps,
    goToStart,
    goToEnd,
    goPrevious,
    goNext,
    play,
    pause,
    restart,
    setSpeed,
  };
}
