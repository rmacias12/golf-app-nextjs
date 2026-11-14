'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Calendar, Clock, Lock, ChevronDown, ChevronUp, MapPin, Target } from 'lucide-react';
import { getGameHistory, getGameDetails } from '@/app/db/actions';

interface Game {
  id: number;
  userId: string;
  mode: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  score: number | null;
  notes: string | null;
}

interface Shot {
  id: number;
  gameId: number;
  hole: number;
  shotNumber: number;
  clubId: number | null;
  intendedDistance: number | null;
  actualDistance: number | null;
  result: string | null;
  notes: string | null;
  createdAt: Date;
  club: {
    id: number;
    name: string;
    type: string;
    category: string;
    defaultDistance: number | null;
  } | null;
}

interface GameWithShots extends Game {
  shots: Shot[];
}

export default function MyGamesPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [expandedGame, setExpandedGame] = useState<number | null>(null);
  const [gameDetails, setGameDetails] = useState<Record<number, GameWithShots>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        const history = await getGameHistory();
        setGames(history.reverse()); // Most recent first
      } catch (error) {
        console.error('Failed to load game history:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      loadGames();
    }
  }, [isLoaded, isSignedIn]);

  const toggleExpandGame = async (gameId: number) => {
    if (expandedGame === gameId) {
      setExpandedGame(null);
      return;
    }

    setExpandedGame(gameId);

    // Load details if not already cached
    if (!gameDetails[gameId]) {
      try {
        const details = await getGameDetails(gameId);
        if (details) {
          setGameDetails(prev => ({ ...prev, [gameId]: details }));
        }
      } catch (error) {
        console.error('Failed to load game details:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreText = (score: number | null) => {
    if (score === null) return '-';
    if (score > 0) return `+${score}`;
    if (score < 0) return `${score}`;
    return 'E';
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score > 0) return 'text-red-600';
    if (score < 0) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
      case 'abandoned':
        return <Badge variant="secondary">Abandoned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const groupShotsByHole = (shots: Shot[]) => {
    const grouped: Record<number, Shot[]> = {};
    shots.forEach(shot => {
      if (!grouped[shot.hole]) grouped[shot.hole] = [];
      grouped[shot.hole].push(shot);
    });
    return grouped;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⛳</div>
          <p className="text-muted-foreground">Loading your games...</p>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to view your game history and track your progress.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full h-12">
                Sign In to View Games
              </Button>
            </SignInButton>
            <Link href="/game-modes" className="block mt-4">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Game Modes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/game-modes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Games</h1>
            <p className="text-sm text-muted-foreground">Your golf game history</p>
          </div>
        </div>

        {/* Stats Summary */}
        {games.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Games</p>
                <p className="text-2xl font-bold">{games.length}</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {games.filter(g => g.status === 'completed').length}
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Best Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(Math.min(...games.filter(g => g.score !== null).map(g => g.score!), 0))}`}>
                  {games.filter(g => g.score !== null).length > 0
                    ? getScoreText(Math.min(...games.filter(g => g.score !== null).map(g => g.score!)))
                    : '-'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Games List */}
        {games.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-5xl mb-4">🏌️</div>
              <h3 className="text-lg font-medium mb-2">No Games Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t played any games. Start your first round!
              </p>
              <Link href="/game-modes/simulate">
                <Button>Play a Round</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <Card
                key={game.id}
                className={`cursor-pointer transition-all ${
                  expandedGame === game.id ? 'ring-2 ring-primary' : 'hover:border-primary'
                }`}
                onClick={() => toggleExpandGame(game.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {game.mode} Game #{game.id}
                        </CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(game.startedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(game.startedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(game.status)}
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getScoreColor(game.score)}`}>
                          {getScoreText(game.score)}
                        </p>
                      </div>
                      {expandedGame === game.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Details */}
                {expandedGame === game.id && gameDetails[game.id] && (
                  <CardContent className="pt-0 border-t">
                    <div className="pt-4 space-y-4">
                      {Object.entries(groupShotsByHole(gameDetails[game.id].shots)).map(([hole, shots]) => {
                        const putts = shots.filter(s => s.club?.category === 'putter').length;
                        const approachShots = shots.length - putts;
                        const totalStrokes = shots.length;

                        return (
                          <div key={hole} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm text-muted-foreground">
                                Hole {hole}
                              </h4>
                              <div className="flex items-center gap-2 text-xs">
                                {approachShots > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {approachShots} approach
                                  </Badge>
                                )}
                                {putts > 0 && (
                                  <Badge variant="outline" className="text-xs bg-green-50">
                                    {putts} putt{putts !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                                <span className="font-medium text-primary">
                                  {totalStrokes} total
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {shots.map((shot, idx) => (
                                <div
                                  key={shot.id}
                                  className={`flex items-center justify-between p-2 rounded ${
                                    shot.club?.category === 'putter'
                                      ? 'bg-green-50/50'
                                      : 'bg-secondary/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground w-6">
                                      {idx + 1}.
                                    </span>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {shot.club?.name || 'Unknown Club'}
                                    </span>
                                    {shot.club?.category === 'putter' && (
                                      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                        Putt
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    {shot.actualDistance !== null && shot.actualDistance > 0 && (
                                      <span className="text-muted-foreground">
                                        {shot.actualDistance} yd
                                      </span>
                                    )}
                                    {shot.club?.category !== 'putter' && shot.result && (
                                      <Badge variant="outline" className="text-xs">
                                        {shot.result === 'green' && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            Green
                                          </span>
                                        )}
                                        {shot.result === 'fairway' && 'Fairway'}
                                        {shot.result === 'rough' && 'Rough'}
                                        {!['green', 'fairway', 'rough'].includes(shot.result || '') && shot.result}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {gameDetails[game.id].shots.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                          No shots recorded for this game.
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <Link href="/game-modes">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game Modes
          </Button>
        </Link>
      </div>
    </main>
  );
}
