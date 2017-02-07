import {Injectable, ModuleWithProviders, NgModule, Optional} from "@angular/core";
import {
  ActivatedRouteSnapshot, CanActivateChild, ExtraOptions, RouterModule, RouterStateSnapshot,
  Routes
} from "@angular/router";
import {Store} from "@ngrx/store";

export const ROUTER_NAVIGATION = 'ROUTER_NAVIGATION';

@Injectable()
export class CanActivateChild_Internal implements CanActivateChild {
  private lastState: RouterStateSnapshot = null;

  constructor(@Optional() private store: Store<any>) {
    if (!store) {
      throw new Error("RouterConnectedToStoreModule can only be used in combination with StoreModule");
    }
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.lastState !== state) {
      this.lastState = state;
      this.store.dispatch({type: ROUTER_NAVIGATION, payload: state});
    }
    return true;
  }
}

export function wrapRoutes(routes: Routes): Routes {
  return [{path: '', canActivateChild: [CanActivateChild_Internal], children: routes}];
}

/**
 * Sets up the router module and wires it up to the store.
 *
 * Usage:
 *
 * ```typescript
 * @NgModule({
 *   declarations: [AppCmp, SimpleCmp],
 *   imports: [
 *     BrowserModule,
 *     StoreModule.provideStore({router: routerReducer}),
 *     RouterConnectedToStoreModule.forRoot([
 *       { path: '', component: SimpleCmp },
 *       { path: 'next', component: SimpleCmp }
 *     ], {useHash: true, initialNavigation: false})
 *   ],
 *   bootstrap: [AppCmp]
 * })
 * class AppModule {
 * }
 * ```
 */
@NgModule({})
export class RouterConnectedToStoreModule {
  static forRoot(routes: Routes, config?: ExtraOptions): ModuleWithProviders{
    return {
      ngModule: RouterModule,
      providers: [
        CanActivateChild_Internal,
        ...RouterModule.forRoot(wrapRoutes(routes), config).providers
      ]
    };
  }
}
