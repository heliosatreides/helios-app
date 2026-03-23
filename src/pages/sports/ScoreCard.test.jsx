import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreCard } from './ScoreCard';

const scheduledGame = {
  id: '1',
  name: 'Lakers at Pistons',
  date: '2026-03-23T23:00Z',
  status: 'Scheduled',
  homeTeam: {
    displayName: 'Detroit Pistons',
    logo: 'https://example.com/pistons.png',
    score: '0',
  },
  awayTeam: {
    displayName: 'Los Angeles Lakers',
    logo: 'https://example.com/lakers.png',
    score: '0',
  },
};

const liveGame = {
  ...scheduledGame,
  id: '2',
  status: 'In Progress',
  homeTeam: { ...scheduledGame.homeTeam, score: '54' },
  awayTeam: { ...scheduledGame.awayTeam, score: '51' },
};

const finalGame = {
  ...scheduledGame,
  id: '3',
  status: 'Final',
  homeTeam: { ...scheduledGame.homeTeam, score: '112' },
  awayTeam: { ...scheduledGame.awayTeam, score: '105' },
};

test('renders home and away team names', () => {
  render(<ScoreCard game={scheduledGame} />);
  expect(screen.getByText('Detroit Pistons')).toBeInTheDocument();
  expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
});

test('renders team logos', () => {
  render(<ScoreCard game={scheduledGame} />);
  const logos = screen.getAllByRole('img');
  expect(logos[0]).toHaveAttribute('src', 'https://example.com/lakers.png');
  expect(logos[1]).toHaveAttribute('src', 'https://example.com/pistons.png');
});

test('shows LIVE badge for in-progress games', () => {
  render(<ScoreCard game={liveGame} />);
  expect(screen.getByText('LIVE')).toBeInTheDocument();
});

test('does NOT show LIVE badge for scheduled games', () => {
  render(<ScoreCard game={scheduledGame} />);
  expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
});

test('shows final scores for finished games', () => {
  render(<ScoreCard game={finalGame} />);
  expect(screen.getByText('112')).toBeInTheDocument();
  expect(screen.getByText('105')).toBeInTheDocument();
  expect(screen.getByText('Final')).toBeInTheDocument();
});

test('shows live scores for in-progress games', () => {
  render(<ScoreCard game={liveGame} />);
  expect(screen.getByText('54')).toBeInTheDocument();
  expect(screen.getByText('51')).toBeInTheDocument();
});
