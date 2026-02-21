/**
 * Waveform Extractor — extract RMS amplitude data from audio buffers
 *
 * Used for rendering mini waveforms inside timeline clips and library assets.
 */

/**
 * Extract normalized RMS waveform data from an AudioBuffer.
 * @param audioBuffer - Decoded audio buffer
 * @param numSamples - Number of waveform bars to generate (default 48)
 * @returns Array of normalized amplitudes (0-1)
 */
export function extractWaveform(audioBuffer: AudioBuffer, numSamples = 48): number[] {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const samplesPerBar = Math.floor(channelData.length / numSamples);
  const waveform: number[] = [];

  let maxRms = 0;

  // First pass: compute RMS for each bar
  const rmsValues: number[] = [];
  for (let i = 0; i < numSamples; i++) {
    const start = i * samplesPerBar;
    const end = Math.min(start + samplesPerBar, channelData.length);

    let sumSquares = 0;
    for (let j = start; j < end; j++) {
      const sample = channelData[j] ?? 0;
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / (end - start));
    rmsValues.push(rms);
    if (rms > maxRms) maxRms = rms;
  }

  // Second pass: normalize to 0-1
  for (const rms of rmsValues) {
    waveform.push(maxRms > 0 ? Math.max(0.05, rms / maxRms) : 0.05);
  }

  return waveform;
}

/**
 * Extract waveform from a URL (base64 data URL or HTTP URL).
 * Creates a temporary AudioContext to decode the audio.
 * @param url - Audio URL
 * @param numSamples - Number of waveform bars (default 48)
 */
export async function extractWaveformFromUrl(
  url: string,
  numSamples = 48
): Promise<number[]> {
  try {
    let arrayBuffer: ArrayBuffer;

    if (url.startsWith('data:')) {
      const base64 = url.split(',')[1];
      if (!base64) return generateFallback(numSamples);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      const response = await fetch(url);
      arrayBuffer = await response.arrayBuffer();
    }

    const ctx = new AudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const waveform = extractWaveform(audioBuffer, numSamples);
    ctx.close();
    return waveform;
  } catch {
    return generateFallback(numSamples);
  }
}

/** Generate a random fallback waveform */
function generateFallback(numSamples: number): number[] {
  return Array.from({ length: numSamples }, (_, i) => {
    const t = i / numSamples;
    return Math.max(0.05, Math.min(1, 0.5 + Math.sin(t * Math.PI * 3) * 0.3 + (Math.random() - 0.5) * 0.4));
  });
}
