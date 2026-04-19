import puzzles from '../data/puzzles.json';

/**
 * Glavna funkcija za generiranje igre.
 * Ustvari naključen nabor 4 skupin in premeša ploščice.
 */
export const getDailyPuzzle = () => {
  // --- KONFIGURACIJA ---
  // Nastavi na 'true' za fiksni dnevni puzzle, 'false' za nov puzzle ob vsakem reloadu.
  const isDaily = true;
  // ---------------------

  const datePart = new Date().toISOString().split('T')[0];
  const seed = isDaily ? datePart : `${datePart}-${Math.random()}`;

  /**
   * Seeded generator naključnih števil (PRNG).
   * Zagotavlja, da je naključnost dosledna glede na podani seed.
   */
  const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    let currentHash = hash;
    return () => {
      currentHash = Math.sin(currentHash++) * 10000;
      return currentHash - Math.floor(currentHash);
    };
  };

  const rng = seededRandom(seed);

  /**
   * Fisher-Yates shuffle algoritem.
   * Uporablja naš rng() za mešanje elementov v polju.
   */
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 1. Priprava barv
  // Uporabljamo tvoje HEX kode iz CSS-a, zapakirane v Tailwind razrede.
  const baseColors = [
    "bg-[#f9df6d] text-black", // Rumena (cat-1)
    "bg-[#a0c35a] text-white", // Zelena (cat-2)
    "bg-[#b0c4ef] text-black", // Modra (cat-3)
    "bg-[#ba81c5] text-white"  // Vijolična (cat-4)
  ];

  // Premešamo vrstni red barv, da je vsak seed vizualno drugačen
  const shuffledColors = shuffleArray(baseColors);

  // 2. Izbira skupin
  const shuffledPuzzles = shuffleArray(puzzles);
  const selectedGroups: any[] = [];
  const usedWords = new Set<string>();

  for (const group of shuffledPuzzles) {
    if (selectedGroups.length === 4) break;

    // Preverimo, če se katera beseda v tej skupini že pojavlja v izbranih
    const hasDuplicate = group.words.some((word: string) =>
        usedWords.has(word.toUpperCase().trim())
    );

    if (!hasDuplicate) {
      // Skupini dodelimo barvo iz našega premešanega seznama barv
      selectedGroups.push({
        ...group,
        colorClass: shuffledColors[selectedGroups.length]
      });

      // Dodamo besede v set uporabljenih besed
      group.words.forEach((word: string) =>
          usedWords.add(word.toUpperCase().trim())
      );
    }
  }

  // Fallback: če v JSONu ni dovolj unikatnih besed, vzamemo prve 4
  const finalGroups = selectedGroups.length === 4 ? selectedGroups : puzzles.slice(0, 4).map((g, i) => ({
    ...g,
    colorClass: shuffledColors[i]
  }));

  // 3. Priprava ploščic (vseh 16 besed)
  // Ploščice vsebujejo besedo in categoryId za preverjanje pravilnosti.
  const allTiles = shuffleArray(
      finalGroups.flatMap(g =>
          g.words.map((w: string) => ({
            word: w,
            categoryId: g.id
          }))
      )
  );

  return {
    groups: finalGroups,
    tiles: allTiles,
    seed: seed
  };
};