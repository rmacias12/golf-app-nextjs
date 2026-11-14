import 'dotenv/config';
import { db } from './index';
import { clubsTable } from './schema';

const defaultClubs = [
  {
    name: 'Driver',
    type: 'wood',
    brand: null,
    category: 'driver' as const,
    defaultDistance: 250,
    loft: 10,
  },
  {
    name: '3 Wood',
    type: 'wood',
    brand: null,
    category: 'fairway_wood' as const,
    defaultDistance: 220,
    loft: 15,
  },
  {
    name: '5 Wood',
    type: 'wood',
    brand: null,
    category: 'fairway_wood' as const,
    defaultDistance: 200,
    loft: 18,
  },
  {
    name: '3 Hybrid',
    type: 'hybrid',
    brand: null,
    category: 'hybrid' as const,
    defaultDistance: 190,
    loft: 21,
  },
  {
    name: '4 Iron',
    type: 'iron',
    brand: null,
    category: 'long_iron' as const,
    defaultDistance: 180,
    loft: 24,
  },
  {
    name: '5 Iron',
    type: 'iron',
    brand: null,
    category: 'mid_iron' as const,
    defaultDistance: 170,
    loft: 27,
  },
  {
    name: '6 Iron',
    type: 'iron',
    brand: null,
    category: 'mid_iron' as const,
    defaultDistance: 160,
    loft: 30,
  },
  {
    name: '7 Iron',
    type: 'iron',
    brand: null,
    category: 'short_iron' as const,
    defaultDistance: 150,
    loft: 34,
  },
  {
    name: '8 Iron',
    type: 'iron',
    brand: null,
    category: 'short_iron' as const,
    defaultDistance: 140,
    loft: 38,
  },
  {
    name: '9 Iron',
    type: 'iron',
    brand: null,
    category: 'short_iron' as const,
    defaultDistance: 130,
    loft: 42,
  },
  {
    name: 'Pitching Wedge',
    type: 'wedge',
    brand: null,
    category: 'wedge' as const,
    defaultDistance: 110,
    loft: 46,
  },
  {
    name: 'Sand Wedge',
    type: 'wedge',
    brand: null,
    category: 'wedge' as const,
    defaultDistance: 80,
    loft: 56,
  },
  {
    name: 'Gap Wedge (52°)',
    type: 'wedge',
    brand: null,
    category: 'wedge' as const,
    defaultDistance: 100,
    loft: 52,
  },
  {
    name: 'A Wedge (Approach)',
    type: 'wedge',
    brand: 'Callaway',
    category: 'wedge' as const,
    defaultDistance: 90,
    loft: 50,
  },
  {
    name: 'Lob Wedge (60°)',
    type: 'wedge',
    brand: null,
    category: 'wedge' as const,
    defaultDistance: 60,
    loft: 60,
  },
  {
    name: 'Putter',
    type: 'putter',
    brand: null,
    category: 'putter' as const,
    defaultDistance: 0,
    loft: 3,
  },
];

async function seed() {
  console.log('Seeding default golf clubs...');

  try {
    // Get existing clubs to check which ones we need to add
    const existingClubs = await db.select().from(clubsTable);
    const existingNames = new Set(existingClubs.map(c => c.name));
    
    let added = 0;
    let skipped = 0;

    // Insert only clubs that don't already exist
    for (const club of defaultClubs) {
      if (existingNames.has(club.name)) {
        console.log(`Skipping (exists): ${club.name}`);
        skipped++;
      } else {
        await db.insert(clubsTable).values(club);
        console.log(`Added: ${club.name}`);
        added++;
      }
    }

    console.log(`\n${added} clubs added, ${skipped} already existed.`);
    console.log(`Total clubs in database: ${existingClubs.length + added}`);
  } catch (error) {
    console.error('Error seeding clubs:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
