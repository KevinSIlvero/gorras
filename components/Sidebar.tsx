import React from 'react';
import { GameSettings, Difficulty, ScoreRecord, CrosshairType, GameMode, ScreenMode, Challenge } from '../types';
import { X, Volume2, VolumeX, History, Settings, HelpCircle, MousePointer2, Target, Monitor, Clock, Skull, CheckCircle2, Trophy } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (newSettings: GameSettings) => void;
  highScores: ScoreRecord[];
  bestStreak: number;
  onShowTutorial: () => void;
  isMobile: boolean;
  challenges: Challenge[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  highScores,
  bestStreak,
  onShowTutorial,
  isMobile,
  challenges
}) => {
  
  const handleDifficultyChange = (diff: Difficulty) => {
    let newSettings = { ...settings, difficulty: diff };
    
    switch (diff) {
      case Difficulty.EASY:
        newSettings = { ...newSettings, bubbleSize: 90, spawnDelay: 400 };
        break;
      case Difficulty.NORMAL:
        newSettings = { ...newSettings, bubbleSize: 60, spawnDelay: 200 };
        break;
      case Difficulty.HARD:
        newSettings = { ...newSettings, bubbleSize: 40, spawnDelay: 0 };
        break;
      case Difficulty.CUSTOM:
        break;
    }
    onSettingsChange(newSettings);
  };

  const handleSliderChange = (key: keyof GameSettings, value: number) => {
    // SECURITY: Although checked in storage, we also clamp here for UI consistency
    onSettingsChange({
      ...settings,
      [key]: value,
      difficulty: Difficulty.CUSTOM,
    });
  };

  const CROSSHAIR_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#06b6d4', '#eab308', '#d946ef', '#ffffff'];

  const CROSSHAIR_TYPES: { id: CrosshairType; label: string }[] = [
    { id: 'dot', label: 'Punto' },
    { id: 'cross', label: 'Cruz' },
    { id: 'plus', label: 'Más' },
    { id: 'circle', label: 'Círculo' },
  ];

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-zinc-900/95 backdrop-blur-md border-l border-zinc-800 transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto shadow-2xl ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center sticky top-0 bg-zinc-900/95 backdrop-blur py-2 z-10 -mx-6 px-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6" /> Ajustes
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
             <button
            onClick={() => onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled })}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-semibold transition ${
              settings.soundEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            {settings.soundEnabled ? 'Sonido' : 'Silencio'}
          </button>
          <button 
            onClick={onShowTutorial}
            className="flex items-center justify-center p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
            title="Ver Tutorial"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Game Mode Selection */}
        <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Modo de Juego
            </label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onSettingsChange({ ...settings, gameMode: GameMode.TIME_TRIAL })}
                    className={`p-3 rounded-lg border text-left transition ${
                        settings.gameMode === GameMode.TIME_TRIAL 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500' 
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                >
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <Clock className="w-4 h-4" /> Contrarreloj
                    </div>
                    <div className="text-[11px] opacity-70 leading-tight">
                        Máximo puntaje antes de que acabe el tiempo.
                    </div>
                </button>
                <button
                    onClick={() => onSettingsChange({ ...settings, gameMode: GameMode.SURVIVAL })}
                    className={`p-3 rounded-lg border text-left transition ${
                        settings.gameMode === GameMode.SURVIVAL
                        ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500' 
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                >
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <Skull className="w-4 h-4" /> Supervivencia
                    </div>
                    <div className="text-[11px] opacity-70 leading-tight">
                        3 Vidas. Dificultad progresiva. No falles.
                    </div>
                </button>
            </div>
        </div>

        {/* Screen Area Selection */}
        <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> Área de Juego (Pizarra)
            </label>
            <div className="grid grid-cols-3 gap-2">
                {[ScreenMode.BOARD, ScreenMode.FULL, ScreenMode.COMPACT].map((mode) => (
                     <button
                        key={mode}
                        onClick={() => onSettingsChange({ ...settings, screenMode: mode })}
                        className={`px-2 py-2 text-[10px] md:text-xs rounded font-medium transition border flex flex-col items-center justify-center gap-1 h-14 ${
                            settings.screenMode === mode
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-800 hover:bg-zinc-700'
                        }`}
                    >
                        {mode === ScreenMode.BOARD && <div className="w-4 h-3 border border-current rounded-sm" />}
                        {mode === ScreenMode.FULL && <div className="w-5 h-3 border border-current rounded-sm bg-current/20" />}
                        {mode === ScreenMode.COMPACT && <div className="w-3 h-2 border border-current rounded-sm" />}
                        {mode.split(' ')[0]}
                    </button>
                ))}
            </div>
            <p className="text-[10px] text-zinc-500 px-1">
                {settings.screenMode === ScreenMode.BOARD && "El área de juego se limita a un rectángulo central (800x600). Ideal para consistencia."}
                {settings.screenMode === ScreenMode.FULL && "Las burbujas aparecen en todo el monitor. Requiere más movimiento de brazo."}
                {settings.screenMode === ScreenMode.COMPACT && "Área reducida. Ideal para movimientos cortos y rápidos de muñeca."}
            </p>
        </div>
       
        {/* Detailed Settings */}
        <div className="space-y-6 bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/50">
          
          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Dificultad</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(Difficulty).map((d) => (
                <button
                  key={d}
                  onClick={() => handleDifficultyChange(d)}
                  className={`px-2 py-2 text-xs md:text-sm rounded font-medium transition ${
                    settings.difficulty === d
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Crosshair Settings - Only on Desktop/Mouse */}
          {!isMobile && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Target className="w-4 h-4" /> Mira (Crosshair)
              </label>
              
              {/* Shape */}
              <div className="grid grid-cols-4 gap-2">
                 {CROSSHAIR_TYPES.map((t) => (
                   <button
                    key={t.id}
                    onClick={() => onSettingsChange({ ...settings, crosshairType: t.id })}
                    className={`text-xs py-1 rounded border ${
                      settings.crosshairType === t.id 
                      ? 'bg-zinc-700 border-white text-white' 
                      : 'bg-transparent border-zinc-700 text-zinc-500 hover:bg-zinc-800'
                    }`}
                   >
                    {t.label}
                   </button>
                 ))}
              </div>

              {/* Color */}
              <div className="flex justify-between gap-1">
                 {CROSSHAIR_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => onSettingsChange({ ...settings, crosshairColor: color })}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                        settings.crosshairColor === color ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                 ))}
              </div>
            </div>
          )}

          {/* Sensitivity - Only on Desktop */}
          {!isMobile && (
            <div>
               <label className="flex justify-between text-sm font-medium text-zinc-400 mb-2">
                <span className="flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> Sensibilidad</span>
                <span className="text-white">{settings.sensitivity.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={settings.sensitivity}
                onChange={(e) => onSettingsChange({ ...settings, sensitivity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          )}

          {/* Size Slider */}
          <div>
            <label className="flex justify-between text-sm font-medium text-zinc-400 mb-2">
              <span>Tamaño Burbuja</span>
              <span className="text-white">{settings.bubbleSize}px</span>
            </label>
            <input
              type="range"
              min="20"
              max="150"
              step="5"
              value={settings.bubbleSize}
              onChange={(e) => handleSliderChange('bubbleSize', parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            {/* Preview Area */}
            <div className="mt-4 h-24 bg-black border border-zinc-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Vista Previa</span>
                </div>
                <div 
                    className="rounded-full border-2 border-white bg-white/10"
                    style={{ width: settings.bubbleSize, height: settings.bubbleSize }}
                />
            </div>
          </div>

          {/* Speed Slider */}
          <div>
            <label className="flex justify-between text-sm font-medium text-zinc-400 mb-2">
              <span>Velocidad (Delay ms)</span>
              <span className="text-white">{settings.spawnDelay}ms</span>
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={settings.spawnDelay}
              onChange={(e) => handleSliderChange('spawnDelay', parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[10px] text-zinc-500 mt-1">Tiempo entre burbujas. Solo modo Contrarreloj.</p>
          </div>

          {/* Duration Slider - Only for Time Trial */}
          {settings.gameMode === GameMode.TIME_TRIAL && (
            <div>
                <label className="flex justify-between text-sm font-medium text-zinc-400 mb-2">
                <span>Duración</span>
                <span className="text-white">{settings.duration}s</span>
                </label>
                <input
                type="range"
                min="10"
                max="120"
                step="10"
                value={settings.duration}
                onChange={(e) => handleSliderChange('duration', parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>
          )}
        </div>

        {/* Dynamic Challenges Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 p-4 rounded-xl">
             <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-yellow-400" /> Desafíos / Logros
            </h3>
            <ul className="space-y-2">
                {challenges.map(challenge => (
                  <li key={challenge.id} className={`flex items-center gap-2 text-xs p-2 rounded ${challenge.isCompleted ? 'bg-emerald-500/10' : 'bg-zinc-800/50'}`}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${challenge.isCompleted ? 'text-emerald-400' : 'text-zinc-600'}`} />
                      <div className="flex-1">
                        <span className={`font-bold block ${challenge.isCompleted ? 'text-emerald-200 line-through' : 'text-zinc-300'}`}>
                          {challenge.title}
                        </span>
                        <span className="text-[10px] text-zinc-500">{challenge.description}</span>
                      </div>
                  </li>
                ))}
            </ul>
        </div>

        <hr className="border-zinc-800" />

        {/* Recent History */}
        <div className="space-y-4 pb-8">
            <div className="flex justify-between items-end">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-500" /> Historial
                </h3>
                <div className="text-right">
                     <div className="text-[10px] text-zinc-500 uppercase">Mejor Racha</div>
                     <div className="text-xl font-bold text-yellow-500">{bestStreak}</div>
                </div>
            </div>
            
            {highScores.length === 0 ? (
                <p className="text-zinc-500 text-sm">Sin partidas recientes.</p>
            ) : (
                <div className="space-y-2">
                    {highScores.slice(0, 5).map((score) => (
                        <div key={score.id} className="bg-zinc-800/50 p-3 rounded border border-zinc-800 flex justify-between items-center relative overflow-hidden group hover:border-zinc-600 transition">
                            <div>
                                <div className="text-white font-bold flex items-center gap-2">
                                    {score.score} 
                                    {score.tags?.map(tag => (
                                        <span key={tag} className="text-[9px] px-1 py-0.5 bg-indigo-500/20 text-indigo-300 rounded uppercase tracking-tight">{tag}</span>
                                    ))}
                                </div>
                                <div className="text-xs text-zinc-500">
                                    {score.mode === GameMode.SURVIVAL ? 'Supervivencia' : 'Tiempo'} • {score.difficulty}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-indigo-400">x{score.maxCombo}</div>
                                <div className="text-xs text-zinc-500">{Math.round(score.accuracy)}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};