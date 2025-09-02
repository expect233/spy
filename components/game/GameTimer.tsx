'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause } from 'lucide-react';
import { TimerState, GameState } from '../../types/game';

interface GameTimerProps {
  timer: TimerState | null;
  onTimerEnd?: () => void;
  className?: string;
}

export function GameTimer({ timer, onTimerEnd, className = '' }: GameTimerProps) {
  const [localRemainMs, setLocalRemainMs] = useState(timer?.remainMs || 0);
  const [isActive, setIsActive] = useState(timer?.isActive || false);

  useEffect(() => {
    if (timer) {
      setLocalRemainMs(timer.remainMs);
      setIsActive(timer.isActive);
    }
  }, [timer]);

  useEffect(() => {
    if (!isActive || localRemainMs <= 0) return;

    const interval = setInterval(() => {
      setLocalRemainMs(prev => {
        const newRemain = Math.max(0, prev - 1000);
        if (newRemain === 0 && onTimerEnd) {
          onTimerEnd();
        }
        return newRemain;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, localRemainMs, onTimerEnd]);

  if (!timer) return null;

  const seconds = Math.ceil(localRemainMs / 1000);
  const progress = timer.totalMs > 0 ? (localRemainMs / timer.totalMs) * 100 : 0;
  
  const getTimerColor = () => {
    if (progress > 60) return 'bg-green-500';
    if (progress > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStateText = (state: GameState) => {
    switch (state) {
      case 'speaking': return '發言時間';
      case 'voting': return '投票時間';
      case 'lobby': return '等待開始';
      default: return '計時中';
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-400" />
        <Badge variant={isActive ? "default" : "secondary"}>
          {getStateText(timer.state)}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="text-lg font-mono font-bold text-white min-w-[3ch]">
          {seconds}s
        </div>
        
        <div className="flex-1 min-w-[60px]">
          <Progress 
            value={progress} 
            className="h-2"
            style={{
              '--progress-background': getTimerColor(),
            } as React.CSSProperties}
          />
        </div>
      </div>

      {!isActive && (
        <div className="flex items-center gap-1 text-slate-400">
          <Pause className="w-3 h-3" />
          <span className="text-xs">暫停</span>
        </div>
      )}
    </div>
  );
}

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
  className?: string;
}

export function CountdownTimer({ 
  seconds, 
  onComplete, 
  autoStart = true,
  className = '' 
}: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setRemainingSeconds(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        const newRemaining = prev - 1;
        if (newRemaining <= 0) {
          setIsRunning(false);
          if (onComplete) {
            onComplete();
          }
        }
        return Math.max(0, newRemaining);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds, onComplete]);

  const progress = seconds > 0 ? (remainingSeconds / seconds) * 100 : 0;
  
  const getColorClass = () => {
    if (progress > 60) return 'text-green-400';
    if (progress > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`text-2xl font-mono font-bold ${getColorClass()}`}>
        {remainingSeconds}
      </div>
      
      <div className="flex-1">
        <Progress 
          value={progress} 
          className="h-3"
        />
      </div>
      
      <div className="flex items-center gap-1">
        {isRunning ? (
          <Play className="w-4 h-4 text-green-400" />
        ) : (
          <Pause className="w-4 h-4 text-slate-400" />
        )}
      </div>
    </div>
  );
}

interface PhaseTimerProps {
  phase: 'lobby' | 'speaking' | 'voting' | 'reveal' | 'ended';
  remainingMs: number;
  totalMs: number;
  isActive: boolean;
  onPhaseEnd?: () => void;
  className?: string;
}

export function PhaseTimer({ 
  phase, 
  remainingMs, 
  totalMs, 
  isActive,
  onPhaseEnd,
  className = '' 
}: PhaseTimerProps) {
  const [localRemaining, setLocalRemaining] = useState(remainingMs);

  useEffect(() => {
    setLocalRemaining(remainingMs);
  }, [remainingMs]);

  useEffect(() => {
    if (!isActive || localRemaining <= 0) return;

    const interval = setInterval(() => {
      setLocalRemaining(prev => {
        const newRemaining = Math.max(0, prev - 1000);
        if (newRemaining === 0 && onPhaseEnd) {
          onPhaseEnd();
        }
        return newRemaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, localRemaining, onPhaseEnd]);

  const seconds = Math.ceil(localRemaining / 1000);
  const progress = totalMs > 0 ? (localRemaining / totalMs) * 100 : 0;

  const getPhaseInfo = () => {
    switch (phase) {
      case 'lobby':
        return { text: '等待開始', color: 'bg-blue-500' };
      case 'speaking':
        return { text: '發言階段', color: 'bg-green-500' };
      case 'voting':
        return { text: '投票階段', color: 'bg-orange-500' };
      case 'reveal':
        return { text: '結果揭曉', color: 'bg-purple-500' };
      case 'ended':
        return { text: '遊戲結束', color: 'bg-gray-500' };
      default:
        return { text: '未知階段', color: 'bg-gray-500' };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 border border-slate-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <Badge 
          className={`${phaseInfo.color} text-white`}
          variant="default"
        >
          {phaseInfo.text}
        </Badge>
        
        {isActive && (
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg font-bold">
              {seconds}s
            </span>
          </div>
        )}
      </div>

      {isActive && (
        <div className="space-y-2">
          <Progress 
            value={progress} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>剩餘時間</span>
            <span>{Math.ceil(totalMs / 1000)}s 總計</span>
          </div>
        </div>
      )}

      {!isActive && phase !== 'ended' && (
        <div className="text-center text-slate-400 text-sm">
          等待階段開始...
        </div>
      )}
    </div>
  );
}
