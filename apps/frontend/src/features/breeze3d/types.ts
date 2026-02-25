export type FanSpeed = 0 | 1 | 2 | 3 | 4;

/**
 * Shared mutable ref for the real-time nature wind factor (0–1).
 * FanModel writes this value every frame; WindParticles & FanAudio read it.
 */
export type NatureFactorRef = { current: number };

export interface FanState {
  speed: FanSpeed;
  isOscillating: boolean;
  power: boolean;
  natureMode: boolean;
  timerMinutes: number | null;
}

export interface FanProps {
  speed: FanSpeed;
  isOscillating: boolean;
  natureMode?: boolean;
  natureFactorRef: NatureFactorRef;
  rotationSpeedRef?: NatureFactorRef;
}
