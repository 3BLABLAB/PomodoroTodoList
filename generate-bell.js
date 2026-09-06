const fs = require('fs');

const sampleRate = 44100;
const duration = 1.5; // 1.5 seconds
const frequency = 880; // A5 note

const numSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + numSamples * 2);

// RIFF chunk descriptor
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4);
buffer.write('WAVE', 8);

// fmt sub-chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size
buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
buffer.writeUInt16LE(1, 22); // NumChannels
buffer.writeUInt32LE(sampleRate, 24); // SampleRate
buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
buffer.writeUInt16LE(2, 32); // BlockAlign
buffer.writeUInt16LE(16, 34); // BitsPerSample

// data sub-chunk
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples * 2, 40);

// Write audio data
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  // Bell-like envelope (exponential decay)
  const amplitude = Math.max(0, 32767 * Math.exp(-4 * t));
  // Adding a harmonic for a slightly richer bell sound
  const sample = amplitude * (0.7 * Math.sin(2 * Math.PI * frequency * t) + 0.3 * Math.sin(2 * Math.PI * (frequency * 2) * t));
  buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(sample))), 44 + i * 2);
}

fs.writeFileSync('assets/sounds/timer-complete.wav', buffer);
console.log('Generated timer-complete.wav');
