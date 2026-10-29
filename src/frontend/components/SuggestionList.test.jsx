import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SuggestionList from './SuggestionList';

describe('SuggestionList Component', () => {
  const mockSuggestions = [
    { id: '1', title: 'Test Suggestion 1', description: 'Description 1', score: 95 },
    { id: '2', title: 'Test Suggestion 2', description: 'Description 2', score: 85 }
  ];

  const mockOnApply = vi.fn();
  const mockOnViewDetails = vi.fn();

  it('renders a list of suggestions', () => {
    render(<SuggestionList suggestions={mockSuggestions} onApply={mockOnApply} onViewDetails={mockOnViewDetails} />);
    
    expect(screen.getByText('Test Suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Test Suggestion 2')).toBeInTheDocument();
  });

  it('renders nothing when empty list provided', () => {
    const { container } = render(<SuggestionList suggestions={[]} onApply={mockOnApply} onViewDetails={mockOnViewDetails} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('shows the quality score badge when a suggestion has a score', () => {
    render(<SuggestionList suggestions={mockSuggestions} onApply={mockOnApply} onViewDetails={mockOnViewDetails} />);

    expect(screen.getByText('Quality 95/100')).toBeInTheDocument();
    expect(screen.getByText('Quality 85/100')).toBeInTheDocument();
  });

  it('hides the score badge when a suggestion has no score', () => {
    const unscored = [{ id: '3', title: 'No score', description: 'D', score: null }];
    render(<SuggestionList suggestions={unscored} onApply={mockOnApply} onViewDetails={mockOnViewDetails} />);

    expect(screen.queryByText(/Quality/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Match/)).not.toBeInTheDocument();
  });
});
