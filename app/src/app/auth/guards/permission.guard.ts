import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateChild } from '@angular/router';
import { Observable } from 'rxjs';
import { PermissionService } from '../services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate, CanActivateChild {

  public constructor(private permissionService: PermissionService) {

  }

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot)
    : Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const right: string = next.data.right as string;
    const permission: boolean = this.hasRequiredPermission(right);
    console.log(`Active root route: ${next.url} - right: ${right}- permission: ${permission}`);
    return permission;
  }

  public canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot)
    : Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const right: string = childRoute.data.right as string;
    const permission: boolean = this.hasRequiredPermission(right);
    console.log(`Active child route: ${childRoute.url} - right: ${right}- permission: ${permission}`);
    return permission;
  }

  public hasRequiredPermission(right: string): boolean {
    if (right === undefined || this.permissionService.hasRight(right)) {
      return true;
    } else {
      return this.permissionService.hasExtendedRight(right);
    }
  }


}
