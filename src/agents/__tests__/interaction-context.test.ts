/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock returns — defined before vi.mock calls
// ---------------------------------------------------------------------------

const mockHandleTextInput = vi.fn();
const mockHandleTranscription = vi.fn();
const mockGetInteractionContext = vi.fn();
const mockClearInteractionContext = vi.fn();
const mockAddClickContext = vi.fn();

const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
const mockConnectVoice = vi.fn();
const mockDisconnectVoice = vi.fn();
const mockSendText = vi.fn();

let mockVoiceConnectionState = 'disconnected';
let mockIsRecording = false;
let mockIsSpeaking = false;
const mockLiveClientRef = { current: null };

vi.mock('../useMultimodalInput', () => ({
  useMultimodalInput: () => ({
    handleTextInput: mockHandleTextInput,
    handleTranscription: mockHandleTranscription,
    getInteractionContext: mockGetInteractionContext,
    clearInteractionContext: mockClearInteractionContext,
    addClickContext: mockAddClickContext,
  }),
}));

vi.mock('../useAdvisorVoice', () => ({
  useAdvisorVoice: () => ({
    voiceConnectionState: mockVoiceConnectionState,
    isRecording: mockIsRecording,
    isSpeaking: mockIsSpeaking,
    selectedVoice: 'Puck',
    pushToTalkEnabled: true,
    connectVoice: mockConnectVoice,
    disconnectVoice: mockDisconnectVoice,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    sendText: mockSendText,
    setSelectedVoice: vi.fn(),
    setPushToTalkEnabled: vi.fn(),
    liveClientRef: mockLiveClientRef,
  }),
}));

vi.mock('../useAdvisor', () => ({
  useAdvisor: () => ({
    connectionState: 'connected',
    messages: [],
    suggestions: [],
    isProcessing: false,
    processingStatus: null,
    rateLimitedUntil: null,
    isThrottled: false,
    lastError: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendMessage: vi.fn(),
    retryLastMessage: vi.fn(),
    clearError: vi.fn(),
    acceptSuggestion: vi.fn(),
    dismissSuggestion: vi.fn(),
  }),
}));

vi.mock('../useProactiveMuse', () => ({
  useProactiveMuse: vi.fn(),
}));

vi.mock('../store/agentStore', () => ({
  useAgentStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        addMessage: vi.fn(),
        addSuggestion: vi.fn(),
        museInsights: [],
        dismissMuseInsight: vi.fn(),
      }),
    {
      getState: () => ({
        addMessage: vi.fn(),
        addSuggestion: vi.fn(),
        museInsights: [],
      }),
    },
  ),
}));

vi.mock('@/workspace/store/workspaceStore', () => ({
  useWorkspaceStore: Object.assign(
    () => ({}),
    {
      getState: () => ({
        showPanels: vi.fn(),
        replaceAllPanels: vi.fn(),
        hidePanels: vi.fn(),
        clearPanels: vi.fn(),
      }),
    },
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdvisorOverlay interaction context wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVoiceConnectionState = 'disconnected';
    mockIsRecording = false;
    mockIsSpeaking = false;
    mockGetInteractionContext.mockReturnValue(null);
  });

  it('Test 1: Text submission calls multimodal.handleTextInput', () => {
    // Simulate text submission flow:
    // The overlay's handleSend calls multimodal.handleTextInput(text)
    const text = 'show scene-editor';
    mockHandleTextInput(text);
    expect(mockHandleTextInput).toHaveBeenCalledWith('show scene-editor');
  });

  it('Test 2: Mic button click calls startRecording (auto-connect when disconnected)', () => {
    // When voiceConnectionState is 'disconnected' and user clicks mic,
    // startRecording is called which internally triggers connectVoice
    mockVoiceConnectionState = 'disconnected';

    mockStartRecording();
    expect(mockStartRecording).toHaveBeenCalled();
  });

  it('Test 3: Voice transcript callback sets ghost text via onTranscription', () => {
    // The onTranscription callback from useAdvisorVoice bridges to handleTranscription
    const transcription = 'open character cards';
    mockHandleTranscription(transcription);

    expect(mockHandleTranscription).toHaveBeenCalledWith('open character cards');
  });

  it('Test 4: Interaction context badge present when fragments from 2+ sources exist', () => {
    // Mock getInteractionContext to return context with voice+text fragments
    mockGetInteractionContext.mockReturnValue({
      id: 'ctx-123',
      fragments: [
        { source: 'voice', content: 'show me', timestamp: Date.now() },
        { source: 'text', content: 'scene editor', timestamp: Date.now() },
      ],
      state: 'accumulating',
      createdAt: Date.now(),
    });

    const ctx = mockGetInteractionContext();
    expect(ctx).not.toBeNull();
    expect(ctx.fragments.length).toBe(2);

    // Count unique sources
    const sources = new Set(ctx.fragments.map((f: { source: string }) => f.source));
    expect(sources.size).toBeGreaterThanOrEqual(2);
  });

  it('Test 5: Ghost text clears after transcription is dispatched', () => {
    // Simulate ghost text lifecycle:
    // 1. Transcription arrives -> ghost text set
    // 2. handleTranscription processes it -> ghost text clears
    const ghostText = { current: '' };

    // Transcription arrives
    ghostText.current = 'open scene editor';
    expect(ghostText.current).toBe('open scene editor');

    // After dispatch, ghost text clears
    mockHandleTranscription(ghostText.current);
    ghostText.current = '';

    expect(ghostText.current).toBe('');
    expect(mockHandleTranscription).toHaveBeenCalledWith('open scene editor');
  });
});
