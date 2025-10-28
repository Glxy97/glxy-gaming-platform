// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Skull, Crosshair, Zap } from 'lucide-react';

interface PlayerStats {
  username: string;
  score: number;
  kills: number;
  deaths: number;
  assists: number;
  ping: number;
  isAlive: boolean;
}

interface TeamStats {
  name: string;
  color: string;
  players: PlayerStats[];
  totalScore: number;
}

interface ScoreboardProps {
  isVisible: boolean;
  team1: TeamStats;
  team2: TeamStats;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ 
  isVisible, 
  team1, 
  team2 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
      <Card className="w-full max-w-4xl bg-gray-900/95 border-gray-700 pointer-events-auto">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-white flex items-center justify-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>SCOREBOARD</span>
          </CardTitle>
          
          {/* Team Scores */}
          <div className="flex justify-center items-center space-x-8 mt-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${team1.color}`}>
                {team1.totalScore}
              </div>
              <div className="text-sm text-gray-400">{team1.name}</div>
            </div>
            
            <div className="text-2xl text-gray-400 font-bold">VS</div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold ${team2.color}`}>
                {team2.totalScore}
              </div>
              <div className="text-sm text-gray-400">{team2.name}</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Team 1 */}
            <div className="space-y-2">
              <div className={`text-lg font-semibold ${team1.color} mb-2`}>
                {team1.name}
              </div>
              
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-800 rounded text-xs text-gray-400 font-semibold">
                <div className="col-span-4">SPIELER</div>
                <div className="col-span-2 text-center">PUNKTE</div>
                <div className="col-span-1 text-center">
                  <Crosshair className="w-3 h-3 mx-auto" />
                </div>
                <div className="col-span-1 text-center">
                  <Skull className="w-3 h-3 mx-auto" />
                </div>
                <div className="col-span-1 text-center">A</div>
                <div className="col-span-2 text-center">PING</div>
                <div className="col-span-1 text-center">STATUS</div>
              </div>
              
              {/* Players */}
              {team1.players.map((player, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-12 gap-2 px-3 py-2 rounded text-sm ${
                    player.isAlive ? 'bg-gray-800/50 hover:bg-gray-800/70' : 'bg-red-900/20'
                  }`}
                >
                  <div className="col-span-4 text-white truncate">
                    {player.username}
                  </div>
                  <div className="col-span-2 text-center text-white font-mono">
                    {player.score}
                  </div>
                  <div className="col-span-1 text-center text-green-400 font-mono">
                    {player.kills}
                  </div>
                  <div className="col-span-1 text-center text-red-400 font-mono">
                    {player.deaths}
                  </div>
                  <div className="col-span-1 text-center text-blue-400 font-mono">
                    {player.assists}
                  </div>
                  <div className="col-span-2 text-center text-gray-300 font-mono">
                    {player.ping}ms
                  </div>
                  <div className="col-span-1 text-center">
                    {player.isAlive ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-2 h-2 bg-red-500 rounded-full mx-auto"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Team 2 */}
            <div className="space-y-2">
              <div className={`text-lg font-semibold ${team2.color} mb-2`}>
                {team2.name}
              </div>
              
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-800 rounded text-xs text-gray-400 font-semibold">
                <div className="col-span-4">SPIELER</div>
                <div className="col-span-2 text-center">PUNKTE</div>
                <div className="col-span-1 text-center">
                  <Crosshair className="w-3 h-3 mx-auto" />
                </div>
                <div className="col-span-1 text-center">
                  <Skull className="w-3 h-3 mx-auto" />
                </div>
                <div className="col-span-1 text-center">A</div>
                <div className="col-span-2 text-center">PING</div>
                <div className="col-span-1 text-center">STATUS</div>
              </div>
              
              {/* Players */}
              {team2.players.map((player, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-12 gap-2 px-3 py-2 rounded text-sm ${
                    player.isAlive ? 'bg-gray-800/50 hover:bg-gray-800/70' : 'bg-red-900/20'
                  }`}
                >
                  <div className="col-span-4 text-white truncate">
                    {player.username}
                  </div>
                  <div className="col-span-2 text-center text-white font-mono">
                    {player.score}
                  </div>
                  <div className="col-span-1 text-center text-green-400 font-mono">
                    {player.kills}
                  </div>
                  <div className="col-span-1 text-center text-red-400 font-mono">
                    {player.deaths}
                  </div>
                  <div className="col-span-1 text-center text-blue-400 font-mono">
                    {player.assists}
                  </div>
                  <div className="col-span-2 text-center text-gray-300 font-mono">
                    {player.ping}ms
                  </div>
                  <div className="col-span-1 text-center">
                    {player.isAlive ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-2 h-2 bg-red-500 rounded-full mx-auto"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Lebend</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Tot</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Crosshair className="w-3 h-3" />
              <span>Kills</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Skull className="w-3 h-3" />
              <span>Tode</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>A</span>
              <span>Assists</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};