import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

import * as ioClient from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };
  private REST_API_SERVER = 'http://localhost:4566';
  socket;

  constructor(private httpClient: HttpClient) {
    this.socket = ioClient(this.REST_API_SERVER);
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
    }
    return throwError(error.error.message);
  }

  createWallet = () => {
    return this.httpClient
      .get(`${this.REST_API_SERVER}/wallet`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  initWallet = (publicKey: string) => {
    return this.httpClient
      .post(
        `${this.REST_API_SERVER}/blockchain/init`,
        {
          publicKey,
        },
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  accessWallet = (privateKey: string) => {
    return this.httpClient
      .post(`${this.REST_API_SERVER}/wallet`, privateKey, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getBalance = (publicKey: string) => {
    return this.httpClient
      .get(`${this.REST_API_SERVER}/blockchain/balance`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  send = (transaction) => {
    return this.httpClient
      .post(
        `${this.REST_API_SERVER}/blockchain/send`,
        transaction,
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  getPendingTransaction = () => {
    return this.httpClient
      .get(
        `${this.REST_API_SERVER}/blockchain/pending-transactions`,
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  miningPendingTransaction = () => {
    return this.httpClient
      .post(
        `${this.REST_API_SERVER}/blockchain/mine-pending-transactions`,
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  getChain = () => {
    return this.httpClient
      .get(`${this.REST_API_SERVER}/blockchain`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getHistory = () => {
    return this.httpClient
      .get(`${this.REST_API_SERVER}/blockchain/history`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
}
