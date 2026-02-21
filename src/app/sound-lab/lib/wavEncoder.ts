/**
 * WAV Encoder — Pure JS, no dependencies
 *
 * Encodes an AudioBuffer into a WAV file (16-bit PCM, RIFF format).
 * Supports mono and stereo. Preserves the original sample rate.
 */

export function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = audioBuffer.length;
  const dataSize = numSamples * numChannels * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // --- RIFF header ---
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);         // File size - 8
  writeString(view, 8, 'WAVE');

  // --- fmt chunk ---
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);                    // Chunk size (16 for PCM)
  view.setUint16(20, 1, true);                     // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true);           // Number of channels
  view.setUint32(24, sampleRate, true);            // Sample rate
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // Byte rate
  view.setUint16(32, numChannels * bytesPerSample, true); // Block align
  view.setUint16(34, bitsPerSample, true);         // Bits per sample

  // --- data chunk ---
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);              // Data size

  // --- Interleaved PCM data ---
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch));
  }

  let offset = headerSize;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = channels[ch]![i]!;
      // Clamp to [-1, 1] and convert to 16-bit signed integer
      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += bytesPerSample;
    }
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Trigger a WAV download from an AudioBuffer.
 */
export function downloadWAV(audioBuffer: AudioBuffer, filename: string): void {
  const wavBuffer = encodeWAV(audioBuffer);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
