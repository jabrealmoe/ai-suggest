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
});
