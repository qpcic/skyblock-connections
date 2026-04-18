"use client";

import React, { useState, useEffect } from 'react';
import { getDailyPuzzle } from '../lib/gameLogic';


export default function ConnectionsGame() {
  const [gameData, setGameData] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [completedGroups, setCompletedGroups] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState(4);

  // Inicializacija igre ob prvem nalaganju
  useEffect(() => {
    const data = getDailyPuzzle();
    setGameData(data);
  }, []);

  if (!gameData) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl animate-pulse font-bold uppercase tracking-widest">
            Loading Skyblock Puzzle...
          </div>
        </div>
    );
  }

  // Filtriramo ploščice, ki še niso del uganjenih skupin
  const remainingTiles = gameData.tiles.filter(
      (tile: any) => !completedGroups.some(group => group.words.includes(tile.word))
  );

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

    // Najdemo categoryId prve izbrane besede
    const firstWordTile = gameData.tiles.find((t: any) => t.word === selected[0]);

    // Preverimo, če imajo vse izbrane besede isti categoryId
    const isCorrect = selected.every(word => {
      const tile = gameData.tiles.find((t: any) => t.word === word);
      return tile.categoryId === firstWordTile.categoryId;
    });

    if (isCorrect) {
      // Poiščemo celoten objekt skupine (vključno s colorClass)
      const correctGroup = gameData.groups.find((g: any) => g.id === firstWordTile.categoryId);
      setCompletedGroups([...completedGroups, correctGroup]);
      setSelected([]);
    } else {
      setMistakes(prev => Math.max(0, prev - 1));
      // Opcijsko: tukaj lahko dodaš vizualni "shake" efekt
    }
  };

  return (
      <main className="flex flex-col items-center p-6 min-h-screen bg-white">
        <h1 className="text-3xl font-bold mb-8 uppercase tracking-tighter maintitle">
          Skyblock Connections
        </h1>

          {/* Življenja - Mistake dots */}
          <div className="mistakes-container">
              <span className="mistakes-label">Lives:</span>
              <div className="dots-row">
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
                    /* Tukaj uporabimo dinamičen colorClass, ki ga določi gameLogic */
                    className={`completed-row ${group.colorClass}`}
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
          <div className="status-message-container">
              {mistakes === 0 && (
                  <div className="game-over-text">
                      Game Over!<br/>Try again tomorrow.
                  </div>
              )}
              {remainingTiles.length === 0 && completedGroups.length === 4 && (
                  <div className="win-text">
                      Perfect!<br/>See you tomorrow.
                  </div>
              )}
          </div>
      </main>
  );
}