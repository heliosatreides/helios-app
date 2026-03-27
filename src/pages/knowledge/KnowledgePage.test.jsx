/**
 * Tests for KnowledgePage wrapper:
 * - Renders PageHeader with title and subtitle
 * - Renders KnowledgeTab content
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../hooks/useIDB', () => ({
  useIDB: vi.fn((key, defaultVal) => {
    const { useState } = require('react');
    return useState(defaultVal);
  }),
  _resetDBPromise: vi.fn(),
}));

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({ generate: vi.fn(), loading: false, hasKey: false }),
}));

import { KnowledgePage } from './KnowledgePage';

describe('KnowledgePage', () => {
  it('renders PageHeader with title', () => {
    render(<KnowledgePage />);
    expect(screen.getByText('Knowledge')).toBeTruthy();
  });

  it('renders PageHeader with subtitle', () => {
    render(<KnowledgePage />);
    expect(screen.getByText('Track what you read, watch, and learn')).toBeTruthy();
  });

  it('renders KnowledgeTab content (reading list section)', () => {
    render(<KnowledgePage />);
    // KnowledgeTab renders cards including "Reading List" and "TIL"
    expect(screen.getByText(/reading list/i)).toBeTruthy();
  });

  it('renders KnowledgeTab content (TIL section)', () => {
    render(<KnowledgePage />);
    expect(screen.getByText(/today i learned/i)).toBeTruthy();
  });

  it('renders KnowledgeTab content (knowledge stats)', () => {
    render(<KnowledgePage />);
    expect(screen.getByText(/knowledge stats/i)).toBeTruthy();
  });
});
