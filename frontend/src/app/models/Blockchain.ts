import { Block } from './Block';
import { Transaction } from './Transaction';

export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  public pendingTransactions: Transaction[];
  public miningReward: number;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 1;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  /**
   * Tạo một block mới
   */
  createGenesisBlock() {
    return new Block(Date.parse('2022-05-01'), [], '0');
  }

  /**
   * Trả về block cuối cùng trong chain
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Đào tất cả các giao dịch chưa được xác nhận
   */
  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(
      null,
      miningRewardAddress,
      this.miningReward
    );
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    this.chain.push(block);

    this.pendingTransactions = [];
  }

  /**
   * Thêm một transaction mới vào trong danh sách các giao dịch chưa được xác nhận
   */
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Giao dịch phải bao gồm địa chỉ gửi và địa chỉ nhận');
    }

    // Xác nhận giao dịch
    if (!transaction.isValid()) {
      throw new Error('Không thể thêm một giao dịch không hợp lệ vào chain');
    }

    if (transaction.amount <= 0) {
      throw new Error('Số coin được chuyển phải lớn hơn 0');
    }

    // Đảm bảo rằng số coin được chuyển không được lớn hơn số dư của tài khoản
    if (
      this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount
    ) {
      throw new Error('Không đủ số dư');
    }

    this.pendingTransactions.push(transaction);
  }

  /**
   * Trả về số dư của một địa chỉ ví
   */
  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  /**
   * Trả về danh sách các giao dịch có liên quan.
   */
  getAllTransactionsForWallet(address) {
    const txs = [];

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          txs.push(tx);
        }
      }
    }

    return txs;
  }

  /**
   * Kiểm tra xem chain này có hợp lệ hay không?
   */
  isChainValid() {
    const realGenesis = JSON.stringify(this.createGenesisBlock());

    if (realGenesis !== JSON.stringify(this.chain[0])) {
      return false;
    }

    // Kiểm tra hash của các block còn lại
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];

      if (!currentBlock.hasValidTransactions()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
    }

    return true;
  }
}
