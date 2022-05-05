import crypto from 'crypto';

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

/**
 * Cấu trúc của một giao dịch
 */
export class Transaction {
  signature: any;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: any;

  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
  }

  /**
   * Tạo hash với SHA256 cho giao dịch
   */
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest('hex');
  }

  /**
   * Ký một giao dịch với `signing key`
   */
  signTransaction(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('Bạn không thể sign các transaction của người khác!');
    }

    const hashTransaction = this.calculateHash();
    const signature = signingKey.sign(hashTransaction, 'base64');

    // Lưu chữ ký vào transaction object đang xét
    this.signature = signature.toDER('hex');
  }

  /**
   * Giao dịch có được ký hợp lệ hay không?
   */
  isValid() {
    // Nếu một giao dịch xảy ra mà không có người chuyển coin,
    // có thể giả định rằng đó là quá trình trao thưởng cho miner
    if (this.fromAddress === null) {
      return true;
    }

    if (!this.signature || this.signature.length === 0) {
      throw new Error('Không có chữ ký cho giao dịch này');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex'); // Lấy `public key` từ giao dịch
    return publicKey.verify(this.calculateHash(), this.signature); // Giao dịch được ký hợp lệ?
  }
}
