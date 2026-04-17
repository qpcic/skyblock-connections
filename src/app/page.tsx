"use client";
import React, { useState, useEffect } from 'react';
import { getDailyPuzzle } from '../lib/gameLogic';

export default function ConnectionsGame() {
  const [gameData, setGameData] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [completedGroups, setCompletedGroups] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState(4);

  useEffect(() => {
    setGameData(getDailyPuzzle());
  }, []);

  if (!gameData) return <div className="p-8 text-center text-zinc-500">Loading Skyblock Puzzle...</div>;

  const handleTileClick = (word: string) => {
    // Če je igra že končana (mistakes = 0), ne dovoli klikanja
    if (mistakes === 0) return;

    if (selected.includes(word)) {
      setSelected(selected.filter(w => w !== word));
    } else if (selected.length < 4) {
      setSelected([...selected, word]);
    }
  };

  const handleSubmit = () => {
    if (selected.length !== 4) return;

    const firstWordTile = gameData.tiles.find((t: any) => t.word === selected[0]);
    const isCorrect = selected.every(word => {
      const tile = gameData.tiles.find((t: any) => t.word === word);
      return tile.categoryId === firstWordTile.categoryId;
    });

    if (isCorrect) {
      const group = gameData.groups.find((g: any) => g.id === firstWordTile.categoryId);
      setCompletedGroups([...completedGroups, group]);
      setSelected([]);
    } else {
      setMistakes(prev => Math.max(0, prev - 1));
      // Opcijsko: tukaj lahko dodaš kodo za tresenje ploščic ob napaki
    }
  };

  // Filtriramo ploščice, ki še niso bile uganjene
  const remainingTiles = gameData.tiles.filter(
    (tile: any) => !completedGroups.some(group => group.words.includes(tile.word))
  );

  return (
    <main className="flex flex-col items-center p-6 min-h-screen bg-[#121212]">
      <h1 className="text-2xl md:text-4xl font-bold mb-8 uppercase tracking-tighter text-white">
        Skyblock Connections
      </h1>

      {/* Življenja - Mistake dots */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm uppercase text-zinc-400">Mistakes:</span>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full transition-colors ${i < mistakes ? 'bg-zinc-100' : 'bg-zinc-800'}`} 
            />
          ))}
        </div>
      </div>

      {/* GLAVNI KONTREJNER ZA IGRO */}
      <div className="w-full max-w-[500px] mb-10">
        
        {/* 1. UGANJENE SKUPINE (Skočijo na vrh in zavzamejo polno širino) */}
        <div className="flex flex-col gap-2 mb-2">
          {completedGroups.map((group, idx) => (
            <div 
              key={idx} 
              // Razred category-X določi barvo iz globals.css
              className={`w-full py-6 flex flex-col items-center justify-center rounded-md animate-in fade-in zoom-in duration-500 category-${group.id || idx + 1}`}
            >
              {/* IME KATEGORIJE - Odebeljeno (font-bold) */}
              <span className="text-xs font-bold uppercase opacity-90 mb-2 tracking-widest">
                {group.category}
              </span>
              {/* BESEDE V SKUPINI */}
              <span className="text-sm md:text-base font-normal uppercase tracking-wide text-center px-4">
                {group.words.join(", ")}
              </span>
            </div>
          ))}
        </div>

        {/* 2. PREOSTALE PLOŠČICE (Mreža 4x4) */}
        <div className="grid grid-cols-4 gap-2">
          {remainingTiles.map((tile: any) => (
            <button
              key={tile.word}
              onClick={() => handleTileClick(tile.word)}
              className={`aspect-[4/3] flex items-center justify-center p-2 text-[10px] md:text-xs font-bold rounded-md transition-all active:scale-95
                ${selected.includes(tile.word) 
                  ? 'bg-zinc-500 text-white' 
                  : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'}
              `}
            >
              <span className="text-center break-words">{tile.word}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KONTROLNI GUMBI */}
      <div className="flex gap-3">
        <button 
          onClick={() => setSelected([])}
          className="px-6 py-3 border border-zinc-700 rounded-full text-sm font-bold hover:bg-zinc-900 transition-colors text-white"
        >
          Deselect all
        </button>
        <button 
          onClick={handleSubmit}
          disabled={selected.length !== 4 || mistakes === 0}
          className={`px-8 py-3 rounded-full text-sm font-bold border transition-all
            ${selected.length === 4 
              ? 'bg-white text-black border-white' 
              : 'bg-transparent text-zinc-600 border-zinc-800 cursor-not-allowed'}
          `}
        >
          Submit
        </button>
      </div>

      {/* GAME OVER STATUS */}
      {mistakes === 0 && (
        <div className="mt-8 text-red-500 font-bold animate-bounce uppercase text-center">
          Game Over!<br/>Try again tomorrow.
        </div>
      )}

      {/* VICTORY STATUS */}
      {remainingTiles.length === 0 && (
        <div className="mt-8 text-green-500 font-bold animate-pulse uppercase text-center">
          Perfect!<br/>See you tomorrow.
        </div>
      )}
    </main>
  );
}