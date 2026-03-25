import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { TabBar, CollapsibleCard, ActionButton, EmptyState, Badge, PageHeader, Card } from './ui';

describe('TabBar', () => {
  it('renders string tabs with pill-toggle style', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={['A', 'B', 'C']} active="B" onChange={onChange} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    // active tab has bg-foreground
    expect(screen.getByText('B').className).toContain('bg-foreground');
    expect(screen.getByText('A').className).not.toContain('bg-foreground');
  });

  it('renders object tabs with id and label', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={[{ id: 'x', label: 'Tab X' }, { id: 'y', label: 'Tab Y' }]} active="x" onChange={onChange} />);
    expect(screen.getByText('Tab X')).toBeInTheDocument();
    expect(screen.getByText('Tab X').className).toContain('bg-foreground');
  });

  it('calls onChange on click', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={['A', 'B']} active="A" onChange={onChange} />);
    fireEvent.click(screen.getByText('B'));
    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('uses pill-toggle wrapper (border p-1 w-fit)', () => {
    const { container } = render(<TabBar tabs={['A']} active="A" onChange={() => {}} />);
    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('border');
    expect(wrapper.className).toContain('p-1');
    expect(wrapper.className).toContain('w-fit');
  });
});

describe('CollapsibleCard', () => {
  it('renders open by default and shows children', () => {
    render(<CollapsibleCard title="Section">Content here</CollapsibleCard>);
    expect(screen.getByText('Section')).toBeInTheDocument();
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('collapses children on toggle click', () => {
    render(<CollapsibleCard title="Section">Content here</CollapsibleCard>);
    fireEvent.click(screen.getByTestId('collapsible-toggle'));
    expect(screen.queryByText('Content here')).not.toBeInTheDocument();
  });

  it('re-expands on second click', () => {
    render(<CollapsibleCard title="Section">Content here</CollapsibleCard>);
    const toggle = screen.getByTestId('collapsible-toggle');
    fireEvent.click(toggle);
    expect(screen.queryByText('Content here')).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('starts collapsed when defaultOpen=false', () => {
    render(<CollapsibleCard title="Closed" defaultOpen={false}>Hidden</CollapsibleCard>);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('has sharp corners (no rounded classes)', () => {
    const { container } = render(<CollapsibleCard title="T">C</CollapsibleCard>);
    expect(container.innerHTML).not.toContain('rounded');
  });
});

describe('ActionButton', () => {
  it('renders primary variant by default', () => {
    render(<ActionButton>Click</ActionButton>);
    const btn = screen.getByText('Click');
    expect(btn.className).toContain('bg-foreground');
    expect(btn.className).toContain('text-background');
  });

  it('renders ai variant with border', () => {
    render(<ActionButton variant="ai">AI Action</ActionButton>);
    const btn = screen.getByText('AI Action');
    expect(btn.className).toContain('border');
    expect(btn.className).toContain('border-border');
    expect(btn.className).not.toContain('amber');
  });

  it('renders secondary variant', () => {
    render(<ActionButton variant="secondary">Sec</ActionButton>);
    expect(screen.getByText('Sec').className).toContain('border-border');
  });

  it('renders danger variant', () => {
    render(<ActionButton variant="danger">Del</ActionButton>);
    expect(screen.getByText('Del').className).toContain('red');
  });

  it('forwards disabled prop', () => {
    render(<ActionButton disabled>Nope</ActionButton>);
    expect(screen.getByText('Nope')).toBeDisabled();
  });

  it('calls onClick', () => {
    const fn = vi.fn();
    render(<ActionButton onClick={fn}>Go</ActionButton>);
    fireEvent.click(screen.getByText('Go'));
    expect(fn).toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Nothing here" description="Add something." />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add something.')).toBeInTheDocument();
  });

  it('has dashed border', () => {
    const { container } = render(<EmptyState title="E" />);
    expect(container.firstChild.className).toContain('border-dashed');
  });

  it('renders action slot', () => {
    render(<EmptyState title="E" action={<button>Add</button>} />);
    expect(screen.getByText('Add')).toBeInTheDocument();
  });
});
