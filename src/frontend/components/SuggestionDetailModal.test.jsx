import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SuggestionDetailModal from './SuggestionDetailModal';

describe('SuggestionDetailModal Component', () => {
  const mockSuggestion = {
    id: '1',
    title: 'Test Modal',
    description: 'Short description',
    originalDescription: 'Full detailed description that is being typed out.'
  };

  const mockOnClose = vi.fn();
  const mockOnApply = vi.fn();

  it('renders the modal with title', () => {
    render(
      <SuggestionDetailModal 
        suggestion={mockSuggestion} 
        onClose={mockOnClose} 
        onApply={mockOnApply} 
        isApplying={false} 
      />
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    // Note: Description might not be fully visible immediately due to typing effect
  });

  it('calls onClose when close button clicked', () => {
     render(
      <SuggestionDetailModal 
        suggestion={mockSuggestion} 
        onClose={mockOnClose} 
        onApply={mockOnApply} 
        isApplying={false} 
      />
    );

    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onApply when apply button clicked', () => {
     render(
      <SuggestionDetailModal 
        suggestion={mockSuggestion} 
        onClose={mockOnClose} 
        onApply={mockOnApply} 
        isApplying={false} 
      />
    );

    fireEvent.click(screen.getByText('Apply Suggestion'));
    expect(mockOnApply).toHaveBeenCalledWith(mockSuggestion);
  });

  it('disables buttons when isApplying is true', () => {
     render(
      <SuggestionDetailModal 
        suggestion={mockSuggestion} 
        onClose={mockOnClose} 
        onApply={mockOnApply} 
        isApplying={true} 
      />
    );

    expect(screen.getByText('Close')).toBeDisabled();
    expect(screen.getByText('Applying...')).toBeDisabled();
  });
});
