import {Component, NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {NavigationEnd, Router} from "@angular/router";
import "rxjs/add/operator/filter";
import {RouterConnectedToStoreModule, Store} from "../src/victor-store-router-module";


function routerReducer(store: Store<any, any>, state: string, action: any) {
  if (action.type === "ROUTER_NAVIGATION") {
    return action.state.url.toString();
  } else {
    return state;
  }
}

@Component({
  selector: 'victor-test-app',
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
    RouterConnectedToStoreModule.forRoot(
      {reducer: "StoreReducer", initState: "StoreInitState"},
      [
        { path: '', component: SimpleCmp },
        { path: 'next', component: SimpleCmp }
      ],
      {useHash: true, initialNavigation: false}
    )
  ],
  providers: [
    {provide: "StoreReducer", useValue: routerReducer},
    {provide: "StoreInitState", useValue: ""}
  ],
  bootstrap: [AppCmp]
})
class TestAppModule {
}

describe('victor', () => {
  beforeEach(() => {
    document.body.appendChild(document.createElement("victor-test-app"));
  });

  it('should work', (done) => {
    platformBrowserDynamic().bootstrapModule(TestAppModule).then(ref => {
      const router = ref.injector.get(Router);
      const store = ref.injector.get(Store);

      let log = setUpLogging(router, store);

      router.navigateByUrl("/");

      setTimeout(() => {
        expect(log).toEqual([
          {type: 'store', url: ""}, // Init event
          {type: 'store', url: "/"}, // ROUTER_NAVIGATION event in the store
          {type: 'router', url: '/'} // NavigationEnd
        ]);
        log.splice(0);
        done();

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

function setUpLogging(router: Router, store: Store<any, any>): string[] {
  const log = [];
  router.events.filter(e => e instanceof NavigationEnd).
  subscribe(e => log.push({type: 'router', url: e.url.toString()}));
  store.subscribe(state => log.push({type: 'store', url: state}));
  return log;
}