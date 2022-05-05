import {Block} from './Block';
import {Transaction} from './Transaction';

/**
 * Cấu trúc của một chain
 */
export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  public pendingTransactions: Transaction[];
  public miningReward: number;

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
    return new Block(Date.parse('2022-05-01'), [], '0');
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

    // Trả về block đã được "đào", để xử lý các thao tác khác
    return block;
  }

  /**
   * Thêm một giao dịch vào chain
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

    // Trả về transaction cần được "đào", để xử lý các thao tác khác
    return transaction;
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
