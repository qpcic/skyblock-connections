import puzzles from '../data/puzzles.json';

export const getDailyPuzzle = () => {
  // 1. Ustvarimo "seed" na podlagi današnjega datuma (vsi igralci bodo imeli isto igro)
  const today = new Date().toISOString().split('T')[0];
  
  const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return () => {
      hash = Math.sin(hash) * 10000;
      return hash - Math.floor(hash);
    };
  };

  const rng = seededRandom(today);

  // 2. Izberemo 4 naključne skupine iz JSON-a
  // Opomba: Če imaš v JSON-u malo skupin, jih bo mogoče težko dobiti 4 brez podvojitev
  const shuffledPuzzles = [...puzzles].sort(() => rng() - 0.5);
  
  const selectedGroups: any[] = [];
  const usedWords = new Set<string>();

  for (const group of shuffledPuzzles) {
    if (selectedGroups.length === 4) break;

    // Preverimo, če se besede podvajajo
    const hasDuplicate = group.words.some(word => usedWords.has(word));

    if (!hasDuplicate) {
      selectedGroups.push(group);
      group.words.forEach(word => usedWords.add(word));
    }
  }

  // 3. Če nam ne uspe najti 4 skupin, vzamemo prve štiri (fallback)
  const finalGroups = selectedGroups.length === 4 ? selectedGroups : puzzles.slice(0, 4);

  // 4. Pripravimo ploščice (vseh 16 besed) in jih premešamo
  const allTiles = finalGroups
    .flatMap(g => g.words.map(w => ({ word: w, categoryId: g.id })))
    .sort(() => rng() - 0.5);

  return {
    groups: finalGroups,
    tiles: allTiles
  };
};