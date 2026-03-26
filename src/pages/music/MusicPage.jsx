import { useState } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { PageHeader } from '../../components/ui';

const MOODS = [
  { id: 'energetic', label: 'Energetic' },
  { id: 'focused', label: 'Focused' },
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'happy', label: 'Happy' },
  { id: 'melancholic', label: 'Melancholic' },
  { id: 'pumpup', label: 'Pump Up' },
];

const ALL_GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Metal', 'Indie', 'Lo-Fi', 'EDM'];

export function MusicPage() {
  const [mood, setMood] = useState(null);
  const [genres, setGenres] = useState(() => {
    try { return JSON.parse(localStorage.getItem('helios-music-genres') || '[]'); } catch { return []; }
  });
  const [songs, setSongs] = useState([]);
  const { generateStructured, loading, error } = useGemini();

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
    try {
      const result = await generateStructured({
        system: 'You are a music recommendation expert. Only suggest real, well-known songs and artists.',
        prompt: `Suggest exactly 5 songs for someone feeling "${mood}". ${genreStr}`,
        schema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              song: { type: 'STRING', description: 'Song title' },
              artist: { type: 'STRING', description: 'Artist name' },
              reason: { type: 'STRING', description: 'Why this fits the mood (1-2 sentences)' },
            },
            required: ['song', 'artist', 'reason'],
          },
        },
      });
      if (Array.isArray(result)) {
        setSongs(result);
      }
    } catch {
      setSongs([]);
    }
  }

  function searchUrl(platform, song, artist) {
    const query = encodeURIComponent(`${song} ${artist}`);
    return platform === 'youtube'
      ? `https://music.youtube.com/search?q=${query}`
      : `https://open.spotify.com/search/${query}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playlist Suggester"
        subtitle="AI-powered song suggestions. Pick a mood, get recommendations, listen on your favorite platform."
      />

      {/* Mood selector */}
      <div className="bg-background border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">How are you feeling?</h2>
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map(m => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`min-h-[44px] py-3 text-sm font-medium border transition-all ${
                mood === m.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre preferences */}
      <div className="bg-background border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Genre Preferences (optional)</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_GENRES.map(g => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`px-3 py-1.5 text-xs font-medium border min-h-[44px] ${
                genres.includes(g)
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Get recommendations */}
      <button
        onClick={getSuggestions}
        disabled={!mood || loading}
        className="w-full min-h-[44px] py-3 bg-foreground text-background font-semibold hover:bg-foreground/90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Finding songs...' : 'Get Recommendations'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Songs */}
      {songs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Recommendations for {MOODS.find(m2 => m2.id === mood)?.label}
          </h2>
          {songs.map((song, i) => (
            <div key={i} className="bg-background border border-border p-4 space-y-2">
              <div>
                <div className="font-semibold text-foreground">{song.song}</div>
                <div className="text-sm text-muted-foreground">{song.artist}</div>
              </div>
              {song.reason && (
                <p className="text-xs text-muted-foreground leading-relaxed">{song.reason}</p>
              )}
              <div className="flex gap-2">
                <a
                  href={searchUrl('youtube', song.song, song.artist)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 min-h-[44px] flex items-center border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  YouTube Music
                </a>
                <a
                  href={searchUrl('spotify', song.song, song.artist)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 min-h-[44px] flex items-center border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  Spotify
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
