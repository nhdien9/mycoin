const {Blockchain, Transaction} = require('./blockchain');

// Khởi tạo một blockchain mới.
let mycoin = new Blockchain();

// Test các transaction với 2 tài khoản.
mycoin.createTransaction(new Transaction('address1', 'address2', 9));
mycoin.createTransaction(new Transaction('address2', 'address1', 6));

console.log('\nBắt đầu tiến hành quá trình "đào"...');
mycoin.minePendingTransactions('address3');

// Kiểm tra số dư trong tài khoản "address3",
// sau khi nó đã "đào" thành công các transaction.
console.log(`Số dư trong tài khoản "address3" là: ${mycoin.getBalanceOfAddress('address3')}`);

// Tiến hành quá trình "đào" lại một lần nữa!
console.log('\nBắt đầu tiến hành quá trình "đào" thêm một lần nữa...');
mycoin.minePendingTransactions('address3');

// Kiểm tra lại số dư trong tài khoản "address3",
// sau khi nó đã "đào" thành công các transaction.
console.log(`Số dư trong tài khoản "address3" là: ${mycoin.getBalanceOfAddress('address3')}`);
