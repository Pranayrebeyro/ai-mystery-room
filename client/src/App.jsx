import { useState } from "react";
import axios from "axios";
import "./App.css";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

const difficulties = [
  {
    name: "Easy",
    suspects: 3,
    clues: 5,
    hints: 2,
    bonus: 100,
    description: "A good place to begin your investigation.",
  },
  {
    name: "Medium",
    suspects: 4,
    clues: 7,
    hints: 3,
    bonus: 150,
    description: "More suspects. More evidence. More uncertainty.",
  },
  {
    name: "Hard",
    suspects: 5,
    clues: 9,
    hints: 3,
    bonus: 200,
    description: "Only the sharpest detectives will solve this.",
  },
];

function App() {
  const [page, setPage] = useState("home");
  const [premise, setPremise] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");

  const [game, setGame] = useState(null);
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSuspect, setSelectedSuspect] = useState("");

  const [latestHint, setLatestHint] = useState(null);
  const [notice, setNotice] = useState("");

  const showError = (err) => {
    setError(
      err.response?.data?.message ||
        err.message ||
        "Something went wrong. Please try again."
    );
  };

  const startMystery = async (event) => {
    event.preventDefault();

    if (premise.trim().length < 10) {
      setError("Please enter a mystery premise with at least 10 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.post("/cases", {
        premise: premise.trim(),
        difficulty,
      });

      setGame(response.data.case);
      setSelectedSuspect("");
      setLatestHint(null);
      setNotice("");
      setPage("investigation");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const discoverClue = async (clueId) => {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const response = await API.post(
        `/cases/${game.id}/clues/${clueId}/discover`
      );

      setGame(response.data.case);
      setNotice("Evidence discovered! You earned 5 points.");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const requestHint = async () => {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const response = await API.post(
        `/cases/${game.id}/hints`
      );

      setLatestHint(response.data.hint);

      setGame((previous) => ({
        ...previous,
        progress: {
          ...previous.progress,
          hintsUsed: response.data.progress.hintsUsed,
          score: response.data.progress.score,
        },
      }));

      setNotice("Hint unlocked. 10 points deducted.");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const accuseSuspect = async (event) => {
    event.preventDefault();

    if (!selectedSuspect) {
      setError("Please select a suspect before making your accusation.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure? Your accusation will permanently complete this mystery."
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");

      const response = await API.post(
        `/cases/${game.id}/accuse`,
        {
          suspectId: selectedSuspect,
        }
      );

      setResult(response.data.result);
      setPage("results");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setGame(null);
    setResult(null);
    setPremise("");
    setDifficulty("Easy");
    setSelectedSuspect("");
    setLatestHint(null);
    setError("");
    setNotice("");
    setPage("home");
  };

  const score = game?.progress?.score ?? 0;
  const discoveredCount =
    game?.progress?.discoveredClueIds?.length ?? 0;

  return (
    <div className="app-shell">
      <header className="navbar">
        <button className="brand" onClick={resetGame}>
          <span className="brand-icon">✦</span>
          <span>
            MYSTERY<span className="gold-text">ROOM</span>
          </span>
        </button>

        <div className="nav-right">
          <span className="status-indicator">
            <span className="status-dot" />
            AI INVESTIGATION SYSTEM
          </span>

          {game && page === "investigation" && (
            <div className="nav-score">
              <span>YOUR SCORE</span>
              <strong>{score}</strong>
            </div>
          )}
        </div>
      </header>

      <main>
        {page === "home" && (
          <section className="home-page">
            <div className="hero-glow" />

            <div className="hero-content">
              <div className="eyebrow">
                <span /> AN AI-POWERED DETECTIVE EXPERIENCE
              </div>

              <h1>
                Every mystery
                <br />
                has a <span className="gold-text">secret.</span>
              </h1>

              <p className="hero-description">
                Enter a world of hidden evidence, suspicious characters
                and unexpected twists. Your reasoning is your greatest weapon.
              </p>

              <button
                className="primary-button hero-button"
                onClick={() => {
                  setError("");
                  setPage("create");
                }}
              >
                Start Your Investigation <span>→</span>
              </button>

              <div className="hero-stats">
                <div>
                  <strong>03</strong>
                  <span>DIFFICULTY LEVELS</span>
                </div>
                <div>
                  <strong>AI</strong>
                  <span>GENERATED CASES</span>
                </div>
                <div>
                  <strong>∞</strong>
                  <span>POSSIBILITIES</span>
                </div>
              </div>
            </div>

            <div className="case-preview">
              <div className="preview-top">
                <span>CASE FILE #001</span>
                <span className="classified">CLASSIFIED</span>
              </div>

              <div className="magnifier">⌕</div>

              <div className="preview-content">
                <span className="gold-text">THE UNKNOWN</span>
                <h2>Look closer.<br />Think deeper.</h2>
                <p>
                  The truth is hidden in plain sight. Can you find it?
                </p>
              </div>

              <div className="preview-bottom">
                <span>CONFIDENTIAL INVESTIGATION</span>
                <span>● ACTIVE</span>
              </div>
            </div>
          </section>
        )}

        {page === "create" && (
          <section className="create-page page-container">
            <button className="back-button" onClick={() => setPage("home")}>
              ← Back to home
            </button>

            <div className="section-heading">
              <span className="eyebrow">NEW INVESTIGATION</span>
              <h1>Create your <span className="gold-text">mystery.</span></h1>
              <p>Set the scene. Choose your challenge. Let the investigation begin.</p>
            </div>

            <form className="create-card" onSubmit={startMystery}>
              <label className="field-label" htmlFor="premise">
                THE MYSTERY PREMISE
              </label>

              <textarea
                id="premise"
                value={premise}
                onChange={(event) => setPremise(event.target.value)}
                placeholder="Example: A priceless diamond disappears from a locked museum room during a private exhibition..."
                maxLength={500}
                required
              />

              <div className="character-count">
                {premise.length}/500 characters
              </div>

              <div className="difficulty-heading">
                <label className="field-label">SELECT DIFFICULTY</label>
                <span>Choose wisely, detective.</span>
              </div>

              <div className="difficulty-grid">
                {difficulties.map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    className={`difficulty-card ${
                      difficulty === item.name ? "selected" : ""
                    }`}
                    onClick={() => setDifficulty(item.name)}
                  >
                    <span className="difficulty-check">
                      {difficulty === item.name ? "✓" : ""}
                    </span>

                    <strong>{item.name}</strong>
                    <small>{item.description}</small>

                    <div className="difficulty-details">
                      <span>{item.suspects} Suspects</span>
                      <span>{item.clues} Clues</span>
                      <span>{item.hints} Hints</span>
                    </div>

                    <span className="bonus">
                      +{item.bonus} SOLVE BONUS
                    </span>
                  </button>
                ))}
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="primary-button full-button"
                disabled={loading}
              >
                {loading ? "Generating your mystery..." : "Generate Mystery →"}
              </button>

              <p className="form-note">
                Your case is uniquely generated by AI. Generation may take a
                little time.
              </p>
            </form>
          </section>
        )}

        {page === "investigation" && game && (
          <section className="investigation-page page-container">
            <div className="investigation-header">
              <div>
                <span className="eyebrow">ACTIVE CASE · {game.difficulty.toUpperCase()}</span>
                <h1>{game.title}</h1>
                <p>{game.premise}</p>
              </div>

              <div className="score-card">
                <span>CURRENT SCORE</span>
                <strong>{score}</strong>
                <small>POINTS</small>
              </div>
            </div>

            <div className="progress-strip">
              <div>
                <span>CLUES FOUND</span>
                <strong>{discoveredCount}/{game.clues.length}</strong>
              </div>
              <div>
                <span>HINTS USED</span>
                <strong>{game.progress.hintsUsed}/{difficulties.find(
                  (item) => item.name === game.difficulty
                )?.hints}</strong>
              </div>
              <div>
                <span>CASE STATUS</span>
                <strong className="active-text">● ACTIVE</strong>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {notice && <div className="success-message">{notice}</div>}

            <section className="story-panel">
              <div className="panel-heading">
                <span>01 / CASE BRIEFING</span>
                <span>◈ CLASSIFIED</span>
              </div>
              <h2>The Incident</h2>
              <p>{game.story}</p>
            </section>

            <section className="investigation-section">
              <div className="section-title">
                <div>
                  <span className="eyebrow">PEOPLE OF INTEREST</span>
                  <h2>Suspects</h2>
                </div>
                <span>{game.suspects.length} SUSPECTS</span>
              </div>

              <div className="suspect-grid">
                {game.suspects.map((suspect, index) => (
                  <article className="suspect-card" key={suspect.id}>
                    <div className="suspect-number">
                      SUSPECT 0{index + 1}
                    </div>
                    <div className="suspect-avatar">
                      {suspect.name.charAt(0).toUpperCase()}
                    </div>
                    <h3>{suspect.name}</h3>
                    <p>{suspect.description}</p>
                    <div className="alibi">
                      <span>ALIBI</span>
                      <p>{suspect.alibi}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="investigation-section">
              <div className="section-title">
                <div>
                  <span className="eyebrow">PHYSICAL EVIDENCE</span>
                  <h2>Clue Board</h2>
                </div>
                <span>+5 POINTS PER CLUE</span>
              </div>

              <div className="clue-grid">
                {game.clues.map((clue, index) => (
                  <article
                    className={`clue-card ${
                      clue.discovered ? "clue-found" : ""
                    }`}
                    key={clue.id}
                  >
                    <div className="clue-card-top">
                      <span>CLUE 0{index + 1}</span>
                      <span>{clue.discovered ? "FOUND ✓" : "LOCKED"}</span>
                    </div>

                    <div className="clue-symbol">
                      {clue.discovered ? "◈" : "?"}
                    </div>

                    <p>
                      {clue.discovered
                        ? clue.description
                        : "Evidence is hidden. Investigate to reveal this clue."}
                    </p>

                    {!clue.discovered && (
                      <button
                        className="secondary-button"
                        onClick={() => discoverClue(clue.id)}
                        disabled={loading}
                      >
                        Discover clue
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="hint-section">
              <div>
                <span className="eyebrow">NEED SOME DIRECTION?</span>
                <h2>Request a hint</h2>
                <p>
                  Each hint costs 10 points. Use them carefully.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={requestHint}
                disabled={
                  loading ||
                  game.progress.hintsUsed >=
                    (difficulties.find(
                      (item) => item.name === game.difficulty
                    )?.hints ?? 0)
                }
              >
                {loading ? "Please wait..." : "Unlock next hint −10"}
              </button>

              {latestHint && (
                <div className="hint-result">
                  <span>HINT {latestHint.order}</span>
                  <p>{latestHint.text}</p>
                </div>
              )}
            </section>

            <section className="accusation-section">
              <span className="eyebrow">THE FINAL DECISION</span>
              <h2>Who is the culprit?</h2>
              <p>
                Review your evidence carefully. Once submitted, your
                accusation cannot be changed.
              </p>

              <form onSubmit={accuseSuspect}>
                <select
                  value={selectedSuspect}
                  onChange={(event) =>
                    setSelectedSuspect(event.target.value)
                  }
                  required
                >
                  <option value="">Select a suspect</option>
                  {game.suspects.map((suspect) => (
                    <option key={suspect.id} value={suspect.id}>
                      {suspect.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading || !selectedSuspect}
                >
                  {loading ? "Submitting..." : "Submit accusation →"}
                </button>
              </form>
            </section>
          </section>
        )}

        {page === "results" && result && (
          <section className="results-page page-container">
            <div className="result-icon">
              {result.correct ? "✓" : "!"}
            </div>

            <span className="eyebrow">INVESTIGATION COMPLETED</span>

            <h1>
              {result.correct ? (
                <>Case <span className="gold-text">solved.</span></>
              ) : (
                <>The truth has <span className="gold-text">emerged.</span></>
              )}
            </h1>

            <p className="result-message">
              {result.correct
                ? "Outstanding detective work. Your accusation was correct."
                : "Your accusation was incorrect, but the mystery is now solved."}
            </p>

            <div className="result-score">
              <span>YOUR FINAL SCORE</span>
              <strong>{result.score}</strong>
              <small>POINTS</small>
            </div>

            <div className="result-grid">
              <div>
                <span>YOUR ACCUSATION</span>
                <strong>{result.selectedSuspect.name}</strong>
                <small>{result.correct ? "CORRECT" : "INCORRECT"}</small>
              </div>

              <div>
                <span>ACTUAL CULPRIT</span>
                <strong>{result.culprit.name}</strong>
                <small>IDENTIFIED</small>
              </div>

              <div>
                <span>CLUES DISCOVERED</span>
                <strong>{result.discoveredClues}</strong>
              </div>

              <div>
                <span>HINTS USED</span>
                <strong>{result.hintsUsed}</strong>
              </div>

              <div>
                <span>ACCURACY BONUS</span>
                <strong>+{result.bonusAwarded}</strong>
              </div>

              <div>
                <span>DIFFICULTY</span>
                <strong>{result.difficulty}</strong>
              </div>
            </div>

            <section className="solution-panel">
              <span className="eyebrow">THE FINAL REVELATION</span>
              <h2>How the mystery was solved</h2>
              <p>{result.solutionExplanation}</p>
            </section>

            <button className="primary-button" onClick={resetGame}>
              Start a New Mystery →
            </button>
          </section>
        )}
      </main>

      <footer className="footer">
        <span>✦ MYSTERY ROOM</span>
        <span>EVERY CLUE MATTERS. EVERY DETAIL COUNTS.</span>
      </footer>
    </div>
  );
}

export default App;