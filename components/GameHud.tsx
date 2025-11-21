import React from 'react';
import { Difficulty, GameMode } from '../types';
import { Pause, Flag, Heart, Zap } from 'lucide-react';

interface GameHudProps {
  score: number;
  timeLeft: number;
  lives: number;
  combo: number;
  difficulty: Difficulty;
  gameMode: GameMode;
  level: number;
  accuracy: number;
  isPaused: boolean;
}

export const GameHud: React.FC<GameHudProps> = ({ 
  score, 
  timeLeft, 
  lives,
  combo, 
  difficulty, 
  gameMode,
  level,
  accuracy, 
  isPaused 
}) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        {/* Top Bar */}
        <div className="w-full p-6 flex justify-between items-start">
            
            {/* Top Left: Score & Accuracy */}
            <div className="flex flex-col gap-1">
                <div className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                    {score.toLocaleString()}
                </div>
                <div className="flex gap-3 text-sm font-mono">
                   <span className="text-zinc-400">ACC: <span className="text-white">{Math.round(accuracy)}%</span></span>
                   {gameMode === GameMode.SURVIVAL && (
                       <span className="text-yellow-400 font-bold">LVL {level}</span>
                   )}
                </div>
            </div>

            {/* Top Center: Timer OR Lives */}
            <div className="flex flex-col items-center">
                {gameMode === GameMode.TIME_TRIAL ? (
                     <div className={`text-4xl font-bold tabular-nums drop-shadow-lg ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timeLeft}s
                    </div>
                ) : (
                    <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                        {[...Array(3)].map((_, i) => (
                            <Heart 
                                key={i} 
                                className={`w-8 h-8 drop-shadow-lg transition-all ${i < lives ? 'fill-red-500 text-red-500' : 'fill-zinc-800 text-zinc-700 scale-75'}`} 
                            />
                        ))}
                    </div>
                )}
                <span className="text-xs uppercase tracking-widest text-zinc-500 mt-1 font-bold">
                    {gameMode === GameMode.TIME_TRIAL ? 'Tiempo' : 'Vidas'}
                </span>
            </div>

            {/* Top Right: Combo & Controls */}
            <div className="flex flex-col items-end gap-4">
                 {/* Pause Hint (or Button target) */}
                <div 
                    id="game-pause-btn" 
                    className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur border border-zinc-700 px-3 py-2 rounded-lg text-zinc-300 text-xs font-bold uppercase tracking-wider pointer-events-auto cursor-pointer hover:bg-zinc-800 transition"
                >
                   <Pause className="w-4 h-4" /> Pause (P)
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold border border-zinc-800 px-2 py-1 rounded bg-black/50 backdrop-blur">
                        {difficulty === Difficulty.CUSTOM && gameMode === GameMode.SURVIVAL ? 'Auto' : difficulty}
                    </div>
                    <div className={`flex items-center gap-2 text-4xl font-black transition-all duration-100 drop-shadow-lg ${combo > 5 ? 'text-yellow-400 scale-110' : 'text-zinc-600'}`}>
                        {combo > 10 && <Zap className="w-6 h-6 animate-pulse" />}
                        x{combo}
                    </div>
                    {combo > 0 && <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Combo</div>}
                </div>
            </div>
        </div>

        {/* Bottom Center: Surrender Button (Visual Target) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
             <div 
                id="game-surrender-btn"
                className="group flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
             >
                <Flag className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wider text-sm">Rendirse</span>
             </div>
        </div>
    </div>
  );
};