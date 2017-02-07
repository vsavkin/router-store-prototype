import {Component, NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {NavigationEnd, Router} from "@angular/router";
import {Store, StoreModule} from "@ngrx/store";
import "rxjs/add/operator/filter";
import {ROUTER_NAVIGATION, RouterConnectedToStoreModule} from "../src/ngrx-store-router-module";


function routerReducer(state: string = "", action: any) {
  if (action.type === ROUTER_NAVIGATION) {
    return action.payload.url.toString();
  } else {
    return state;
  }
}

@Component({
  selector: 'test-app',
  template: '<router-outlet></router-outlet>'
})
class AppCmp {
}

@Component({
  selector: 'pagea-cmp',
  template: 'pagea-cmp'
})
class SimpleCmp {}

@NgModule({
  declarations: [AppCmp, SimpleCmp],
  imports: [
    BrowserModule,
    StoreModule.provideStore({router: routerReducer}),
    RouterConnectedToStoreModule.forRoot([
      { path: '', component: SimpleCmp },
      { path: 'next', component: SimpleCmp }
    ], {useHash: true, initialNavigation: false})
  ],
  bootstrap: [AppCmp]
})
class TestAppModule {
}

describe('ngrx', () => {
  beforeEach(() => {
    document.body.appendChild(document.createElement("test-app"));
  });

  it('should work', (done) => {

    platformBrowserDynamic().bootstrapModule(TestAppModule).then(ref => {
      const router = ref.injector.get(Router);
      const store = ref.injector.get(Store);

      let log = setUpLogging(router, store);

      router.navigateByUrl("/");

      setTimeout(() => {
        expect(log).toEqual([
          {type: 'store', url: ""}, //init event. has nothing to do with the router
          {type: 'store', url: "/"}, // ROUTER_NAVIGATION event in the store
          {type: 'router', url: '/'} // NavigationEnd
        ]);
        log.splice(0);

        router.navigateByUrl("next").then(() => {
          expect(log).toEqual([
            {type: 'store', url: "/next"},
            {type: 'router', url: '/next'}
          ]);
          done();
        });
      }, 100);
    });
  });
});

function setUpLogging(router: Router, store: Store<any>): string[] {
  const log = [];
  router.events.filter(e => e instanceof NavigationEnd).
  subscribe(e => log.push({type: 'router', url: e.url.toString()}));
  store.subscribe(store => log.push({type: 'store', url: store.router}));
  return log;
}