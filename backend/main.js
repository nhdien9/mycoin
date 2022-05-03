const {Blockchain, Transaction} = require('./src/blockchain');

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('463e332ba16dcc316d7fc605e8668dfed6261669666fdea7c3beabafc7d02296');
const myWalletAddress = myKey.getPublic('hex');

// Khởi tạo một blockchain mới.
let mycoin = new Blockchain();

// Bắt đầu "đào" cho block đầu tiên.
console.log('Bắt đầu tiến hành quá trình "đào" cho block đầu tiên...');
mycoin.minePendingTransactions(myWalletAddress);

// Tạo một giao dịch đầu tiên.
const transaction1 = new Transaction(myWalletAddress, 'address2', 6);
transaction1.signTransaction(myKey);
mycoin.addTransaction(transaction1);

console.log('\nBắt đầu tiến hành quá trình "đào" cho giao dịch đầu tiên...');
mycoin.minePendingTransactions(myWalletAddress);

// Tạo một giao dịch thứ hai.
const transaction2 = new Transaction(myWalletAddress, 'address1', 9);
transaction2.signTransaction(myKey);
mycoin.addTransaction(transaction2);

console.log('\nBắt đầu tiến hành quá trình "đào" cho giao dịch thứ hai...');
mycoin.minePendingTransactions(myWalletAddress);

// Kiểm tra số dư trong tài khoản, sau khi nó đã "đào" thành công các transaction.
console.log(`\nSố dư trong tài khoản là: ${mycoin.getBalanceOfAddress(myWalletAddress)}`);

// Nếu có bất kì thông tin trong giao dịch nào bị thay đổi,
// thì chắc chắn rằng chain đó sẽ không đảm bảo được tính hợp lệ
// mycoin.chain[1].transactions[0].amount = 1;

console.log(`Blockchain hợp lệ? ${mycoin.isChainValid() ? 'Có' : 'Không'}`);
