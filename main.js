const SHA256 = require('crypto-js/sha256');

/**
 * Cấu trúc của một block.
 */
class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  /**
   * Tạo hash với SHA256 cho giao dịch.
   */
  calculateHash() {
    return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
  }

  /**
   * Bắt đầu quá trình "đào" trên một block.
   */
  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(`Block đã được đào: ${this.hash}`);
  }
}

/**
 * Cấu trúc của một blockchain.
 */
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4; // Độ khó để "đào" một block
  }

  /**
   * Tạo block đầu tiên trong blockchain.
   */
  createGenesisBlock() {
    // Tạo một block mới với dữ liệu bất kì.
    return new Block(0, "2022-04-26", "Genesis block", "0");
  }

  /**
   * Lấy block cuối cùng trong blockchain.
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Thêm một block mới vào blockchain.
   */
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;

    // Khi và chỉ khi một block đã được "đào" thành công,
    // thì nó mới được phép thêm vào blockchain đang xét
    newBlock.mineBlock(this.difficulty);

    this.chain.push(newBlock);
  }

  /**
   * Kiểm tra xem một blockchain có hợp lệ hay không?
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
}

// Khởi tạo một blockchain mới.
let mycoin = new Blockchain();

// Tiến hành "đào" block đầu tiên.
console.log('Đang tiến hành "đào" block đầu tiên...')
mycoin.addBlock(new Block(1, "2022-04-25", {amount: 6}));

// Tiến hành "đào" block thứ hai.
console.log('Đang tiến hành "đào" block thứ hai...')
mycoin.addBlock(new Block(1, "2022-04-26", {amount: 9}));

// Xem trạng thái hiện tại của blockchain.
// console.log(JSON.stringify(mycoin, null, 4));
