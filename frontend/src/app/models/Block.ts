import * as crypto from 'crypto';

/**
 * Cấu trúc của một block
 */
export class Block {
  public previousHash: any;
  public timestamp: any;
  public transactions: any;
  public nonce: number;
  public hash: string;

  constructor(timestamp, transactions, previousHash = '') {
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  /**
   * Tạo hash với SHA256 cho một block
   */
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
      )
      .digest('hex');
  }

  /**
   * Bắt đầu quá trình "đào" trên một block
   */
  mineBlock(difficulty: number) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')
      ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(this.hash);
  }

  /**
   * Xác minh tất cả các giao dịch có trong block
   */
  hasValidTransactions() {
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        return false;
      }
    }

    return true;
  }
}
