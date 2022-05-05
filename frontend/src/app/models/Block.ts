import * as crypto from 'crypto';

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
     * Trả về SHA256 của block này
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
     * Tiến hành quá trình "đào" trên block
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
     * Kiểm tra xem tất cả giao dịch bên trong block này có hợp lệ hay không
     */
    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }

        return true;
    }
}
