import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicPage } from './MusicPage';

// Mock useGemini
const mockGenerateStructured = vi.fn();
vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({
    generateStructured: mockGenerateStructured,
    loading: false,
    error: null,
  }),
}));

describe('MusicPage (Playlist Suggester)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn(() => '[]'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders page header with correct title and subtitle', () => {
    render(<MusicPage />);
    expect(screen.getByText('Playlist Suggester')).toBeInTheDocument();
    expect(screen.getByText(/AI-powered song suggestions/i)).toBeInTheDocument();
  });

  it('renders all mood buttons', () => {
    render(<MusicPage />);
    expect(screen.getByText('Energetic')).toBeInTheDocument();
    expect(screen.getByText('Focused')).toBeInTheDocument();
    expect(screen.getByText('Relaxed')).toBeInTheDocument();
    expect(screen.getByText('Happy')).toBeInTheDocument();
    expect(screen.getByText('Melancholic')).toBeInTheDocument();
    expect(screen.getByText('Pump Up')).toBeInTheDocument();
  });

  it('renders genre chips', () => {
    render(<MusicPage />);
    expect(screen.getByText('Pop')).toBeInTheDocument();
    expect(screen.getByText('Rock')).toBeInTheDocument();
    expect(screen.getByText('Jazz')).toBeInTheDocument();
    expect(screen.getByText('Lo-Fi')).toBeInTheDocument();
  });

  it('disables generate button when no mood selected', () => {
    render(<MusicPage />);
    const btn = screen.getByRole('button', { name: /get recommendations/i });
    expect(btn).toBeDisabled();
  });

  it('enables generate button when mood selected', () => {
    render(<MusicPage />);
    fireEvent.click(screen.getByText('Energetic'));
    const btn = screen.getByRole('button', { name: /get recommendations/i });
    expect(btn).not.toBeDisabled();
  });

  it('highlights selected mood button', () => {
    render(<MusicPage />);
    const btn = screen.getByText('Energetic');
    fireEvent.click(btn);
    expect(btn.closest('button')).toHaveClass('bg-foreground');
  });

  it('toggles genre selection on click', () => {
    render(<MusicPage />);
    const pop = screen.getByText('Pop');
    fireEvent.click(pop);
    expect(pop.closest('button')).toHaveClass('bg-foreground');
    fireEvent.click(pop);
    expect(pop.closest('button')).not.toHaveClass('bg-foreground');
  });

  it('renders songs with YouTube and Spotify links after generation', async () => {
    mockGenerateStructured.mockResolvedValue([
      { song: 'Blinding Lights', artist: 'The Weeknd', reason: 'High energy synth pop.' },
      { song: 'Levitating', artist: 'Dua Lipa', reason: 'Upbeat disco pop.' },
    ]);
    render(<MusicPage />);
    fireEvent.click(screen.getByText('Energetic'));
    fireEvent.click(screen.getByRole('button', { name: /get recommendations/i }));

    await waitFor(() => {
      expect(screen.getByText('Blinding Lights')).toBeInTheDocument();
      expect(screen.getByText('The Weeknd')).toBeInTheDocument();
      expect(screen.getByText('Levitating')).toBeInTheDocument();
    });

    const ytLinks = screen.getAllByText(/YouTube Music/);
    expect(ytLinks.length).toBe(2);
    const spotifyLinks = screen.getAllByText(/Spotify/);
    expect(spotifyLinks.length).toBe(2);
  });

  it('does not persist liked songs to IDB', () => {
    // MusicPage should not import useIDB at all
    render(<MusicPage />);
    // No IDB-related elements
    expect(screen.queryByText(/Liked Songs/i)).not.toBeInTheDocument();
  });
});
