import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check, Share2, ExternalLink, Image as ImageIcon, MessageSquare, CircleHelp } from 'lucide-react';

// CONFIGURATION
const MAX_GUESSES = 5;

// FLAVOR TEXT OPTIONS
const WIN_MESSAGES = ["Oh??", "🤠", "👀", "Good job, bud.", "EZ."];
const LOSE_MESSAGES = ["Yikes.", "Bro??", "Skill Issue?", "Uhhh...", "Frick!"];

// STYLES (Discord Dark Theme)
const styles = {
  title: { maxWidth: '600px', margin: '0 auto', padding: '2px', fontFamily: 'normal Helvetica', textAlign: 'center', letterSpacing: '5px', textShadow: '-5px 5px 10px rgba(0, 0, 0, 0.75)' },
  subtitle: { maxWidth: '300px', margin: '0 auto', padding: '2px', marginBottom: '10px', fontFamily: 'normal Helvetica', textAlign: 'center', letterSpacing: '1px' },
  container: { maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', paddingBottom: '50px' },
  tabContainer: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  tab: (isActive) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    borderRadius: '4px',
    border: isActive ? '1px solid #949BA4' : 'none',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: isActive ? '#5865F2' : '#4f545c',
    color: 'white',
    transition: 'all 0.2s'
  }),
  imagePreview: { maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', marginBottom: '20px', cursor: 'zoom-in', transition: 'transform 0.1s', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' },
  quoteBox: { background: '#2b2d31', borderLeft: '4px solid #5865F2', padding: '15px', borderRadius: '4px', fontSize: '1.1rem', marginBottom: '20px', textAlign: 'left', color: '#dbdee1' },
  inputGroup: { position: 'relative', marginBottom: '10px' },
  input: { width: '100%', padding: '15px', fontSize: '1rem', borderRadius: '8px', border: 'none', background: '#383a40', color: 'white', outline: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
  dropdown: { position: 'absolute', width: '100%', maxHeight: '200px', overflowY: 'auto', background: '#2b2d31', borderRadius: '0 0 8px 8px', zIndex: 10, textAlign: 'left', boxShadow: '0 4px 6px rgba(0,0,0,0.5)' },
  dropdownItem: { padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1e1f22', color: '#dbdee1' },
  disabledItem: { padding: '10px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1e1f22', color: '#dbdee1', opacity: 0.5, background: '#232428' },
  grid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: '8px' },
  cell: { padding: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'white', fontWeight: 'bold', boxShadow: '0 2px 2px rgba(0,0,0,0.2)', minWidth: 0, overflow: 'hidden' },
  avatarSmall: { width: '30px', height: '30px', borderRadius: '50%' },
  btnPrimary: { background: '#5865F2', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' },
  btnSecondary: { background: '#4f545c', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' },
  resultsBox: { marginTop: '30px', padding: '20px', background: '#2b2d31', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' },
  guessCounter: { fontSize: '0.9rem', color: '#949BA4', marginBottom: '20px', marginTop: '5px' },
  difficultyBadge: {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '15px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '30px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  aiHintBox: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e3f2fd', // Light Blue
    border: '1px solid #90caf9',
    borderRadius: '8px',
    color: '#0d47a1',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    justifyContent: 'center'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, 
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Dark transparent background
    zIndex: 2000, // On top of everything
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // cursor: 'zoom-out'
  },
  modalImage: {
    maxWidth: '95vw', // Max 95% of viewport width
    maxHeight: '95vh', // Max 95% of viewport height
    borderRadius: '4px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  },
    header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px',
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px'
  },
  // HELP MODAL
  helpContent: {
    backgroundColor: '#4f545c',
    padding: '25px',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    textAlign: 'left',
    position: 'relative',
    lineHeight: '1.6'
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666'
  },
  legendTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px'
  },
  legendRow: {
    borderBottom: '1px solid #eee'
  },
  legendCell: {
    padding: '8px',
    fontSize: '0.9rem'
  },
  dateDisplay: {
    position: 'fixed',
    top: '10px',
    left: '10px',
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 'bold',
    zIndex: 1000,
    backgroundColor: '#383a40',
    padding: '4px 8px',
    borderRadius: '4px',
    pointerEvents: 'none' 
  }
};

const GAME_START_DATE = new Date('2025-12-01T00:00:00'); 

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
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const getPuzzleNumber = () => {
  const current = new Date(dateStr);
  const start = new Date(GAME_START_DATE.toLocaleDateString("en-US", { timeZone: "America/New_York" }));

  const diffTime = current - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // +1 because Dec 1st should be #1, not #0
  return Math.max(1, diffDays + 1);
};

const getDifficultyColor = (label) => {
  switch(label) {
    case 'Easy': return 'rgba(106, 170, 100, 0.3)'; 
    case 'Medium': return 'rgba(201, 180, 88, 0.3)';
    case 'Hard': return 'rgba(229, 115, 115, 0.3)';
    default: return 'rgba(120, 124, 126, 0.3)';
  }
};

const getUserEmoji = (username) => {
  // Maintain alphabetical order
  if (!username) return '||🤠||';
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
    case 'timmy.tam' : return '||:TimmahSuh:||';
    case 'tothemoonn': return '||:audacity:||';
    case 'zalteo': return '||:ZalteoSup:||';
    default: return '||🤠||';
  }
};

const generateGridString = (guessesArray) => {
  return guessesArray.map(g => {
    let row = '';
    row += g.correct ? '🟩' : getUserEmoji(g.user.username);
    row += g.rankHint === 'equal' ? '🟩' : (g.rankHint === 'higher' ? '⬆️' : '⬇️');
    row += g.correct ? '🟩' : (g.joinHint === 'earlier' ? '⬅️' : '➡️');
    if (g.correct) row += '🟩';
    else row += g.roleSimilarity === 100 ? '🟩' : g.roleSimilarity > 30 ? '🟨' : '⬛';
    return row;
  }).join('\n') + '\n';
};

export default function App() {
  const [mode, setMode] = useState('text'); // 'text' or 'image'
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.dateDisplay}>
        {todayStr}
      </div>
      
      {/* 2. HEADER WITH HELP BUTTON */}
      <div style={styles.header}>
        <div style={{width: '24px'}}></div> {/* Spacer to center title */}
        <h1 style={styles.title}>WHODLE</h1>
        <CircleHelp 
          size={24} 
          style={{cursor: 'pointer', color: '#555'}} 
          onClick={() => setShowHelp(true)}
        />
      </div>

      {/* MODE TABS */}
      <div style={styles.tabContainer}>
        <button style={styles.tab(mode === 'text')} onClick={() => setMode('text')}>
          <MessageSquare size={18} /> Text
        </button>
        <button style={styles.tab(mode === 'image')} onClick={() => setMode('image')}>
          <ImageIcon size={18} /> Image
        </button>
      </div>
      <Game key={mode} mode={mode} />

      {/* 3. HELP MODAL */}
      {showHelp && (
        <div style={styles.modalOverlay} onClick={() => setShowHelp(false)}>
          <div style={styles.helpContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setShowHelp(false)}>&times;</button>
            
            <h2 style={{marginTop: 0}}>How to Play</h2>
            <p>Guess which server member sent the message or image.</p>
            <ul style={{paddingLeft: '20px'}}>
              <li>You have <strong>5 guesses</strong> per game mode (text and image).</li>
              <li>A new puzzle is available every day at <strong>Midnight EST</strong>.</li>
              <li>Complete both game modes to share your combined score.</li>
            </ul>

            <h3>Clues Legend</h3>
            <table style={styles.legendTable}>
              <tbody>
                <tr style={styles.legendRow}>
                  <td style={styles.legendCell}><strong>Rank</strong></td>
                  <td style={styles.legendCell}>
                    <ArrowUp size={16} style={{verticalAlign: 'middle'}}/> Target is <strong>Higher</strong> rank in the server<br/>
                    <ArrowDown size={16} style={{verticalAlign: 'middle'}}/> Target is <strong>Lower</strong> rank in the server
                  </td>
                </tr>
                <tr style={styles.legendRow}>
                  <td style={styles.legendCell}><strong>Joined</strong></td>
                  <td style={styles.legendCell}>
                    <ArrowLeft size={16} style={{verticalAlign: 'middle'}}/> Target joined the server <strong>Earlier</strong><br/>
                    <ArrowRight size={16} style={{verticalAlign: 'middle'}}/> Target joined the server <strong>Later</strong><br/>
                  </td>
                </tr>
                <tr style={styles.legendRow}>
                  <td style={styles.legendCell}><strong>Roles</strong></td>
                  <td style={styles.legendCell}>
                    Each incorrect guess will reveal a random role shared between the target and your guess, from the pool below (if any exist). Clues will not repeat.
                    <br/><br/><strong>Role Pool</strong>:<br/> arom?, boomer shooters, exiles, jelley-events, lost arknights, PTCGP, qb-dungeoneers, Rat Gang, readers, riot-games, seattleite, tft, tractor?, val?, variety gamers?
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

function Game({ mode }) {
  const [data, setData] = useState(null);
  const [targetMsg, setTargetMsg] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [input, setInput] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const puzzleNum = getPuzzleNumber();
  const storageKey = `whodle_${mode}_${puzzleNum}`;
  const otherMode = mode === 'text' ? 'image' : 'text';
  const otherStorageKey = `whodle_${otherMode}_${puzzleNum}`;

  const otherModeData = useMemo(() => {
    const saved = localStorage.getItem(otherStorageKey);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed.gameOver ? parsed : null;
  }, [otherStorageKey, mode]);

  const canShareCombined = gameOver && otherModeData !== null;

  const handleCombinedShare = () => {
    if (!canShareCombined) return;

    // Prepare current mode data
    const curScore = guesses[guesses.length - 1].correct ? guesses.length : 'X';
    const curGrid = generateGridString(guesses);
    
    // Prepare other mode data
    const otherGuesses = otherModeData.guesses;
    const otherScore = otherGuesses[otherGuesses.length - 1].correct ? otherGuesses.length : 'X';
    const otherGrid = generateGridString(otherGuesses);

    let text = `WHODLE #${puzzleNum}\n`;

    if (mode === 'text') {
      text += `💬: ${curScore}/${MAX_GUESSES}\n${curGrid}\n`;
      text += `📸 : ${otherScore}/${MAX_GUESSES}\n${otherGrid}`;
    } else {
      text += `💬: ${otherScore}/${MAX_GUESSES}\n${otherGrid}\n`;
      text += `📸: ${curScore}/${MAX_GUESSES}\n${curGrid}`;
    }

    text += 'https://vsporeddy.github.io/whodle/';

    navigator.clipboard.writeText(text);
    setCopied('combined');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const filename = mode === 'text' ? 'filtered_text_data.json' : 'filtered_image_data.json';
    fetch(`./${filename}`)
      .then(res => res.json())
      .then(json => {
        setData(json);

        const msgPool = json.messages;
        const seed = getDailySeed();
        // if (mode === 'image') seed += 999; // Offset for image mode
        const rng = mulberry32(seed); 
        const randIndex = Math.floor(rng() * msgPool.length);
        
        setTargetMsg(msgPool[randIndex]);
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.seed === seed) {
            setGuesses(parsed.guesses);
            setGameOver(parsed.gameOver);
          }
        }
      });
  }, [mode, storageKey]);

  useEffect(() => {
    if (!targetMsg) return;
    const seed = getDailySeed();
    localStorage.setItem(storageKey, JSON.stringify({
      seed, guesses, gameOver
    }));
  }, [guesses, gameOver, targetMsg]);

  // Search and filtering
  const filteredUsers = useMemo(() => {
    if (!data || !input) return [];
    const searchStr = input.toLowerCase();
    
    // All matching users
    const matches = Object.values(data.users).filter(u => 
      u.username.toLowerCase().includes(searchStr) || 
      u.nickname.toLowerCase().includes(searchStr) || 
      u.display_name.toLowerCase().includes(searchStr)
    );

    // Sort by relevance
    matches.sort((a, b) => {
      const getScore = (u) => {
        const names = [u.username, u.nickname, u.display_name].map(n => n.toLowerCase());
        if (names.some(n => n === searchStr)) return 0; // Exact match
        if (names.some(n => n.startsWith(searchStr))) return 1; // Starts with
        return 2; // Contains
      };

      const scoreA = getScore(a);
      const scoreB = getScore(b);

      if (scoreA !== scoreB) return scoreA - scoreB;
      // Tie-breaker: shorter nickname first
      return a.nickname.length - b.nickname.length;
    });

    return matches;
  }, [data, input]);

  const handleGuess = (user) => {
    if (gameOver) return;
    if (guesses.some(g => g.user.id === user.id)) return;

    const guessIndex = guesses.length;

    const targetUser = data.users[targetMsg.author_id];
    
    const rankDir = user.rank_val === targetUser.rank_val ? 'equal' : (user.rank_val > targetUser.rank_val ? 'higher' : 'lower');
    const joinDir = user.joined_at === targetUser.joined_at ? 'equal' : (user.joined_at > targetUser.joined_at ? 'earlier' : 'later');

    const roleSimilarity = calculateSimilarity(user, targetUser);

    const isCorrect = user.id === targetUser.id;
    let roleClueText = '';

    if (isCorrect) {
      roleClueText = 'Correct!';
    } else {
      const sharedRoles = user.clues.filter(c => targetUser.clues.includes(c));
      if (sharedRoles.length === 0) {
        roleClueText = "-";
      } else {
        const previouslyRevealed = new Set(
          guesses.map(g => g.roleClue).filter(t => t && t !== '-' && t !== 'No new shared roles!' && t !== 'Correct!')
        );
        const candidates = sharedRoles.filter(r => !previouslyRevealed.has(r));
        if (candidates.length === 0) {
           roleClueText = "No new shared roles!";
        } else {
           const randomRole = candidates[Math.floor(Math.random() * candidates.length)];
           roleClueText = randomRole;
        }
      }
    }

    const newGuess = {
      user: user,
      correct: isCorrect,
      rankHint: rankDir,
      joinHint: joinDir,
      guessIndex: guessIndex,
      sharedClues: user.clues.filter(c => targetUser.clues.includes(c)),
      roleClue: roleClueText
    };

    const updatedGuesses = [...guesses, newGuess];
    setGuesses(updatedGuesses);
    setInput('');
    localStorage.setItem(storageKey, JSON.stringify(updatedGuesses));
    
    if (newGuess.correct || updatedGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
    }
  };

  const handleShare = () => {    
    const lastGuess = guesses[guesses.length - 1];
    const isWin = lastGuess && lastGuess.correct;
    const score = isWin ? guesses.length : 'X';
    const modeEmoji = mode === 'text' ? '💬' : '📸';
    
    let text = `WHODLE ${modeEmoji} #${puzzleNum}\n${score}/${MAX_GUESSES}\n`;
    text += generateGridString(guesses);
    text += 'https://vsporeddy.github.io/whodle/';

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to pick flavor text based on daily seed
  const getEndGameMessage = () => {
    if (guesses.length === 0) return "";
    const isWin = guesses[guesses.length - 1].correct;
    const seed = getDailySeed();
    const list = isWin ? WIN_MESSAGES : LOSE_MESSAGES;
    return list[seed % list.length];
  };

  const getDiscordLink = () => {
    if (!data || !targetMsg) return '#';
    return `https://discord.com/channels/${data.meta.guild_id}/${targetMsg.channel_id}/${targetMsg.msg_id}`;
  };

  if (!data || !targetMsg) return <div style={{padding:'20px', color:'white'}}>Loading...</div>;

  const guessesRemaining = MAX_GUESSES - guesses.length;

  const formatMessageContent = (text) => {
    if (!text) return null;

    const regex = /(<@!?\d+>)/g;
    
    return text.split(regex).map((part, i) => {
      const match = part.match(/<@!?(\d+)>/);
      if (match) {
        const userId = match[1];
        const user = data.users[userId];
        const displayName = user ? `@${user.nickname}` : "@User";

        return (
          <span 
            key={i} 
            style={{
              color: '#5865F2',
              backgroundColor: '#5865F21A',
              borderRadius: '3px',
              padding: '0 2px',
              fontWeight: '500'
            }}
          >
            {displayName}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div style={styles.container}>
      {/* MESSAGE */}
      {targetMsg.type === 'image' ? (
        <>
          <img 
            src={targetMsg.content} 
            style={styles.imagePreview} 
            alt="Image" 
            onClick={() => setIsZoomed(true)} 
            title="Click to zoom"
          />
          {isZoomed && (
            <div style={styles.modalOverlay} onClick={() => setIsZoomed(false)}>
              <img 
                src={targetMsg.content} 
                style={styles.modalImage} 
                alt="Zoomed" 
              />
            </div>
          )}
        </>
      ) : (
        <div style={styles.quoteBox}>"{formatMessageContent(targetMsg.content)}"</div>
      )}

      {/* INPUT */}
      {!gameOver && (
        <>
          <div style={styles.inputGroup}>
            <input 
              style={styles.input}
              placeholder={`Who ${mode === 'text' ? 'said' : 'posted'} it...?`}
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
                      <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start', lineHeight:'1.2'}}>
                        <span style={{fontWeight:'bold'}}>
                          {u.nickname} {isGuessed && "(Already Guessed)"}
                        </span>
                        <span><span style={{fontSize:'0.8rem', color:'#949BA4'}}>{u.display_name}</span> <small style={{color: '#666'}}>({u.username})</small></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={styles.guessCounter}>
            {guessesRemaining} guess{guessesRemaining !== 1 ? 'es' : ''} remaining
          </div>
        </>
      )}

      {/* GRID */}
      <div style={styles.grid}>
        {guesses.length > 0 && (
          <div style={{display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr', gap:'5px', fontSize:'0.8rem', opacity: 0.7, marginBottom:'5px', color:'#dbdee1'}}>
              <span>User</span>
              <span>Rank</span>
              <span>Joined</span>
              <span>Roles</span>
          </div>
        )}
        
        {guesses.map((g, i) => (
          <GuessRow key={i} guess={g} />
        ))}
      </div>

      {/* GAME OVER UI */}
      {gameOver && (
        <div style={styles.resultsBox}>
          <h2 style={{marginTop:0}}>{getEndGameMessage()}</h2>
          
          <div style={{marginBottom: '20px'}}>
            The message was sent by: <br/>
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginTop:'10px'}}>
                <img src={data.users[targetMsg.author_id].avatar} style={styles.avatarSmall} alt=""/>
                <strong>{data.users[targetMsg.author_id].nickname}</strong>
            </div>
          </div>

          <div style={{display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap'}}>
            <button onClick={canShareCombined ? handleCombinedShare : handleShare} style={styles.btnPrimary}>
              <Share2 size={18} /> {copied ? "Copied!" : canShareCombined ? "Share Results (Combined)" : "Share Result"}
            </button>
            
            <a href={getDiscordLink()} target="_blank" rel="noopener noreferrer" style={styles.btnSecondary}>
              <ExternalLink size={18} /> Jump to Message
            </a>
          </div>
        </div>
      )}
    </div>
  );
  
  function calculateSimilarity(guessUser, targetUser) {
    const guessRoles = guessUser.clues;
    const targetRoles = targetUser.clues;

    if (guessRoles.length === 0 && targetRoles.length === 0) return 100;
    const shared = guessRoles.filter(role => targetRoles.includes(role));
    const uniqueRoles = new Set([...guessRoles, ...targetRoles]);
    const percentage = (shared.length / uniqueRoles.size) * 100;
    return Math.round(percentage);
  }

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
        <div style={{...styles.cell, background: guess.correct ? GREEN : GREY, justifyContent: 'flex-start', gap: '10px', textOverflow: 'ellipsis'}}>
          <img src={guess.user.avatar} style={styles.avatarSmall} alt="" />
          <span style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {guess.user.nickname}
          </span>
        </div>

        <div style={{...styles.cell, background: guess.correct ? GREEN : (guess.rankHint === 'equal' ? GREEN : GREY)}}>
          {guess.rankHint === 'equal' ? <Check size={16}/> : 
          guess.rankHint === 'higher' ? <ArrowUp size={16}/> : 
          <ArrowDown size={16}/>}
        </div>

        <div style={{...styles.cell, background: guess.correct ? GREEN : (guess.joinHint === 'equal' ? YELLOW : GREY)}}>
          {guess.joinHint === 'equal' ? <Check size={16}/> : 
          guess.joinHint === 'earlier' ? <span>Earlier</span> : 
          <span>Later</span>}
        </div>

        <div style={{
          ...styles.cell, 
          background: getRoleBg(guess.roleClue, guess.correct),          
          fontSize: guess.roleClue === 'No new shared roles!' ? '0.7rem' : '0.85rem',
          flexDirection:'column', 
          lineHeight:'1.1',
          textAlign: 'center',
          wordBreak: 'break-word',
          padding: '5px'
        }}>
          {guess.roleClue}
        </div>
      </div>
    );
  }
}