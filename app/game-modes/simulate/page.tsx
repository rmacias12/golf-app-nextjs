'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Flag, ArrowLeft, Trophy, Play, Club, Target, MapPin, CheckCircle, Lock, Map, Trees, Mountain, Waves, Building2 } from 'lucide-react';
import { getUserClubs, createGame, recordShot, updateGame, recommendClub, getGameDetails } from '@/app/db/actions';

interface Hole {
  number: number;
  par: number;
  distance: number;
  description: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  location: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalPar: number;
  totalDistance: number;
  holes: Hole[];
  icon: React.ReactNode;
}

const courses: Course[] = [
  {
    id: 'meadowbrook',
    name: 'Meadowbrook Pines',
    description: 'A scenic parkland course with gentle rolling fairways and forgiving rough. Perfect for beginners and casual rounds.',
    location: 'Countryside, USA',
    difficulty: 'Easy',
    totalPar: 36,
    totalDistance: 3325,
    icon: <Trees className="h-6 w-6" />,
    holes: [
      { number: 1, par: 4, distance: 380, description: 'Straightaway par 4' },
      { number: 2, par: 3, distance: 165, description: 'Over water par 3' },
      { number: 3, par: 5, distance: 520, description: 'Long par 5, dogleg right' },
      { number: 4, par: 4, distance: 410, description: 'Uphill par 4' },
      { number: 5, par: 4, distance: 355, description: 'Short par 4, reachable' },
      { number: 6, par: 3, distance: 185, description: 'Elevated par 3' },
      { number: 7, par: 4, distance: 425, description: 'Narrow fairway par 4' },
      { number: 8, par: 5, distance: 495, description: 'Par 5 with hazard on right' },
      { number: 9, par: 4, distance: 390, description: 'Finishing par 4' },
    ],
  },
  {
    id: 'coastal',
    name: 'Coastal Links',
    description: 'A challenging seaside links course with ocean winds, tight fairways, and punishing bunkers.',
    location: 'Coastal Oregon',
    difficulty: 'Hard',
    totalPar: 36,
    totalDistance: 3450,
    icon: <Waves className="h-6 w-6" />,
    holes: [
      { number: 1, par: 4, distance: 420, description: 'Into the wind par 4' },
      { number: 2, par: 3, distance: 195, description: 'Cliffside par 3' },
      { number: 3, par: 5, distance: 565, description: 'Double dogleg par 5' },
      { number: 4, par: 4, distance: 445, description: 'Beachside par 4' },
      { number: 5, par: 4, distance: 390, description: 'Dune ridge par 4' },
      { number: 6, par: 3, distance: 175, description: 'Island green par 3' },
      { number: 7, par: 4, distance: 465, description: 'Ocean view par 4' },
      { number: 8, par: 5, distance: 540, description: 'Long coastal par 5' },
      { number: 9, par: 4, distance: 255, description: 'Risk/reward par 4' },
    ],
  },
  {
    id: 'mountainview',
    name: 'Mountain View',
    description: 'Elevation changes and mountain terrain make club selection critical. Spectacular views on every hole.',
    location: 'Colorado Rockies',
    difficulty: 'Medium',
    totalPar: 36,
    totalDistance: 3280,
    icon: <Mountain className="h-6 w-6" />,
    holes: [
      { number: 1, par: 4, distance: 395, description: 'Downhill par 4' },
      { number: 2, par: 3, distance: 155, description: 'Rocky outcrop par 3' },
      { number: 3, par: 5, distance: 510, description: 'Valley par 5' },
      { number: 4, par: 4, distance: 425, description: 'Uphill battle par 4' },
      { number: 5, par: 4, distance: 340, description: 'Short but tricky par 4' },
      { number: 6, par: 3, distance: 205, description: 'High altitude par 3' },
      { number: 7, par: 4, distance: 410, description: 'Mountain ridge par 4' },
      { number: 8, par: 5, distance: 480, description: 'Canyon crossing par 5' },
      { number: 9, par: 4, distance: 370, description: 'Homeward par 4' },
    ],
  },
  {
    id: 'urban',
    name: 'Metro City GC',
    description: 'A tight city course where accuracy matters more than distance. Avoid the buildings and streets!',
    location: 'Downtown Metro',
    difficulty: 'Medium',
    totalPar: 36,
    totalDistance: 2950,
    icon: <Building2 className="h-6 w-6" />,
    holes: [
      { number: 1, par: 4, distance: 340, description: 'Tight fairway par 4' },
      { number: 2, par: 3, distance: 145, description: 'City view par 3' },
      { number: 3, par: 5, distance: 480, description: 'Long but open par 5' },
      { number: 4, par: 4, distance: 365, description: 'Street hazard par 4' },
      { number: 5, par: 4, distance: 325, description: 'Accuracy test par 4' },
      { number: 6, par: 3, distance: 165, description: 'Water tower par 3' },
      { number: 7, par: 4, distance: 380, description: 'Dogleg left par 4' },
      { number: 8, par: 5, distance: 445, description: 'Risk/reward par 5' },
      { number: 9, par: 4, distance: 305, description: 'Urban finish par 4' },
    ],
  },
];

interface UserClub {
  id: number;
  userId: string;
  clubId: number;
  customDistance: number | null;
  active: boolean;
  notes: string | null;
  club: {
    id: number;
    name: string;
    type: string;
    category: string;
    defaultDistance: number | null;
  };
}

interface Shot {
  shotNumber: number;
  clubName: string;
  intendedDistance: number;
  actualDistance: number;
  remainingDistance: number;
}

interface HoleStats {
  shots: number;
  putts: number;
  score: number;
}

import { Suspense } from 'react';

// Main component that uses useSearchParams
function SimulateGameContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const resumeGameId = searchParams.get('resume');

  // Game state
  const [gameState, setGameState] = useState<'selectCourse' | 'start' | 'playing' | 'onGreen' | 'holeComplete' | 'gameComplete'>('selectCourse');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [currentHole, setCurrentHole] = useState(0);
  const [distanceToGreen, setDistanceToGreen] = useState(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [putts, setPutts] = useState(0);
  const [holeStats, setHoleStats] = useState<HoleStats[]>([]);
  const [totalScore, setTotalScore] = useState(0);

  // User data
  const [userClubs, setUserClubs] = useState<UserClub[]>([]);
  const [recommendedClub, setRecommendedClub] = useState<UserClub | null>(null);
  const [selectedClub, setSelectedClub] = useState<UserClub | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResuming, setIsResuming] = useState(false);

  // Input state
  const [actualYardage, setActualYardage] = useState('');
  const [puttsInput, setPuttsInput] = useState('');

  // Track if we've successfully resumed (to prevent re-running)
  const resumedGameIdRef = useRef<string | null>(null);

  // Load user's clubs on mount
  useEffect(() => {
    async function loadClubs() {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        const clubs = await getUserClubs();
        setUserClubs(clubs as unknown as UserClub[]);
      } catch (error) {
        console.error('Failed to load user clubs:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      loadClubs();
    }
  }, [isLoaded, isSignedIn]);

  // Handle resuming a game
  useEffect(() => {
    // Only resume if we have a resumeGameId, haven't already resumed this game,
    // and all prerequisites are loaded
    if (!resumeGameId) return;
    if (resumedGameIdRef.current === resumeGameId) return; // Already resumed this game
    if (!isSignedIn || !isLoaded || loading || userClubs.length === 0) return;

    // Mark this game as being resumed
    resumedGameIdRef.current = resumeGameId;

    async function resumeGame(gameIdStr: string) {
      setIsResuming(true);
      console.log('Resuming game:', gameIdStr);

      try {
        const gameId = parseInt(gameIdStr);
        const gameDetails = await getGameDetails(gameId);

        console.log('Game details:', gameDetails);

        if (!gameDetails || gameDetails.status !== 'in_progress') {
          console.log('Game not found or not in progress');
          setIsResuming(false);
          return;
        }

        // Find the course from the stored courseId
        const courseId = gameDetails.courseId;
        console.log('Looking for course ID:', courseId);

        if (!courseId) {
          console.log('No courseId stored in game - this game was created before course tracking was added');
          console.log('Going to course selection to let user choose course');
          setGameId(gameId);
          setGameState('selectCourse');
          setIsResuming(false);
          return;
        }

        const course = courses.find(c => c.id === courseId);
        console.log('Course found:', course?.name || 'NOT FOUND');

        if (!course) {
          console.log('Course not found in hardcoded list, going to course selection');
          setGameId(gameId);
          setGameState('selectCourse');
          setIsResuming(false);
          return;
        }

        // Restore game state
        setSelectedCourse(course);
        setGameId(gameId);
        setTotalScore(gameDetails.score || 0);

        // Process shots to restore hole-by-hole state
        const shots = gameDetails.shots || [];
        console.log('Shots found:', shots.length);

        // Group shots by hole
        type ShotWithHole = typeof shots[number];
        const shotsByHole: Record<number, ShotWithHole[]> = {};
        shots.forEach((shot: ShotWithHole) => {
          if (!shotsByHole[shot.hole]) shotsByHole[shot.hole] = [];
          shotsByHole[shot.hole].push(shot);
        });

        // Find the current hole (first hole without all shots recorded)
        let currentHoleNum = 1;
        const completedHoles: HoleStats[] = [];

        for (let holeNum = 1; holeNum <= course.holes.length; holeNum++) {
          const holeShots = shotsByHole[holeNum] || [];

          if (holeShots.length === 0) {
            currentHoleNum = holeNum;
            break;
          }

          const lastShot = holeShots[holeShots.length - 1];
          const isOnGreen = lastShot.result === 'green';

          if (isOnGreen) {
            const holePar = course.holes[holeNum - 1].par;
            const strokes = holeShots.length + 2;
            completedHoles.push({
              shots: strokes,
              putts: 2,
              score: strokes - holePar,
            });

            if (holeNum === course.holes.length) {
              currentHoleNum = holeNum;
            } else {
              currentHoleNum = holeNum + 1;
            }
          } else {
            currentHoleNum = holeNum;

            const currentShots: Shot[] = [];
            let remainingDist = course.holes[holeNum - 1].distance;

            for (const shot of holeShots) {
              remainingDist = Math.max(0, remainingDist - (shot.actualDistance || 0));
              currentShots.push({
                shotNumber: shot.shotNumber,
                clubName: shot.club?.name || 'Unknown',
                intendedDistance: shot.intendedDistance || 0,
                actualDistance: shot.actualDistance || 0,
                remainingDistance: remainingDist,
              });
            }

            setShots(currentShots);
            setDistanceToGreen(remainingDist);
            setCurrentHole(currentHoleNum - 1);
            setHoleStats(completedHoles);
            setGameState('playing');
            setIsResuming(false);
            console.log('Resumed to playing hole', currentHoleNum);
            return;
          }
        }

        setCurrentHole(currentHoleNum - 1);
        setHoleStats(completedHoles);

        const currentHoleShots = shotsByHole[currentHoleNum] || [];
        if (currentHoleShots.length > 0) {
          const lastShot = currentHoleShots[currentHoleShots.length - 1];
          let remainingDist = course.holes[currentHoleNum - 1].distance;
          const currentShots: Shot[] = [];

          for (const shot of currentHoleShots) {
            remainingDist = Math.max(0, remainingDist - (shot.actualDistance || 0));
            currentShots.push({
              shotNumber: shot.shotNumber,
              clubName: shot.club?.name || 'Unknown',
              intendedDistance: shot.intendedDistance || 0,
              actualDistance: shot.actualDistance || 0,
              remainingDistance: remainingDist,
            });
          }

          setShots(currentShots);
          setDistanceToGreen(remainingDist);

          if (lastShot.result === 'green') {
            setGameState('onGreen');
            console.log('Resumed to onGreen');
          } else {
            setGameState('playing');
            console.log('Resumed to playing');
          }
        } else {
          setShots([]);
          setDistanceToGreen(course.holes[currentHoleNum - 1].distance);
          setGameState('playing');
          console.log('Resumed to playing fresh hole', currentHoleNum);
        }

      } catch (error) {
        console.error('Failed to resume game:', error);
      } finally {
        setIsResuming(false);
      }
    }

    resumeGame(resumeGameId);
  }, [resumeGameId, isSignedIn, isLoaded, loading, userClubs.length]);

  // Update recommended club when distance changes
  useEffect(() => {
    if (userClubs.length > 0 && distanceToGreen > 0 && selectedCourse) {
      const validClubs = userClubs.filter(uc => 
        uc.club.category !== 'putter' && (uc.customDistance || uc.club.defaultDistance)
      );
      
      if (validClubs.length > 0) {
        const sorted = validClubs.sort((a, b) => {
          const distA = (b.customDistance || b.club.defaultDistance || 0);
          const distB = (a.customDistance || a.club.defaultDistance || 0);
          return distA - distB;
        });

        // Find club that can reach or come close to the target
        const recommended = sorted.find(uc => {
          const dist = uc.customDistance || uc.club.defaultDistance || 0;
          return dist <= distanceToGreen * 1.1;
        });

        const newRecommended = recommended || sorted[0];
        setRecommendedClub(newRecommended);
        // Pre-select the recommended club, but allow user to change it
        setSelectedClub(newRecommended);
      }
    }
  }, [distanceToGreen, userClubs, selectedCourse]);

  const selectCourse = (course: Course) => {
    setSelectedCourse(course);
    setGameState('start');
  };

  const startGame = async () => {
    if (!isSignedIn || !selectedCourse) return;

    try {
      const game = await createGame('simulate', selectedCourse.id);
      setGameId(game.id);
      setCurrentHole(0);
      setDistanceToGreen(selectedCourse.holes[0].distance);
      setShots([]);
      setPutts(0);
      setHoleStats([]);
      setTotalScore(0);
      setGameState('playing');
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const submitShot = async () => {
    if (!actualYardage || !selectedClub || !gameId) return;

    const actualDistance = parseInt(actualYardage);
    const intendedDistance = selectedClub.customDistance || selectedClub.club.defaultDistance || 0;
    const newRemaining = Math.max(0, distanceToGreen - actualDistance);

    const newShot: Shot = {
      shotNumber: shots.length + 1,
      clubName: selectedClub.club.name,
      intendedDistance,
      actualDistance,
      remainingDistance: newRemaining,
    };

    // Record shot in database
    try {
      await recordShot({
        gameId,
        hole: currentHole + 1,
        shotNumber: shots.length + 1,
        clubId: selectedClub.clubId,
        intendedDistance,
        actualDistance,
        result: newRemaining <= 10 ? 'green' : newRemaining < distanceToGreen ? 'fairway' : 'rough',
      });
    } catch (error) {
      console.error('Failed to record shot:', error);
    }

    const updatedShots = [...shots, newShot];
    setShots(updatedShots);
    setActualYardage('');

    // Check if on green (within 10 yards)
    if (newRemaining <= 10) {
      setDistanceToGreen(newRemaining);
      setGameState('onGreen');
    } else {
      setDistanceToGreen(newRemaining);
    }
  };

  const submitPutts = async () => {
    if (!puttsInput || !gameId || !selectedCourse) return;

    const puttsCount = parseInt(puttsInput);
    setPutts(puttsCount);

    // Calculate hole score
    const hole = selectedCourse.holes[currentHole];
    const strokes = shots.length + puttsCount;
    const holeScore = strokes - hole.par;

    const newHoleStats = [...holeStats, { shots: strokes, putts: puttsCount, score: holeScore }];
    setHoleStats(newHoleStats);

    const newTotalScore = totalScore + holeScore;
    setTotalScore(newTotalScore);

    // Record putts in database
    try {
      // Find the putter club from user's clubs
      const putterClub = userClubs.find(uc => uc.club.category === 'putter');

      if (putterClub) {
        // Record each putt as a separate shot
        for (let i = 0; i < puttsCount; i++) {
          await recordShot({
            gameId,
            hole: currentHole + 1,
            shotNumber: shots.length + i + 1,
            clubId: putterClub.clubId,
            intendedDistance: 0,
            actualDistance: 0,
            result: 'green',
          });
        }
      }

      await updateGame(gameId, { score: newTotalScore });
    } catch (error) {
      console.error('Failed to update game:', error);
    }

    // Check if game is complete
    if (currentHole >= selectedCourse.holes.length - 1) {
      try {
        await updateGame(gameId, {
          score: newTotalScore,
          status: 'completed',
          completedAt: new Date(),
        });
      } catch (error) {
        console.error('Failed to complete game:', error);
      }
      setGameState('gameComplete');
    } else {
      setGameState('holeComplete');
    }
  };

  const nextHole = () => {
    if (!selectedCourse) return;
    
    const nextHoleIndex = currentHole + 1;
    setCurrentHole(nextHoleIndex);
    setDistanceToGreen(selectedCourse.holes[nextHoleIndex].distance);
    setShots([]);
    setPutts(0);
    setPuttsInput('');
    setGameState('playing');
  };

  const resetGame = () => {
    setGameState('selectCourse');
    setSelectedCourse(null);
    setGameId(null);
    setCurrentHole(0);
    setShots([]);
    setPutts(0);
    setHoleStats([]);
    setTotalScore(0);
    setActualYardage('');
    setPuttsInput('');
    setRecommendedClub(null);
    setSelectedClub(null);
  };

  const getScoreText = (score: number) => {
    if (score > 0) return `+${score}`;
    if (score < 0) return `${score}`;
    return 'E';
  };

  const getScoreColor = (score: number) => {
    if (score > 0) return 'text-red-600';
    if (score < 0) return 'text-green-600';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⛳</div>
          <p className="text-muted-foreground">Loading your bag...</p>
        </div>
      </main>
    );
  }

  // Show loading while resuming a game
  if (isResuming) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⛳</div>
          <p className="text-muted-foreground">Resuming your game...</p>
          <p className="text-xs text-muted-foreground mt-2">Please wait</p>
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
              Sign in to play rounds and track your golf game history.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full h-12">
                Sign In to Play
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

  // COURSE SELECTION SCREEN
  if (gameState === 'selectCourse') {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="text-5xl mb-4">🏌️</div>
            <h1 className="text-3xl font-bold text-primary">Select Course</h1>
            <p className="text-muted-foreground">
              Choose a course to play your 9-hole round
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card 
                key={course.id} 
                className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                onClick={() => selectCourse(course)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {course.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{course.location}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      course.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      course.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {course.difficulty}
                    </span>
                    <span className="text-muted-foreground">
                      Par {course.totalPar} • {course.totalDistance} yd
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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

  // START SCREEN
  if (gameState === 'start' && selectedCourse) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="text-5xl mb-4">⛳</div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Now Playing</p>
            <h1 className="text-2xl font-bold text-primary">{selectedCourse.name}</h1>
            <p className="text-sm text-muted-foreground">{selectedCourse.location}</p>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Holes</p>
                  <p className="text-xl font-bold">9</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Par</p>
                  <p className="text-xl font-bold">{selectedCourse.totalPar}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-xl font-bold">{selectedCourse.totalDistance} yd</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardDescription className="text-base">
                Play a round with your custom clubs. 
                Enter your actual yardages after each shot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Your bag: {userClubs.length} clubs</p>
                <p className="mt-1">
                  {userClubs.length === 0 && (
                    <span className="text-amber-600">
                      Add clubs to your bag first for recommendations!
                    </span>
                  )}
                </p>
              </div>
              <Button 
                onClick={startGame} 
                className="w-full h-14 text-lg"
                disabled={userClubs.length === 0}
              >
                <Play className="mr-2 h-5 w-5" />
                Start Round
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setGameState('selectCourse')}
            >
              <Map className="mr-2 h-4 w-4" />
              Change Course
            </Button>
            <Link href="/game-modes" className="flex-1">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const hole = selectedCourse?.holes[currentHole];

  // PLAYING SCREEN (taking shots)
  if (gameState === 'playing' && selectedCourse && hole) {
    return (
      <main className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Progress */}
          <div className="space-y-1">
            <Progress value={currentHole + 1} max={selectedCourse.holes.length} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Hole {currentHole + 1} of {selectedCourse.holes.length}
            </p>
          </div>

          {/* Score Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total Score</p>
                  <p className={`text-xl font-bold ${getScoreColor(totalScore)}`}>
                    {getScoreText(totalScore)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Strokes</p>
                  <p className="text-xl font-bold">{shots.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hole Info */}
          <Card className="border-primary">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-primary">Hole {hole.number}</CardTitle>
              <CardDescription>{hole.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Par</p>
                  <p className="text-2xl font-bold">{hole.par}</p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{hole.distance} yd</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distance to Green */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6 text-center">
              <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground mb-1">Distance to Green</p>
              <p className="text-5xl font-bold text-primary">{distanceToGreen}</p>
              <p className="text-lg text-muted-foreground">yards</p>
            </CardContent>
          </Card>

          {/* Club Selection */}
          {userClubs.length > 0 && (
            <Card className="border-green-500/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Club className="h-5 w-5 text-green-600" />
                  <CardDescription className="text-sm">
                    {recommendedClub && selectedClub?.clubId === recommendedClub.clubId
                      ? 'Recommended Club (Selected)'
                      : 'Select Club Used'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Club selector grid */}
                <div className="grid grid-cols-3 gap-2">
                  {userClubs
                    .filter(uc => uc.club.category !== 'putter' && (uc.customDistance || uc.club.defaultDistance))
                    .sort((a, b) => (b.customDistance || b.club.defaultDistance || 0) - (a.customDistance || a.club.defaultDistance || 0))
                    .map((uc) => {
                      const isSelected = selectedClub?.clubId === uc.clubId;
                      const isRecommended = recommendedClub?.clubId === uc.clubId;
                      return (
                        <button
                          key={uc.clubId}
                          onClick={() => setSelectedClub(uc)}
                          className={`p-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                              : 'bg-secondary/50 hover:bg-secondary text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm truncate">{uc.club.name}</span>
                            {isRecommended && !isSelected && (
                              <span className="text-xs text-green-600">★</span>
                            )}
                          </div>
                          <p className="text-xs opacity-80">
                            {uc.customDistance || uc.club.defaultDistance} yd
                          </p>
                        </button>
                      );
                    })}
                </div>
                {recommendedClub && selectedClub?.clubId !== recommendedClub.clubId && (
                  <p className="text-xs text-muted-foreground text-center">
                    Recommended: {recommendedClub.club.name} ({recommendedClub.customDistance || recommendedClub.club.defaultDistance} yd)
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shot Entry */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardDescription>Enter your shot distance</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  How far did you hit it?
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Yardage"
                    value={actualYardage}
                    onChange={(e) => setActualYardage(e.target.value)}
                    className="text-lg"
                  />
                  <Button
                    onClick={submitShot}
                    disabled={!actualYardage || !selectedClub}
                    className="px-6"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Be honest! This helps the app track your progress.
              </p>
            </CardContent>
          </Card>

          {/* Shot History */}
          {shots.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Shots on this hole</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {shots.map((shot, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-secondary/10 rounded">
                    <div>
                      <span className="font-medium">{shot.clubName}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {shot.actualDistance} yd
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      → {shot.remainingDistance} yd to green
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Button variant="ghost" className="w-full" onClick={() => setGameState('start')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quit Game
          </Button>
        </div>
      </main>
    );
  }

  // ON GREEN (putting)
  if (gameState === 'onGreen' && selectedCourse && hole) {
    return (
      <main className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-center pt-8">
            <div className="text-5xl mb-4">🏁</div>
            <h1 className="text-3xl font-bold text-primary">On the Green!</h1>
          </div>

          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Distance to pin</p>
              <p className="text-4xl font-bold text-green-600">{distanceToGreen} yd</p>
              <p className="text-sm text-muted-foreground mt-2">
                Approach: {shots.length > 0 ? shots[shots.length - 1].clubName : 'Drive'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>How many putts did you take?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder="Number of putts"
                value={puttsInput}
                onChange={(e) => setPuttsInput(e.target.value)}
                className="text-2xl text-center"
                min="1"
                max="10"
              />
              <Button 
                onClick={submitPutts}
                disabled={!puttsInput}
                className="w-full h-14 text-lg"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Complete Hole
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Shots to reach green</CardDescription>
            </CardHeader>
            <CardContent>
              {shots.map((shot, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span>{shot.clubName}</span>
                  <span className="text-muted-foreground">{shot.actualDistance} yd</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // HOLE COMPLETE
  if (gameState === 'holeComplete' && selectedCourse && hole) {
    const holeScore = holeStats[holeStats.length - 1];
    
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">
              {holeScore.score < 0 ? '🦅' : holeScore.score === 0 ? '✅' : holeScore.score === 1 ? '😐' : '😅'}
            </div>
            <h1 className="text-2xl font-bold text-primary">Hole {hole.number} Complete</h1>
          </div>

          <Card className="border-primary">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Par</p>
                  <p className="text-xl font-bold">{hole.par}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Strokes</p>
                  <p className="text-xl font-bold">{holeScore.shots}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className={`text-xl font-bold ${getScoreColor(holeScore.score)}`}>
                    {getScoreText(holeScore.score)}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  {holeScore.putts} putt{holeScore.putts !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Running Total: <span className={`font-bold ${getScoreColor(totalScore)}`}>{getScoreText(totalScore)}</span>
            </p>
          </div>

          <Button onClick={nextHole} className="w-full h-14 text-lg">
            <Flag className="mr-2 h-5 w-5" />
            Next Hole
          </Button>
        </div>
      </main>
    );
  }

  // GAME COMPLETE
  if (!selectedCourse) return null;
  
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-primary">Round Complete!</h1>
          <p className="text-sm text-muted-foreground mt-1">{selectedCourse.name}</p>
        </div>

        <Card className="border-primary border-2">
          <CardHeader className="text-center">
            <CardDescription className="text-lg">Final Score</CardDescription>
            <CardTitle className={`text-5xl ${getScoreColor(totalScore)}`}>
              {getScoreText(totalScore)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalScore > 0 ? 'Over Par' : totalScore < 0 ? 'Under Par' : 'Even Par'}
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Hole-by-Hole</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-9 gap-1 text-center text-xs">
              {holeStats.map((stat, index) => (
                <div key={index} className={`p-2 rounded ${stat.score < 0 ? 'bg-green-100' : stat.score > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <div className="font-bold">{index + 1}</div>
                  <div className={getScoreColor(stat.score)}>{getScoreText(stat.score)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Strokes</p>
              <p className="text-xl font-bold">
                {holeStats.reduce((sum, h) => sum + h.shots, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Putts</p>
              <p className="text-xl font-bold">
                {holeStats.reduce((sum, h) => sum + h.putts, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">GIR</p>
              <p className="text-xl font-bold">
                {holeStats.filter((h, i) => h.shots - h.putts <= selectedCourse.holes[i].par - 2).length}/9
              </p>
            </CardContent>
          </Card>
        </div>

        <Button onClick={resetGame} className="w-full h-14 text-lg">
          <Trophy className="mr-2 h-5 w-5" />
          Play Again
        </Button>

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

// Wrapper with Suspense for useSearchParams
export default function SimulateGamePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⛳</div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </main>
    }>
      <SimulateGameContent />
    </Suspense>
  );
}
