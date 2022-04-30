const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const key = ec.genKeyPair();
const publicKey = key.getPublic('hex');
const privateKey = key.getPrivate('hex');

// Tạo cặp khóa {private, public} với secp256k1.
console.log(`Private key: ${privateKey}`);
console.log(`Public key: ${publicKey}`);
