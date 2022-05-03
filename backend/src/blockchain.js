const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

/**
 * Cấu trúc của một giao dịch
 */
class Transaction {
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
    return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString();
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

/**
 * Cấu trúc của một block
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
   * Tạo hash với SHA256 cho một block
   */
  calculateHash() {
    return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
  }

  /**
   * Bắt đầu quá trình "đào" trên một block
   */
  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(`Block đã được đào: ${this.hash}`);
  }

  /**
   * Xác minh tất cả các giao dịch có trong block
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
 * Cấu trúc của một chain
 */
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2; // Độ khó để "đào" một block
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  /**
   * Tạo block đầu tiên trong chain
   */
  createGenesisBlock() {
    return new Block(Date.parse(Date.now()), [], '0');
  }

  /**
   * Lấy block cuối cùng trong chain
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Tiến hành "đào" tất cả các giao dịch đang chờ xử lý,
   * quá trình này bao gồm thêm các giao dịch thưởng cho miner
   */
  minePendingTransactions(miningRewardAddress) {
    const rewardTransaction = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTransaction);

    // Trong thực tế, một miner không thể "đào" (tất cả các) giao dịch đang chờ xử lý;
    // thay vào đó, miner sẽ tiến hành chọn ra một hoặc một vài block nào đó để "đào"!
    // (Trường hợp này là ví dụ đơn giản, để phần code xử lý được đơn giản!)
    let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);

    // Khi và chỉ khi một block đã được "đào" thành công,
    // thì nó mới được phép thêm vào chain đang xét
    console.log('Block đã được "đào" xong!');
    this.chain.push(block);

    // Reset lại danh sách các giao dịch đang chờ xử lý
    this.pendingTransactions = [];
  }

  /**
   * Thêm một giao dịch vào chain.
   */
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Mỗi giao dịch phải có cả địa chỉ gửi và địa chỉ nhận');
    }

    if (!transaction.isValid()) {
      throw new Error('Không thể thêm bất kì giao dịch không hợp lệ nào vào chain');
    }

    if (transaction.amount <= 0) {
      throw new Error('Số coin giao dịch phải lớn hơn 0');
    }

    // Cần phải đảm bảo rằng số coin được chuyển đi
    // không được phép lớn hơn số dư hiện có trong tài khoản
    const walletBalance = this.getBalanceOfAddress(transaction.fromAddress);
    if (walletBalance < transaction.amount) {
      throw new Error('Không đủ số dư');
    }

    // Lấy tất cả các giao dịch đang chờ xử lý của tài khoản "nguồn"
    const pendingTransactionForWallet = this.pendingTransactions
      .filter(transaction => transaction.fromAddress === transaction.fromAddress);

    // Nếu tài khoản "nguồn" có nhiều giao dịch đang chờ xử lý,
    // thì trước hết cần tính tổng số coin sẽ chuyển đi.
    // Nếu tổng số coin này lớn hơn số dư có trong tài khoản,
    // thì tiến hành hủy giao dịch đó.
    if (pendingTransactionForWallet.length > 0) {
      const totalPendingAmount = pendingTransactionForWallet
        .map(transaction => transaction.amount)
        .reduce((prev, curr) => prev + curr);

      const totalAmount = totalPendingAmount + transaction.amount;
      if (totalAmount > walletBalance) {
        throw new Error('Số coin sẽ được chuyển lớn hơn số dư hiện có trong tài khoản');
      }
    }

    this.pendingTransactions.push(transaction);
  }

  /**
   * Lấy số dư tài khoản từ một địa chỉ "ví" điện tử
   */
  getBalanceOfAddress(address) {
    let balance = 0;

    // Phải tiến hành duyệt lại toàn bộ chain để tìm số dư tài khoản
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        // Nếu đã chuyển coin sang một địa chỉ khác,
        // thì cần phải trừ số coin tương ứng trong tài khoản đang xét
        if (transaction.fromAddress === address) {
          balance -= transaction.amount;
        }

        // Nếu đã được một tài khoản khác chuyển coin đến,
        // thì cần phải cộng số coin tương ứng vào tài khoản đang xét
        if (transaction.toAddress === address) {
          balance += transaction.amount;
        }
      }
    }

    return balance;
  }

  /**
   * Lấy danh sách các giao dịch có liên quan đến địa chỉ ví.
   */
  getAllTransactionsForWallet(address) {
    const transactions = [];

    // Phải tiến hành duyệt lại toàn bộ chain để tìm các giao dịch
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        // Lọc ra các giao dịch có liên quan đến địa chỉ ví đang xét
        if (transaction.fromAddress === address || transaction.toAddress === address) {
          transactions.push(transaction);
        }
      }
    }

    return transactions;
  }

  /**
   * Kiểm tra xem một chain có hợp lệ hay không?
   */
  isChainValid() {
    // Kiểm tra xem block đầu tiên có bị giả mạo hay không
    const realGenesis = JSON.stringify(this.createGenesisBlock());

    if (realGenesis !== JSON.stringify(this.chain[0])) {
      return false
    }

    // Kiểm tra xem các block còn lại trên chain
    // có hash và signature trùng khớp với nhau hay không
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (previousBlock.hash !== currentBlock.previousHash) {
        return false;
      }

      // Nếu có một block tồn tại giao dịch không hợp lệ,
      // thì chain chứa block đó cũng sẽ là không hợp lệ.
      if (!currentBlock.hasValidTransaction()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
    }

    return true;
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction;
