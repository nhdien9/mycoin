import {WalletService} from 'src/app/shared/services/wallet.service';
import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {MatTableDataSource} from '@angular/material/table';

@Component({
  selector: 'app-pending-transactions',
  templateUrl: './pending-transactions.component.html',
  styleUrls: ['./pending-transactions.component.scss'],
})
export class PendingTransactionsComponent implements OnInit {
  displayedColumns: string[] = [
    'position',
    'fromAddress',
    'toAddress',
    'amount',
    'timestamp',
  ];
  dataSource: MatTableDataSource<TransactionData> = null;
  isLoading = false;

  constructor(private title: Title, private walletService: WalletService) {
    this.title.setTitle('Các giao dịch đang chờ xử lý');
  }

  public startMining = () => {
    this.walletService.miningPendingTransaction().subscribe((data: any) => {
      this.getPendingTransactions();
    });
  };

  // tslint:disable-next-line:typedef
  public getPendingTransactions() {
    this.isLoading = true;
    this.walletService.getPendingTransaction().subscribe((data: any) => {
      this.dataSource = new MatTableDataSource<TransactionData>(
        data.pendingTransactions
      );
      this.isLoading = false;
    });
  }

  ngOnInit(): void {
    this.getPendingTransactions();
  }
}

export interface TransactionData {
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: number;
  signature: string;
}
