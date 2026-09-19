import type { OperationStep } from '../../core/steps';

interface StepPlayerProps<TSnapshot> {
  steps: OperationStep<TSnapshot>[];
  currentIndex: number;
  currentStep: OperationStep<TSnapshot> | null;
  isPlaying: boolean;
  speed: number;
  onStart: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.5, 1, 1.5, 2];

export function StepPlayer<TSnapshot>({
  steps,
  currentIndex,
  currentStep,
  isPlaying,
  speed,
  onStart,
  onPrevious,
  onNext,
  onPlay,
  onPause,
  onRestart,
  onSpeedChange,
}: StepPlayerProps<TSnapshot>) {
  if (steps.length === 0) {
    return <div className="step-player step-player--empty">Execute uma operação para ver o passo a passo aqui.</div>;
  }

  return (
    <div className="step-player">
      <div className="step-player__status">
        Passo {currentIndex + 1} de {steps.length}
      </div>
      <p className="step-player__description">{currentStep?.description}</p>

      <div className="step-player__controls">
        <button type="button" onClick={onStart} disabled={currentIndex <= 0} title="Início">
          ⏮ Início
        </button>
        <button type="button" onClick={onPrevious} disabled={currentIndex <= 0} title="Anterior">
          ← Anterior
        </button>
        {isPlaying ? (
          <button type="button" onClick={onPause} title="Pausar">
            ⏸ Pausar
          </button>
        ) : (
          <button type="button" onClick={onPlay} disabled={currentIndex >= steps.length - 1} title="Reproduzir">
            ▶ Reproduzir
          </button>
        )}
        <button type="button" onClick={onNext} disabled={currentIndex >= steps.length - 1} title="Próximo">
          Próximo →
        </button>
        <button type="button" onClick={onRestart} title="Reiniciar">
          ↺ Reiniciar
        </button>
      </div>

      <div className="step-player__speed">
        <span>Velocidade:</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={s === speed ? 'speed-btn speed-btn--active' : 'speed-btn'}
            onClick={() => onSpeedChange(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
