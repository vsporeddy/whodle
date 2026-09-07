import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check, Share2, ExternalLink, CircleHelp, BarChart3, X } from 'lucide-react';

// CONFIGURATION
const MAX_GUESSES = 5;
const MODES = ['text', 'image', 'url'];

// QUIZ MODE ("How well do you know X?") — runs every other day, alternating with classic.
// Odd puzzle numbers are quiz days (puzzle #281 on 9/7/2026 is a quiz day).
const isQuizDay = (puzzleNum) => puzzleNum % 2 === 1;
const QUIZ_EMOJI = '🧠';
const QUIZ_SEED_OFFSET = 4242;
const QUIZ_SIZE = 20;
const QUIZ_TYPE_SLOTS = { text: 12, image: 4, url: 4 }; // 60% / 20% / 20%
// Share of posts that are really the target's: drawn (seeded) per quiz within this range
const QUIZ_TARGET_MIN = Math.ceil(QUIZ_SIZE * 0.3);
const QUIZ_TARGET_MAX = Math.floor(QUIZ_SIZE * 0.6);
// Stats: a quiz day is a much bigger sample than one classic round, so it weighs more
const STATS_QUIZ_WEIGHT = 3;
// Only a perfect score earns an S; each miss drops one step from there.
const QUIZ_RANKS = ['F', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'S'];
const QUIZ_RANK_MESSAGES = {
  S: "am i that?",
  A: "besties 🥹",
  B: "nyum",
  C: "coin flip energy",
  D: "do you even know them",
  F: "bro??"
};
const MODE_EMOJI = { text: '💬', image: '📸', url: '🔗' };
const MODE_FILE = {
  text: 'filtered_text_data.json',
  image: 'filtered_image_data.json',
  url: 'filtered_url_data.json'
};
const MODE_SEED_OFFSET = { text: 0, image: 999, url: 1999 };

// Default emojis for unknown users (no repeats per mode)
const DEFAULT_USER_EMOJI_POOL = ['🤔', '🧐', '🐱', '🐶', '🤠', '🥚', '🙂', '🐸'];
const defaultEmojiState = {
  text: { shuffled: null, index: 0 },
  image: { shuffled: null, index: 0 },
  url: { shuffled: null, index: 0 }
};

const WIN_MESSAGES = ["Oh??", "🤠", "👀", "Good job, bud.", "EZ."];
const LOSE_MESSAGES = ["Yikes.", "Bro??", "Skill Issue?", "Uhhh...", "Frick!"];

const HOLIDAY_OVERRIDES = {
  '12/25/2025': {
    text: '1319050976698695760',
    image: '1056752019689459742'
  },
  '1/1/2026': {
    text: '1191265799466393600',
    image: '926701962035097660'
  },
  '3/16/2026': {
    text: '953880386772041758',
    image: '953880973974573097',
    url: '1187368996274700288'
  },
  '3/17/2026': {
    text: '1161929955882565632'
  },
  '4/1/2026': {
    text: '1445515695440920687',
    image: '616492595224510475',
    url: '1100267104948727859'
  },
  '4/5/2026': {
    text: '945906585358708776',
    image: '1465578066465128509',
    url: '1336552097201651823'
  }
};

const dateStr = new Date().toLocaleDateString("en-US", {
  timeZone: "America/New_York",
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
});

const todayStr = new Date().toLocaleDateString("en-US", {
  timeZone: "America/New_York",
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

const isAprilFools = dateStr.startsWith('4/1/');

// STYLES (Discord Dark Theme)
const styles = {
  title: { maxWidth: '600px', margin: '0 auto', padding: '2px', fontFamily: isAprilFools ? '"Comic Sans MS", "Comic Sans", cursive' : 'normal Helvetica', textAlign: 'center', letterSpacing: '5px', textShadow: '-5px 5px 10px rgba(0, 0, 0, 0.75)' },
  subtitle: { maxWidth: '300px', margin: '0 auto', padding: '2px', marginBottom: '10px', fontFamily: isAprilFools ? '"Comic Sans MS", "Comic Sans", cursive' : 'normal Helvetica', textAlign: 'center', letterSpacing: '1px' },
  container: { width: 'min(500px, 90%)', margin: '0 auto', padding: '20px', fontFamily: isAprilFools ? '"Comic Sans MS", "Comic Sans", cursive' : 'sans-serif', textAlign: 'center', paddingBottom: '50px', transform: isAprilFools ? 'rotate(1.5deg)' : 'none' },
  imagePreview: { maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', marginBottom: '20px', cursor: 'zoom-in', transition: 'transform 0.1s', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' },
  quoteBox: { background: '#2b2d31', borderLeft: '4px solid #5865F2', padding: '15px', borderRadius: '4px', fontSize: '1.1rem', marginBottom: '20px', textAlign: 'left', color: '#dbdee1' },
  inputGroup: { position: 'relative', marginBottom: '10px' },
  input: { width: '100%', padding: '15px', fontSize: '1rem', borderRadius: '8px', border: 'none', background: '#383a40', color: 'white', outline: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', boxSizing: 'border-box' },
  dropdown: { position: 'absolute', width: '100%', maxHeight: '200px', overflowY: 'auto', background: '#2b2d31', borderRadius: '0 0 8px 8px', zIndex: 10, textAlign: 'left', boxShadow: '0 4px 6px rgba(0,0,0,0.5)' },
  dropdownItem: { padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1e1f22', color: '#dbdee1' },
  disabledItem: { padding: '10px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1e1f22', color: '#dbdee1', opacity: 0.5, background: '#232428' },
  grid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 2fr', gap: '8px' },
  cell: { padding: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'white', fontWeight: 'bold', boxShadow: '0 2px 2px rgba(0,0,0,0.2)', minWidth: 0, overflow: 'hidden' },
  avatarSmall: { width: '30px', height: '30px', borderRadius: '50%' },
  btnPrimary: { background: '#5865F2', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' },
  btnSecondary: { background: '#4f545c', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' },
  btnDanger: { background: '#6d3b3c', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  resultsBox: { marginTop: '30px', padding: '20px', background: '#2b2d31', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' },
  guessCounter: { fontSize: '0.9rem', color: '#949BA4', marginTop: '5px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalImage: { maxWidth: '95vw', maxHeight: '95vh', borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' },
  helpContent: { backgroundColor: '#4f545c', padding: '25px', borderRadius: '8px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto', textAlign: 'left', position: 'relative', lineHeight: '1.6' },
  closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' },
  legendTable: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  legendRow: { borderBottom: '1px solid #eee' },
  legendCell: { padding: '8px', fontSize: '0.9rem' },
  dateDisplay: { position: 'fixed', top: '10px', left: '10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', zIndex: 1000, backgroundColor: '#383a40', padding: '4px 8px', borderRadius: '4px', pointerEvents: 'none' },
  // Quiz mode
  quizUserList: { maxHeight: '55vh', overflowY: 'auto', background: '#2b2d31', borderRadius: '8px', textAlign: 'left', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginTop: '10px' },
  quizProgressTrack: { height: '6px', background: '#1e1f22', borderRadius: '3px', overflow: 'hidden', margin: '8px 0 20px' },
  quizProgressFill: { height: '100%', background: '#5865F2', transition: 'width 0.2s' },
  quizChoiceYes: { flex: 1, background: '#23a559', color: 'white', border: 'none', padding: '14px 10px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: 0 },
  quizChoiceNo: { flex: 1, background: '#da373c', color: 'white', border: 'none', padding: '14px 10px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: 0 },
  quizFeedback: { padding: '15px', borderRadius: '8px', marginBottom: '10px', color: 'white' },
  quizGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', maxWidth: '260px', margin: '15px auto' },
  quizGridCell: { aspectRatio: '1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }
};

// Seed gen based on Eastern time
const getDailySeed = () => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

// Mulberry32 PRNG
const mulberry32 = (a) => {
  return function () {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
};

const getPuzzleNumber = () => {
  const [month, day, year] = dateStr.split('/').map(Number);
  const current = Date.UTC(year, month - 1, day);
  const start = Date.UTC(2025, 11, 1); // Dec 1, 2025
  const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
};

const getNextDefaultEmoji = (mode) => {
  const state = defaultEmojiState[mode] || defaultEmojiState.text;
  if (!state.shuffled) {
    const seed = getDailySeed() + (MODE_SEED_OFFSET[mode] ?? 0);
    const rng = mulberry32(seed);
    const pool = [...DEFAULT_USER_EMOJI_POOL];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.shuffled = pool;
    state.index = 0;
  }

  const emoji = state.shuffled[state.index % state.shuffled.length];
  state.index += 1;
  return emoji;
};

const getUserEmoji = (username, mode = 'text') => {
  // Maintain alphabetical order
  if (!username) return `||${getNextDefaultEmoji(mode)}||`;
  switch (username) {
    case 'asura_of_war': return '||:BusyThatDay:||';
    case 'bcguy390': return '||:sus:||';
    case 'coldchowder': return '||:ChowderScuffed:||';
    case 'doncha7': return '||:DonchaHowdy:||';
    case 'dudeman27': return '||:DudemanEZ:||';
    case 'dvrx': return '||:dvrxApproved:||';
    case 'infinitori_': return '||:birb:||';
    case 'iron.urn': return '||:IronUrn:||';
    case 'misder': return '||:Misder:||';
    case 'mrshu': return '||:paperliskpog:||';
    case 'oxray': return '||:0xFEDORA:||';
    case 'phantah': return '||:PhantahBrim:||';
    case 'r0ffles': return '||:RofflesTeemo:||';
    case 'spatika': return '||:frick:||';
    case 'strawberryhoney': return '||:StrawberryKek:||';
    case 'timmy.tam': return '||:TimmahSuh:||';
    case 'tothemoonn': return '||:audacity:||';
    case 'zalteo': return '||:ZalteoSup:||';
    default: return `||${getNextDefaultEmoji(mode)}||`;
  }
};

const getRank = (modes, puzzleNum) => {
  let total = 0;
  for (const m of modes) {
    const saved = localStorage.getItem(`whodle_${m}_${puzzleNum}`);
    if (!saved) return null;
    const d = JSON.parse(saved);
    const g = d.guesses || [];
    const gu = d.gaveUp || false;
    if (gu) {
      total += 6;
    } else if (g.length > 0 && g[g.length - 1].correct) {
      total += g.length;
    } else {
      total += 6;
    }
  }
  switch (total) {
    case 3: return 'S';
    case 4: return 'S-';
    case 5: return 'A+';
    case 6: return 'A';
    case 7: return 'A-';
    case 8: return 'B+';
    case 9: return 'B';
    case 10: return 'B-';
    case 11: return 'C+';
    case 12: return 'C';
    case 13: return 'C-';
    case 14: return 'D+';
    case 15: return 'D';
    case 16: return 'D-';
    case 17: return 'F+';
    default: return 'F';
  }
};

// ---------- QUIZ HELPERS ----------
const randInt = (min, max, rng = Math.random) => min + Math.floor(rng() * (max - min + 1));

const shuffleInPlace = (arr, rng = Math.random) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Draws n distinct random items from pool (no mutation of pool)
const sample = (pool, n, rng = Math.random) => shuffleInPlace([...pool], rng).slice(0, n);

// Today's quiz subject: seeded pick among members with enough posts (sorted by id so every client agrees)
const pickQuizUser = (datasets, rng) => {
  const counts = getQuizPostCounts(datasets);
  const eligible = Object.values(datasets.text.users)
    .filter(u => (counts[u.id]?.total || 0) >= QUIZ_TARGET_MIN)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (eligible.length === 0) return null;
  return eligible[Math.floor(rng() * eligible.length)];
};

// Per-user post counts across all datasets: { [userId]: { text, image, url, total } }
const getQuizPostCounts = (datasets) => {
  const counts = {};
  for (const mode of MODES) {
    for (const msg of datasets[mode].messages) {
      const c = counts[msg.author_id] ||= { text: 0, image: 0, url: 0, total: 0 };
      c[mode] += 1;
      c.total += 1;
    }
  }
  return counts;
};

// Builds a shuffled list of QUIZ_SIZE items: { msg, isTarget }
// Mix follows QUIZ_TYPE_SLOTS, with 30-60% of posts by the target user.
// Pass a seeded rng so every player gets the same quiz on the same day.
const buildQuiz = (datasets, targetId, rng = Math.random) => {
  const own = {}, others = {};
  for (const mode of MODES) {
    own[mode] = datasets[mode].messages.filter(m => m.author_id === targetId);
    others[mode] = datasets[mode].messages.filter(m => m.author_id !== targetId);
  }
  const totalOwn = MODES.reduce((s, m) => s + own[m].length, 0);
  if (totalOwn < QUIZ_TARGET_MIN) return null;

  // Slot composition per type. If the target has never posted a type, hand those
  // slots to a type they do post, so the mix doesn't give the answer away.
  const slots = { ...QUIZ_TYPE_SLOTS };
  const fallbackType = MODES.find(m => own[m].length > 0);
  for (const mode of MODES) {
    if (own[mode].length === 0 && mode !== fallbackType) {
      slots[fallbackType] += slots[mode];
      slots[mode] = 0;
    }
  }

  // How many of the QUIZ_SIZE posts are actually by the target
  const targetTotal = randInt(QUIZ_TARGET_MIN, Math.min(QUIZ_TARGET_MAX, totalOwn), rng);

  // Spread target posts across types proportionally, clamped by availability
  const cap = (mode) => Math.min(own[mode].length, slots[mode]);
  const targetPer = {};
  let assigned = 0;
  for (const mode of MODES) {
    targetPer[mode] = Math.min(cap(mode), Math.round(targetTotal * slots[mode] / QUIZ_SIZE));
    assigned += targetPer[mode];
  }
  // Fix rounding / clamping so the sum hits targetTotal (or as close as availability allows)
  let guard = 0;
  while (assigned !== targetTotal && guard++ < 100) {
    const dir = assigned < targetTotal ? 1 : -1;
    const candidate = MODES.find(m => dir > 0 ? targetPer[m] < cap(m) : targetPer[m] > 0);
    if (!candidate) break;
    targetPer[candidate] += dir;
    assigned += dir;
  }

  const items = [];
  for (const mode of MODES) {
    const n = slots[mode];
    if (n === 0) continue;
    const ownPicks = sample(own[mode], targetPer[mode], rng);
    const decoyPicks = sample(others[mode], n - ownPicks.length, rng);
    ownPicks.forEach(msg => items.push({ msg, isTarget: true }));
    decoyPicks.forEach(msg => items.push({ msg, isTarget: false }));
  }
  return shuffleInPlace(items, rng);
};

const getQuizRank = (correct, total = QUIZ_SIZE) => {
  // 25 -> S, 24 -> A, 23 -> A-, ... 14 -> D-, 13 and below -> F
  const idx = Math.max(0, Math.min(QUIZ_RANKS.length - 1, correct - (total - (QUIZ_RANKS.length - 1))));
  return QUIZ_RANKS[idx];
};

const getQuizRankMessage = (rank) => QUIZ_RANK_MESSAGES[rank[0]] || '';

const generateQuizGridString = (answers) => {
  const rows = [];
  for (let i = 0; i < answers.length; i += 5) {
    rows.push(answers.slice(i, i + 5).map(a => (a.correct ? '🟩' : '🟥')).join(''));
  }
  return rows.join('\n');
};

// Renders <@id> mentions as display names
const formatMessageContent = (text, users) => {
  if (!text) return null;
  const regex = /(<@!?\d+>)/g;
  return text.split(regex).map((part, i) => {
    const match = part.match(/<@!?(\d+)>/);
    if (match) {
      const user = users[match[1]];
      const displayName = user ? `@${user.display_name}` : "@User";
      return (
        <span key={i} style={{ color: '#5865F2', backgroundColor: '#5865F21A', borderRadius: '3px', padding: '0 2px', fontWeight: '500' }}>
          {displayName}
        </span>
      );
    }
    return part;
  });
};

const generateGridString = (guessesArray, gaveUp = false, mode = 'text') => {
  const isPerfect = !gaveUp && guessesArray.length === 1 && guessesArray[0].correct;

  if (isPerfect) return '🟪🟪🟪🟪';

  const rows = guessesArray.map(g => {
    let row = '';
    row += g.correct ? '🟩' : getUserEmoji(g.user.username, mode);
    row += g.rankHint === 'equal' ? '🟩' : (g.rankHint === 'higher' ? '⬆️' : '⬇️');
    row += g.correct ? '🟩' : (g.joinHint === 'earlier' ? '⬅️' : '➡️');
    row += g.correct ? '🟩' : ((g.roleClue === '-' || g.roleClue === 'No new shared roles!') ? '⬛' : '🟨');
    return row;
  });

  if (gaveUp) rows.push('🟥🟥🟥🟥');

  return rows.join('\n');
};

export default function App() {
  const shuffledModes = useMemo(() => {
    const seed = getDailySeed();
    const rng = mulberry32(seed);
    const modes = [...MODES];
    // Fisher-Yates shuffle with seeded RNG
    for (let i = modes.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [modes[i], modes[j]] = [modes[j], modes[i]];
    }
    return modes;
  }, []);

  const [currentMode, setCurrentMode] = useState(() => {
    const puzzleNum = getPuzzleNumber();
    for (const m of shuffledModes) {
      const saved = localStorage.getItem(`whodle_${m}_${puzzleNum}`);
      if (!saved || !JSON.parse(saved).gameOver) return m;
    }
    return shuffledModes[shuffledModes.length - 1]; // all modes complete, show last mode
  });

  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const currentModeIndex = shuffledModes.indexOf(currentMode);
  const isLastMode = currentMode === shuffledModes[shuffledModes.length - 1];
  const advanceMode = () => setCurrentMode(shuffledModes[currentModeIndex + 1]);

  const puzzleNum = getPuzzleNumber();
  const quizDay = isQuizDay(puzzleNum);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <span title="Stats: how well do you know everyone?" style={{ display: 'inline-flex', cursor: 'pointer', color: '#555' }} onClick={() => setShowStats(true)}>
          <BarChart3 size={24} />
        </span>
        <h1 style={styles.title}>
          {isAprilFools ? 'WHOMSTDLE' : 'WHODLE'}{' '}
          <span style={{ fontSize: '0.8em', opacity: 0.5, letterSpacing: '2px' }}>#{puzzleNum}</span>
        </h1>
        <CircleHelp
          size={24}
          style={{ cursor: 'pointer', color: '#555' }}
          onClick={() => setShowHelp(true)}
        />
      </div>

      {/* MODE PROGRESS INDICATOR */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '1.2rem' }}>
        {quizDay ? (
          <span title="quiz day" style={{ fontSize: '2.5rem' }}>{QUIZ_EMOJI}</span>
        ) : (() => {
          const activeMode = shuffledModes.find(m => {
            const s = localStorage.getItem(`whodle_${m}_${puzzleNum}`);
            return !s || !JSON.parse(s).gameOver;
          }) ?? shuffledModes[shuffledModes.length - 1];
          return shuffledModes.map(m => {
            const saved = localStorage.getItem(`whodle_${m}_${puzzleNum}`);
            const isDone = saved && JSON.parse(saved).gameOver;
            const isCurrent = m === currentMode;
            const isClickable = (isDone || m === activeMode) && !isCurrent;
            return (
              <React.Fragment key={m}>
                <span
                  title={m}
                  onClick={() => isClickable && setCurrentMode(m)}
                  style={{
                    opacity: isCurrent ? 1 : isDone || m === activeMode ? 1 : 0.25,
                    fontSize: isCurrent ? '2.5rem' : '1.1rem',
                    transition: 'all 0.2s',
                    cursor: isClickable ? 'pointer' : 'default',
                  }}
                >
                  {MODE_EMOJI[m]}
                </span>
              </React.Fragment>
            );
          });
        })()}
      </div>

      {quizDay ? (
        <Quiz puzzleNum={puzzleNum} />
      ) : (
        <Game
          key={currentMode}
          mode={currentMode}
          shuffledModes={shuffledModes}
          onNextRound={!isLastMode ? advanceMode : null}
        />
      )}

      {/* STATS MODAL */}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}

      {/* HELP MODAL */}
      {showHelp && (
        <div style={styles.modalOverlay} onClick={() => setShowHelp(false)}>
          <div style={styles.helpContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setShowHelp(false)}>&times;</button>

            <h2 style={{ marginTop: 0 }}>How to Play</h2>
            <p>A new puzzle is available every day at <strong>Midnight EST</strong>. Days alternate between <strong>Classic</strong> and <strong>Quiz</strong>.</p>

            <h3>{MODE_EMOJI.text}{MODE_EMOJI.image}{MODE_EMOJI.url} Classic</h3>
            <p>Guess which server member sent the message, image, or URL (three rounds played in order).</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>You have <strong>5 guesses</strong> per round.</li>
              <li>Complete all three rounds to share your combined results.</li>
              <li>Use <strong>Skip</strong> to skip a round and see the answer (counts as a loss).</li>
            </ul>

            <h3>{QUIZ_EMOJI} Quiz</h3>
            <p><strong>"How well do you know…?"</strong> One member is picked for the day. Judge {QUIZ_SIZE} posts one at a time: did they post it, or did someone else? Everyone gets the same member and the same posts.</p>

            <h3><BarChart3 size={18} style={{ verticalAlign: 'middle' }} /> Stats</h3>
            <p>Tap the chart icon to see how well you know each member, combining your Classic and Quiz results.</p>

            <h3>Clues Legend</h3>
            <table style={styles.legendTable}>
              <tbody>
                <tr style={styles.legendRow}>
                  <td style={styles.legendCell}><strong>Rank</strong></td>
                  <td style={styles.legendCell}>
                    <ArrowUp size={16} style={{ verticalAlign: 'middle' }} /> Target is <strong>Higher</strong> rank in the server<br />
                    <ArrowDown size={16} style={{ verticalAlign: 'middle' }} /> Target is <strong>Lower</strong> rank in the server
                  </td>
                </tr>
                <tr style={styles.legendRow}>
                  <td style={styles.legendCell}><strong>Joined</strong></td>
                  <td style={styles.legendCell}>
                    <ArrowLeft size={16} style={{ verticalAlign: 'middle' }} /> Target joined the server <strong>Earlier</strong><br />
                    <ArrowRight size={16} style={{ verticalAlign: 'middle' }} /> Target joined the server <strong>Later</strong>
                  </td>
                </tr>
                <tr style={styles.legendRow}>
                  <td style={styles.legendCell}><strong>Roles</strong></td>
                  <td style={styles.legendCell}>
                    Each incorrect guess reveals a random role shared between the target and your guess (if any). Clues won't repeat.
                    <br /><br /><strong>Role Pool</strong>:<br /> arom?, boomer shooters, exiles, jelley-events, lost arknights, PTCGP, qb-dungeoneers, Rat Gang, readers, riot-games, seattleite, tft, tractor?, val?, variety gamers?
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function UrlPreview({ url, preview }) {
  const [meta, setMeta] = useState(preview ? {
    publisher: preview.publisher,
    title: preview.title,
    description: preview.description,
    image: preview.image ? { url: preview.image } : null,
  } : null);
  const [loading, setLoading] = useState(!preview);

  useEffect(() => {
    if (preview) return; // skip live fetch if pre-generated preview exists

    const isYouTube = /youtube\.com\/watch|youtu\.be\//.test(url);

    if (isYouTube) {
      fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
        .then(res => res.json())
        .then(data => setMeta({
          publisher: data.provider_name,
          title: data.title,
          description: data.author_name,
          image: { url: data.thumbnail_url },
        }))
        .catch(() => { })
        .finally(() => setLoading(false));
    } else {
      fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') setMeta(data.data);
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    }
  }, [url, preview]);

  let domain = url;
  try { domain = new URL(url).hostname; } catch (_) { }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={styles.quoteBox}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#00AFF4', wordBreak: 'break-all' }}>
          {url}
        </a>
      </div>

      {!loading && meta && (
        <div style={{
          border: '1px solid #1e1f22',
          borderLeft: '4px solid #5865F2',
          borderRadius: '0 0 4px 4px',
          padding: '12px',
          background: '#232428',
          textAlign: 'left',
          marginTop: '-16px',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#949BA4', marginBottom: '4px' }}>
            {meta.publisher || domain}
          </div>
          {meta.title && (
            <div style={{ fontWeight: 'bold', color: '#00AFF4', marginBottom: '4px', fontSize: '0.95rem' }}>
              {meta.title}
            </div>
          )}
          {meta.description && (
            <div style={{
              fontSize: '0.85rem', color: '#dbdee1',
              marginBottom: meta.image?.url ? '8px' : 0,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {meta.description}
            </div>
          )}
          {meta.image?.url && (
            <img
              src={meta.image.url}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', objectFit: 'cover', display: 'block', marginTop: '8px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Game({ mode, shuffledModes, onNextRound }) {
  const [data, setData] = useState(null);
  const [targetMsg, setTargetMsg] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [input, setInput] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [combinedRank, setCombinedRank] = useState(null);

  const puzzleNum = getPuzzleNumber();
  const storageKey = `whodle_${mode}_${puzzleNum}`;

  useEffect(() => {
    fetch(`./${MODE_FILE[mode]}`)
      .then(res => res.json())
      .then(json => {
        setData(json);

        let chosenMsg = null;
        const msgPool = json.messages;

        // Holiday overrides
        const override = HOLIDAY_OVERRIDES[dateStr];
        if (override && override[mode]) {
          chosenMsg = json.messages.find(m => m.msg_id === override[mode]) || null;
        }

        if (!chosenMsg) {
          const seed = getDailySeed() + MODE_SEED_OFFSET[mode];
          const rng = mulberry32(seed);
          const randIndex = Math.floor(rng() * msgPool.length);
          chosenMsg = msgPool[randIndex];
        }

        setTargetMsg(chosenMsg);

        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setGuesses(parsed.guesses);
          setGameOver(parsed.gameOver);
          if (parsed.gaveUp) setGaveUp(true);
        }
      });
  }, [mode, storageKey]);

  useEffect(() => {
    if (!targetMsg) return;
    const seed = getDailySeed();
    // targetId lets the stats screen attribute this round to a member even on a loss
    localStorage.setItem(storageKey, JSON.stringify({ seed, guesses, gameOver, gaveUp, targetId: targetMsg.author_id }));

    // Update combined rank if all modes are complete
    const allComplete = MODES.every(m => {
      const saved = localStorage.getItem(`whodle_${m}_${puzzleNum}`);
      return saved && JSON.parse(saved).gameOver;
    });
    if (allComplete) {
      setCombinedRank(getRank(shuffledModes, puzzleNum));
    }
  }, [guesses, gameOver, gaveUp, targetMsg, shuffledModes, puzzleNum]);

  const filteredUsers = useMemo(() => {
    if (!data || !input) return [];
    const searchStr = input.toLowerCase();

    const matches = Object.values(data.users).filter(u =>
      u.username.toLowerCase().includes(searchStr) ||
      u.nickname.toLowerCase().includes(searchStr) ||
      u.display_name.toLowerCase().includes(searchStr)
    );

    matches.sort((a, b) => {
      const getScore = (u) => {
        const names = [u.username, u.nickname, u.display_name].map(n => n.toLowerCase());
        if (names.some(n => n === searchStr)) return 0;
        if (names.some(n => n.startsWith(searchStr))) return 1;
        return 2;
      };
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.nickname.length - b.nickname.length;
    });

    return matches;
  }, [data, input]);

  const handleGuess = (user) => {
    if (gameOver) return;
    if (guesses.some(g => g.user.id === user.id)) return;

    const targetUser = data.users[targetMsg.author_id];
    const rankDir = user.rank_val === targetUser.rank_val ? 'equal' : (user.rank_val > targetUser.rank_val ? 'higher' : 'lower');
    const joinDir = user.joined_at === targetUser.joined_at ? 'equal' : (user.joined_at > targetUser.joined_at ? 'earlier' : 'later');

    const isCorrect = user.id === targetUser.id;
    let roleClueText = '';

    if (isCorrect) {
      roleClueText = 'Correct!';
    } else {
      const sharedRoles = user.clues.filter(c => targetUser.clues.includes(c));
      if (sharedRoles.length === 0) {
        roleClueText = '-';
      } else {
        const previouslyRevealed = new Set(
          guesses.map(g => g.roleClue).filter(t => t && t !== '-' && t !== 'No new shared roles!' && t !== 'Correct!')
        );
        const candidates = sharedRoles.filter(r => !previouslyRevealed.has(r));
        roleClueText = candidates.length === 0 ? 'No new shared roles!' : candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    const newGuess = {
      user,
      correct: isCorrect,
      rankHint: rankDir,
      joinHint: joinDir,
      guessIndex: guesses.length,
      sharedClues: user.clues.filter(c => targetUser.clues.includes(c)),
      roleClue: roleClueText
    };

    const updatedGuesses = [...guesses, newGuess];
    setGuesses(updatedGuesses);
    setInput('');

    if (newGuess.correct || updatedGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
    }
  };

  const handleGiveUp = () => {
    setGaveUp(true);
    setGameOver(true);
  };

  // All 3 modes must be complete before sharing
  const canShareCombined = gameOver && MODES.every(m => {
    if (m === mode) return gameOver;
    const saved = localStorage.getItem(`whodle_${m}_${puzzleNum}`);
    return saved && JSON.parse(saved).gameOver;
  });

  const handleCombinedShare = () => {
    const rank = combinedRank || getRank(shuffledModes, puzzleNum);

    let text = `${isAprilFools ? 'WHOMSTDLE' : 'WHODLE'} #${puzzleNum}\n`;

    for (const m of shuffledModes) {
      const saved = localStorage.getItem(`whodle_${m}_${puzzleNum}`);
      const d = saved ? JSON.parse(saved) : { guesses: [], gaveUp: false };
      const g = d.guesses || [];
      const gu = d.gaveUp || false;
      const isWin = !gu && g.length > 0 && g[g.length - 1].correct;
      const score = isWin ? g.length : 'X';
      text += `${MODE_EMOJI[m]}: ${score}/${MAX_GUESSES}\n${generateGridString(g, gu, m)}\n`;
    }
    text += `Rank: ${rank}\n`;
    text += 'https://vsporeddy.github.io/whodle/';

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEndGameMessage = () => {
    if (guesses.length === 0 && !gaveUp) return "";
    const isWin = !gaveUp && guesses.length > 0 && guesses[guesses.length - 1].correct;
    if (isWin && guesses.length === 1) return "One shot! 🌟";
    const seed = getDailySeed();
    const list = isWin ? WIN_MESSAGES : LOSE_MESSAGES;
    return list[seed % list.length];
  };

  const getDiscordLink = () => {
    if (!data || !targetMsg) return '#';
    return `https://discord.com/channels/${data.meta.guild_id}/${targetMsg.channel_id}/${targetMsg.msg_id}`;
  };

  if (!data || !targetMsg) return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>;

  const guessesRemaining = MAX_GUESSES - guesses.length;
  const placeholders = { text: 'Who said it...?', image: 'Who posted it...?', url: 'Who shared it...?' };
  const revealLabels = { text: 'message was sent', image: 'image was posted', url: 'link was shared' };

  function GuessRow({ guess }) {
    const GREEN = '#23a559';
    const YELLOW = '#f0b232';
    const GREY = '#4e5058';

    const getRoleBg = (text, isCorrect) => {
      if (isCorrect) return GREEN;
      if (text === '-' || text === 'No new shared roles!') return GREY;
      return YELLOW;
    };

    return (
      <div style={styles.row}>
        <div style={{ ...styles.cell, background: guess.correct ? GREEN : GREY, justifyContent: 'flex-start', gap: '10px', textOverflow: 'ellipsis' }}>
          <img src={guess.user.avatar} style={styles.avatarSmall} alt="" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{guess.user.display_name}</span>
        </div>
        <div style={{ ...styles.cell, background: guess.correct ? GREEN : (guess.rankHint === 'equal' ? GREEN : GREY) }}>
          {guess.rankHint === 'equal' ? <Check size={16} /> : guess.rankHint === 'higher' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
        </div>
        <div style={{ ...styles.cell, background: guess.correct ? GREEN : (guess.joinHint === 'equal' ? YELLOW : GREY) }}>
          {guess.joinHint === 'equal' ? <Check size={16} /> : guess.joinHint === 'earlier' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </div>
        <div style={{
          ...styles.cell,
          background: getRoleBg(guess.roleClue, guess.correct),
          fontSize: guess.roleClue === 'No new shared roles!' ? '0.7rem' : '0.85rem',
          flexDirection: 'column',
          lineHeight: '1.1',
          textAlign: 'center',
          wordBreak: 'break-word',
          padding: '5px'
        }}>
          {guess.roleClue === 'Correct!' ? <Check size={16} /> : guess.roleClue}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* MESSAGE DISPLAY */}
      <PostDisplay msg={targetMsg} users={data.users} />

      {/* INPUT */}
      {!gameOver && (
        <>
          <div style={styles.inputGroup}>
            <input
              style={styles.input}
              placeholder={placeholders[mode]}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {input && (
              <div style={styles.dropdown}>
                {filteredUsers.map(u => {
                  const isGuessed = guesses.some(g => g.user.id === u.id);
                  return (
                    <div
                      key={u.id}
                      style={isGuessed ? styles.disabledItem : styles.dropdownItem}
                      onClick={() => !isGuessed && handleGuess(u)}
                    >
                      <img src={u.avatar} style={styles.avatarSmall} alt="" />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {u.display_name} {isGuessed && "(Already Guessed)"}
                        </span>
                        <span><small style={{ color: '#666' }}>({u.username})</small></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={styles.guessCounter}>
              {guessesRemaining} guess{guessesRemaining !== 1 ? 'es' : ''} remaining
            </div>
          </div>
        </>
      )}

      {/* GUESS GRID */}
      <div style={styles.grid}>
        {guesses.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 2fr', gap: '5px', fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px', color: '#dbdee1' }}>
            <span>User</span><span>Rank</span><span>Joined</span><span>Roles</span>
          </div>
        )}
        {guesses.map((g, i) => <GuessRow key={i} guess={g} />)}
      </div>

      {!gameOver && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button style={styles.btnDanger} onClick={handleGiveUp}>
            SKIP
          </button>
        </div>
      )}

      {/* GAME OVER */}
      {gameOver && (
        <div style={styles.resultsBox}>
          <h2 style={{ marginTop: 0 }}>{getEndGameMessage()}</h2>

          <div style={{ marginBottom: '20px' }}>
            The {revealLabels[mode]} by:<br />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
              <img src={data.users[targetMsg.author_id].avatar} style={styles.avatarSmall} alt="" />
              <strong>{data.users[targetMsg.author_id].display_name}</strong>
            </div>
          </div>

          {canShareCombined && combinedRank && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.2rem' }}>Rank:</span>
              <strong style={{ fontSize: '2rem', color: '#5865F2', transform: 'translateY(3px)' }}>{combinedRank}</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {onNextRound ? (
              <button onClick={onNextRound} style={styles.btnPrimary}>
                Next →
              </button>
            ) : (
              canShareCombined && (
                <button onClick={handleCombinedShare} style={styles.btnPrimary}>
                  <Share2 size={18} /> {copied ? "Copied!" : "Share Results"}
                </button>
              )
            )}
            <a href={getDiscordLink()} target="_blank" rel="noopener noreferrer" style={styles.btnSecondary}>
              <ExternalLink size={18} /> Jump to Message
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Renders a single post (text / image / url) the same way in daily and quiz modes
function PostDisplay({ msg, users }) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (msg.type === 'image') {
    return (
      <>
        <img
          src={msg.content}
          style={styles.imagePreview}
          alt="Image"
          onClick={() => setIsZoomed(true)}
          title="Click to zoom"
        />
        {isZoomed && (
          <div style={styles.modalOverlay} onClick={() => setIsZoomed(false)}>
            <img src={msg.content} style={styles.modalImage} alt="Zoomed" />
          </div>
        )}
      </>
    );
  }
  if (msg.type === 'url') {
    return <UrlPreview url={msg.content} preview={msg.preview} />;
  }
  return <div style={styles.quoteBox}>"{formatMessageContent(msg.content, users)}"</div>;
}

// QUIZ MODE (daily): "How well do you know X?" — same member and posts for everyone that day
function Quiz({ puzzleNum }) {
  const [datasets, setDatasets] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [items, setItems] = useState(null);       // [{ msg, isTarget }]
  const [answers, setAnswers] = useState([]);     // [{ correct, isTarget, type }]
  const [feedback, setFeedback] = useState(null); // { correct, author, msg } for the post just answered
  const [copied, setCopied] = useState(false);

  const storageKey = `whodle_quiz_${puzzleNum}`;

  useEffect(() => {
    Promise.all(MODES.map(m => fetch(`./${MODE_FILE[m]}`).then(res => res.json())))
      .then(([text, image, url]) => {
        const ds = { text, image, url };
        const rng = mulberry32(getDailySeed() + QUIZ_SEED_OFFSET);
        const user = pickQuizUser(ds, rng);
        const built = user ? buildQuiz(ds, user.id, rng) : null;
        if (!built) { setLoadError(true); return; }

        // Restore today's progress (only if it was built for the same member)
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.targetId === user.id && Array.isArray(parsed.answers)) {
            setAnswers(parsed.answers.slice(0, built.length));
          }
        }

        setDatasets(ds);
        setTargetUser(user);
        setItems(built);
      })
      .catch(() => setLoadError(true));
  }, [storageKey]);

  const users = datasets?.text.users;
  const index = answers.length;
  const finished = !!items && index >= items.length;
  const correctCount = answers.filter(a => a.correct).length;

  // Persist progress
  useEffect(() => {
    if (!items || !targetUser) return;
    localStorage.setItem(storageKey, JSON.stringify({
      seed: getDailySeed(),
      targetId: targetUser.id,
      answers,
      gameOver: answers.length >= items.length
    }));
  }, [answers, items, targetUser, storageKey]);

  const handleAnswer = (guessIsTarget) => {
    if (!items || feedback || finished) return;
    const item = items[index];
    const correct = guessIsTarget === item.isTarget;
    setAnswers(prev => [...prev, { correct, isTarget: item.isTarget, type: item.msg.type }]);
    setFeedback({ correct, author: users[item.msg.author_id], msg: item.msg });
  };

  const handleNext = () => {
    if (!feedback) return;
    setFeedback(null);
    window.scrollTo({ top: 0 });
  };

  // Keyboard shortcuts: 1 / Y / <- = them, 2 / N / -> = someone else, Enter / Space = next
  useEffect(() => {
    if (!items || (finished && !feedback)) return;
    const onKey = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (feedback) {
        if (k === 'enter' || k === ' ' || k === 'arrowright') { e.preventDefault(); handleNext(); }
        return;
      }
      if (k === '1' || k === 'y' || k === 'arrowleft') handleAnswer(true);
      else if (k === '2' || k === 'n' || k === 'arrowright') handleAnswer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleShare = () => {
    const rank = getQuizRank(correctCount, items.length);
    const userEmoji = getUserEmoji(targetUser.username).replace(/\|\|/g, '');
    let text = `${isAprilFools ? 'WHOMSTDLE' : 'WHODLE'} #${puzzleNum}\n`;
    text += `**${targetUser.display_name}** ${userEmoji}\n`;
    text += `${generateQuizGridString(answers)}\n`;
    text += `Score: ${correctCount}/${items.length}\n`;
    text += `Rank: ${rank}\n`;
    text += 'https://vsporeddy.github.io/whodle/';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDiscordLink = (msg) =>
    `https://discord.com/channels/${datasets.text.meta.guild_id}/${msg.channel_id}/${msg.msg_id}`;

  // ---------- RENDER ----------
  if (loadError) return <div style={{ padding: '20px', color: 'white' }}>Couldn't load today's quiz. Try refreshing.</div>;
  if (!datasets || !items) return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>;

  // RESULTS (once the last post has been answered and its feedback dismissed)
  if (finished && !feedback) {
    const rank = getQuizRank(correctCount, items.length);
    const byType = MODES.map(m => {
      const ofType = answers.filter(a => a.type === m);
      return { mode: m, correct: ofType.filter(a => a.correct).length, total: ofType.length };
    }).filter(t => t.total > 0);
    const actualTargetCount = items.filter(i => i.isTarget).length;

    return (
      <div style={styles.container}>
        <div style={styles.resultsBox}>
          <div style={{ color: '#949BA4', fontSize: '0.85rem', marginBottom: '6px' }}>How well do you know</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
            <img src={targetUser.avatar} style={styles.avatarSmall} alt="" />
            <strong style={{ fontSize: '1.2rem' }}>{targetUser.display_name}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>Rank:</span>
            <strong style={{ fontSize: '3rem', color: '#5865F2', transform: 'translateY(4px)' }}>{rank}</strong>
          </div>
          <h2 style={{ margin: '5px 0 0' }}>{getQuizRankMessage(rank)}</h2>
          <div style={{ fontSize: '1.1rem', marginTop: '10px' }}>
            <strong>{correctCount}</strong> / {items.length} correct
          </div>
          <div style={{ fontSize: '0.8rem', color: '#949BA4', marginTop: '4px' }}>
            {actualTargetCount} of the {items.length} posts were really theirs
          </div>

          <div style={styles.quizGrid}>
            {answers.map((a, i) => (
              <div
                key={i}
                style={{ ...styles.quizGridCell, background: a.correct ? '#23a559' : '#da373c' }}
                title={`#${i + 1}: ${a.correct ? 'correct' : 'wrong'} (${a.type}${a.isTarget ? ', theirs' : ', decoy'})`}
              >
                {MODE_EMOJI[a.type]}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', fontSize: '0.9rem', color: '#dbdee1', marginBottom: '20px', flexWrap: 'wrap' }}>
            {byType.map(t => (
              <span key={t.mode}>{MODE_EMOJI[t.mode]} {t.correct}/{t.total}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleShare} style={styles.btnPrimary}>
              <Share2 size={18} /> {copied ? 'Copied!' : 'Share Results'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUESTION (or feedback for the post just answered)
  const item = feedback ? items[index - 1] : items[index];
  const shownIndex = feedback ? index - 1 : index;
  const wrongCount = answers.length - correctCount;

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
        <img src={targetUser.avatar} style={styles.avatarSmall} alt="" />
        <span>Did <strong>{targetUser.display_name}</strong> post this?</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#949BA4' }}>
        <span>{shownIndex + 1} / {items.length}</span>
        <span>✅ {correctCount} · ❌ {wrongCount}</span>
      </div>
      <div style={styles.quizProgressTrack}>
        <div style={{ ...styles.quizProgressFill, width: `${(shownIndex / items.length) * 100}%` }} />
      </div>

      <PostDisplay key={item.msg.msg_id} msg={item.msg} users={users} />

      {!feedback ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.quizChoiceYes} onClick={() => handleAnswer(true)} title="Shortcut: 1, Y, or Left arrow">
            <Check size={18} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>yup that's {targetUser.display_name}</span>
          </button>
          <button style={styles.quizChoiceNo} onClick={() => handleAnswer(false)} title="Shortcut: 2, N, or Right arrow">
            <X size={18} /> not {targetUser.display_name}
          </button>
        </div>
      ) : (
        <>
          <div style={{ ...styles.quizFeedback, background: feedback.correct ? '#23a559' : '#da373c' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '6px' }}>
              {feedback.correct ? 'Correct!' : 'Nope.'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem' }}>
              Posted by
              <img src={feedback.author?.avatar} style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="" />
              <strong>{feedback.author?.display_name || 'Unknown'}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleNext} style={styles.btnPrimary} autoFocus>
              {index >= items.length ? 'See results' : 'Next →'}
            </button>
            <a href={getDiscordLink(feedback.msg)} target="_blank" rel="noopener noreferrer" style={{ ...styles.btnSecondary, padding: '12px 16px' }} title="Jump to message">
              <ExternalLink size={18} />
            </a>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- STATS ----------
// Per-member knowledge score built from saved Classic rounds and Quiz days in localStorage.
//   Classic round: 100 for a 1-guess win, 80 / 60 / 40 / 20 for 2-5 guesses, 0 for a loss or skip.
//   Quiz day:      percent of posts called correctly. Weighs STATS_QUIZ_WEIGHT classic rounds.
//   Composite:     weighted average of the above.
const collectStats = () => {
  const stats = {}; // userId -> { classic: [scores], classicWins, quiz: [scores], quizBest }
  const entry = (id) => (stats[id] ||= { classic: [], classicWins: 0, quiz: [], quizBest: 0 });

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    let parsed;
    try { parsed = JSON.parse(localStorage.getItem(key)); } catch { continue; }
    if (!parsed || typeof parsed !== 'object') continue;

    const classic = key.match(/^whodle_(text|image|url)_(\d+)$/);
    if (classic) {
      if (!parsed.gameOver) continue;
      const guesses = parsed.guesses || [];
      const won = !parsed.gaveUp && guesses.length > 0 && guesses[guesses.length - 1].correct;
      // Older saves lack targetId; on a win the last guess is the target
      const targetId = parsed.targetId || (won ? guesses[guesses.length - 1].user?.id : null);
      if (!targetId) continue;
      const e = entry(targetId);
      e.classic.push(won ? Math.round((MAX_GUESSES + 1 - guesses.length) / MAX_GUESSES * 100) : 0);
      if (won) e.classicWins += 1;
      continue;
    }

    const quiz = key.match(/^whodle_quiz_(\d+)$/);
    if (quiz) {
      if (!parsed.gameOver || !parsed.targetId || !Array.isArray(parsed.answers) || parsed.answers.length === 0) continue;
      const correct = parsed.answers.filter(a => a.correct).length;
      const pct = Math.round(correct / parsed.answers.length * 100);
      const e = entry(parsed.targetId);
      e.quiz.push(pct);
      e.quizBest = Math.max(e.quizBest, pct);
    }
  }

  for (const e of Object.values(stats)) {
    const weight = e.classic.length + e.quiz.length * STATS_QUIZ_WEIGHT;
    const sum = e.classic.reduce((s, v) => s + v, 0) + e.quiz.reduce((s, v) => s + v, 0) * STATS_QUIZ_WEIGHT;
    e.composite = weight > 0 ? Math.round(sum / weight) : 0;
  }
  return stats;
};

const scoreColor = (score) => {
  if (score >= 80) return '#23a559';
  if (score >= 50) return '#f0b232';
  if (score >= 25) return '#e67e22';
  return '#da373c';
};

function StatsModal({ onClose }) {
  const [users, setUsers] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const stats = useMemo(() => collectStats(), []);

  useEffect(() => {
    fetch(`./${MODE_FILE.text}`)
      .then(res => res.json())
      .then(json => setUsers(json.users))
      .catch(() => setLoadError(true));
  }, []);

  const rows = useMemo(() => {
    if (!users) return [];
    return Object.entries(stats)
      .map(([id, s]) => ({ id, user: users[id], ...s }))
      .filter(r => r.user)
      .sort((a, b) => b.composite - a.composite || a.user.display_name.localeCompare(b.user.display_name, undefined, { sensitivity: 'base' }));
  }, [users, stats]);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.helpContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        <h2 style={{ marginTop: 0, marginBottom: '4px' }}>How well do you know…</h2>
        <p style={{ marginTop: 0, fontSize: '0.85rem', color: '#dbdee1', opacity: 0.8 }}>
          Combined from your Classic rounds and Quiz days on this device.
        </p>

        {loadError && <p>Couldn't load member data.</p>}
        {!loadError && !users && <p>Loading...</p>}
        {users && rows.length === 0 && (
          <p style={{ color: '#dbdee1' }}>No results yet. Finish a Classic round or a Quiz day and check back.</p>
        )}

        {rows.length > 0 && (
          <div style={{ ...styles.quizUserList, maxHeight: 'none', marginTop: 0 }}>
            {rows.map(r => (
              <div key={r.id} style={{ ...styles.dropdownItem, cursor: 'default' }}>
                <img src={r.user.avatar} style={styles.avatarSmall} alt="" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.3', flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{r.user.display_name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#949BA4' }}>
                    {r.classic.length > 0 && `🎯 ${r.classicWins}W ${r.classic.length - r.classicWins}L`}
                    {r.classic.length > 0 && r.quiz.length > 0 && ' · '}
                    {r.quiz.length > 0 && `${QUIZ_EMOJI} ${r.quizBest}%${r.quiz.length > 1 ? ` best of ${r.quiz.length}` : ''}`}
                  </span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.3rem', color: scoreColor(r.composite), minWidth: '48px', textAlign: 'right' }} title="Knowledge score (0-100)">
                  {r.composite}
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: '0.75rem', color: '#dbdee1', opacity: 0.7, marginBottom: 0, marginTop: '15px', lineHeight: '1.4' }}>
          Score 0-100. Classic: 100 for a one-shot win, down to 20 for a five-guess win, 0 for a loss or skip.
          Quiz: percent correct, weighted {STATS_QUIZ_WEIGHT}× a Classic round.
        </p>
      </div>
    </div>
  );
}
