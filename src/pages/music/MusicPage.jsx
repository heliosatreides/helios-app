import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';

const MOODS = [
  { id: 'energetic', label: '⚡ Energetic', color: 'text-yellow-400' },
  { id: 'focused', label: '🎯 Focused', color: 'text-blue-400' },
  { id: 'relaxed', label: '🌊 Relaxed', color: 'text-teal-400' },
  { id: 'happy', label: '😊 Happy', color: 'text-green-400' },
  { id: 'melancholic', label: '🌧️ Melancholic', color: 'text-purple-400' },
  { id: 'pumpup', label: '🔥 Pump Up', color: 'text-red-400' },
];

const ALL_GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Metal', 'Indie', 'Lo-Fi', 'EDM'];

function parseSongs(text) {
  // Parse songs from AI response — try to extract structured song data
  const songs = [];
  const lines = text.split('\n');
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    // Match "1. Song Title - Artist" or "**Song Title** by Artist" patterns
    const numbered = trimmed.match(/^\d+\.\s+\*?\*?(.+?)\*?\*?\s*[-–]\s*\*?\*?(.+?)\*?\*?$/);
    const byPattern = trimmed.match(/^\d+\.\s+\*?\*?(.+?)\*?\*?\s+by\s+\*?\*?(.+?)\*?\*?$/i);

    if (numbered || byPattern) {
      const match = byPattern || numbered;
      if (current) songs.push(current);
      current = { song: match[1].trim(), artist: match[2].trim(), reason: '' };
    } else if (current && trimmed && !trimmed.match(/^\d+\./)) {
      current.reason += (current.reason ? ' ' : '') + trimmed.replace(/^[-–•*]\s*/, '');
    }
  }
  if (current) songs.push(current);
  return songs.length > 0 ? songs : null;
}

export function MusicPage() {
  const [likes, setLikes] = useIDB('music-likes', []);
  const [mood, setMood] = useState(null);
  const [genres, setGenres] = useState(() => {
    try { return JSON.parse(localStorage.getItem('helios-music-genres') || '[]'); } catch { return []; }
  });
  const [songs, setSongs] = useState([]);
  const [rawText, setRawText] = useState('');
  const { generate, loading, error } = useGemini();

  function toggleGenre(g) {
    setGenres(prev => {
      const next = prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g];
      localStorage.setItem('helios-music-genres', JSON.stringify(next));
      return next;
    });
  }

  async function getSuggestions() {
    if (!mood) return;
    const genreStr = genres.length > 0 ? `Genre preferences: ${genres.join(', ')}.` : '';
    const resp = await generate(`You are a music recommendation expert. Suggest exactly 5 songs for someone who is feeling "${mood}". ${genreStr}\n\nFor each song, use this format:\n1. Song Title - Artist\n   Why it fits: Brief reason (1-2 sentences)\n\n2. Song Title - Artist\n   Why it fits: Brief reason\n\n(continue for 5 songs)\n\nBe specific with real songs and artists.`);
    setRawText(resp);
    const parsed = parseSongs(resp);
    setSongs(parsed || []);
  }

  function likeSong(song) {
    setLikes(prev => {
      if (prev.some(s => s.song === song.song && s.artist === song.artist)) return prev;
      return [...prev, { ...song, mood, likedAt: new Date().toISOString(), id: Date.now().toString() }];
    });
  }

  function searchUrl(platform, song, artist) {
    const query = encodeURIComponent(`${song} ${artist}`);
    return platform === 'youtube'
      ? `https://music.youtube.com/search?q=${query}`
      : `https://open.spotify.com/search/${query}`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Music Recommendations</h1>

      {/* Mood selector */}
      <div className="bg-background border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">How are you feeling?</h2>
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map(m => (
            <button key={m.id} onClick={() => setMood(m.id)} className={`py-3 text-sm font-medium border transition-all ${mood === m.id ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-secondary border-border text-muted-foreground hover:border-[#3f3f46]'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre preferences */}
      <div className="bg-background border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Genre Preferences (pick 3-5)</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_GENRES.map(g => (
            <button key={g} onClick={() => toggleGenre(g)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${genres.includes(g) ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-secondary border-border text-muted-foreground hover:border-[#3f3f46]'}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Get recommendations */}
      <button onClick={getSuggestions} disabled={!mood || loading} className="w-full py-3 bg-purple-600 text-white font-semibold hover:bg-purple-500 disabled:opacity-50 transition-colors">
        {loading ? '✨ Finding songs...' : '✨ Get Recommendations'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Songs */}
      {songs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Recommendations for {MOODS.find(m2 => m2.id === mood)?.label}</h2>
          {songs.map((song, i) => (
            <div key={i} className="bg-background border border-border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-foreground">{song.song}</div>
                  <div className="text-sm text-muted-foreground">{song.artist}</div>
                </div>
                <button onClick={() => likeSong(song)} title="Like" className={`text-lg ${likes.some(s => s.song === song.song) ? 'text-red-400' : 'text-muted-foreground/80 hover:text-red-400'}`}>
                  ♥
                </button>
              </div>
              {song.reason && <p className="text-xs text-muted-foreground leading-relaxed">{song.reason}</p>}
              <div className="flex gap-2">
                <a href={searchUrl('youtube', song.song, song.artist)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-red-600/20 text-red-400 text-xs hover:bg-red-600/30">▶ YouTube Music</a>
                <a href={searchUrl('spotify', song.song, song.artist)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-green-600/20 text-green-400 text-xs hover:bg-green-600/30">▶ Spotify</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raw AI output if parsing failed */}
      {rawText && songs.length === 0 && (
        <div className="bg-background border border-border p-4">
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{rawText}</pre>
        </div>
      )}

      {/* Liked songs */}
      {likes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">❤️ Liked Songs ({likes.length})</h2>
          {likes.map(song => (
            <div key={song.id} className="bg-background border border-border p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">{song.song}</div>
                <div className="text-xs text-muted-foreground">{song.artist} · {song.mood}</div>
              </div>
              <div className="flex gap-2">
                <a href={searchUrl('spotify', song.song, song.artist)} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300">Spotify</a>
                <button onClick={() => setLikes(p => p.filter(s => s.id !== song.id))} className="text-muted-foreground/80 hover:text-red-400 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
