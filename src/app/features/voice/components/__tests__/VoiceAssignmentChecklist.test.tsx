/**
 * VoiceAssignmentChecklist — Rendering and interaction tests
 *
 * Tests: character name rendering, assign voice buttons, all-assigned state,
 * onAssign callback, and onSkip callback.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { VoiceAssignmentChecklist } from '../VoiceAssignmentChecklist';

afterEach(() => {
  cleanup();
});

describe('VoiceAssignmentChecklist', () => {
  it('renders character names from unassignedCharacters prop', () => {
    render(
      <VoiceAssignmentChecklist
        unassignedCharacters={['ALICE', 'BOB', 'CHARLIE']}
        onAssign={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    expect(screen.getByText('ALICE')).toBeDefined();
    expect(screen.getByText('BOB')).toBeDefined();
    expect(screen.getByText('CHARLIE')).toBeDefined();
  });

  it('renders "Assign Voice" button for each unassigned character', () => {
    render(
      <VoiceAssignmentChecklist
        unassignedCharacters={['ALICE', 'BOB']}
        onAssign={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    // Each character row has an "Assign Voice" button
    const allButtons = screen.getAllByRole('button');
    const assignButtons = allButtons.filter((btn) => btn.textContent?.includes('Assign Voice'));
    expect(assignButtons.length).toBe(2);
  });

  it('when unassignedCharacters is empty, shows "All Assigned" generate button', () => {
    render(
      <VoiceAssignmentChecklist
        unassignedCharacters={[]}
        onAssign={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /all assigned/i })).toBeDefined();
  });

  it('clicking "Assign Voice" calls onAssign with correct character name', () => {
    const onAssign = vi.fn();
    render(
      <VoiceAssignmentChecklist
        unassignedCharacters={['ALICE', 'BOB']}
        onAssign={onAssign}
        onSkip={vi.fn()}
      />
    );

    const assignButtons = screen.getAllByRole('button', { name: /assign voice/i });
    fireEvent.click(assignButtons[0]);

    expect(onAssign).toHaveBeenCalledTimes(1);
    expect(onAssign).toHaveBeenCalledWith('ALICE');
  });

  it('clicking "Skip" calls onSkip callback', () => {
    const onSkip = vi.fn();
    render(
      <VoiceAssignmentChecklist
        unassignedCharacters={['ALICE']}
        onAssign={vi.fn()}
        onSkip={onSkip}
      />
    );

    const skipButton = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipButton);

    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
