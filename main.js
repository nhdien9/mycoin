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
  }

  /**
   * Tạo hash với SHA256 cho giao dịch.
   */
  calculateHash() {
    return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)).toString();
  }
}

/**
 * Cấu trúc của một blockchain.
 */
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
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

    // Cần phải cập nhật lại hash cho newBlock cho chính xác
    // (Vì hash của một block bất kì được tính gồm cả previousHash,
    // mà previousHash đã được cập nhật cho newBlock sau lời gọi constructor())
    newBlock.hash = newBlock.calculateHash();

    this.chain.push(newBlock);
  }
}

// Khởi tạo một blockchain mới.
let mycoin = new Blockchain();

// Thêm các block vào blockchain.
mycoin.addBlock(new Block(1, "2022-04-25", {amount: 6}));
mycoin.addBlock(new Block(1, "2022-04-26", {amount: 9}));

// Xem trạng thái hiện tại của blockchain.
console.log(JSON.stringify(mycoin, null, 4));
