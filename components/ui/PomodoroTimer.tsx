import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Coffee, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PomodoroTimer: React.FC = () => {
  const { logStudyTime, t } = useApp();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [minutesStudied, setMinutesStudied] = useState(0);

  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
        
        // Accumulate studied time every 60 seconds of focus
        if (mode === 'focus' && timeLeft % 60 === 0) {
            setMinutesStudied(prev => prev + 1);
        }
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        logStudyTime(minutesStudied || 25);
        setMinutesStudied(0);
        setMode('break');
        setTimeLeft(BREAK_TIME);
        new Notification("Focus session complete! Time for a break.");
      } else {
        setMode('focus');
        setTimeLeft(FOCUS_TIME);
        new Notification("Break is over! Ready to focus?");
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, minutesStudied, logStudyTime]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'focus' && minutesStudied > 0) {
        logStudyTime(minutesStudied);
        setMinutesStudied(0);
    }
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    if (mode === 'focus' && minutesStudied > 0) {
        logStudyTime(minutesStudied);
        setMinutesStudied(0);
    }
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'focus' 
    ? ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100 
    : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Minimized View / Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300 ${
            isActive ? 'animate-pulse ring-2 ring-offset-2' : ''
        } ${
            mode === 'focus' 
            ? 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 ring-red-500 text-white' 
            : 'bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 ring-emerald-500 text-white'
        }`}
      >
        {mode === 'focus' ? <Brain size={18} /> : <Coffee size={18} />}
        <span className="font-mono font-bold tracking-wider">{formatTime(timeLeft)}</span>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mb-4 w-72 bg-card dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up">
          <div className="p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {mode === 'focus' ? 'Focus Session' : 'Take a Break'}
              </h3>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button 
                    onClick={() => switchMode('focus')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${mode === 'focus' ? 'bg-white dark:bg-gray-600 shadow-sm text-red-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Focus
                </button>
                <button 
                    onClick={() => switchMode('break')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${mode === 'break' ? 'bg-white dark:bg-gray-600 shadow-sm text-emerald-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Break
                </button>
              </div>
            </div>

            <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
              {/* Circular Progress */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle 
                    className="text-gray-200 dark:text-gray-700" 
                    strokeWidth="8" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="88" 
                    cx="96" 
                    cy="96" 
                />
                <circle 
                    className={mode === 'focus' ? "text-red-500 transition-all duration-1000" : "text-emerald-500 transition-all duration-1000"} 
                    strokeWidth="8" 
                    strokeDasharray={88 * 2 * Math.PI} 
                    strokeDashoffset={88 * 2 * Math.PI - (progress / 100) * 88 * 2 * Math.PI}
                    strokeLinecap="round" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="88" 
                    cx="96" 
                    cy="96" 
                />
              </svg>
              <div className="text-4xl font-mono font-bold text-gray-900 dark:text-gray-100">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button 
                onClick={toggleTimer}
                className={`p-4 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                    mode === 'focus' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              <button 
                onClick={resetTimer}
                className="p-4 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-transform hover:scale-105 active:scale-95"
              >
                <Square size={20} fill="currentColor" />
              </button>
            </div>
            
            {mode === 'focus' && (
                <p className="text-center text-xs text-gray-500 mt-4">
                    Stay focused! Time is automatically logged to your stats.
                </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
