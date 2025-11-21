import { ScoreRecord, GameSettings, Difficulty, GameMode, ScreenMode, CrosshairType } from '../types';

// SECURITY: Use specific prefixes to avoid collisions and clarify ownership
const SCORES_KEY = 'reflex_trainer_scores';
const SETTINGS_KEY = 'reflex_trainer_settings';
const CHALLENGES_KEY = 'reflex_trainer_challenges';

export const DEFAULT_SETTINGS: GameSettings = {
  gameMode: GameMode.TIME_TRIAL,
  screenMode: ScreenMode.BOARD,
  difficulty: Difficulty.NORMAL,
  bubbleSize: 60,
  spawnDelay: 200,
  duration: 60,
  soundEnabled: true,
  sensitivity: 1.0,
  crosshairType: 'dot',
  crosshairColor: '#6366f1', // Indigo-500
};

// SECURITY: Validate settings shape and ranges to prevent logic errors or injection via localStorage modification
const validateSettings = (data: any): GameSettings => {
  if (!data || typeof data !== 'object') return DEFAULT_SETTINGS;

  // Helper to safe-check enums
  const safeEnum = <T>(val: any, enumObj: object, defaultVal: T): T => {
    return Object.values(enumObj).includes(val) ? val : defaultVal;
  };

  // Helper to safe-check numbers with ranges
  const safeNum = (val: any, min: number, max: number, defaultVal: number): number => {
    if (typeof val !== 'number' || isNaN(val)) return defaultVal;
    return Math.max(min, Math.min(max, val));
  };

  return {
    gameMode: safeEnum(data.gameMode, GameMode, DEFAULT_SETTINGS.gameMode),
    screenMode: safeEnum(data.screenMode, ScreenMode, DEFAULT_SETTINGS.screenMode),
    difficulty: safeEnum(data.difficulty, Difficulty, DEFAULT_SETTINGS.difficulty),
    bubbleSize: safeNum(data.bubbleSize, 10, 300, DEFAULT_SETTINGS.bubbleSize),
    spawnDelay: safeNum(data.spawnDelay, 0, 5000, DEFAULT_SETTINGS.spawnDelay),
    duration: safeNum(data.duration, 5, 3600, DEFAULT_SETTINGS.duration),
    soundEnabled: typeof data.soundEnabled === 'boolean' ? data.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    sensitivity: safeNum(data.sensitivity, 0.1, 10.0, DEFAULT_SETTINGS.sensitivity),
    crosshairType: ['dot', 'cross', 'circle', 'plus'].includes(data.crosshairType) ? data.crosshairType : DEFAULT_SETTINGS.crosshairType,
    crosshairColor: typeof data.crosshairColor === 'string' && data.crosshairColor.startsWith('#') && data.crosshairColor.length <= 7 
      ? data.crosshairColor 
      : DEFAULT_SETTINGS.crosshairColor,
  };
};

export const getStoredScores = (): ScoreRecord[] => {
  try {
    const data = localStorage.getItem(SCORES_KEY);
    // SECURITY: Basic JSON parse check
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 50); // Limit size
  } catch (e) {
    console.error('Failed to load scores', e);
    return [];
  }
};

export const saveScore = (record: ScoreRecord) => {
  try {
    const current = getStoredScores();
    const updated = [record, ...current].sort((a, b) => b.score - a.score).slice(0, 50);
    localStorage.setItem(SCORES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save score', e);
  }
};

export const getBestStreak = (): number => {
  const scores = getStoredScores();
  if (scores.length === 0) return 0;
  return Math.max(...scores.map(s => s.maxCombo || 0));
};

export const getStoredSettings = (): GameSettings | null => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return validateSettings(parsed);
  } catch (e) {
    return null;
  }
};

export const saveStoredSettings = (settings: GameSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
};

// Challenges Persistence
export const getCompletedChallenges = (): string[] => {
  try {
    const data = localStorage.getItem(CHALLENGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const markChallengeComplete = (id: string) => {
  try {
    const completed = new Set(getCompletedChallenges());
    completed.add(id);
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(Array.from(completed)));
  } catch (e) {
    console.error('Failed to save challenge', e);
  }
};