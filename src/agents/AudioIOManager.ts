/**
 * AudioIOManager — Browser audio capture and playback for voice mode.
 *
 * Capture: getUserMedia → AudioWorklet → PCM 16kHz mono → base64 chunks
 * Playback: base64 PCM 24kHz → AudioContext → speakers
 */

type AudioChunkCallback = (base64Pcm: string) => void;

const CAPTURE_SAMPLE_RATE = 16000;
const PLAYBACK_SAMPLE_RATE = 24000;

// AudioWorklet processor code (inline to avoid extra file)
const WORKLET_CODE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0] && input[0].length > 0) {
      // Convert float32 to int16
      const float32 = input[0];
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
`;

export class AudioIOManager {
  private captureStream: MediaStream | null = null;
  private captureContext: AudioContext | null = null;
  private captureNode: AudioWorkletNode | null = null;
  private playbackContext: AudioContext | null = null;
  private playbackQueue: AudioBuffer[] = [];
  private playbackScheduledTime = 0;
  private isPlaying = false;
  private onChunkCallbacks: AudioChunkCallback[] = [];
  private _isCapturing = false;

  get isCapturing(): boolean {
    return this._isCapturing;
  }

  // ─── Capture (Microphone → PCM base64) ────────

  async startCapture(): Promise<void> {
    if (this._isCapturing) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: CAPTURE_SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.captureStream = stream;
    this.captureContext = new AudioContext({ sampleRate: CAPTURE_SAMPLE_RATE });

    // Register the worklet processor
    const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await this.captureContext.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    const source = this.captureContext.createMediaStreamSource(stream);
    this.captureNode = new AudioWorkletNode(this.captureContext, 'pcm-capture-processor');

    this.captureNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const buffer = event.data;
      const base64 = this.arrayBufferToBase64(buffer);
      this.onChunkCallbacks.forEach(cb => cb(base64));
    };

    source.connect(this.captureNode);
    // Don't connect to destination — we only want to capture, not echo
    this._isCapturing = true;
  }

  stopCapture(): void {
    if (!this._isCapturing) return;

    this.captureNode?.disconnect();
    this.captureNode = null;

    this.captureStream?.getTracks().forEach(t => t.stop());
    this.captureStream = null;

    this.captureContext?.close();
    this.captureContext = null;

    this._isCapturing = false;
  }

  onAudioChunk(callback: AudioChunkCallback): () => void {
    this.onChunkCallbacks.push(callback);
    return () => {
      this.onChunkCallbacks = this.onChunkCallbacks.filter(cb => cb !== callback);
    };
  }

  // ─── Playback (PCM base64 → Speakers) ─────────

  playAudioChunk(base64Pcm: string): void {
    if (!this.playbackContext) {
      this.playbackContext = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE });
    }

    const pcmData = this.base64ToInt16Array(base64Pcm);
    const audioBuffer = this.playbackContext.createBuffer(1, pcmData.length, PLAYBACK_SAMPLE_RATE);
    const channelData = audioBuffer.getChannelData(0);

    // Convert int16 to float32
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768;
    }

    this.playbackQueue.push(audioBuffer);
    this.schedulePlayback();
  }

  /** Stop all queued and playing audio */
  stopPlayback(): void {
    this.playbackQueue = [];
    this.playbackScheduledTime = 0;
    this.isPlaying = false;
  }

  private schedulePlayback(): void {
    if (!this.playbackContext || this.playbackQueue.length === 0) return;

    const buffer = this.playbackQueue.shift()!;
    const source = this.playbackContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.playbackContext.destination);

    const now = this.playbackContext.currentTime;
    const startTime = Math.max(now, this.playbackScheduledTime);

    source.start(startTime);
    this.playbackScheduledTime = startTime + buffer.duration;
    this.isPlaying = true;

    source.onended = () => {
      if (this.playbackQueue.length > 0) {
        this.schedulePlayback();
      } else {
        this.isPlaying = false;
      }
    };
  }

  // ─── Cleanup ───────────────────────────────────

  destroy(): void {
    this.stopCapture();
    this.stopPlayback();
    this.playbackContext?.close();
    this.playbackContext = null;
    this.onChunkCallbacks = [];
  }

  // ─── Utilities ─────────────────────────────────

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToInt16Array(base64: string): Int16Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }
}
