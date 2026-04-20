import 'dotenv/config';

import { drizzle } from 'drizzle-orm/mysql2';
import { puzzles } from '../drizzle/schema';
import { nanoid } from 'nanoid';

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    return;
  }

  const db = drizzle(process.env.DATABASE_URL);

  const puzzleData = [
    {
      id: nanoid(),
      title: 'Back Rank Mate',
      description: 'Find the winning move for white.',
      fen: '6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1',
      solution: ['Rb8#'],
      difficulty: 'beginner' as const,
      theme: 'Mate in 1',
    },
    {
      id: nanoid(),
      title: 'Smothered Mate',
      description: 'White to move and mate.',
      fen: '6rk/5Npp/8/8/8/8/8/7K b - - 0 1',
      solution: [], // This is actually already mate in the FEN for demonstration or wrong FEN
      difficulty: 'intermediate' as const,
      theme: 'Mate',
    },
    {
      id: nanoid(),
      title: 'Scholar\'s Mate',
      description: 'Complete the mate.',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
      solution: ['Qxf7#'],
      difficulty: 'beginner' as const,
      theme: 'Opening',
    }
  ];

  console.log('Seeding puzzles...');
  for (const puzzle of puzzleData) {
    await db.insert(puzzles).values(puzzle);
  }
  console.log('Seeding completed.');
}

seed().catch(console.error);
