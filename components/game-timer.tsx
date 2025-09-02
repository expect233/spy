'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import type { GameState } from '@/types/game';

interface GameTimerProps {
  state: GameState;
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
  className?: string;
}

export function GameTimer({
  state,
  timeRemaining,
  totalTime,
  isActive,
  className = '',
}: GameTimerProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setDisplayTime(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const seconds = Math.max(0, Math.floor(displayTime / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const progressPercentage = totalTime > 0 ? ((totalTime - displayTime) / totalTime) * 100 : 0;
  const isUrgent = seconds <= 10 && isActive;
  const isWarning = seconds <= 30 && seconds > 10 && isActive;

  const getStateLabel = (state: GameState): string => {
    switch (state) {
      case 'lobby':
        return '準備中';
      case 'speaking':
        return '發言階段';
      case 'voting':
        return '投票階段';
      case 'reveal':
        return '結果揭曉';
      case 'ended':
        return '遊戲結束';
      default:
        return '未知狀態';
    }
  };

  const getTimerVariant = () => {
    if (isUrgent) return 'destructive';
    if (isWarning) return 'secondary';
    return 'default';
  };

  if (!isActive && state === 'lobby') {
    return (
      <div className={`text-center ${className}`}>
        <Badge variant="outline" className="text-sm">
          {getStateLabel(state)}
        </Badge>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className={`h-4 w-4 ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className="text-sm font-medium">{getStateLabel(state)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isUrgent && (
            <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
          )}
          <Badge variant={getTimerVariant()} className="font-mono">
            {minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${remainingSeconds}s`}
          </Badge>
        </div>
      </div>
      
      {isActive && (
        <Progress 
          value={progressPercentage} 
          className={`h-2 ${isUrgent ? 'progress-destructive' : ''}`}
        />
      )}
    </div>
  );
}

interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularTimer({
  timeRemaining,
  totalTime,
  size = 60,
  strokeWidth = 4,
  className = '',
}: CircularTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;
  const strokeDashoffset = circumference - progress * circumference;
  
  const seconds = Math.max(0, Math.floor(timeRemaining / 1000));
  const isUrgent = seconds <= 10;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ${
            isUrgent ? 'text-destructive' : 'text-primary'
          }`}
        />
      </svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-mono font-bold ${
          isUrgent ? 'text-destructive' : 'text-foreground'
        }`}>
          {seconds}
        </span>
      </div>
    </div>
  );
}

interface TimerDisplayProps {
  state: GameState;
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TimerDisplay({
  state,
  timeRemaining,
  totalTime,
  isActive,
  variant = 'linear',
  size = 'md',
  className = '',
}: TimerDisplayProps) {
  const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80,
  };

  if (variant === 'circular') {
    return (
      <div className={`text-center space-y-2 ${className}`}>
        <CircularTimer
          timeRemaining={timeRemaining}
          totalTime={totalTime}
          size={sizeMap[size]}
        />
        <Badge variant="outline" className="text-xs">
          {state === 'speaking' ? '發言' : state === 'voting' ? '投票' : '等待'}
        </Badge>
      </div>
    );
  }

  return (
    <GameTimer
      state={state}
      timeRemaining={timeRemaining}
      totalTime={totalTime}
      isActive={isActive}
      className={className}
    />
  );
}
