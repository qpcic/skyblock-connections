"use client";

import React, { useState, useEffect } from 'react';
import { getDailyPuzzle } from '../lib/gameLogic';
import { sendToDiscord, incrementSolveCount } from './submit/actions'; // Added action
import puzzles from '../data/puzzles.json';
import HowToPlay from "@/src/app/components/HowToPlay";
import GuessedToast from "@/src/app/components/GuessedToast";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export default function ConnectionsGame() {
  const [gameData, setGameData] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [completedGroups, setCompletedGroups] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState(4);
  const [guesses, setGuesses] = useState<number[][]>([]);
  const [idToColorMap, setIdToColorMap] = useState<Record<number, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [wordGuesses, setWordGuesses] = useState<string[][]>([]);

  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // New State for Backend Info
  const [activeBoardNumber, setActiveBoardNumber] = useState<number>(0);
  const [solveCount, setSolveCount] = useState<number>(0);

  const showToast = (msg: string) => {
    if (toastMessage && msg === "Already guessed!") return;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(curr => curr === msg ? null : curr), 4000);
  };

  // 1. Initial Sync with Server
  useEffect(() => {
    async function initGame() {
      try {
        const res = await fetch('/api/game-info');
        const info = await res.json();

        let boardToLoad = info.boardNumber;
        if (DEV_MODE) {
          const savedOffset = parseInt(localStorage.getItem('skyblock-dev-offset') || "0");
          boardToLoad += savedOffset;
        }

        setActiveBoardNumber(boardToLoad);
        setSolveCount(info.solveCount);

        const data = getDailyPuzzle(boardToLoad);
        setGameData(data);

        const mapping: Record<number, number> = {};
        data.groups.forEach((group: any, index: number) => {
          mapping[group.id] = index + 1;
        });
        setIdToColorMap(mapping);

        const saved = localStorage.getItem(`skyblock-progress-${boardToLoad}`);
        if (saved) {
          const { savedSelected, savedCompleted, savedMistakes, savedGuesses, savedWordGuesses } = JSON.parse(saved);
          if (savedSelected) setSelected(savedSelected);
          if (savedCompleted) setCompletedGroups(savedCompleted);
          if (savedMistakes !== undefined) setMistakes(savedMistakes);
          if (savedGuesses) setGuesses(savedGuesses);
          if (savedWordGuesses) setWordGuesses(savedWordGuesses);
        }
        setIsLoaded(true);
      } catch (err) {
        console.error("Sync failed", err);
      }
    }
    initGame();
  }, []);

  // 2. Handle Solve Recording
  useEffect(() => {
    if (completedGroups.length === 4 && isLoaded) {
      const winKey = `skyblock-won-${activeBoardNumber}`;
      if (!localStorage.getItem(winKey)) {
        incrementSolveCount(activeBoardNumber).then(res => {
          if (res.success) {
            setSolveCount(res.newCount || 0);
            localStorage.setItem(winKey, 'true');
          }
        });
      }
      const timer = setTimeout(() => setShowModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [completedGroups.length, isLoaded, activeBoardNumber]);

  // Timer logic (Keep local for UI countdown, but doesn't affect Board ID)
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    const timerId = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(timerId);
  }, []);

  // Persistence logic (Same as before)
  useEffect(() => {
    if (isLoaded && activeBoardNumber) {
      const progress = {
        savedSelected: selected, savedCompleted: completedGroups,
        savedMistakes: mistakes, savedGuesses: guesses, savedWordGuesses: wordGuesses,
      };
      localStorage.setItem(`skyblock-progress-${activeBoardNumber}`, JSON.stringify(progress));
    }
  }, [selected, completedGroups, mistakes, guesses, wordGuesses, activeBoardNumber, isLoaded]);

  if (!gameData || !isLoaded) return <div className="loading-container"><div className="loading-text">Loading...</div></div>;

  const isGameOver = mistakes === 0 || completedGroups.length === 4;
  const remainingTiles = gameData.tiles.filter((tile: any) => !completedGroups.some(g => g.words.includes(tile.word)));

  const handleTileClick = (word: string) => {
    if (isGameOver) return;
    if (selected.includes(word)) setSelected(selected.filter(w => w !== word));
    else if (selected.length < 4) setSelected([...selected, word]);
  };

  const handleSubmit = () => {
    if (selected.length !== 4) return;
    const sortedSelected = [...selected].sort();
    if (wordGuesses.some(prev => [...prev].sort().every((w, i) => w === sortedSelected[i]))) {
      showToast("Already guessed!");
      return;
    }
    const selectedTiles = selected.map(word => gameData.tiles.find((t: any) => t.word === word));
    const categoryIds = selectedTiles.map(tile => tile.categoryId);
    const colors = categoryIds.map(id => idToColorMap[id]);
    setGuesses(prev => [...prev, colors]);
    setWordGuesses(prev => [...prev, selected]);
    if (categoryIds.every(id => id === categoryIds[0])) {
      setCompletedGroups([...completedGroups, gameData.groups.find((g: any) => g.id === categoryIds[0])]);
      setSelected([]);
    } else {
      const counts: any = {};
      categoryIds.forEach(id => counts[id] = (counts[id] || 0) + 1);
      if (Object.values(counts).some(c => c === 3)) showToast("One away...");
      setMistakes(prev => Math.max(0, prev - 1));
    }
  };

  return (
      <main className="main-wrapper">
        <h1 className="maintitle">Skyblock Connections</h1>
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.1rem', opacity: 0.9 }}>
          Board #{activeBoardNumber} | Next Puzzle in: <span>{timeLeft}</span>
        </div>

        <div className="mistakes-container">
          <span className="mistakes-label">Lives:</span>
          <div className="dots-row">
            {[...Array(4)].map((_, i) => <div key={i} className={`mistake-dot ${i < mistakes ? 'filled' : 'empty'}`} />)}
          </div>
          <HowToPlay />
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
                <button key={tile.word} onClick={() => handleTileClick(tile.word)} className={`tile-button ${selected.includes(tile.word) ? 'selected' : ''}`}>
                  {tile.word}
                </button>
            ))}
          </div>
        </div>

        <div className="controls">
          <button onClick={() => setShowSuggestModal(true)} className="btn-base btn-secondary">Suggest words</button>
          {!isGameOver ? (
              <>
                <button onClick={() => setGameData({...gameData, tiles: [...gameData.tiles].sort(() => Math.random() - 0.5)})} className="btn-base btn-secondary">Shuffle</button>
                <button onClick={() => setSelected([])} className="btn-base btn-secondary">Deselect</button>
                <button onClick={handleSubmit} disabled={selected.length !== 4} className="btn-base btn-primary">Submit</button>
              </>
          ) : <button onClick={() => setShowModal(true)} className="btn-base btn-primary">View Results</button>}
        </div>

        <div className="status-message-container">
          {mistakes === 0 && <div className="game-over-text">Game Over!</div>}
          {completedGroups.length === 4 && <div className="win-text">Perfect! ({solveCount} solved today)</div>}
        </div>

        {/* RESULTS MODAL */}
        {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Results</h2>
                <p style={{textAlign: 'center', marginBottom: '10px'}}>{solveCount} people have solved this today!</p>
                <div className="emoji-grid">
                  {guesses.map((guess, i) => (
                      <div key={i} className="emoji-row">
                        {guess.map((id, j) => <span key={j}>{{1:"🟨", 2:"🟩", 3:"🟦", 4:"🟪"}[id as 1|2|3|4] || "⬛"}</span>)}
                      </div>
                  ))}
                </div>
                <button
                    onClick={() => {
                      const grid = guesses.map(g => g.map(id => ({1:"🟨", 2:"🟩", 3:"🟦", 4:"🟪"}[id as 1|2|3|4])).join("")).join("\n");
                      navigator.clipboard.writeText(`Skyblock Connections\nPuzzle #${activeBoardNumber}\n${grid}\n\nPlay: https://skyblock-connections.com/`);
                      showToast("Copied to clipboard!");
                    }}
                    className="btn-base btn-primary share-btn"
                >Share Result</button>
                <button onClick={() => setShowModal(false)} className="btn-base btn-secondary">Close</button>
              </div>
            </div>
        )}

        {/* SUGGESTION MODAL */}
        {showSuggestModal && (
            <div className="modal-overlay" onClick={() => setShowSuggestModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title" style={{ fontSize: '28px', marginBottom: '5px' }}>Suggest words</h2>
                <form onSubmit={onSubmitSuggestion} className="suggest-form">
                  <input name="category" placeholder="Category Name" required className="suggest-input" />
                  <div className="word-grid">
                    <input name="w1" placeholder="Word 1" required className="suggest-input" />
                    <input name="w2" placeholder="Word 2" required className="suggest-input" />
                    <input name="w3" placeholder="Word 3" required className="suggest-input" />
                    <input name="w4" placeholder="Word 4" required className="suggest-input" />
                  </div>
                  <input name="author" placeholder="Your IGN (Optional)" className="suggest-input" />
                  <button type="submit" disabled={isSending} className="btn-base btn-primary" style={{ marginTop: '5px' }}>
                    {isSending ? "Sending..." : "Submit Suggestion"}
                  </button>
                </form>
                <button onClick={() => setShowSuggestModal(false)} className="close-modal-text">Cancel</button>
              </div>
            </div>
        )}

        <footer className="footer-container" style={{ marginTop: '40px', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>© {new Date().getFullYear()} | qpcic</span>
            {DEV_MODE && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={nukeStorage} style={{ ...devButtonStyle, color: '#aa0000', borderColor: 'rgba(0,0,0, 0.9)' }}>Nuke Storage</button>
                  <button onClick={generateAndCopyShuffle} style={{ ...devButtonStyle, color: '#00aa00', borderColor: 'rgba(0,0,0, 0.9)' }}>Gen Shuffle.json</button>
                </div>
            )}
          </div>
        </footer>
        <GuessedToast message={toastMessage} />
      </main>
  );
}