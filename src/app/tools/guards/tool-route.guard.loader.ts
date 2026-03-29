import { inject, Injector, runInInjectionContext } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';

/**
 * Lazy wrapper so `app.routes` does not eagerly import the guard module.
 * `inject()` in the inner guard must run inside an injection context — capture `Injector`
 * synchronously here, then invoke the lazy guard under `runInInjectionContext` after `import()`.
 */
export const toolRouteGuard: CanActivateFn = (route, state) => {
  const injector = inject(Injector);
  return import('./tool-route.guard').then(({ toolRouteGuard: inner }) =>
    runInInjectionContext(injector, () => {
      const result = inner(route, state);
      if (isObservable(result)) {
        return firstValueFrom(result);
      }
      return Promise.resolve(result);
    }),
  );
};
