const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const {Blockchain, Transaction} = require('./src/blockchain');
const request = require('request');

const ioClient = require('socket.io-client');
const port = process.env.PORT || process.argv[2]; // Cho phép chọn port để chạy úng dụng từ command-line

let server = app.listen(port, function () {
  console.log(`Listening to port at ${port}`);
});
let io = require('socket.io')(server);
let client = ioClient(`http://localhost:${process.argv[4]}`);

let mycoin = new Blockchain();

// Lấy thông tin về một chain nào đó
request.get(`http://localhost:${process.argv[4]}/blockchain`, (error, response, body) => {
    if (body) mycoin.chain = JSON.parse(body).blockchain.chain;
  }
);

// Lấy danh sách các giao dịch đang chờ xử lý
request.get(`http://localhost:${process.argv[4]}/blockchain/pending-transactions`, (error, response, body) => {
    if (body) mycoin.pendingTransactions = JSON.parse(body).pendingTransactions;
  }
);

// Khi có một node vừa được kết nối vào hệ thống
io.on('connection', (socket) => {
  console.log(`A new user connected: ${socket.id}`);

  let myKey;
  let myWalletAddress;

  // Lấy thông tin một ví điện tử
  app.get('/wallet', (req, res) => {
    myKey = ec.genKeyPair();
    myWalletAddress = myKey.getPublic('hex');

    const newBlock = mycoin.minePendingTransactions(myWalletAddress);

    client.emit('new-block', JSON.stringify(newBlock));
    client.emit('mine-transaction', '');

    res.json({
      publicKey: myWalletAddress,
      privateKey: myKey.getPrivate().toString(16),
    });
  });

  // Tạo một ví điện tử mới
  app.post('/wallet', (req, res) => {
    myKey = ec.keyFromPrivate(req.body.privateKey);
    myWalletAddress = myKey.getPublic('hex');

    res.json({
      publicKey: myWalletAddress,
    });
  });

  client.on('new-block', (newBlock) => {
    let block = JSON.parse(newBlock);
    if (mycoin.getLatestBlock().index !== block.index) mycoin.addBlock(block);
  });

  socket.on('new-block', (newBlock) => {
    let block = JSON.parse(newBlock);
    if (mycoin.getLatestBlock().index !== block.index) mycoin.addBlock(block);
  });

  client.on('new-transaction', (newTransaction) => {
    // console.log('client');
    console.log(newTransaction);
    let transaction = JSON.parse(newTransaction);
    socket.emit('new-transaction', newTransaction);
    mycoin.pendingTransactions.push(transaction);
  });

  socket.on('new-transaction', (newTransaction) => {
    // console.log('socket');
    let transaction = JSON.parse(newTransaction);
    socket.emit('new-transaction', newTransaction);
    mycoin.pendingTransactions.push(transaction);
  });

  client.on('mine-transaction', () => {
    socket.emit('mine-transaction', '');
    mycoin.pendingTransactions = [];
  });

  socket.on('mine-transaction', () => {
    socket.emit('mine-transaction', '');
    mycoin.pendingTransactions = [];
  });

  app.get('/public-key', (req, res) => {
    res.json({
      publicKey: myWalletAddress,
    });
  });

  app.post('/blockchain/init', (req, res) => {
    const newBlock = mycoin.minePendingTransactions(myWalletAddress);

    client.emit('new-block', JSON.stringify(newBlock));
    client.emit('mine-transaction', '');

    res.json({
      blockchain: mycoin,
    });
  });

  app.get('/blockchain', (req, res) => {
    res.json({
      blockchain: mycoin,
    });
  });

  app.get('/blockchain/balance', async function (req, res) {
    let balance = mycoin.getBalanceOfAddress(myWalletAddress);
    res.json({balance: balance});
  });

  app.post('/blockchain/send', async function (req, res) {
    let transaction = new Transaction(
      req.body.fromPublicKey,
      req.body.toPublicKey,
      req.body.amount
    );
    transaction.signTransaction(myKey);
    let newTransaction = mycoin.addTransaction(transaction);
    if (newTransaction.status && newTransaction.status === 1) {
      return res.status(400).json({
        message: newTransaction.message,
      });
    }
    client.emit('new-transaction', JSON.stringify(newTransaction));
    io.emit('new-transaction', JSON.stringify(newTransaction));

    res.json({success: true});
  });

  // Lấy danh sách các giao dịch cần được xác nhận
  app.get('/blockchain/pending-transactions', async function (req, res) {
    let pendingTransactions = mycoin.pendingTransactions;
    res.json({pendingTransactions: pendingTransactions});
  });

  app.post('/blockchain/mine-pending-transactions', async function (req, res) {
    const newBlock = mycoin.minePendingTransactions(myWalletAddress);
    client.emit('new-block', JSON.stringify(newBlock));
    client.emit('mine-transaction', '');
    io.emit('mine-transaction', '');
    io.emit('new-block', JSON.stringify(newBlock));
    res.json({success: true});
  });

  // Lấy thông tin lịch sử giao dịch
  app.get('/blockchain/history', async function (req, res) {
    let history = [];
    for (let i = 0; i < mycoin.chain.length; i++) {
      for (let j = 0; j < mycoin.chain[i].transactions.length; j++) {
        if (mycoin.chain[i].transactions[j].fromAddress === myWalletAddress ||
          mycoin.chain[i].transactions[j].toAddress === myWalletAddress) {
          history.push(mycoin.chain[i].transactions[j]);
        }
      }
    }
    res.json({history});
  });

  socket.on('disconnect', () => {
    console.log(`Đã ngắt kết nối với node ${socket.id}`);
  });
});
