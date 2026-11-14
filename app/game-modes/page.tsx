"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Dice5, Flag, ArrowLeft, History, PlayCircle, Calendar, MapPin, ChevronRight, Trash2 } from "lucide-react";
import { getInProgressGames, deleteGame } from "@/app/db/actions";

// Course mapping for display names
const courseNames: Record<string, string> = {
  meadowbrook: "Meadowbrook Pines",
  coastal: "Coastal Links",
  mountainview: "Mountain View",
  urban: "Metro City GC",
};

interface InProgressGame {
  id: number;
  mode: string;
  courseId: string | null;
  startedAt: Date;
  score: number | null;
}

export default function GameModesPage() {
  const { isSignedIn } = useAuth();
  const [inProgressGames, setInProgressGames] = useState<InProgressGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllGames, setShowAllGames] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState<number | null>(null);
  const [gameToDelete, setGameToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function loadInProgressGames() {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        const games = await getInProgressGames();
        setInProgressGames(games.map(game => ({
          id: game.id,
          mode: game.mode,
          courseId: game.courseId || null,
          startedAt: game.startedAt,
          score: game.score,
        })));
      } catch (error) {
        console.error("Failed to load in-progress games:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInProgressGames();
  }, [isSignedIn]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreText = (score: number | null) => {
    if (score === null) return "-";
    if (score > 0) return `+${score}`;
    if (score < 0) return `${score}`;
    return "E";
  };

  const openDeleteDialog = (gameId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setGameToDelete(gameId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteGame = async () => {
    if (!gameToDelete) return;

    setDeletingGameId(gameToDelete);
    setIsDeleteDialogOpen(false);

    try {
      await deleteGame(gameToDelete);
      // Remove the deleted game from local state
      setInProgressGames(prev => prev.filter(game => game.id !== gameToDelete));
      toast.success("Game deleted successfully");
    } catch (error) {
      console.error("Failed to delete game:", error);
      toast.error("Failed to delete game. Please try again.");
    } finally {
      setDeletingGameId(null);
      setGameToDelete(null);
    }
  };

  // Determine which games to show
  const hasInProgressGames = inProgressGames.length > 0;
  const displayGames = showAllGames ? inProgressGames : inProgressGames.slice(0, 1);
  const hasMoreGames = inProgressGames.length > 1;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold text-primary">Game Modes</h1>
          <p className="text-muted-foreground">Select how you want to play</p>
        </div>

        {/* In Progress Games Section */}
        {!loading && hasInProgressGames && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Resume Game
              </h2>
              {inProgressGames.length > 1 && (
                <Badge variant="secondary" className="text-xs">
                  {inProgressGames.length} in progress
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {displayGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/game-modes/simulate?resume=${game.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-500/50 bg-orange-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <PlayCircle className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-orange-900">
                              Game #{game.id}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-orange-700/70">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(game.startedAt)} {formatTime(game.startedAt)}
                              </span>
                              {game.courseId && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {courseNames[game.courseId] || game.courseId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-orange-700 border-orange-300"
                          >
                            {getScoreText(game.score)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => openDeleteDialog(game.id, e)}
                            disabled={deletingGameId === game.id}
                          >
                            {deletingGameId === game.id ? (
                              <span className="animate-spin">⌛</span>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          <ChevronRight className="h-4 w-4 text-orange-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Show More/Less Button */}
            {hasMoreGames && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllGames(!showAllGames)}
                className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                {showAllGames
                  ? "Show Less"
                  : `Show ${inProgressGames.length - 1} More Game${
                      inProgressGames.length > 2 ? "s" : ""
                    }`}
              </Button>
            )}
          </div>
        )}

        <div className="grid gap-4">
          <Link href="/game-modes/random" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                  <Dice5 className="h-8 w-8" />
                  Random Generator
                </CardTitle>
                <CardDescription>Get a random club selection</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/game-modes/simulate" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-secondary">
                  <Flag className="h-8 w-8" />
                  Simulate Game
                </CardTitle>
                <CardDescription>Play a virtual round of golf</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/my-games" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-accent-foreground">
                  <History className="h-8 w-8" />
                  Game History
                </CardTitle>
                <CardDescription>View your past games and stats</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <Link href="/" className="block">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Game</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this game? This action cannot be undone.
                All shots and progress for this game will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setGameToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGame}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toast Notifications */}
        <Toaster position="bottom-center" />
      </div>
    </main>
  );
}
