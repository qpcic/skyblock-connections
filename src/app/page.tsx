"use client";

import React, { useState, useEffect } from 'react';
import { getDailyPuzzle } from '../lib/gameLogic';
import { sendToDiscord } from './submit/actions';
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

  // --- Board Logic ---
  const startDate = new Date('2026-04-19T00:00:00');
  const today = new Date();
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const realBoardNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const [activeBoardNumber, setActiveBoardNumber] = useState(realBoardNumber);
  const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // --- Simple Toast Helper ---
  const showToast = (msg: string) => {
    if (toastMessage && msg === "Already guessed!") return;
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

// --- DEV UTILITIES ---
  const generateAndCopyShuffle = async () => {
    // 1. Create a clean array of unique integers [0, 1, 2, ... puzzles.length - 1]
    const count = puzzles.length;
    const newShuffle = Array.from({ length: count }, (_, i) => i);

    // 2. Perform Fisher-Yates Shuffle
    for (let i = newShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newShuffle[i], newShuffle[j]] = [newShuffle[j], newShuffle[i]];
    }

    // 3. Final Integrity Check: Ensure 100% uniqueness and correct length
    const uniqueCheck = new Set(newShuffle);
    if (uniqueCheck.size !== count) {
      console.error("Shuffle Error: Duplicate or missing indices detected.");
      showToast("Error: Shuffle was not unique!");
      return;
    }

    // 4. Copy to clipboard
    const jsonString = JSON.stringify(newShuffle);
    try {
      await navigator.clipboard.writeText(jsonString);
      console.log("New Unique Shuffle:", newShuffle);
      showToast("Unique Shuffle Copied!");
    } catch (err) {
      console.error("Failed to copy!", err);
      showToast("Failed to copy to clipboard.");
    }
  };
  const nukeStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

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

    const data = getDailyPuzzle(currentBoard);
    setGameData(data);

    const mapping: Record<number, number> = {};
    data.groups.forEach((group: any, index: number) => {
      mapping[group.id] = index + 1;
    });
    setIdToColorMap(mapping);

    const saved = localStorage.getItem(`skyblock-progress-${currentBoard}`);
    if (saved) {
      const { savedSelected, savedCompleted, savedMistakes, savedGuesses, savedWordGuesses } = JSON.parse(saved);
      if (savedSelected) setSelected(savedSelected);
      if (savedCompleted) setCompletedGroups(savedCompleted);
      if (savedMistakes !== undefined) setMistakes(savedMistakes);
      if (savedGuesses) setGuesses(savedGuesses);
      if (savedWordGuesses) setWordGuesses(savedWordGuesses);
    }
    setIsLoaded(true);
  }, [realBoardNumber]);

  // Timer logic
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
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

  // Save Progress
  useEffect(() => {
    if (isLoaded) {
      const progress = {
        savedSelected: selected,
        savedCompleted: completedGroups,
        savedMistakes: mistakes,
        savedGuesses: guesses,
        savedWordGuesses: wordGuesses,
      };
      localStorage.setItem(`skyblock-progress-${activeBoardNumber}`, JSON.stringify(progress));
    }
  }, [selected, completedGroups, mistakes, guesses, wordGuesses, activeBoardNumber, isLoaded]);

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

    const sortedSelected = [...selected].sort();
    const isDuplicate = wordGuesses.some(prevWords => {
      const sortedPrev = [...prevWords].sort();
      return sortedPrev.every((word, i) => word === sortedSelected[i]);
    });

    if (isDuplicate) {
      showToast("Already guessed!");
      return;
    }

    const selectedTiles = selected.map(word => gameData.tiles.find((t: any) => t.word === word));
    const categoryIds = selectedTiles.map(tile => tile.categoryId);
    const unsortedGuessColors = categoryIds.map(id => idToColorMap[id]);

    setGuesses(prev => [...prev, unsortedGuessColors]);
    setWordGuesses(prev => [...prev, selected]);

    const firstId = categoryIds[0];
    const isCorrect = categoryIds.every(id => id === firstId);

    if (isCorrect) {
      const correctGroup = gameData.groups.find((g: any) => g.id === firstId);
      setCompletedGroups([...completedGroups, correctGroup]);
      setSelected([]);
    } else {
      const counts: Record<number, number> = {};
      categoryIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
      const isOneOff = Object.values(counts).some(count => count === 3);

      if (isOneOff) {
        showToast("One away...");
      }

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

  // --- Styled Dev Button Helper ---
  const devButtonStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: '0.7rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(0, 0, 0, 0.0)',
    color: '#aaa',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 'bold'
  };

  return (
      <main className="main-wrapper">
        <h1 className="maintitle">Skyblock Connections</h1>

        <div style={{textAlign: 'center', marginBottom: '20px', fontSize: '1.1rem', fontWeight: '500', opacity: 0.9}}>
          {formattedDate} | Board #{activeBoardNumber}
          {DEV_MODE && <span style={{color: '#ff4d4d'}}> (DEV)</span>}
          <span>, Next in: {timeLeft}</span>
        </div>

        <div className="mistakes-container">
          <span className="mistakes-label">Lives:</span>
          <div className="dots-row">
            {[...Array(4)].map((_, i) => (
                <div key={i} className={`mistake-dot ${i < mistakes ? 'filled' : 'empty'}`}/>
            ))}
          </div>
          <HowToPlay/>
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
          <button onClick={() => setShowSuggestModal(true)} className="btn-base btn-secondary">Suggest words</button>
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
                      const grid = guesses.map(g => g.map(id => ({
                        1: "🟨", 2: "🟩", 3: "🟦", 4: "🟪"
                      }[id as 1 | 2 | 3 | 4])).join("")).join("\n");
                      navigator.clipboard.writeText(`Skyblock Connections\nPuzzle #${activeBoardNumber}\n${grid}\n\nPlay: https://skyblock-connections.com/`);
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
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'}}>
            <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>© {new Date().getFullYear()} | qpcic</span>

            {DEV_MODE && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                      onClick={nukeStorage}
                      style={{ ...devButtonStyle, color: '#aa0000', borderColor: 'rgba(0,0,0, 0.9)' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)')}
                  >
                    Nuke Storage
                  </button>
                  <button
                      onClick={generateAndCopyShuffle}
                      style={{ ...devButtonStyle, color: '#00aa00', borderColor: 'rgba(0,0,0, 0.9)' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(81, 207, 102, 0.1)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)')}
                  >
                    Gen Shuffle.json
                  </button>
                </div>
            )}
          </div>
        </footer>

        <GuessedToast message={toastMessage} />
      </main>
  );
}