import { CanActivateFn } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';

/** Lazy wrapper so `app.routes` does not eagerly import all tool host components. */
export const toolRouteGuard: CanActivateFn = async (route, state) => {
  const { toolRouteGuard: inner } = await import('./tool-route.guard');
  const result = inner(route, state);
  if (isObservable(result)) {
    return firstValueFrom(result);
  }
  return await Promise.resolve(result);
};
