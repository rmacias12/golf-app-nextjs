import { integer, pgTable, varchar, boolean, timestamp, serial, pgEnum } from "drizzle-orm/pg-core";

// Enum for club categories
export const clubCategoryEnum = pgEnum("club_category", [
  "driver",
  "fairway_wood",
  "hybrid",
  "long_iron",
  "mid_iron",
  "short_iron",
  "wedge",
  "putter"
]);

// Master list of golf clubs with default specifications
export const clubsTable = pgTable("clubs", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 100 }).notNull(), // wood, iron, wedge, putter
  brand: varchar({ length: 255 }),
  category: clubCategoryEnum().notNull(),
  defaultDistance: integer(), // typical yardage for this club type
  loft: integer(), // loft angle in degrees (optional)
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// User's personal club bag with custom distances and specs
export const userClubsTable = pgTable("user_clubs", {
  id: serial().primaryKey(),
  userId: varchar({ length: 255 }).notNull(),
  clubId: integer().notNull().references(() => clubsTable.id, { onDelete: "cascade" }),
  customDistance: integer(), // user's actual distance with this club
  // Fitting customization fields
  customBrand: varchar({ length: 255 }), // override brand (e.g., user has a different brand than default)
  customLoft: integer(), // adjusted loft in degrees (e.g., +1 or -1 from standard)
  shaftType: varchar({ length: 50 }), // "Steel", "Graphite", "Multi-Material"
  shaftFlex: varchar({ length: 50 }), // "X-Stiff", "Stiff", "Regular", "Senior", "Ladies"
  gripType: varchar({ length: 50 }), // "Standard", "Midsize", "Jumbo", "Oversize"
  clubLength: varchar({ length: 20 }), // "+0.5", "-0.25", "Standard"
  lieAngle: varchar({ length: 20 }), // "+2°", "-1°", "Standard"
  condition: varchar({ length: 50 }), // "New", "Excellent", "Good", "Fair", "Worn"
  purchaseYear: integer(), // year purchased for tracking club age
  // General fields
  active: boolean().default(true).notNull(),
  notes: varchar({ length: 500 }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Game sessions for tracking simulated rounds
export const gamesTable = pgTable("games", {
  id: serial().primaryKey(),
  userId: varchar({ length: 255 }).notNull(),
  mode: varchar({ length: 100 }).notNull(), // random, simulate, etc.
  status: varchar({ length: 50 }).default("in_progress").notNull(), // in_progress, completed, abandoned
  courseId: varchar({ length: 100 }), // Store course ID for simulate mode
  startedAt: timestamp().defaultNow().notNull(),
  completedAt: timestamp(),
  score: integer(),
  notes: varchar({ length: 1000 }),
});

// Individual shots recorded during games
export const gameShotsTable = pgTable("game_shots", {
  id: serial().primaryKey(),
  gameId: integer().notNull().references(() => gamesTable.id, { onDelete: "cascade" }),
  hole: integer().notNull(),
  shotNumber: integer().notNull(),
  clubId: integer().references(() => clubsTable.id),
  intendedDistance: integer(),
  actualDistance: integer(),
  result: varchar({ length: 255 }), // fairway, green, rough, sand, etc.
  notes: varchar({ length: 500 }),
  createdAt: timestamp().defaultNow().notNull(),
});
