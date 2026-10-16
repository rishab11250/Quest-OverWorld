import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getSetting, setSetting } from './secureStore';

// In-memory sound cache & active state
let isSoundEnabled = true;
let isAudioInitialized = false;
const soundObjects = {};

// Base64 helper
function bytesToBase64(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    base64 += chars[b0 >> 2];
    base64 += chars[((b0 & 3) << 4) | (b1 >> 4)];
    base64 += i + 1 < len ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    base64 += i + 2 < len ? chars[b2 & 63] : '=';
  }
  return base64;
}

// 8-bit Mono PCM WAV Encoder
function buildWavBase64(samples, sampleRate = 22050) {
  const numSamples = samples.length;
  const buffer = new Uint8Array(44 + numSamples);

  function writeStr(str, offset) {
    for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
  }
  function write32(val, offset) {
    buffer[offset] = val & 0xff;
    buffer[offset + 1] = (val >> 8) & 0xff;
    buffer[offset + 2] = (val >> 16) & 0xff;
    buffer[offset + 3] = (val >> 24) & 0xff;
  }
  function write16(val, offset) {
    buffer[offset] = val & 0xff;
    buffer[offset + 1] = (val >> 8) & 0xff;
  }

  writeStr('RIFF', 0);
  write32(36 + numSamples, 4);
  writeStr('WAVE', 8);
  writeStr('fmt ', 12);
  write32(16, 16);
  write16(1, 20); // PCM
  write16(1, 22); // Mono
  write32(sampleRate, 24);
  write32(sampleRate, 28);
  write16(1, 32);
  write16(8, 34); // 8-bit
  writeStr('data', 36);
  write32(numSamples, 40);

  for (let i = 0; i < numSamples; i++) {
    buffer[44 + i] = Math.max(0, Math.min(255, Math.floor(samples[i])));
  }

  return bytesToBase64(buffer);
}

// Chiptune Synthesis Algorithms
const SFX_GENERATORS = {
  // 1. tap: quick 45ms crisp square blip
  tap: (sr = 22050) => {
    const total = Math.floor(sr * 0.045);
    const out = [];
    for (let i = 0; i < total; i++) {
      const t = i / total;
      const freq = 550 + t * 250;
      const phase = ((i * freq) / sr) % 1;
      const env = 1 - t;
      out.push((phase < 0.5 ? 1 : -1) * env * 60 + 128);
    }
    return out;
  },

  // 2. coin: 2-stage classic Mario/Zelda coin chime (B5 -> E6)
  coin: (sr = 22050) => {
    const t1 = Math.floor(sr * 0.06);
    const t2 = Math.floor(sr * 0.18);
    const out = [];
    for (let i = 0; i < t1; i++) {
      const phase = ((i * 987) / sr) % 1;
      out.push((phase < 0.5 ? 1 : -1) * 70 + 128);
    }
    for (let i = 0; i < t2; i++) {
      const t = i / t2;
      const phase = ((i * 1318) / sr) % 1;
      const env = Math.pow(1 - t, 1.5);
      out.push((phase < 0.5 ? 1 : -1) * 70 * env + 128);
    }
    return out;
  },

  // 3. laser: descending futuristic QR zap
  laser: (sr = 22050) => {
    const total = Math.floor(sr * 0.12);
    const out = [];
    let phaseAcc = 0;
    for (let i = 0; i < total; i++) {
      const t = i / total;
      const freq = 1800 * Math.pow(0.15, t);
      phaseAcc += freq / sr;
      const env = 1 - t * 0.8;
      out.push(((phaseAcc % 1) < 0.5 ? 1 : -1) * 65 * env + 128);
    }
    return out;
  },

  // 4. fanfare: triumphant 4-note ascending arcade arpeggio (C5-E5-G5-C6)
  fanfare: (sr = 22050) => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const out = [];
    notes.forEach((freq, idx) => {
      const isLast = idx === notes.length - 1;
      const dur = isLast ? 0.22 : 0.07;
      const nSamples = Math.floor(sr * dur);
      for (let i = 0; i < nSamples; i++) {
        const t = i / nSamples;
        const phase = ((i * freq) / sr) % 1;
        const env = isLast ? Math.pow(1 - t, 1.2) : 0.9;
        out.push((phase < 0.5 ? 1 : -1) * 70 * env + 128);
      }
    });
    return out;
  },

  // 5. error: low frequency descending buzz
  error: (sr = 22050) => {
    const total = Math.floor(sr * 0.14);
    const out = [];
    for (let i = 0; i < total; i++) {
      const t = i / total;
      const freq = 130 - t * 30;
      const phase = ((i * freq) / sr) % 1;
      const env = 1 - t * 0.5;
      out.push((phase < 0.25 ? 1 : -1) * 75 * env + 128);
    }
    return out;
  },

  // 6. radar: high damped compass/beacon ping
  radar: (sr = 22050) => {
    const total = Math.floor(sr * 0.08);
    const out = [];
    for (let i = 0; i < total; i++) {
      const t = i / total;
      const phase = ((i * 1760) / sr) % 1;
      const env = Math.exp(-t * 22);
      out.push(Math.sin(2 * Math.PI * phase) * 80 * env + 128);
    }
    return out;
  },
};

/**
 * Initialize 8-Bit Audio System
 */
export async function initAudioEngine() {
  if (isAudioInitialized) return;

  try {
    const enabled = await getSetting('sound_effects', true);
    isSoundEnabled = Boolean(enabled);

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Synthesize & write sound assets to disk
    const keys = Object.keys(SFX_GENERATORS);
    for (const key of keys) {
      const path = `${FileSystem.cacheDirectory}sfx_${key}.wav`;
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) {
        const base64 = buildWavBase64(SFX_GENERATORS[key]());
        await FileSystem.writeAsStringAsync(path, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Pre-create sound object
      const { sound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: false, volume: 0.65 }
      );
      soundObjects[key] = sound;
    }

    isAudioInitialized = true;
  } catch (err) {
    // Non-blocking fallback
    console.warn('Audio engine initialization notice:', err?.message || err);
  }
}

/**
 * Play an 8-bit sound effect by key: 'tap' | 'coin' | 'laser' | 'fanfare' | 'error' | 'radar'
 */
export async function playSound(key) {
  if (!isSoundEnabled) return;

  try {
    if (!isAudioInitialized) {
      await initAudioEngine();
    }

    const sound = soundObjects[key];
    if (sound) {
      await sound.replayAsync();
    }
  } catch (_err) {
    // Fallback silent failure
  }
}

/**
 * Toggle sound on/off globally
 */
export async function setSoundState(enabled) {
  isSoundEnabled = Boolean(enabled);
  await setSetting('sound_effects', isSoundEnabled);
}

export function getSoundState() {
  return isSoundEnabled;
}
