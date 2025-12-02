import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, Check, Share2, ExternalLink } from 'lucide-react';

// STYLES
const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', paddingBottom: '50px' },
  imagePreview: { maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' },
  
  // Updated to Discord Embed Style (Darker Grey)
  quoteBox: { background: '#2b2d31', borderLeft: '4px solid #5865F2', padding: '15px', borderRadius: '4px', fontSize: '1.1rem', marginBottom: '20px', textAlign: 'left', color: '#dbdee1' },
  
  inputGroup: { position: 'relative', marginBottom: '20px' },
  
  // Dark Input Field
  input: { width: '100%', padding: '15px', fontSize: '1rem', borderRadius: '8px', border: 'none', background: '#383a40', color: 'white', outline: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
  
  // Dark Dropdown
  dropdown: { position: 'absolute', width: '100%', maxHeight: '200px', overflowY: 'auto', background: '#2b2d31', borderRadius: '0 0 8px 8px', zIndex: 10, textAlign: 'left', boxShadow: '0 4px 6px rgba(0,0,0,0.5)' },
  dropdownItem: { padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1e1f22', color: '#dbdee1' },
  
  grid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px' },
  
  // Cells
  cell: { padding: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'white', fontWeight: 'bold', boxShadow: '0 2px 2px rgba(0,0,0,0.2)' },
  
  avatarSmall: { width: '30px', height: '30px', borderRadius: '50%' },
  
  // Buttons
  btnPrimary: { background: '#5865F2', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' },
  btnSecondary: { background: '#4f545c', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' },
  
  // Dark Results Box
  resultsBox: { marginTop: '30px', padding: '20px', background: '#2b2d31', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }
};

const getDailySeed = () => Math.floor(Date.now() / 86400000); 

const seededRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export default function App() {
  const [data, setData] = useState(null);
  const [targetMsg, setTargetMsg] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [input, setInput] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    fetch('./game_data.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        const seed = getDailySeed();
        const randIndex = Math.floor(seededRandom(seed) * json.messages.length);
        setTargetMsg(json.messages[randIndex]);
      });
  }, []);

const filteredUsers = useMemo(() => {
    if (!data || !input) return [];
    
    const searchStr = input.toLowerCase();
    
    return Object.values(data.users).filter(u => 
      u.username.toLowerCase().includes(searchStr) ||      // matches "r0ffles"
      u.nickname.toLowerCase().includes(searchStr) ||      // matches "rawhide"
      u.display_name.toLowerCase().includes(searchStr)     // matches "roffles"
    ).slice(0, 5);
  }, [data, input]);

  const handleGuess = (user) => {
    if (gameOver) return;
    const targetUser = data.users[targetMsg.author_id];
    
    // Logic: Lower rank value = Higher Status (Admin=0)
    // If Guess(3) vs Target(0) -> Target is Higher Rank (Up Arrow)
    const rankDir = user.rank_val === targetUser.rank_val ? 'equal' : (user.rank_val > targetUser.rank_val ? 'higher' : 'lower');
    const joinDir = user.joined_at === targetUser.joined_at ? 'equal' : (user.joined_at > targetUser.joined_at ? 'earlier' : 'later');

    const newGuess = {
      user: user,
      correct: user.id === targetUser.id,
      rankHint: rankDir,
      joinHint: joinDir,
      sharedClues: user.clues.filter(c => targetUser.clues.includes(c))
    };

    const updatedGuesses = [...guesses, newGuess];
    setGuesses(updatedGuesses);
    setInput('');
    
    if (newGuess.correct || updatedGuesses.length >= 6) {
      setGameOver(true);
    }
  };

  const handleShare = () => {
    // Generate Emoji Grid
    let text = `Who Said It? ${new Date().toLocaleDateString()} - ${guesses.length}/6\n\n`;
    
    guesses.forEach(g => {
        // 1. Identity
        text += g.correct ? '🟩' : '⬛';
        // 2. Rank
        text += g.rankHint === 'equal' ? '🟩' : (g.rankHint === 'higher' ? '⬆️' : '⬇️');
        // 3. Join
        text += g.joinHint === 'equal' ? '🟩' : (g.joinHint === 'earlier' ? '⬅️' : '➡️');
        // 4. Clues
        text += g.sharedClues.length > 0 ? '🟨' : '⬛';
        text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDiscordLink = () => {
    if (!data || !targetMsg) return '#';
    // Format: https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID
    return `https://discord.com/channels/${data.meta.guild_id}/${targetMsg.channel_id}/${targetMsg.msg_id}`;
  };

  if (!data || !targetMsg) return <div style={{padding:'20px'}}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1>Who Said It?</h1>
      
      {targetMsg.type === 'image' ? (
        <img src={targetMsg.content} style={styles.imagePreview} alt="Puzzle" />
      ) : (
        <div style={styles.quoteBox}>"{targetMsg.content}"</div>
      )}

      {/* INPUT */}
      {!gameOver && (
        <div style={styles.inputGroup}>
          <input 
            style={styles.input}
            placeholder="Type a name..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {input && (
            <div style={styles.dropdown}>
              {filteredUsers.map(u => (
                <div key={u.id} style={styles.dropdownItem} onClick={() => handleGuess(u)}>
                  <img src={u.avatar} style={styles.avatarSmall} alt="" />
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start', lineHeight:'1.2'}}>
                    {/* Show Nickname as main, display/username as subtext */}
                    <span style={{fontWeight:'bold'}}>{u.nickname}</span>
                    <span style={{fontSize:'0.8rem', color:'#949BA4'}}> {/* Changed from #666 to #949BA4 */}
                      {u.display_name !== u.nickname ? u.display_name : u.username}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GRID */}
      <div style={styles.grid}>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'5px', fontSize:'0.8rem', opacity: 0.7, marginBottom:'5px'}}>
            <span>User</span>
            <span>Rank</span>
            <span>Joined</span>
            <span>Roles</span>
        </div>
        {guesses.map((g, i) => (
          <GuessRow key={i} guess={g} />
        ))}
      </div>

      {/* GAME OVER UI */}
      {gameOver && (
        <div style={styles.resultsBox}>
          <h2>{guesses[guesses.length-1].correct ? "Nailed it!" : "Game Over"}</h2>
          
          <div style={{marginBottom: '20px'}}>
            The message was sent by: <br/>
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginTop:'10px'}}>
                <img src={data.users[targetMsg.author_id].avatar} style={styles.avatarSmall} alt=""/>
                <strong>{data.users[targetMsg.author_id].nickname}</strong>
            </div>
          </div>

          <div style={{display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap'}}>
            <button onClick={handleShare} style={styles.btnPrimary}>
              <Share2 size={18} /> {copied ? "Copied!" : "Share Result"}
            </button>
            
            <a href={getDiscordLink()} target="_blank" rel="noopener noreferrer" style={styles.btnSecondary}>
              <ExternalLink size={18} /> Jump to Message
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function GuessRow({ guess }) {
  const getCellColor = (isCorrect) => isCorrect ? '#6aaa64' : '#787c7e';
  const getPartialColor = (isClose) => isClose ? '#c9b458' : '#787c7e';

  return (
    <div style={styles.row}>
      <div style={{...styles.cell, background: getCellColor(guess.correct), justifyContent: 'flex-start', gap: '10px'}}>
        <img src={guess.user.avatar} style={styles.avatarSmall} alt="" />
        {guess.user.nickname}
      </div>

      <div style={{...styles.cell, background: getPartialColor(guess.rankHint === 'equal')}}>
        {guess.rankHint === 'equal' ? <Check size={16}/> : 
         guess.rankHint === 'higher' ? <ArrowUp size={16}/> : 
         <ArrowDown size={16}/>}
      </div>

      <div style={{...styles.cell, background: getPartialColor(guess.joinHint === 'equal')}}>
        {guess.joinHint === 'equal' ? <Check size={16}/> : 
         guess.joinHint === 'earlier' ? <span>Earlier</span> : 
         <span>Later</span>}
      </div>

      <div style={{...styles.cell, background: guess.sharedClues.length > 0 ? '#c9b458' : '#787c7e', fontSize: '0.6rem', flexDirection:'column', lineHeight:'1'}}>
        {guess.sharedClues.length > 0 ? guess.sharedClues.slice(0,2).join(', ') : "-"}
      </div>
    </div>
  );
}