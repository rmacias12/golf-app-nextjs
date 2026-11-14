'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dice5, ArrowLeft, Club, Lock } from 'lucide-react';
import { getUserClubs } from '@/app/db/actions';

interface UserClub {
  id: number;
  club: {
    id: number;
    name: string;
    type: string;
    category: string;
    defaultDistance: number | null;
  };
  customDistance: number | null;
}

export default function RandomGeneratorPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [userClubs, setUserClubs] = useState<UserClub[]>([]);
  const [selectedClub, setSelectedClub] = useState<UserClub | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadClubs = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    
    try {
      const clubs = await getUserClubs();
      setUserClubs(clubs as unknown as UserClub[]);
    } catch (error) {
      console.error('Failed to load clubs:', error);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isLoaded) {
      loadClubs();
    }
  }, [isLoaded, loadClubs]);

  const generateRandomClub = () => {
    if (userClubs.length === 0) return;

    setIsGenerating(true);
    setSelectedClub(null);

    let iterations = 0;
    const maxIterations = 15;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * userClubs.length);
      setSelectedClub(userClubs[randomIndex]);
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * userClubs.length);
        setSelectedClub(userClubs[finalIndex]);
        setIsGenerating(false);
      }
    }, 100);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🏌️</div>
          <p className="text-muted-foreground">Loading your bag...</p>
        </div>
      </main>
    );
  }

  // Show sign-in prompt if not authenticated
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
              Sign in to access your club bag and generate random clubs.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full h-12">
                Sign In to Continue
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
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">🎲</div>
          <h1 className="text-3xl font-bold text-primary">Random Club Generator</h1>
          <p className="text-muted-foreground">
            {userClubs.length > 0 
              ? `Picking from your ${userClubs.length} clubs` 
              : 'Add clubs to your bag first!'}
          </p>
        </div>

        <Card className={selectedClub ? 'border-primary border-2' : 'border-muted'}>
          <CardHeader className="text-center">
            {selectedClub ? (
              <>
                <div className="flex justify-center mb-2">
                  <Club className="h-8 w-8 text-primary" />
                </div>
                <CardDescription className="text-lg">Your Club:</CardDescription>
                <CardTitle className="text-3xl text-primary">{selectedClub.club.name}</CardTitle>
              </>
            ) : (
              <CardDescription className="text-lg py-4">
                Press generate to get a random club from your bag
              </CardDescription>
            )}
          </CardHeader>
          {selectedClub && (
            <CardContent className="text-center pb-6">
              <p className="text-2xl font-medium text-muted-foreground">
                {selectedClub.customDistance || selectedClub.club.defaultDistance || 0} yards
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedClub.club.type} • {selectedClub.club.category}
              </p>
            </CardContent>
          )}
        </Card>

        <Button
          onClick={generateRandomClub}
          disabled={isGenerating || userClubs.length === 0}
          className="w-full h-14 text-lg"
        >
          <Dice5 className="mr-2 h-5 w-5" />
          {isGenerating ? 'Generating...' : 'Generate Random Club'}
        </Button>

        {userClubs.length === 0 && (
          <p className="text-center text-sm text-amber-600">
            Go to &quot;My Clubs&quot; to add clubs to your bag first!
          </p>
        )}

        <Link href="/game-modes" className="block">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game Modes
          </Button>
        </Link>
      </div>
    </main>
  );
}
