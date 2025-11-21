export enum Difficulty {
  EASY = 'Easy',
  NORMAL = 'Normal',
  HARD = 'Hard',
  CUSTOM = 'Custom',
}

export enum GameMode {
  TIME_TRIAL = 'Contrarreloj',
  SURVIVAL = 'Supervivencia',
}

export enum ScreenMode {
  FULL = 'Pantalla Completa',
  BOARD = 'Pizarra (Estándar)',
  COMPACT = 'Compacto',
}

export type CrosshairType = 'dot' | 'cross' | 'circle' | 'plus';

export interface GameSettings {
  gameMode: GameMode;
  screenMode: ScreenMode;
  difficulty: Difficulty;
  bubbleSize: number; // px
  spawnDelay: number; // ms
  duration: number; // seconds (for Time Trial)
  soundEnabled: boolean;
  sensitivity: number; // 0.1 to 5.0
  crosshairType: CrosshairType;
  crosshairColor: string;
}

export interface ScoreRecord {
  id: string;
  date: string;
  score: number;
  maxCombo: number;
  accuracy: number;
  difficulty: Difficulty;
  mode: GameMode;
  tags: string[]; // e.g. "Ninja", "Cirujano"
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  timeLeft: number;
  lives: number;
  level: number; // For survival scaling
  isPlaying: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  condition: (stats: GameStats, settings: GameSettings) => boolean;
}