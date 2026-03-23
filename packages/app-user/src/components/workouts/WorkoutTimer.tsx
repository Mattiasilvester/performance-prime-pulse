import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimationControls, useDragControls } from 'framer-motion';
import { Pause, Play, Trash2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'pp_recent_timers';
const SWIPE_THRESHOLD = 50;
const DRUM_MIN_DELTA = 5;
const ROW_HEIGHT = 44;
const ITEM_HEIGHT = 44;

type RecentTimer = { hours: number; minutes: number; seconds: number };

function formatHHMMSS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatMMSScc(cs: number): string {
  const totalSec = Math.floor(cs / 100);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const c = cs % 100;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${c.toString().padStart(2, '0')}`;
}

function formatRecentLabel(hours: number, minutes: number, seconds: number): string {
  if (hours > 0) return minutes > 0 ? `${hours} ora ${minutes} min` : `${hours} ora`;
  if (minutes > 0) return seconds > 0 ? `${minutes} min ${seconds} sec` : `${minutes} min`;
  return `${seconds} sec`;
}

interface DrumColumnProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (n: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function DrumColumn({ label, value, min, max, onValueChange, onDragStart, onDragEnd }: DrumColumnProps) {
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const totalHeight = items.length * ITEM_HEIGHT;
  const containerCenter = (ROW_HEIGHT * 5) / 2;
  const selectedCenterFromListTop = (value - min) * ITEM_HEIGHT + ITEM_HEIGHT / 2;
  const listTranslateY = containerCenter - selectedCenterFromListTop;

  const handleStart = useCallback((clientY: number) => {
    onDragStart();
    setIsDragging(true);
    setDragStartY(clientY);
    setDragStartValue(value);
  }, [onDragStart, value]);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const delta = dragStartY - clientY;
    if (Math.abs(delta) < DRUM_MIN_DELTA) return;
    const steps = Math.round(delta / ITEM_HEIGHT);
    const next = Math.max(min, Math.min(max, dragStartValue + steps));
    if (next !== value) {
      onValueChange(next);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    }
  }, [dragStartY, dragStartValue, isDragging, max, min, onValueChange, value]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd();
  }, [onDragEnd]);

  useEffect(() => {
    if (!isDragging) return;
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleEnd, handleMove, isDragging]);

  const getStyle = (index: number) => {
    const dist = Math.abs((value - min) - index);
    if (dist === 0) return { numFontSize: 28, color: '#ffffff', numWeight: 500 };
    if (dist === 1) return { numFontSize: 22, color: '#636366', numWeight: 400 };
    return { numFontSize: 18, color: '#3a3a3c', numWeight: 400 };
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden"
        style={{ width: 72, height: ROW_HEIGHT * 5 }}
        onTouchStart={(e) => handleStart(e.touches[0].clientY)}
        onMouseDown={(e) => handleStart(e.clientY)}
      >
        <div className="absolute left-0 right-0 rounded-[10px] bg-[#1c1c1e]" style={{ top: ROW_HEIGHT * 2, height: ROW_HEIGHT }} />
        <div
          className="absolute left-0 right-0 flex flex-col items-center justify-center transition-transform duration-100"
          style={{ transform: `translateY(${listTranslateY}px)`, height: totalHeight }}
        >
          {items.map((n, i) => {
            const s = getStyle(i);
            const isCenter = i === value - min;
            return (
              <div key={n} className="flex items-center justify-center w-full" style={{ height: ITEM_HEIGHT, color: s.color }}>
                <span style={{ fontSize: s.numFontSize, fontWeight: s.numWeight, opacity: isCenter ? 0 : 1 }}>{n}</span>
              </div>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0A0A0C 0%, transparent 30%, transparent 70%, #0A0A0C 100%)' }} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
          <div className="flex items-center justify-center" style={{ gap: 5 }}>
            <span style={{ fontSize: 28, fontWeight: 500, color: '#ffffff' }}>{value}</span>
            <span style={{ fontSize: 17, fontWeight: 500, color: '#ffffff' }}>{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecentRowProps {
  timer: RecentTimer;
  index: number;
  isOpen: boolean;
  onOpen: (index: number) => void;
  onClose: () => void;
  onDelete: (index: number) => void;
  onUse: (timer: RecentTimer) => void;
}

function RecentRow({ timer, index, isOpen, onOpen, onClose, onDelete, onUse }: RecentRowProps) {
  const controls = useAnimationControls();
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const trashOpacity = useTransform(x, [-120, -10, 0], [1, 1, 0]);
  const redBgOpacity = useTransform(x, [-120, 0], [1, 0]);
  const deleteEnabled = isOpen || x.get() <= -60;

  useEffect(() => {
    if (!isOpen) {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }
  }, [controls, isOpen]);

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-xl isolate"
      style={{ height: 56 }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: '#16161A', zIndex: 0 }} />
      <motion.div
        className="absolute right-0 top-0 bottom-0"
        style={{ width: 120, backgroundColor: '#dc2626', opacity: redBgOpacity, zIndex: 10 }}
      />
      <button
        type="button"
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center"
        style={{
          width: 120,
          backgroundColor: 'transparent',
          zIndex: 15,
          pointerEvents: deleteEnabled ? 'auto' : 'none',
        }}
        onClick={() => onDelete(index)}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label="Elimina timer recente"
      >
        <motion.span style={{ opacity: trashOpacity }} className="flex items-center justify-center">
          <Trash2 size={20} color="#ffffff" />
        </motion.span>
      </button>

      <motion.div
        data-recent-row="true"
        className="relative flex items-center justify-between h-full px-3"
        style={{ x, width: '100%', backgroundColor: '#16161A', zIndex: 20 }}
        drag="x"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ right: 0, left: -120 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => {
          onOpen(index);
        }}
        onDragEnd={(_, info) => {
          const isDrag = Math.abs(info.offset.x) > 5 || Math.abs(info.velocity.x) > 50;
          if (!isDrag) return;
          if (info.offset.x <= -120) {
            onDelete(index);
            return;
          }
          if (info.offset.x <= -60) {
            onOpen(index);
            controls.start({ x: -72, transition: { type: 'spring', stiffness: 300, damping: 30 } });
            return;
          }
          onClose();
          controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div
          style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            dragControls.start(e);
          }}
        >
          <span className="text-white">{formatRecentLabel(timer.hours, timer.minutes, timer.seconds)}</span>
        </div>
        <button
          type="button"
          className="flex items-center justify-center rounded-full bg-[#1a2a1a] text-[#EEBA2B]"
          style={{ width: 36, height: 36 }}
          onClick={() => onUse(timer)}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          aria-label="Usa questo timer"
        >
          <Play className="h-4 w-4" fill="currentColor" />
        </button>
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ border: '1px solid #2a2a2e', zIndex: 30 }}
      />
    </motion.div>
  );
}

export function WorkoutTimer() {
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const [pickerHours, setPickerHours] = useState(0);
  const [pickerMinutes, setPickerMinutes] = useState(0);
  const [pickerSeconds, setPickerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchCs, setStopwatchCs] = useState(0);
  const [lastLap, setLastLap] = useState<string | null>(null);
  const [lapCount, setLapCount] = useState(0);
  const [recentTimers, setRecentTimers] = useState<RecentTimer[]>([]);
  const [openRecentIndex, setOpenRecentIndex] = useState<number | null>(null);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopwatchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const isDraggingDrum = useRef(false);

  const playTimerEndSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // fallback silenzioso
    }
  }, []);

  const playCountdownBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // fallback silenzioso
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RecentTimer[];
        if (Array.isArray(parsed)) setRecentTimers(parsed.slice(0, 3));
      }
    } catch {
      // ignore
    }
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
      if (lapTimeoutRef.current) clearTimeout(lapTimeoutRef.current);
    };
  }, []);

  const saveRecent = useCallback((hours: number, minutes: number, seconds: number) => {
    setRecentTimers((prev) => {
      const next = [{ hours, minutes, seconds }, ...prev.filter((t) => !(t.hours === hours && t.minutes === minutes && t.seconds === seconds))].slice(0, 3);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const deleteRecent = useCallback((index: number) => {
    setRecentTimers((prev) => {
      const next = prev.filter((_, i) => i !== index);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setOpenRecentIndex(null);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  }, []);

  useEffect(() => {
    if (!timerRunning || !isMountedRef.current) return;
    timerIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          if (isMountedRef.current) {
            playTimerEndSound();
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            setTimerRunning(false);
            setTimerPaused(false);
          }
          return 0;
        }
        if (prev === 4) playCountdownBeep();
        if (prev === 3) playCountdownBeep();
        if (prev === 2) playCountdownBeep();
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    };
  }, [playCountdownBeep, playTimerEndSound, timerRunning]);

  useEffect(() => {
    if (!stopwatchRunning || !isMountedRef.current) return;
    stopwatchIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      setStopwatchCs((prev) => prev + 1);
    }, 10);
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
      stopwatchIntervalRef.current = null;
    };
  }, [stopwatchRunning]);

  const startTimer = useCallback(() => {
    const total = pickerHours * 3600 + pickerMinutes * 60 + pickerSeconds;
    if (total <= 0) return;
    saveRecent(pickerHours, pickerMinutes, pickerSeconds);
    setTimerInitialSeconds(total);
    setTimerSeconds(total);
    setTimerRunning(true);
    setTimerPaused(false);
  }, [pickerHours, pickerMinutes, pickerSeconds, saveRecent]);

  const cancelTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerPaused(false);
    setTimerSeconds(timerInitialSeconds);
    setTimerInitialSeconds(0);
  }, [timerInitialSeconds]);

  const pauseTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerPaused(true);
  }, []);

  const riprendiTimer = useCallback(() => {
    setTimerRunning(true);
    setTimerPaused(false);
  }, []);

  const applyRecent = useCallback((timer: RecentTimer) => {
    setPickerHours(timer.hours);
    setPickerMinutes(timer.minutes);
    setPickerSeconds(timer.seconds);
    const total = timer.hours * 3600 + timer.minutes * 60 + timer.seconds;
    setTimerInitialSeconds(total);
    setTimerSeconds(total);
    setTimerRunning(true);
    setTimerPaused(false);
    setOpenRecentIndex(null);
  }, []);

  const startStopwatch = useCallback(() => setStopwatchRunning(true), []);
  const pauseStopwatch = useCallback(() => setStopwatchRunning(false), []);
  const resetStopwatch = useCallback(() => {
    setStopwatchRunning(false);
    setStopwatchCs(0);
    setLastLap(null);
    setLapCount(0);
  }, []);

  const addLap = useCallback(() => {
    const label = `Giro ${lapCount + 1} — ${formatMMSScc(stopwatchCs)}`;
    setLapCount((c) => c + 1);
    setLastLap(label);
    if (lapTimeoutRef.current) clearTimeout(lapTimeoutRef.current);
    lapTimeoutRef.current = setTimeout(() => {
      lapTimeoutRef.current = null;
      if (isMountedRef.current) setLastLap(null);
    }, 2000);
  }, [lapCount, stopwatchCs]);

  const handleSwipeStart = useCallback((clientX: number, clientY: number) => {
    if (isDraggingDrum.current) return;
    swipeStartX.current = clientX;
    swipeStartY.current = clientY;
  }, []);

  const handleSwipeEnd = useCallback((clientX: number, clientY: number) => {
    if (isDraggingDrum.current) return;
    const deltaX = clientX - swipeStartX.current;
    const deltaY = clientY - swipeStartY.current;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    setActiveSlide(deltaX > 0 ? 0 : 1);
  }, []);

  const drumDragStart = useCallback(() => { isDraggingDrum.current = true; }, []);
  const drumDragEnd = useCallback(() => { isDraggingDrum.current = false; }, []);

  const timerTotal = pickerHours * 3600 + pickerMinutes * 60 + pickerSeconds;

  return (
    <div
      className="min-h-[80vh] flex flex-col overflow-hidden"
      style={{ backgroundColor: '#0A0A0C' }}
      onTouchStart={(e) => {
        if ((e.target as HTMLElement).closest('[data-recent-row]')) return;
        if ((e.target as HTMLElement).closest('button')) return;
        handleSwipeStart(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={(e) => {
        if ((e.target as HTMLElement).closest('[data-recent-row]')) return;
        if ((e.target as HTMLElement).closest('button')) return;
        if (e.changedTouches[0]) handleSwipeEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('[data-recent-row]')) return;
        if ((e.target as HTMLElement).closest('button')) return;
        handleSwipeStart(e.clientX, e.clientY);
      }}
      onMouseUp={(e) => {
        if ((e.target as HTMLElement).closest('[data-recent-row]')) return;
        if ((e.target as HTMLElement).closest('button')) return;
        handleSwipeEnd(e.clientX, e.clientY);
      }}
    >
      <div className="flex-1 flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait" initial={false}>
          {activeSlide === 0 && (
            <motion.div
              key="timer"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col p-4"
            >
              {!timerRunning && !timerPaused ? (
                <>
                  <div className="flex-1 flex items-center justify-center gap-6 py-4">
                    <DrumColumn label="ore" value={pickerHours} min={0} max={23} onValueChange={setPickerHours} onDragStart={drumDragStart} onDragEnd={drumDragEnd} />
                    <DrumColumn label="min" value={pickerMinutes} min={0} max={59} onValueChange={setPickerMinutes} onDragStart={drumDragStart} onDragEnd={drumDragEnd} />
                    <DrumColumn label="sec" value={pickerSeconds} min={0} max={59} onValueChange={setPickerSeconds} onDragStart={drumDragStart} onDragEnd={drumDragEnd} />
                  </div>

                  {recentTimers.length > 0 && (
                    <div
                      className="mb-4"
                      onPointerDown={(e) => {
                        if (!(e.target as HTMLElement).closest('[data-recent-row]')) setOpenRecentIndex(null);
                      }}
                    >
                      <h2 className="text-lg font-bold text-white mb-2">Recenti</h2>
                      <div className="flex flex-col gap-2">
                        <AnimatePresence initial={false}>
                          {recentTimers.map((timer, index) => (
                            <motion.div
                              key={`${timer.hours}-${timer.minutes}-${timer.seconds}-${index}`}
                              layout
                              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <RecentRow
                                timer={timer}
                                index={index}
                                isOpen={openRecentIndex === index}
                                onOpen={setOpenRecentIndex}
                                onClose={() => setOpenRecentIndex(null)}
                                onDelete={deleteRecent}
                                onUse={applyRecent}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      className="rounded-full flex items-center justify-center bg-[#EEBA2B] text-black hover:opacity-90 disabled:opacity-40 transition-opacity"
                      style={{ width: 72, height: 72 }}
                      onClick={startTimer}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                      disabled={timerTotal <= 0}
                      aria-label="Avvia"
                    >
                      <Play className="h-8 w-8" fill="currentColor" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-white text-center font-extralight tabular-nums" style={{ fontSize: 64, letterSpacing: -2 }}>
                      {formatHHMMSS(timerSeconds)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 px-4">
                    <button
                      type="button"
                      className="rounded-full flex items-center justify-center bg-[#1c1c1e] text-[#8A8A96] hover:opacity-90"
                      style={{ width: 72, height: 72 }}
                      onClick={cancelTimer}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                    >
                      Annulla
                    </button>
                    {timerRunning ? (
                      <button
                        type="button"
                        className="rounded-full flex items-center justify-center bg-[#EEBA2B] text-black hover:opacity-90"
                        style={{ width: 72, height: 72 }}
                        onClick={pauseTimer}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                      >
                        <Pause className="h-8 w-8" fill="currentColor" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-full flex items-center justify-center bg-[#EEBA2B] text-black hover:opacity-90"
                        style={{ width: 72, height: 72 }}
                        onClick={riprendiTimer}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                      >
                        Riprendi
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeSlide === 1 && (
            <motion.div
              key="stopwatch"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col p-4"
            >
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-white text-center font-extralight tabular-nums" style={{ fontSize: 64, letterSpacing: -2 }}>
                  {formatMMSScc(stopwatchCs)}
                </div>
                <AnimatePresence mode="wait">
                  {lastLap && (
                    <motion.p key={lastLap} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-4 text-[#8A8A96] text-lg">
                      {lastLap}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex justify-between items-center pt-4 px-4">
                {!stopwatchRunning && stopwatchCs === 0 && (
                  <>
                    <button type="button" className="rounded-full flex items-center justify-center bg-[#1c1c1e] text-[#EEBA2B] opacity-40 cursor-not-allowed" style={{ width: 72, height: 72 }} disabled onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                      Giro
                    </button>
                    <button type="button" className="rounded-full flex items-center justify-center bg-[#EEBA2B] text-black hover:opacity-90" style={{ width: 72, height: 72 }} onClick={startStopwatch} onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                      Avvia
                    </button>
                  </>
                )}
                {stopwatchRunning && (
                  <>
                    <button type="button" className="rounded-full flex items-center justify-center bg-[#1c1c1e] text-[#EEBA2B] hover:opacity-90" style={{ width: 72, height: 72 }} onClick={addLap} onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                      Giro
                    </button>
                    <button type="button" className="rounded-full flex items-center justify-center bg-[#EEBA2B] text-black hover:opacity-90" style={{ width: 72, height: 72 }} onClick={pauseStopwatch} onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                      <Pause className="h-8 w-8" fill="currentColor" />
                    </button>
                  </>
                )}
                {!stopwatchRunning && stopwatchCs > 0 && (
                  <>
                    <button type="button" className="rounded-full flex items-center justify-center bg-[#1c1c1e] text-[#8A8A96] hover:opacity-90" style={{ width: 72, height: 72 }} onClick={resetStopwatch} onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                      Reset
                    </button>
                    <button type="button" className="rounded-full flex items-center justify-center bg-[#EEBA2B] text-black hover:opacity-90" style={{ width: 72, height: 72 }} onClick={startStopwatch} onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                      Riprendi
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center items-center py-4" style={{ gap: 6 }}>
        <motion.div
          role="button"
          tabIndex={0}
          className="cursor-pointer shrink-0"
          style={{ width: activeSlide === 0 ? '18px' : '7px', height: '7px', backgroundColor: activeSlide === 0 ? '#EEBA2B' : '#3a3a3c', borderRadius: activeSlide === 0 ? 99 : '50%' }}
          animate={{ width: activeSlide === 0 ? '18px' : '7px' }}
          layout
          transition={{ type: 'tween', duration: 0.2 }}
          onClick={() => setActiveSlide(0)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSlide(0); } }}
          aria-label="Slide Timer"
        />
        <motion.div
          role="button"
          tabIndex={0}
          className="cursor-pointer shrink-0"
          style={{ width: activeSlide === 1 ? '18px' : '7px', height: '7px', backgroundColor: activeSlide === 1 ? '#EEBA2B' : '#3a3a3c', borderRadius: activeSlide === 1 ? 99 : '50%' }}
          animate={{ width: activeSlide === 1 ? '18px' : '7px' }}
          layout
          transition={{ type: 'tween', duration: 0.2 }}
          onClick={() => setActiveSlide(1)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSlide(1); } }}
          aria-label="Slide Cronometro"
        />
      </div>
    </div>
  );
}
