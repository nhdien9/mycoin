import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot,} from '@angular/router';
import {Observable, of} from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (localStorage.getItem('publicKey')) {
      return of(true);
    }
    localStorage.clear();
    this.router.navigate(['/login']);
    return of(false);
  }
}
