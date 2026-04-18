"use client";

import React, { useState, useEffect } from 'react';
import { getDailyPuzzle } from '../lib/gameLogic';

export default function ConnectionsGame() {
  const [gameData, setGameData] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [completedGroups, setCompletedGroups] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState(4);
  const [guesses, setGuesses] = useState<number[][]>([]);
  const [idToColorMap, setIdToColorMap] = useState<Record<number, number>>({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const data = getDailyPuzzle();
    setGameData(data);

    const mapping: Record<number, number> = {};
    data.groups.forEach((group: any, index: number) => {
      mapping[group.id] = index + 1;
    });
    setIdToColorMap(mapping);
  }, []);

  const isGameOver = mistakes === 0 || completedGroups.length === 4;

  useEffect(() => {
    if (isGameOver) {
      const timer = setTimeout(() => setShowModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isGameOver]);

  if (!gameData) {
    return (
        <div className="loading-container">
          <div className="loading-text">Loading Skyblock Puzzle...</div>
        </div>
    );
  }

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

    const currentGuessColors = selected.map(word => {
      const tile = gameData.tiles.find((t: any) => t.word === word);
      return idToColorMap[tile.categoryId];
    });

    setGuesses(prev => [...prev, currentGuessColors]);

    const firstWordTile = gameData.tiles.find((t: any) => t.word === selected[0]);
    const isCorrect = selected.every(word => {
      const tile = gameData.tiles.find((t: any) => t.word === word);
      return tile.categoryId === firstWordTile.categoryId;
    });

    if (isCorrect) {
      const correctGroup = gameData.groups.find((g: any) => g.id === firstWordTile.categoryId);
      setCompletedGroups([...completedGroups, correctGroup]);
      setSelected([]);
    } else {
      setMistakes(prev => Math.max(0, prev - 1));
    }
  };

  return (
      <main className="main-wrapper">
        <h1 className="maintitle">Skyblock Connections</h1>

        <div className="mistakes-container">
          <span className="mistakes-label">Lives:</span>
          <div className="dots-row">
            {[...Array(4)].map((_, i) => (
                <div key={i} className={`mistake-dot ${i < mistakes ? 'filled' : 'empty'}`} />
            ))}
          </div>
        </div>

        <div className="game-container">
          <div className="completed-container">
            {completedGroups.map((group, idx) => (
                <div key={idx} className={`completed-row cat-${idToColorMap[group.id]}`}>
                  <span className="completed-title">{group.category}</span>
                  <span className="completed-members">{group.words.join(", ")}</span>
                </div>
            ))}
          </div>

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

        <div className="controls">
          {/* Če je igre konec, pokažemo samo gumb Results, sicer pa Shuffle/Deselect/Submit */}
          {!isGameOver ? (
              <>
                <button
                    onClick={() => {
                      const shuffled = [...gameData.tiles].sort(() => Math.random() - 0.5);
                      setGameData({ ...gameData, tiles: shuffled });
                    }}
                    className="btn-base btn-secondary"
                >
                  Shuffle
                </button>
                <button onClick={() => setSelected([])} className="btn-base btn-secondary">
                  Deselect all
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={selected.length !== 4}
                    className="btn-base btn-primary"
                >
                  Submit
                </button>
              </>
          ) : (
              <button
                  onClick={() => setShowModal(true)}
                  className="btn-base btn-primary"
              >
                View Results
              </button>
          )}
        </div>

        <div className="status-message-container">
          {mistakes === 0 && <div className="game-over-text">Game Over!</div>}
          {remainingTiles.length === 0 && completedGroups.length === 4 && (
              <div className="win-text">Perfect!</div>
          )}
        </div>

        {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Results</h2>
                <div className="emoji-grid">
                  {guesses.map((guess, i) => (
                      <div key={i} className="emoji-row">
                        {guess.map((id, j) => {
                          const map: Record<number, string> = { 1: "🟨", 2: "🟩", 3: "🟦", 4: "🟪" };
                          return <span key={j}>{map[id] || "⬛"}</span>;
                        })}
                      </div>
                  ))}
                </div>

                <button
                    onClick={() => {
                      const grid = guesses.map(g => g.map(id => ({ 1: "🟨", 2: "🟩", 3: "🟦", 4: "🟪" }[id as 1 | 2 | 3 | 4])).join("")).join("\n");
                      navigator.clipboard.writeText(`Skyblock Connections\nPuzzle #${gameData.day || 1}\n${grid}`);
                    }}
                    className="btn-base btn-primary share-btn"
                >
                  Share Result
                </button>
                <button onClick={() => setShowModal(false)} className="close-modal-text">
                  Close
                </button>
              </div>
            </div>
        )}
      </main>
  );
}