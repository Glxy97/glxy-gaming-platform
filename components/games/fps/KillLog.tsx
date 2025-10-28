// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
// Import the proper KillLogEntry type
import { KillLogEntry } from '@/lib/games/bots/bot-system';

interface KillLogProps {
  killLog: KillLogEntry[];
  maxEntries?: number;
}

export function KillLog({ killLog, maxEntries = 10 }: KillLogProps) {
  const [displayedLog, setDisplayedLog] = useState<KillLogEntry[]>([]);

  useEffect(() => {
    // Show only the most recent entries
    const recentEntries = killLog.slice(0, maxEntries);
    setDisplayedLog(recentEntries);
  }, [killLog, maxEntries]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getWeaponIcon = (weapon: string) => {
    switch (weapon) {
      case 'rifle':
        return '🔫';
      case 'smg':
        return '🔫';
      case 'shotgun':
        return '🔫';
      default:
        return '⚔️';
    }
  };

  const getTeamColor = (team: string) => {
    return team === 'team1' ? 'bg-blue-500' : 'bg-red-500';
  };

  return (
    <Card className="w-80 bg-black/80 border-gray-700 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <span className="text-red-500">☠️</span>
          Kill Log
          <Badge variant="secondary" className="ml-auto text-xs">
            {displayedLog.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 px-4 pb-4">
          {displayedLog.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No kills yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedLog.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-900/50'
                  } hover:bg-gray-700/50 transition-colors`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {/* Killer */}
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getTeamColor(entry.killer.team)}`} />
                      <span className="font-medium text-sm">{entry.killer.name}</span>
                    </div>
                    
                    {/* Weapon icon */}
                    <span className="text-lg">{getWeaponIcon(entry.killer.weapon)}</span>
                    
                    {/* Arrow */}
                    <span className="text-gray-400">→</span>
                    
                    {/* Victim */}
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getTeamColor(entry.victim.team)}`} />
                      <span className="font-medium text-sm">{entry.victim.name}</span>
                    </div>
                    
                    {/* Headshot indicator */}
                    {entry.isHeadshot && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        HEADSHOT
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">{formatTime(entry.timestamp)}</span>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>{entry.damage}hp</span>
                      <span>{Math.round(entry.distance)}m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}