import puzzles from '../data/puzzles.json';
import shuffleMap from '../data/shuffle.json';

/**
 * Grabs the daily puzzle based on a hardcoded shuffle map.
 */
export const getDailyPuzzle = (boardNumber: number) => {
  const totalCategories = puzzles.length-1;
  const seed = `skyblock-board-${boardNumber}`;

  // 1. SELECT CATEGORIES
  const startPos = (boardNumber - 1) * 4;
  const selectedGroups: any[] = [];
  const usedWordsInBoard = new Set<string>();

  for (let i = 0; i < 4; i++) {
    let lookAhead = 0;
    let foundValid = false;

    while (!foundValid) {
      const mapIndex = (startPos + i + lookAhead) % shuffleMap.length;
      const puzzleIndex = shuffleMap[mapIndex];
      const category = (puzzles as any[])[puzzleIndex];

      // --- DIAGNOSTIC LOGGING ---
      console.log(`[Board ${boardNumber}] Slot ${i}: checking mapIndex ${mapIndex} -> puzzleIndex ${puzzleIndex}`);
      
      // Safety Guard: Check if category exists before checking words
      if (!category) {
        console.warn(`⚠️ Missing category at puzzles[${puzzleIndex}]. Skipping...`);
        lookAhead++;
        continue; // Try the next lookAhead index
      }

      // Standard duplicate word check
      const hasDuplicate = category.words.some((word: string) =>
          usedWordsInBoard.has(word.toUpperCase().trim())
      );

      if (!hasDuplicate) {
        selectedGroups.push(category);
        console.warn(`Selected category: "${category.category}"`);
        category.words.forEach((w: string) => usedWordsInBoard.add(w.toUpperCase().trim()));
        foundValid = true;
      } else {
        console.log(`🔄 Duplicate found in category "${category.category}". Skipping...`);
        lookAhead++; 
      }
    }
  }

  // --- Seeded RNG for UI Layout ---
  const seededRandom = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    let currentHash = hash;
    return () => {
      currentHash = Math.sin(currentHash++) * 10000;
      return currentHash - Math.floor(currentHash);
    };
  };

  const rng = seededRandom(seed);
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const baseColors = [
    "bg-[#f9df6d] text-black", "bg-[#a0c35a] text-white",
    "bg-[#b0c4ef] text-black", "bg-[#ba81c5] text-white"
  ];
  const shuffledColors = shuffleArray(baseColors);

  const finalGroups = selectedGroups.map((group, index) => ({
    ...group,
    colorClass: shuffledColors[index]
  }));

  const allTiles = shuffleArray(
      finalGroups.flatMap(g => g.words.map((w: string) => ({ word: w, categoryId: g.id })))
  );

  return { groups: finalGroups, tiles: allTiles, boardNumber };
};