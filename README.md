# Connection Router to Store (Prototypes)

## Current Approach (ngrx/router-store)

### The current version of RouterStore does four things:

* It adds "path" to the state
* It adds "syntax sugar" actions (e.g., go, replace, search), so the use can send an action to navigate to the store, which will eventually called the router
* It sets up a listener that will send an action to the store when router navigates
* It sets up a listener that will send an action the router when the store "updates" the "path" property

### This approach suffers from a lot of problems:

#### Problem 1: Dispatch is different from clicking on a link

Calling

```
store.dispatch(go("/url"))
```

is different from

```
router.navigateByUrl("/url")
```

This means that `store.dispatch(go("/url"))` is different from clicking on a link ``<a routerLink='/url'>`.

In this first case the order of events will look like this:

* The reducer is called before the router updates
* The router updates
* The reducer is called after the router updates

Clicking on the link, on the other hand, will result in the following:

* The router updates
* The reducer is called after the router updates

Updating the URL directly will result in the following as well:

* The router updates
* The reducer is called after the router updates

This breaks the fundamental rule 'Updating the URL directly should not differ from updating it imperatively'. In practice this may not matter as much, but it is unfortunate that this property no longer holds.



#### Problem 2: Resolvers and Guards See Obsolete Data

Resolvers and guards cannot access the new state, which makes them less useful.

Since the order of events looks like this:

* The router updates
* The reducer is called after the router updates

We cannot access the updated state in guards or resolvers.



#### Problem 3: Router state stored in the store is a string

RouterStateSnapshot is the data structure we should use. It's way more useful for any non-trivial analysis of the URL. It's also almost impossible to write a useful reduction over a string. So writing reducers in the current setup is challenging.




#### Problem 4: Store has no way of preventing a navigation

The logic of the application is in the store. It's very handy for the store to be able to say 'no' to navigation.


These are really important problems which are caused by us synchronizing the store and the router. Any time we sync two mutable objects, we will have this problem.



## New Approach

I think we should NOT synchronize the store and the router, and instead make the store reduction part of the navigation process.

So it looks like this:

```
[Router Parses URL, Applies Redirects, Creates RouterStateSnapshot] =>
    [Store Emits New State] =>
        [Router Runs Guards and Resolvers] =>
            [RouteR Activates Components]
```

This approach fixes all the problems listed above.

* Every navigation corresponds to a single call to the reducing function. We follow the rule 'Updating the URL directly should not differ from updating it imperatively'.
* Resolvers and guards run after the store updates, so they see the latest data and can make decisions based on it.
* The store receives a RouterStateSnapshot, not a string. This is way more useful as you have access to the router config.
* The store can prevent navigation (see more comments below).
* No synchronization needed!
* We can achieve all of this with less code and no changes to the router itself.



## Two Versions

This repo contains two versions of the library:

* One for `ngrx/store`
* One for Victor's store

"Victor's store" differs from the ngrx/store in the following ways:

* The reducer can return an observable, in which case other actions will be blocked until this observable completes. This allows us to run async work in the reducer and wait for that async work to complete. The user dispatching an action can wait for that action to be processed!
* If that observable "errors", the navigation will be canceled.
* The store supports automatic rollbacks.