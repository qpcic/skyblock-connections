"use client";

import React, { useState, useEffect } from 'react';
import { getDailyPuzzle } from '../lib/gameLogic';
import { sendToDiscord } from './submit/actions';
import puzzles from '../data/puzzles.json';

// --- CONFIGURATION ---
const DEV_MODE = false; // Set to true to see Dev buttons and skip days on F5
// ---------------------

export default function ConnectionsGame() {
  const [gameData, setGameData] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [completedGroups, setCompletedGroups] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState(4);
  const [guesses, setGuesses] = useState<number[][]>([]);
  const [idToColorMap, setIdToColorMap] = useState<Record<number, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // --- Board Number Calculation ---
  const startDate = new Date('2026-04-19T00:00:00');
  const today = new Date();
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const realBoardNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const [activeBoardNumber, setActiveBoardNumber] = useState(realBoardNumber);

  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // --- DEV UTILITY: Generate static shuffle file ---
  // --- Inside ConnectionsGame component ---

// --- DEV UTILITY: Generate static shuffle and copy to clipboard ---
  const generateAndCopyShuffle = async () => {
    const count = puzzles.length;
    const newShuffle = Array.from({ length: count }, (_, i) => i);

    // Scramble the indices
    for (let i = newShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newShuffle[i], newShuffle[j]] = [newShuffle[j], newShuffle[i]];
    }

    const jsonString = JSON.stringify(newShuffle);

    try {
      await navigator.clipboard.writeText(jsonString);
      alert("Shuffle JSON copied to clipboard! Paste it into your shuffle.json file.");
    } catch (err) {
      console.error("Failed to copy!", err);
      alert("Failed to copy to clipboard. Check console.");
    }
  };

// --- In your Footer (inside the DEV_MODE block) ---
  <button
      onClick={generateAndCopyShuffle}
      style={{
        color: '#4dff88',
        fontSize: '0.75rem',
        background: 'none',
        border: '1px solid #4dff88',
        padding: '2px 8px',
        cursor: 'pointer',
        borderRadius: '4px'
      }}
  >
    Copy Shuffle.json
  </button>

  // 1. Initial Puzzle Load
  useEffect(() => {
    let currentBoard = realBoardNumber;

    if (DEV_MODE) {
      const devOffsetKey = 'skyblock-dev-offset';
      const savedOffset = parseInt(localStorage.getItem(devOffsetKey) || "0");
      const newOffset = savedOffset + 1;
      localStorage.setItem(devOffsetKey, newOffset.toString());
      currentBoard = realBoardNumber + savedOffset;
      setActiveBoardNumber(currentBoard);
    }

    // Now logic handles the shuffle internally via shuffle.json
    const data = getDailyPuzzle(currentBoard);
    setGameData(data);

    const mapping: Record<number, number> = {};
    data.groups.forEach((group: any, index: number) => {
      mapping[group.id] = index + 1;
    });
    setIdToColorMap(mapping);

    const saved = localStorage.getItem(`skyblock-progress-${currentBoard}`);
    if (saved) {
      const { savedSelected, savedCompleted, savedMistakes, savedGuesses } = JSON.parse(saved);
      if (savedSelected) setSelected(savedSelected);
      if (savedCompleted) setCompletedGroups(savedCompleted);
      if (savedMistakes !== undefined) setMistakes(savedMistakes);
      if (savedGuesses) setGuesses(savedGuesses);
    }
    setIsLoaded(true);
  }, [realBoardNumber]);

  // 2. Save Progress
  useEffect(() => {
    if (isLoaded) {
      const progress = {
        savedSelected: selected,
        savedCompleted: completedGroups,
        savedMistakes: mistakes,
        savedGuesses: guesses,
      };
      localStorage.setItem(`skyblock-progress-${activeBoardNumber}`, JSON.stringify(progress));
    }
  }, [selected, completedGroups, mistakes, guesses, activeBoardNumber, isLoaded]);

  const isGameOver = mistakes === 0 || completedGroups.length === 4;

  useEffect(() => {
    if (isGameOver && isLoaded) {
      const timer = setTimeout(() => setShowModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isGameOver, isLoaded]);

  if (!gameData || !isLoaded) {
    return <div className="loading-container"><div className="loading-text">Loading...</div></div>;
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

  const onSubmitSuggestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      category: formData.get("category") as string,
      words: [formData.get("w1") as string, formData.get("w2") as string, formData.get("w3") as string, formData.get("w4") as string],
      author: formData.get("author") as string,
    };
    const res = await sendToDiscord(data);
    setIsSending(false);
    if (res.success) {
      setShowSuggestModal(false);
      alert("Sent!");
    }
  };

  return (
      <main className="main-wrapper">
        <h1 className="maintitle">Skyblock Connections</h1>

        <div style={{textAlign: 'center', marginBottom: '20px', fontSize: '1.1rem', fontWeight: '500', opacity: 0.9}}>
          {formattedDate} | Board #{activeBoardNumber} {DEV_MODE && <span style={{color: '#ff4d4d'}}>(DEV)</span>}
        </div>

        <div className="mistakes-container">
          <span className="mistakes-label">Lives:</span>
          <div className="dots-row">
            {[...Array(4)].map((_, i) => (
                <div key={i} className={`mistake-dot ${i < mistakes ? 'filled' : 'empty'}`}/>
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
          <button onClick={() => setShowSuggestModal(true)} className="btn-base btn-secondary">Suggest</button>
          {!isGameOver ? (
              <>
                <button
                    onClick={() => {
                      const shuffled = [...gameData.tiles].sort(() => Math.random() - 0.5);
                      setGameData({...gameData, tiles: shuffled});
                    }}
                    className="btn-base btn-secondary"
                >Shuffle</button>
                <button onClick={() => setSelected([])} className="btn-base btn-secondary">Deselect</button>
                <button onClick={handleSubmit} disabled={selected.length !== 4} className="btn-base btn-primary">Submit</button>
              </>
          ) : (
              <button onClick={() => setShowModal(true)} className="btn-base btn-primary">View Results</button>
          )}
        </div>

        <div className="status-message-container">
          {mistakes === 0 && <div className="game-over-text">Game Over!</div>}
          {remainingTiles.length === 0 && completedGroups.length === 4 && <div className="win-text">Perfect!</div>}
        </div>

        {/* RESULTS MODAL */}
        {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Results</h2>
                <div className="emoji-grid">
                  {guesses.map((guess, i) => (
                      <div key={i} className="emoji-row">
                        {guess.map((id, j) => {
                          const map: Record<number, string> = {1: "🟨", 2: "🟩", 3: "🟦", 4: "🟪"};
                          return <span key={j}>{map[id] || "⬛"}</span>;
                        })}
                      </div>
                  ))}
                </div>
                <button
                    onClick={() => {
                      const grid = guesses.map(g => g.map(id => ({ 1: "🟨", 2: "🟩", 3: "🟦", 4: "🟪" }[id as 1|2|3|4])).join("")).join("\n");
                      navigator.clipboard.writeText(`Skyblock Connections\nPuzzle #${activeBoardNumber}\n${grid}\n\nPlay: https://skyblock-connections.com/`);
                    }}
                    className="btn-base btn-primary share-btn"
                >Share Result</button>
                <button onClick={() => setShowModal(false)} className="close-modal-text">Close</button>
              </div>
            </div>
        )}

        {/* SUGGESTION MODAL */}
        {showSuggestModal && (
            <div className="modal-overlay" onClick={() => setShowSuggestModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Suggest Words</h2>
                <form onSubmit={onSubmitSuggestion} style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px'}}>
                  <input name="category" placeholder="Category Name" required className="tile-button" style={{textAlign: 'left', padding: '10px'}}/>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                    <input name="w1" placeholder="Word 1" required className="tile-button" />
                    <input name="w2" placeholder="Word 2" required className="tile-button" />
                    <input name="w3" placeholder="Word 3" required className="tile-button" />
                    <input name="w4" placeholder="Word 4" required className="tile-button" />
                  </div>
                  <input name="author" placeholder="Your IGN (Optional)" className="tile-button" style={{textAlign: 'left', padding: '10px'}}/>
                  <button type="submit" disabled={isSending} className="btn-base btn-primary">
                    {isSending ? "Sending..." : "Submit Suggestion"}
                  </button>
                </form>
                <button onClick={() => setShowSuggestModal(false)} className="close-modal-text">Cancel</button>
              </div>
            </div>
        )}

        <footer className="footer-container" style={{marginTop: '40px'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap'}}>
            <span>© {new Date().getFullYear()} | qpcic</span>
            {DEV_MODE && (
                <>
                  <button
                      onClick={() => { localStorage.clear(); window.location.reload(); }}
                      style={{color: '#ff4d4d', fontSize: '0.75rem', background: 'none', border: '1px solid #ff4d4d', padding: '2px 8px', cursor: 'pointer', borderRadius: '4px'}}
                  >
                    Nuke Storage
                  </button>
                  <button
                      onClick={generateAndCopyShuffle}
                      style={{color: '#4dff88', fontSize: '0.75rem', background: 'none', border: '1px solid #4dff88', padding: '2px 8px', cursor: 'pointer', borderRadius: '4px'}}
                  >
                    Gen Shuffle.json
                  </button>
                </>
            )}
          </div>
        </footer>
      </main>
  );
}