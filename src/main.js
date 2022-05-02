const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const {Blockchain, Transaction} = require('./blockchain');

const myKey = ec.keyFromPrivate('44c2456ca33788764c9ed1445ece267836e2ddaf84c1a38c3800e1bc33b06ea6');
const myWalletAddress = myKey.getPublic('hex');

// Khởi tạo một blockchain mới.
let mycoin = new Blockchain();

const transaction1 = new Transaction(myWalletAddress, '042edbe720b9eb5d38548429a93a1c96065109024783e0381addb02dfc9f47b69d0c9d83488586a14de2303daa7d5e6dcf322e2bfe701407194e19f4bb9c41722e', 10);
transaction1.signTransaction(myKey);
mycoin.addTransaction(transaction1);

console.log('Bắt đầu tiến hành quá trình "đào"...');
mycoin.minePendingTransactions(myWalletAddress);

// Kiểm tra số dư trong tài khoản, sau khi nó đã "đào" thành công các transaction.
console.log(`Số dư trong tài khoản là: ${mycoin.getBalanceOfAddress(myWalletAddress)}`);

mycoin.chain[1].transactions[0].amount = 1;

console.log(`Blockchain hợp lệ? ${mycoin.isChainValid()}`);
