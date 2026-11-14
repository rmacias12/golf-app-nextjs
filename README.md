# Golf Club Selector - Next.js

A web-based golf companion app built with Next.js, TypeScript, Drizzle ORM, and Neon PostgreSQL. Features a digital caddie for tracking real golf rounds and managing your custom club bag.

## Screenshots

| My Clubs | Simulate Round | Round Complete |
| --- | --- | --- |
| ![My Clubs bag with custom distances](screenshots/my-clubs.png) | ![Simulated round with club recommendation](screenshots/simulate-round.png) | ![Round complete scorecard](screenshots/round-complete.png) |

| Random Generator | Mobile |
| --- | --- |
| ![Random club generator result](screenshots/random-generator.png) | ![Simulated round on mobile](screenshots/simulate-round-mobile.png) |

## Features

- **My Clubs** - Manage your personal golf bag with custom distances
  - Add clubs from the master database
  - Set custom distances for each club
  - Edit or remove clubs from your bag
  
- **Random Generator** - Pick a random club from your bag (great for practice)
  - Uses your actual clubs and distances
  - Animated dice roll effect

- **Simulate Game** - Play a real 9-hole round with the app as your caddie
  - Recommends clubs based on remaining distance to green
  - Enter your actual yardages after each shot
  - Tracks score, putts, and Greens in Regulation
  - Saves game history to database

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Drizzle ORM** - Type-safe database queries
- **Neon PostgreSQL** - Serverless Postgres database
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Neon PostgreSQL database (free tier available at [neon.tech](https://neon.tech))
- A [Clerk](https://clerk.com) application for authentication (free tier available)

### Installation

```bash
cd golf-app-nextjs
npm install
```

### Database Setup

1. Create a `.env` file in the root (it is gitignored — never commit real keys):
```
DATABASE_URL=postgresql://user:***@host.neon.tech/dbname?sslmode=require
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=***
CLERK_SECRET_KEY=***
```
Both Clerk keys come from your Clerk application's API Keys page.

2. Push the database schema:
```bash
npm run db:push
```

3. Seed the default golf clubs:
```bash
npx tsx app/db/seed.ts
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Database Scripts

- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Apply migrations
- `npm run db:studio` - Open Drizzle Studio (visual database browser)

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
golf-app-nextjs/
├── app/                      # Next.js App Router
│   ├── db/                   # Database layer
│   │   ├── schema.ts         # Table definitions
│   │   ├── index.ts          # Database connection
│   │   ├── actions.ts        # Server actions (CRUD)
│   │   └── seed.ts           # Seed script for clubs
│   ├── game-modes/
│   │   ├── random/          # Random Generator page
│   │   └── simulate/        # Simulate Game page
│   ├── my-clubs/            # Club management page
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   └── ui/                   # shadcn/ui components
│       ├── alert-dialog.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── select.tsx
│       └── sonner.tsx
├── lib/
│   └── utils.ts             # Utility functions (cn)
├── drizzle.config.ts        # Drizzle Kit configuration
├── .env                     # Environment variables (gitignored — create your own)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## Navigation Flow

```
Home (/)
├── Game Modes (/game-modes)
│   ├── Random Generator (/game-modes/random)
│   └── Simulate Game (/game-modes/simulate)
└── My Clubs (/my-clubs)
```

## Database Schema

### Tables

- **clubs** - Master list of golf clubs (name, type, category, default distance, loft)
- **userClubs** - User's personal bag with custom distances
- **games** - Game sessions (user, mode, status, score, dates)
- **gameShots** - Individual shots (hole, club, distances, result)

### Club Categories

- driver
- fairway_wood
- hybrid
- long_iron
- mid_iron
- short_iron
- wedge
- putter

## Simulate Mode Flow

1. **Start Game** - Creates game record, loads user's clubs
2. **Tee Shot** - Recommends club based on hole distance
3. **Enter Shot** - User enters actual yardage after hitting
4. **Next Club** - App recalculates remaining distance, recommends next club
5. **On Green** - When within 10 yards, prompts for putts
6. **Hole Complete** - Shows score, saves shots to database
7. **Game Complete** - Final score, stats, hole-by-hole breakdown

## Notes

- All game data is persisted to the Neon PostgreSQL database
- Club recommendations use your custom distances from your bag
- Use Drizzle Studio (`npm run db:studio`) to browse/edit data during development
- Clerk authentication is integrated - each user has their own club bag and game history

## License

MIT — see [LICENSE](LICENSE).
