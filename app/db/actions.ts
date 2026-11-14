'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from './index';
import { clubsTable, userClubsTable, gamesTable, gameShotsTable } from './schema';

// ============ CLUBS ============

export async function getAllClubs() {
  return await db.select().from(clubsTable).orderBy(clubsTable.defaultDistance);
}

export async function getClubById(id: number) {
  const result = await db.select().from(clubsTable).where(eq(clubsTable.id, id));
  return result[0] || null;
}

// ============ USER CLUBS ============

export async function getUserClubs() {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const result = await db
    .select({
      userClub: userClubsTable,
      club: clubsTable,
    })
    .from(userClubsTable)
    .innerJoin(clubsTable, eq(userClubsTable.clubId, clubsTable.id))
    .where(and(
      eq(userClubsTable.userId, userId),
      eq(userClubsTable.active, true)
    ))
    .orderBy(clubsTable.defaultDistance);

  return result.map(r => ({
    ...r.userClub,
    club: r.club,
  }));
}

export async function addUserClub(data: {
  clubId: number;
  customDistance?: number;
  customBrand?: string;
  customLoft?: number;
  shaftType?: string;
  shaftFlex?: string;
  gripType?: string;
  clubLength?: string;
  lieAngle?: string;
  condition?: string;
  purchaseYear?: number;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  // Get the default distance from the club if not provided
  let customDistance = data.customDistance;
  if (!customDistance) {
    const club = await getClubById(data.clubId);
    if (club) {
      customDistance = club.defaultDistance || 0;
    }
  }

  const result = await db.insert(userClubsTable).values({
    userId,
    clubId: data.clubId,
    customDistance,
    customBrand: data.customBrand,
    customLoft: data.customLoft,
    shaftType: data.shaftType,
    shaftFlex: data.shaftFlex,
    gripType: data.gripType,
    clubLength: data.clubLength,
    lieAngle: data.lieAngle,
    condition: data.condition,
    purchaseYear: data.purchaseYear,
    notes: data.notes,
    active: true,
  }).returning();

  revalidatePath('/my-clubs');
  return result[0];
}

export async function updateUserClub(
  id: number,
  data: {
    customDistance?: number;
    customBrand?: string;
    customLoft?: number;
    shaftType?: string;
    shaftFlex?: string;
    gripType?: string;
    clubLength?: string;
    lieAngle?: string;
    condition?: string;
    purchaseYear?: number;
    notes?: string;
    active?: boolean;
  }
) {
  const result = await db
    .update(userClubsTable)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(userClubsTable.id, id))
    .returning();

  revalidatePath('/my-clubs');
  return result[0];
}

export async function deleteUserClub(id: number) {
  // Soft delete by setting active to false
  const result = await db
    .update(userClubsTable)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(userClubsTable.id, id))
    .returning();

  revalidatePath('/my-clubs');
  return result[0];
}

// ============ GAMES ============

export async function createGame(mode: string = 'simulate', courseId?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const result = await db.insert(gamesTable).values({
    userId,
    mode,
    courseId,
    status: 'in_progress',
    score: 0,
  }).returning();

  return result[0];
}

export async function updateGame(
  id: number,
  data: {
    status?: string;
    score?: number;
    completedAt?: Date;
  }
) {
  const result = await db
    .update(gamesTable)
    .set(data)
    .where(eq(gamesTable.id, id))
    .returning();

  return result[0];
}

export async function getGameById(id: number) {
  const result = await db.select().from(gamesTable).where(eq(gamesTable.id, id));
  return result[0] || null;
}

export async function getGameHistory() {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  return await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.userId, userId))
    .orderBy(gamesTable.startedAt);
}

export async function getInProgressGame() {
  const { userId } = await auth();
  if (!userId) return null;

  const result = await db
    .select()
    .from(gamesTable)
    .where(and(
      eq(gamesTable.userId, userId),
      eq(gamesTable.status, 'in_progress')
    ))
    .orderBy(gamesTable.startedAt)
    .limit(1);

  return result[0] || null;
}

export async function getInProgressGames() {
  const { userId } = await auth();
  if (!userId) return [];

  return await db
    .select()
    .from(gamesTable)
    .where(and(
      eq(gamesTable.userId, userId),
      eq(gamesTable.status, 'in_progress')
    ))
    .orderBy(gamesTable.startedAt);
}

export async function deleteGame(gameId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  // Verify the game belongs to the user before deleting
  const gameResult = await db
    .select()
    .from(gamesTable)
    .where(and(
      eq(gamesTable.id, gameId),
      eq(gamesTable.userId, userId)
    ));

  if (gameResult.length === 0) {
    throw new Error('Game not found or access denied');
  }

  // Delete the game - shots will cascade automatically
  await db.delete(gamesTable).where(eq(gamesTable.id, gameId));

  revalidatePath('/game-modes');
  return { success: true };
}

export async function getGameDetails(gameId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  // Get the game
  const gameResult = await db
    .select()
    .from(gamesTable)
    .where(and(
      eq(gamesTable.id, gameId),
      eq(gamesTable.userId, userId)
    ));

  if (gameResult.length === 0) return null;
  const game = gameResult[0];

  // Get all shots for this game with club details
  const shots = await db
    .select({
      shot: gameShotsTable,
      club: clubsTable,
    })
    .from(gameShotsTable)
    .leftJoin(clubsTable, eq(gameShotsTable.clubId, clubsTable.id))
    .where(eq(gameShotsTable.gameId, gameId))
    .orderBy(gameShotsTable.hole, gameShotsTable.shotNumber);

  return {
    ...game,
    shots: shots.map(s => ({
      ...s.shot,
      club: s.club,
    })),
  };
}

// ============ SHOTS ============

export async function recordShot(data: {
  gameId: number;
  hole: number;
  shotNumber: number;
  clubId?: number;
  intendedDistance?: number;
  actualDistance?: number;
  result?: string;
  notes?: string;
}) {
  const result = await db.insert(gameShotsTable).values(data).returning();
  return result[0];
}

export async function getShotsByGame(gameId: number) {
  return await db
    .select()
    .from(gameShotsTable)
    .where(eq(gameShotsTable.gameId, gameId))
    .orderBy(gameShotsTable.hole, gameShotsTable.shotNumber);
}

export async function getShotsByHole(gameId: number, hole: number) {
  return await db
    .select({
      shot: gameShotsTable,
      club: clubsTable,
    })
    .from(gameShotsTable)
    .leftJoin(clubsTable, eq(gameShotsTable.clubId, clubsTable.id))
    .where(and(
      eq(gameShotsTable.gameId, gameId),
      eq(gameShotsTable.hole, hole)
    ))
    .orderBy(gameShotsTable.shotNumber);
}

// ============ HELPER FUNCTIONS ============

export async function recommendClub(distance: number, userClubs: Array<{ customDistance: number | null; club: typeof clubsTable.$inferSelect }>) {
  // Filter out putters for non-green shots
  const validClubs = userClubs.filter(uc => 
    uc.club.category !== 'putter' && uc.customDistance && uc.customDistance > 0
  );

  if (validClubs.length === 0) return null;

  // Sort by distance descending
  const sorted = validClubs.sort((a, b) => (b.customDistance || 0) - (a.customDistance || 0));

  // Find club that hits closest to target without going too far over
  // Allow 10% buffer for rollout
  const recommended = sorted.find(uc => (uc.customDistance || 0) <= distance * 1.1);

  // If no club found within buffer, use the longest club
  return recommended || sorted[0];
}
