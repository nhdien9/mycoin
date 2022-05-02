const {Blockchain, Transaction} = require('./blockchain');

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('463e332ba16dcc316d7fc605e8668dfed6261669666fdea7c3beabafc7d02296');
const myWalletAddress = myKey.getPublic('hex');

// Khởi tạo một blockchain mới.
let mycoin = new Blockchain();

// Bắt đầu "đào" cho block đầu tiên.
mycoin.minePendingTransactions(myWalletAddress);

// Tạo một transaction đầu tiên.
const transaction1 = new Transaction(myWalletAddress, 'address2', 6);
transaction1.signTransaction(myKey);
mycoin.addTransaction(transaction1);

console.log('Bắt đầu tiến hành quá trình "đào" cho giao dịch đầu tiên...');
mycoin.minePendingTransactions(myWalletAddress);

// Tạo một transaction thứ hai.
const transaction2 = new Transaction(myWalletAddress, 'address1', 9);
transaction2.signTransaction(myKey);
mycoin.addTransaction(transaction2);

console.log('Bắt đầu tiến hành quá trình "đào" cho giao dịch thứ hai...');
mycoin.minePendingTransactions(myWalletAddress);

// Kiểm tra số dư trong tài khoản, sau khi nó đã "đào" thành công các transaction.
console.log(`Số dư trong tài khoản là: ${mycoin.getBalanceOfAddress(myWalletAddress)}`);

// mycoin.chain[1].transactions[0].amount = 1;

console.log(`Blockchain hợp lệ? ${mycoin.isChainValid() ? 'Có' : 'Không'}`);
