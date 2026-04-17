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

  if (!gameData) return <div className="p-8 text-center">Loading Skyblock Puzzle...</div>;

  const handleTileClick = (word: string) => {
    if (mistakes === 0 || remainingTiles.length === 0) return;

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
    }
  };

  const remainingTiles = gameData.tiles.filter(
      (tile: any) => !completedGroups.some(group => group.words.includes(tile.word))
  );

  return (
      <main className="flex flex-col items-center p-6 min-h-screen bg-white">
        <h1 className="text-3xl font-bold mb-8 uppercase tracking-tighter">
          Skyblock Connections
        </h1>

        {/* Življenja - Mistake dots */}
        <div className="mistakes-container">
          <span className="text-xs uppercase opacity-60">Mistakes:</span>
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className={`mistake-dot ${i < mistakes ? 'filled' : 'empty'}`}
                />
            ))}
          </div>
        </div>

        <div className="game-container">
          {/* 1. UGANJENE SKUPINE */}
          <div className="flex flex-col">
            {completedGroups.map((group, idx) => (
                <div
                    key={idx}
                    className={`completed-row cat-${group.id || idx + 1}`}
                >
                  <span className="completed-title">{group.category}</span>
                  <span className="completed-members">{group.words.join(", ")}</span>
                </div>
            ))}
          </div>

          {/* 2. PREOSTALE PLOŠČICE */}
          <div className="tiles-grid">
            {remainingTiles.map((tile: any) => (
                <button
                    key={tile.word}
                    onClick={() => handleTileClick(tile.word)}
                    className={`tile-button ${selected.includes(tile.word) ? 'selected' : ''}`}
                >
                  {tile.word}
                </button>
            ))}
          </div>
        </div>

        {/* KONTROLNI GUMBI */}
        <div className="controls">
          <button
              onClick={() => setSelected([])}
              className="btn-base btn-secondary"
          >
            Deselect all
          </button>
          <button
              onClick={handleSubmit}
              disabled={selected.length !== 4 || mistakes === 0}
              className="btn-base btn-primary"
          >
            Submit
          </button>
        </div>

        {/* STATUS SPOROČILA */}
        <div className="mt-8 text-center uppercase font-bold">
          {mistakes === 0 && (
              <div className="text-red-500 animate-bounce">
                Game Over!<br/>Try again tomorrow.
              </div>
          )}
          {remainingTiles.length === 0 && completedGroups.length > 0 && (
              <div className="text-green-600 animate-pulse">
                Perfect!<br/>See you tomorrow.
              </div>
          )}
        </div>
      </main>
  );
}