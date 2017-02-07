import {BehaviorSubject, Observable, Observer, Operator, Scheduler, Subject} from "rxjs";
import {of} from "rxjs/observable/of";
import {Injectable, Injector, ModuleWithProviders, NgModule, Optional} from "@angular/core";
import {
  ActivatedRouteSnapshot, CanActivateChild, ExtraOptions, RouterModule, RouterStateSnapshot,
  Routes
} from "@angular/router";

export type RollbackFunction<S, A> = (currentState: S, oldState: S, action: A) => S;
export type Reducer<S, A> = (store: Store<S,A>, state: S, action: A) => S|Observable<S>;
export type RouterNavigation = { type: 'ROUTER_NAVIGATION', state: RouterStateSnapshot };



@Injectable()
export class Store<S, A> {
  private actions = new Subject<{action: A, result: Observer<boolean>}>();
  private states: BehaviorSubject<S>;

  constructor(private reducer: Reducer<S, A>, initState: S) {
    this.states = new BehaviorSubject<S>(initState);

    this.actions.observeOn(Scheduler.async).mergeMap(a => {
      const state = reducer(this, this.states.value, a.action);
      const obs = state instanceof Observable ? state : of(state);
      return obs.map(state => ({state, result: a.result}));
    }).subscribe(pair => {
      this.states.next(pair.state);
      pair.result.next(true);
      pair.result.complete();
    });
  }

  subscribe(callback: (v:S) => void) {
    return this.states.subscribe(callback);
  }

  dispatch(action: A): Observable<boolean> {
    const res = new Subject<boolean>();
    this.actions.next({action, result: res});
    return res;
  }
}

@Injectable()
export class CanActivateChild_Internal implements CanActivateChild {
  private lastState: RouterStateSnapshot = null;
  constructor(private store: Store<any, any>) {}

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean|Observable<boolean> {
    if (this.lastState !== state) {
      this.lastState = state;
      return this.store.dispatch({type: 'ROUTER_NAVIGATION', state: state});
    } else {
      return true;
    }
  }
}

export function wrapRoutes(routes: Routes): Routes {
  return [{path: '', canActivateChild: [CanActivateChild_Internal], children: routes}];
}

export interface StoreOptions {
  reducer: any;
  initState: any;
}

@NgModule({})
export class RouterConnectedToStoreModule {
  static forRoot(store: StoreOptions, routes: Routes, config: ExtraOptions): ModuleWithProviders{
    return {
      ngModule: RouterModule,
      providers: [
        CanActivateChild_Internal,
        {provide: Store, useFactory: (inj) => new Store(inj.get(store.reducer), inj.get(store.initState)), deps: [Injector]},
        ...RouterModule.forRoot(wrapRoutes(routes), config).providers
      ]
    };
  }
}