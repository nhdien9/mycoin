const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

/**
 * Cấu trúc của một transaction.
 */
class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  /**
   * Tạo hash với SHA256 cho giao dịch.
   */
  calculateHash() {
    return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
  }

  /**
   * Sign một giao dịch với "signing key".
   */
  signTransaction(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('Bạn không thể sign các transaction của người khác!');
    }

    const hashTransaction = this.calculateHash();
    const signature = signingKey.sign(hashTransaction, 'base64');
    this.signature = signature.toDER('hex'); // Lưu signature vào transaction đang xét.
  }

  /**
   * Transaction có được sign hợp lệ hay không?
   */
  isValid() {
    // Nếu một giao dịch xảy ra mà không có người chuyển "tiền",
    // có thể giả định rằng đó là quá trình trao thưởng cho miner.
    if (this.fromAddress === null) {
      return true;
    }

    if (!this.signature || this.signature.length === 0) {
      throw new Error('Không có signature cho giao dịch này');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex'); // Lấy public key từ transaction
    return publicKey.verify(this.calculateHash(), this.signature); // Transaction được sign hợp lệ?
  }
}

/**
 * Cấu trúc của một block.
 */
class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  /**
   * Tạo hash với SHA256 cho một block.
   */
  calculateHash() {
    return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
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

  /**
   * Xác minh tất cả các transaction có trong block.
   */
  hasValidTransaction() {
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Cấu trúc của một blockchain.
 */
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2; // Độ khó để "đào" một block
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  /**
   * Tạo block đầu tiên trong blockchain.
   */
  createGenesisBlock() {
    // Tạo một block mới với dữ liệu bất kì.
    return new Block(0, '2022-04-26', 'Genesis block', '0');
  }

  /**
   * Lấy block cuối cùng trong blockchain.
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Tiến hành "đào" các giao dịch đang chờ xử lý.
   */
  minePendingTransactions(miningRewardAddress) {
    // Trong thực tế, một miner không thể "đào" (tất cả các) pending transaction;
    // thay vào đó, miner sẽ tiến hành chọn ra một hoặc một vài block nào đó để "đào"!
    // (Trường hợp này là ví dụ đơn giản, để phần code xử lý được đơn giản!)
    let block = new Block(Date.now(), this.pendingTransactions);
    block.mineBlock(this.difficulty);

    console.log('Block đã được "đào" xong!');

    // Khi và chỉ khi một block đã được "đào" thành công,
    // thì nó mới được phép thêm vào blockchain đang xét
    this.chain.push(block);

    // Reset lại danh sách các pending transaction,
    // và tiến hành quá trình nhận thưởng cho miner
    this.pendingTransactions = [
      new Transaction(null, miningRewardAddress, this.miningReward)
    ];
  }

  /**
   * Thêm một transaction vào blockchain.
   */
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Mỗi giao dịch phải có cả địa chỉ gửi và địa chỉ nhận');
    }

    if (!transaction.isValid()) {
      throw new Error('Không thể thêm bất kì transaction không hợp lệ nào vào blockchain');
    }

    this.pendingTransactions.push(transaction);
  }

  /**
   * Lấy số dư tài khoản từ một địa chỉ "ví" điện tử.
   */
  getBalanceOfAddress(address) {
    let balance = 0;

    // Phải tiến hành duyệt lại toàn bộ blockchain để tìm số dư tài khoản
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        // Nếu đã chuyển "tiền" sang một địa chỉ khác,
        // thì cần phải trừ số "tiền" tương ứng trong tài khoản đang xét
        if (transaction.fromAddress === address) {
          balance -= transaction.amount;
        }

        // Nếu đã được một tài khoản khác chuyển "tiền" đến,
        // thì cần phải cộng số "tiền" tương ứng vào tài khoản đang xét
        if (transaction.toAddress === address) {
          balance += transaction.amount;
        }
      }
    }

    return balance;
  }

  /**
   * Kiểm tra xem một blockchain có hợp lệ hay không?
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Nếu có một block tồn tại giao dịch không hợp lệ,
      // thì blockchain chứa block đó cũng sẽ là không hợp lệ.
      if (!currentBlock.hasValidTransaction()) {
        return false;
      }

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

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
