import crypto from 'crypto';
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

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
   * Tạo hash cho giao dịch
   */
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest('hex');
  }

  /**
   * Ký một giao dịch được lưu
   */
  signTransaction(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('Không thể ký các giao dịch của ví khác!');
    }

    // Tạo hash cho giao dịch
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');

    this.signature = sig.toDER('hex');
  }

  /**
   * Kiểm tra xem chữ ký có hợp lệ hay không?
   */
  isValid() {
    // Xử lý trường hợp giao dịch đặc biệt,
    // với giao dịch không có địa chỉ gửi
    if (this.fromAddress === null) { return true; }

    if (!this.signature || this.signature.length === 0) {
      throw new Error('Không có chữ ký trong giao dịch này');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}
