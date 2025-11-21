import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Play, LogOut, Crown, Skull, Clock } from 'lucide-react';
import { Bubble } from './components/Bubble';
import { Sidebar } from './components/Sidebar';
import { GameHud } from './components/GameHud';
import { Tutorial } from './components/Tutorial';
import { GameSettings, GameStats, Position, GameMode, ScreenMode, Challenge } from './types';
import { soundService } from './services/soundService';
import { 
  DEFAULT_SETTINGS, 
  getStoredSettings, 
  saveStoredSettings, 
  getStoredScores, 
  saveScore, 
  getBestStreak,
  getCompletedChallenges,
  markChallengeComplete
} from './services/storageService';

const App: React.FC = () => {
  // --- State ---
  // SECURITY: settings initialized with Safe Defaults
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    timeLeft: 0,
    lives: 3,
    level: 1,
    isPlaying: false,
  });
  
  const [bubblePos, setBubblePos] = useState<Position | null>(null);
  const [bubbleSpawnTime, setBubbleSpawnTime] = useState<number>(0); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [highScores, setHighScores] = useState(getStoredScores());
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  
  // State for Pause/Sensitivity
  const [isPaused, setIsPaused] = useState(false);
  
  // Mobile Detection
  const [isMobile, setIsMobile] = useState(false);

  // Board Dimensions (Calculated)
  const [boardRect, setBoardRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const survivalLoopRef = useRef<NodeJS.Timeout | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorPosRef = useRef<Position>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // --- Challenge Definitions ---
  // Defined here to access stats/settings
  const DEFINED_CHALLENGES: Omit<Challenge, 'isCompleted'>[] = [
    { id: 'novice_survivor', title: 'Sobreviviente Novato', description: 'Alcanza el nivel 5 en Supervivencia', condition: (s, c) => c.gameMode === GameMode.SURVIVAL && s.level >= 5 },
    { id: 'precision_master', title: 'Cirujano', description: 'Termina con +95% de precisión (min 20 clicks)', condition: (s) => (s.hits + s.misses) > 20 && (s.hits / (s.hits + s.misses)) >= 0.95 },
    { id: 'combo_king', title: 'Rey del Combo', description: 'Logra un combo de 50', condition: (s) => s.maxCombo >= 50 },
    { id: 'marathon', title: 'Maratonista', description: 'Juega una partida de 120 segundos', condition: (s, c) => c.gameMode === GameMode.TIME_TRIAL && c.duration >= 120 && s.hits > 0 },
  ];

  const updateChallenges = () => {
      const completedIds = getCompletedChallenges();
      const updated = DEFINED_CHALLENGES.map(c => ({
          ...c,
          isCompleted: completedIds.includes(c.id)
      }));
      setChallenges(updated);
  };

  // --- Initialization ---
  useEffect(() => {
    // SECURITY: settings loaded via validated getter in storageService
    const stored = getStoredSettings();
    if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...stored });
    }
    
    // Check tutorial flag
    try {
        const hasSeenTutorial = localStorage.getItem('reflex_tutorial_seen');
        if (!hasSeenTutorial) setShowTutorial(true);
    } catch (e) {
        // Ignore localStorage error
    }

    // Mobile check
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Load challenges
    updateChallenges();

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    soundService.setEnabled(settings.soundEnabled);
    saveStoredSettings(settings);
  }, [settings]);

  // --- Board Area Calculation ---
  // SECURITY: This logic runs entirely client-side based on validated enums.
  const updateBoardDimensions = useCallback(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      let width = w;
      let height = h;
      let x = 0;
      let y = 0;

      // "Pizarra" logic: Centered rectangle with padding
      if (settings.screenMode === ScreenMode.BOARD) {
          width = Math.min(w * 0.9, 800);
          height = Math.min(h * 0.8, 600);
          x = (w - width) / 2;
          y = (h - height) / 2;
      } else if (settings.screenMode === ScreenMode.COMPACT) {
          width = Math.min(w * 0.8, 500);
          height = Math.min(h * 0.6, 400);
          x = (w - width) / 2;
          y = (h - height) / 2;
      }

      setBoardRect({ x, y, width, height });
  }, [settings.screenMode]);

  useEffect(() => {
      updateBoardDimensions();
      window.addEventListener('resize', updateBoardDimensions);
      return () => window.removeEventListener('resize', updateBoardDimensions);
  }, [updateBoardDimensions]);


  // --- Helper: Safe Pointer Lock ---
  const requestLock = useCallback(() => {
    if (!gameAreaRef.current || isMobile) return;
    
    try {
        const promise = gameAreaRef.current.requestPointerLock() as any;
        if (promise && typeof promise.catch === 'function') {
            promise.catch((e: any) => {
                // Allow silent fail if user is spamming clicks or browser blocks it
                console.debug("Pointer lock interaction prevented:", e);
            });
        }
    } catch (e) {
        console.error("Pointer lock error:", e);
    }
  }, [isMobile]);

  // --- Pointer Lock Change Listener ---
  useEffect(() => {
      const handleLockChange = () => {
          const locked = document.pointerLockElement === gameAreaRef.current;
          // Auto-pause if focus lost during gameplay
          if (!locked && gameStats.isPlaying && !isPaused && !isMobile) {
              setIsPaused(true);
              if (timerRef.current) clearInterval(timerRef.current);
              if (survivalLoopRef.current) clearInterval(survivalLoopRef.current);
          }
      };

      document.addEventListener('pointerlockchange', handleLockChange);
      document.addEventListener('mozpointerlockchange', handleLockChange);
      return () => {
          document.removeEventListener('pointerlockchange', handleLockChange);
          document.removeEventListener('mozpointerlockchange', handleLockChange);
      };
  }, [gameStats.isPlaying, isPaused, isMobile]);

  // --- Custom Cursor Logic (Desktop Only) ---
  const updateCursorVisual = () => {
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${cursorPosRef.current.x}px, ${cursorPosRef.current.y}px)`;
    }
    rafRef.current = requestAnimationFrame(updateCursorVisual);
  };

  useEffect(() => {
    if (gameStats.isPlaying && !isPaused && !isMobile) {
        rafRef.current = requestAnimationFrame(updateCursorVisual);
        document.addEventListener('mousemove', handleMouseMove);
    } else {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        document.removeEventListener('mousemove', handleMouseMove);
    }

    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameStats.isPlaying, isPaused, settings.sensitivity, isMobile]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!gameStats.isPlaying || isPaused) return;

    if (document.pointerLockElement === gameAreaRef.current) {
        const moveX = e.movementX * settings.sensitivity;
        const moveY = e.movementY * settings.sensitivity;

        cursorPosRef.current = {
            x: Math.min(Math.max(0, cursorPosRef.current.x + moveX), window.innerWidth),
            y: Math.min(Math.max(0, cursorPosRef.current.y + moveY), window.innerHeight),
        };
    } else {
        cursorPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [gameStats.isPlaying, isPaused, settings.sensitivity]);


  // --- Game Logic Helper ---
  const spawnBubble = useCallback(() => {
    // Dimensions
    const { x: bx, y: by, width, height } = boardRect;
    
    // Calculate Bubble Size (Survival scaling)
    let size = settings.bubbleSize;
    if (settings.gameMode === GameMode.SURVIVAL) {
        // Decrease size slightly per level, capped at 30px minimum
        // Logic constrained to avoid negative size errors
        size = Math.max(30, settings.bubbleSize - (gameStats.level * 2));
    }

    const maxX = bx + width - size;
    const maxY = by + height - size;
    
    // Generate random position within the "Pizarra" (Board)
    const randomX = Math.max(bx, Math.random() * (maxX - bx) + bx);
    const randomY = Math.max(by, Math.random() * (maxY - by) + by);
    
    setBubblePos({ x: randomX, y: randomY });
    setBubbleSpawnTime(Date.now());
    setLastClickTime(Date.now());
  }, [settings.bubbleSize, settings.gameMode, gameStats.level, boardRect]);


  const togglePause = useCallback(() => {
    if (!gameStats.isPlaying) return;

    if (isPaused) {
      // Resume
      setIsPaused(false);
      requestLock();
      startTimer();
    } else {
      // Pause
      setIsPaused(true);
      if (!isMobile && document.pointerLockElement) {
          document.exitPointerLock();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (survivalLoopRef.current) clearInterval(survivalLoopRef.current);
    }
  }, [gameStats.isPlaying, isPaused, isMobile, requestLock]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // SECURITY: Ensure no default actions interfere unexpectedly, though typically safe here
        if (e.key.toLowerCase() === 'p' || e.key === 'Escape') {
            if (showTutorial) {
                setShowTutorial(false);
                return;
            }
            if (isSidebarOpen) {
                setIsSidebarOpen(false);
                return;
            }
            
            if (gameStats.isPlaying) {
                 if (e.key === 'Escape' && document.pointerLockElement) return; 
                 togglePause();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStats.isPlaying, isPaused, togglePause, showTutorial, isSidebarOpen]);

  // --- Game Loop Controls ---
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (survivalLoopRef.current) clearInterval(survivalLoopRef.current);

    if (settings.gameMode === GameMode.TIME_TRIAL) {
        // Standard Countdown
        timerRef.current = setInterval(() => {
        setGameStats(prev => {
            if (prev.timeLeft <= 1) {
                endGame();
                return { ...prev, timeLeft: 0, isPlaying: false };
            }
            return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
        }, 1000);
    }
    // Survival loop is handled by the effect below to avoid closure staleness issues
  };

  // Survival Bubble Expiration Check
  useEffect(() => {
      if (settings.gameMode !== GameMode.SURVIVAL || !gameStats.isPlaying || isPaused || !bubblePos) return;

      const interval = setInterval(() => {
          const now = Date.now();
          // Base lifespan: 3s - (level * 0.15s). Min 0.6s
          const maxLifespan = Math.max(600, 3000 - (gameStats.level * 150)); 
          
          if (now - bubbleSpawnTime > maxLifespan) {
              // Bubble Expired
              handleMiss(); // Deduct life, break combo
              spawnBubble(); // Force new bubble
          }
      }, 100);
      return () => clearInterval(interval);
  }, [gameStats.isPlaying, isPaused, bubblePos, bubbleSpawnTime, settings.gameMode, gameStats.level]);


  const startGame = () => {
    setIsSidebarOpen(false);
    setIsPaused(false);
    
    cursorPosRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    updateBoardDimensions(); 

    setGameStats({
      score: 0,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      misses: 0,
      timeLeft: settings.duration,
      lives: 3,
      level: 1,
      isPlaying: true,
    });
    
    requestLock();
    setTimeout(spawnBubble, 100);
    startTimer();
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (survivalLoopRef.current) clearInterval(survivalLoopRef.current);
    setBubblePos(null);
    if (!isMobile && document.pointerLockElement) {
        document.exitPointerLock();
    }
    soundService.playGameEnd();
    setIsPaused(false);
  };

  const handleSurrender = () => {
    setGameStats(prev => ({ ...prev, isPlaying: false, timeLeft: 0 }));
    endGame();
  };

  // Check Challenges and Save Score on Game End
  useEffect(() => {
    if (!gameStats.isPlaying && gameStats.hits > 0) {
        const accuracy = gameStats.hits + gameStats.misses > 0 
            ? (gameStats.hits / (gameStats.hits + gameStats.misses)) * 100 
            : 0;
        
        // Determine Tags
        const tags: string[] = [];
        if (accuracy >= 95) tags.push('Cirujano');
        if (gameStats.maxCombo >= 30) tags.push('Ninja');
        if (gameStats.score > 50000) tags.push('Leyenda');
        if (gameStats.hits / (settings.duration || 1) > 2) tags.push('Flash');

        saveScore({
            id: Date.now().toString(),
            date: new Date().toLocaleDateString(),
            score: gameStats.score,
            maxCombo: gameStats.maxCombo,
            accuracy: accuracy,
            difficulty: settings.difficulty,
            mode: settings.gameMode,
            tags: tags
        });

        // Check Challenges
        DEFINED_CHALLENGES.forEach(challenge => {
            if (challenge.condition(gameStats, settings)) {
                markChallengeComplete(challenge.id);
            }
        });
        
        updateChallenges();
        setHighScores(getStoredScores());
    }
  }, [gameStats.isPlaying]);


  // --- Interaction Handlers ---

  const handleHit = () => {
    soundService.playPop();
    const now = Date.now();
    const reactionTime = now - lastClickTime;
    
    const speedBonus = Math.max(0, 100 - Math.floor(reactionTime / 10)); 
    const sizeMultiplier = (150 / settings.bubbleSize); 
    const comboMultiplier = 1 + (gameStats.combo * 0.1);
    
    const points = Math.round((100 + speedBonus) * sizeMultiplier * comboMultiplier);

    setGameStats(prev => {
        const newCombo = prev.combo + 1;
        let newLevel = prev.level;
        
        // Level up in survival every 10 hits
        if (settings.gameMode === GameMode.SURVIVAL && newCombo % 10 === 0) {
            newLevel += 1;
        }

        return {
            ...prev,
            score: prev.score + points,
            combo: newCombo,
            maxCombo: Math.max(prev.maxCombo, newCombo),
            hits: prev.hits + 1,
            level: newLevel
        };
    });

    setBubblePos(null);

    // Calculate delay based on mode
    let nextDelay = settings.spawnDelay;
    if (settings.gameMode === GameMode.SURVIVAL) {
        // Faster as level goes up, floor at 0ms
        nextDelay = Math.max(0, 500 - (gameStats.level * 50));
    }

    if (nextDelay > 0) {
        setTimeout(spawnBubble, nextDelay);
    } else {
        spawnBubble();
    }
  };

  const handleMiss = () => {
    soundService.playMiss();
    setGameStats(prev => {
        const newLives = prev.lives - 1;
        
        // Check Game Over Condition for Survival
        if (settings.gameMode === GameMode.SURVIVAL && newLives <= 0) {
            endGame();
            return { ...prev, lives: 0, isPlaying: false, misses: prev.misses + 1 };
        }

        return {
            ...prev,
            combo: 0, 
            misses: prev.misses + 1,
            lives: newLives,
            score: Math.max(0, prev.score - 50) 
        };
    });
  };

  // DESKTOP: Global click
  const handleGlobalClick = useCallback(() => {
    if (!gameStats.isPlaying || isPaused || isMobile) return;
    
    const cx = cursorPosRef.current.x;
    const cy = cursorPosRef.current.y;

    // Check UI Buttons
    const element = document.elementFromPoint(cx, cy);
    if (element?.closest('#game-pause-btn')) {
        togglePause();
        return;
    }
    if (element?.closest('#game-surrender-btn')) {
        handleSurrender();
        return;
    }

    // Check Bubble Hit
    if (bubblePos) {
        let currentSize = settings.bubbleSize;
        if (settings.gameMode === GameMode.SURVIVAL) {
            currentSize = Math.max(30, settings.bubbleSize - (gameStats.level * 2));
        }

        const radius = currentSize / 2;
        const bubbleCenterX = bubblePos.x + radius;
        const bubbleCenterY = bubblePos.y + radius;
        
        const dist = Math.sqrt(Math.pow(cx - bubbleCenterX, 2) + Math.pow(cy - bubbleCenterY, 2));
        
        if (dist <= radius) {
             handleHit();
             return;
        }
    }

    handleMiss();

  }, [gameStats.isPlaying, isPaused, bubblePos, settings, togglePause, isMobile, gameStats.level]);

  // MOBILE: Miss
  const handleMobileBackgroundClick = (e: React.MouseEvent | React.TouchEvent) => {
      if (!gameStats.isPlaying || isPaused || !isMobile) return;
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('#game-pause-btn') || target.closest('#game-surrender-btn')) return;
      handleMiss();
  };

  // MOBILE: Hit
  const handleMobileBubbleInteract = () => {
      if (!gameStats.isPlaying || isPaused) return;
      handleHit();
  };

  const handleTutorialClose = () => {
    try {
      localStorage.setItem('reflex_tutorial_seen', 'true');
    } catch {}
    setShowTutorial(false);
  };

  const accuracy = gameStats.hits + gameStats.misses === 0 
    ? 100 
    : (gameStats.hits / (gameStats.hits + gameStats.misses)) * 100;

  // --- Crosshair Rendering ---
  const renderCrosshair = () => {
      const { crosshairType, crosshairColor } = settings;
      const commonStyle = { backgroundColor: crosshairColor };
      
      switch(crosshairType) {
          case 'dot': return <div className="w-2 h-2 rounded-full shadow-sm" style={commonStyle} />;
          case 'plus': return <div className="relative flex items-center justify-center"><div className="absolute w-6 h-1 rounded-sm" style={commonStyle} /><div className="absolute h-6 w-1 rounded-sm" style={commonStyle} /></div>;
          case 'circle': return <div className="w-6 h-6 rounded-full border-2 shadow-sm" style={{ borderColor: crosshairColor }} />;
          case 'cross':
          default: return <div className="relative flex items-center justify-center"><div className="absolute w-4 h-1 rounded-sm" style={commonStyle} /><div className="absolute h-4 w-1 rounded-sm" style={commonStyle} /></div>;
      }
  };

  return (
    <div className="relative w-full h-screen bg-zinc-950 overflow-hidden select-none overscroll-none touch-none">
      
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }}
      />

      {/* VISUAL BOARD / PLAY AREA */}
      {/* This div visualizes the requested 'Pizarra' logic. Bubbles only spawn inside here. */}
      {settings.screenMode !== ScreenMode.FULL && (
          <div 
            className="absolute border-2 border-zinc-700/50 bg-zinc-900/30 rounded-xl transition-all duration-500 ease-out pointer-events-none shadow-2xl"
            style={{
                left: boardRect.x,
                top: boardRect.y,
                width: boardRect.width,
                height: boardRect.height
            }}
          >
             {gameStats.isPlaying && (
                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-zinc-600 uppercase tracking-widest bg-zinc-950 px-2">
                    Área de Juego
                 </span>
             )}
          </div>
      )}

      {/* Game Area Layer */}
      <div 
        ref={gameAreaRef}
        className={`absolute inset-0 z-0 ${gameStats.isPlaying && !isPaused && !isMobile ? 'cursor-none' : 'cursor-default'}`}
        onMouseDown={isMobile ? undefined : handleGlobalClick} 
        onTouchStart={isMobile ? handleMobileBackgroundClick : undefined} 
      >
        {/* Bubble Render */}
        {gameStats.isPlaying && bubblePos && (
            <div className={!isMobile ? "pointer-events-none" : "pointer-events-auto"}> 
                <Bubble 
                    position={bubblePos} 
                    size={settings.gameMode === GameMode.SURVIVAL 
                        ? Math.max(30, settings.bubbleSize - (gameStats.level * 2)) 
                        : settings.bubbleSize} 
                    onClick={handleMobileBubbleInteract}
                    isVisible={!!bubblePos}
                />
            </div>
        )}
      </div>

      {/* Custom Cursor */}
      {gameStats.isPlaying && !isPaused && !isMobile && (
          <div 
            ref={cursorRef}
            className="fixed top-0 left-0 pointer-events-none z-50"
            style={{ willChange: 'transform' }}
          >
              <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10">
                  {renderCrosshair()}
              </div>
          </div>
      )}

      {/* HUD */}
      {gameStats.isPlaying && (
        <GameHud 
            score={gameStats.score} 
            timeLeft={gameStats.timeLeft} 
            lives={gameStats.lives}
            combo={gameStats.combo}
            difficulty={settings.difficulty}
            gameMode={settings.gameMode}
            level={gameStats.level}
            accuracy={accuracy}
            isPaused={isPaused}
        />
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl shadow-2xl flex flex-col gap-4 min-w-[300px]">
                <h2 className="text-3xl font-black text-white text-center mb-4">PAUSA</h2>
                <button onClick={togglePause} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-bold transition"><Play className="w-5 h-5" /> Continuar</button>
                <button onClick={handleSurrender} className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-red-900/50 hover:text-red-200 text-zinc-300 py-3 px-6 rounded-lg font-bold transition"><LogOut className="w-5 h-5" /> Rendirse</button>
            </div>
        </div>
      )}

      {/* Start Screen */}
      {!gameStats.isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-4">
            <div className="pointer-events-auto text-center animate-in fade-in zoom-in duration-300 w-full max-w-lg">
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2 uppercase">
                    TODO<span className="text-indigo-500">GORRA</span>
                </h1>
                <div className="flex items-center justify-center gap-2 text-zinc-400 mb-8">
                    {settings.gameMode === GameMode.TIME_TRIAL ? <Clock className="w-4 h-4" /> : <Skull className="w-4 h-4" />}
                    <span className="text-lg font-medium uppercase tracking-widest">
                        {settings.gameMode === GameMode.TIME_TRIAL ? 'Modo Contrarreloj' : 'Modo Supervivencia'}
                    </span>
                </div>
                
                <div className="flex flex-col gap-4 items-center w-full">
                    <button 
                        onClick={startGame}
                        className="bg-white text-black text-xl font-bold py-4 px-12 rounded-full hover:scale-105 hover:bg-zinc-200 active:scale-95 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] w-full md:w-auto"
                    >
                        {gameStats.hits + gameStats.misses > 0 ? 'JUGAR DE NUEVO' : 'EMPEZAR'}
                    </button>
                    
                    {gameStats.hits + gameStats.misses > 0 && (
                         <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-xl mt-4 w-full">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-3">
                                <p className="text-zinc-400 text-sm uppercase tracking-widest">Reporte</p>
                                {accuracy >= 95 && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded uppercase font-bold">Cirujano</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-white">{gameStats.score}</div>
                                    <div className="text-xs text-zinc-500">Puntos</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-indigo-400">{Math.round(accuracy)}%</div>
                                    <div className="text-xs text-zinc-500">Precisión</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-yellow-500">{gameStats.maxCombo}</div>
                                    <div className="text-xs text-zinc-500">Max Combo</div>
                                </div>
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Sidebar Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className={`absolute top-6 right-6 z-20 p-3 bg-zinc-900/50 backdrop-blur hover:bg-zinc-800 text-white rounded-full border border-zinc-700 transition ${isSidebarOpen || (gameStats.isPlaying && !isPaused) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Menu className="w-6 h-6" />
      </button>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        highScores={highScores}
        bestStreak={getBestStreak()}
        onShowTutorial={() => setShowTutorial(true)}
        isMobile={isMobile}
        challenges={challenges}
      />

      {showTutorial && <Tutorial onClose={handleTutorialClose} />}
    </div>
  );
};

export default App;