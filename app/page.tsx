"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2, Club } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <div className="text-6xl mb-4">⛳</div>
          <h1 className="text-4xl font-bold text-primary">Golf Club Selector</h1>
          <p className="text-muted-foreground">Choose your game mode</p>
        </div>

        <div className="grid gap-4">
          <Link href="/game-modes" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-primary">
                  <Gamepad2 className="h-6 w-6" />
                  Game Modes
                </CardTitle>
                <CardDescription>Play various golf games</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/my-clubs" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-secondary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-secondary">
                  <Club className="h-6 w-6" />
                  My Clubs
                </CardTitle>
                <CardDescription>Edit your available clubs</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
