import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AiSuggestion, humanizeError } from './AiSuggestion';

describe('humanizeError', () => {
  it('maps 429 to rate-limit message', () => {
    expect(humanizeError('Error: HTTP 429')).toBe('AI is rate-limited. Try again in a moment.');
  });

  it('maps rate-limit text', () => {
    expect(humanizeError('rate limit exceeded')).toBe('AI is rate-limited. Try again in a moment.');
  });

  it('maps quota exceeded', () => {
    expect(humanizeError('quota exceeded for this key')).toBe('AI is rate-limited. Try again in a moment.');
  });

  it('maps 401 to auth error', () => {
    expect(humanizeError('Error: HTTP 401')).toBe('API key is invalid or expired. Check your key in Settings.');
  });

  it('maps 403 to auth error', () => {
    expect(humanizeError('Error: HTTP 403 Forbidden')).toBe('API key is invalid or expired. Check your key in Settings.');
  });

  it('maps network errors', () => {
    expect(humanizeError('Failed to fetch')).toBe("Couldn't connect to AI. Check your connection and API key in Settings.");
  });

  it('maps timeout errors', () => {
    expect(humanizeError('network timeout')).toBe("Couldn't connect to AI. Check your connection and API key in Settings.");
  });

  it('maps no API key messages', () => {
    expect(humanizeError('No API key configured')).toBe('No API key configured. Add your Gemini key in Settings.');
  });

  it('passes through unknown errors', () => {
    expect(humanizeError('Something unexpected happened')).toBe('Something unexpected happened');
  });

  it('handles null/undefined', () => {
    expect(humanizeError(null)).toBeNull();
    expect(humanizeError(undefined)).toBeUndefined();
  });
});

describe('AiSuggestion', () => {
  it('renders nothing when no props active', () => {
    const { container } = render(<AiSuggestion loading={false} result={null} error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows skeleton when loading', () => {
    render(<AiSuggestion loading={true} result={null} error={null} />);
    expect(screen.getByTestId('ai-suggestion-skeleton')).toBeInTheDocument();
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    // Should have pulse skeleton bars
    const skeleton = screen.getByTestId('ai-suggestion-skeleton');
    const pulseBars = skeleton.querySelectorAll('.animate-pulse');
    expect(pulseBars.length).toBe(2);
  });

  it('shows humanized error for 429', () => {
    render(<AiSuggestion loading={false} result={null} error="Error: HTTP 429" />);
    expect(screen.getByTestId('ai-suggestion-error')).toHaveTextContent('AI is rate-limited. Try again in a moment.');
  });

  it('shows humanized error for network failure', () => {
    render(<AiSuggestion loading={false} result={null} error="Failed to fetch" />);
    expect(screen.getByTestId('ai-suggestion-error')).toHaveTextContent("Couldn't connect to AI");
  });

  it('shows result text when provided', () => {
    render(<AiSuggestion loading={false} result="Here is your suggestion" error={null} />);
    expect(screen.getByText('Here is your suggestion')).toBeInTheDocument();
  });

  it('shows custom title', () => {
    render(<AiSuggestion loading={false} result="result" error={null} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('loading takes priority over error', () => {
    render(<AiSuggestion loading={true} result={null} error="some error" />);
    expect(screen.getByTestId('ai-suggestion-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('ai-suggestion-error')).not.toBeInTheDocument();
  });
});
