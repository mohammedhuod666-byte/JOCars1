// Usage: node scripts/decrypt-backup.js <backup-file.json.enc>
// Reads BACKUP_ENCRYPTION_KEY from .env and writes the decrypted JSON
// next to the input file. Keep the key safe — without it the file is useless.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [, , input] = process.argv;
if (!input || !input.endsWith('.enc')) {
  console.error('Usage: node scripts/decrypt-backup.js <backup-file.json.enc>');
  process.exit(1);
}
const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf8');
const keyHex = ((env.match(/^BACKUP_ENCRYPTION_KEY=(.*)$/m) || [])[1] || '').trim().replace(/^"|"$/g, '');
if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
  console.error('BACKUP_ENCRYPTION_KEY missing or invalid in .env');
  process.exit(1);
}
const inPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
const buf = fs.readFileSync(inPath);
if (buf.subarray(0, 4).toString() !== 'JCB1') {
  console.error('Not a JO Cars encrypted backup (bad magic)');
  process.exit(1);
}
const iv = buf.subarray(4, 16);
const tag = buf.subarray(16, 32);
const ct = buf.subarray(32);
try {
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  const outPath = inPath.replace(/\.enc$/, '');
  fs.writeFileSync(outPath, plain);
  console.log('Decrypted OK -> ' + outPath + ' (' + plain.length + ' bytes)');
} catch (e) {
  console.error('DECRYPT FAILED — wrong key or corrupted file');
  process.exit(1);
}
