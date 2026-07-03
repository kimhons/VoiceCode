/**
 * Generate placeholder assets for VoiceFlow Mobile App
 * Creates PNG files with solid color backgrounds
 */

const fs = require('fs');
const path = require('path');

// PNG file header and IHDR chunk generator
function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // IDAT chunk (compressed image data)
  const zlib = require('zlib');
  const rawData = Buffer.alloc((width * 3 + 1) * height);
  
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 3 + 1)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = makeCRCTable();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  
  return crc ^ 0xFFFFFFFF;
}

function makeCRCTable() {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
}

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// VoiceFlow brand color: #007AFF (blue)
const brandR = 0x00;
const brandG = 0x7A;
const brandB = 0xFF;

// Generate assets
const assets = [
  { name: 'icon.png', width: 1024, height: 1024 },
  { name: 'adaptive-icon.png', width: 1024, height: 1024 },
  { name: 'splash.png', width: 2048, height: 2048 },
  { name: 'notification-icon.png', width: 96, height: 96 },
  { name: 'favicon.png', width: 48, height: 48 },
];

console.log('Generating VoiceFlow Mobile assets...\n');

assets.forEach(asset => {
  const filePath = path.join(assetsDir, asset.name);
  const png = createPNG(asset.width, asset.height, brandR, brandG, brandB);
  fs.writeFileSync(filePath, png);
  console.log(`✅ Created ${asset.name} (${asset.width}x${asset.height})`);
});

// Create a placeholder notification sound (empty WAV file)
const wavPath = path.join(assetsDir, 'notification-sound.wav');
// Minimal WAV header for empty audio
const wavHeader = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // "RIFF"
  0x24, 0x00, 0x00, 0x00, // File size - 8
  0x57, 0x41, 0x56, 0x45, // "WAVE"
  0x66, 0x6D, 0x74, 0x20, // "fmt "
  0x10, 0x00, 0x00, 0x00, // Subchunk1Size (16)
  0x01, 0x00,             // AudioFormat (PCM)
  0x01, 0x00,             // NumChannels (1)
  0x44, 0xAC, 0x00, 0x00, // SampleRate (44100)
  0x88, 0x58, 0x01, 0x00, // ByteRate
  0x02, 0x00,             // BlockAlign
  0x10, 0x00,             // BitsPerSample (16)
  0x64, 0x61, 0x74, 0x61, // "data"
  0x00, 0x00, 0x00, 0x00, // Subchunk2Size (0)
]);
fs.writeFileSync(wavPath, wavHeader);
console.log(`✅ Created notification-sound.wav (placeholder)`);

console.log('\n✨ All assets generated successfully!');
console.log(`📁 Assets location: ${assetsDir}`);

