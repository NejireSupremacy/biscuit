import { CDN_URL } from '@biscuitland/common';
import type { CDNRoutes, Routes } from './';
import { BiscuitREST } from './REST';

export enum RequestMethod {
  Delete = 'delete',
  Get = 'get',
  Patch = 'patch',
  Post = 'post',
  Put = 'put'
}

const ArrRequestsMethods = Object.values(RequestMethod) as string[];

export class Router {
  noop = () => {
    return;
  };

  constructor(private rest: BiscuitREST) {}

  createProxy(route = [] as string[]): Routes {
    return new Proxy(this.noop, {
      get: (_, key: string) => {
        if (ArrRequestsMethods.includes(key)) {
          return (...options: any[]) => this.rest[key](`/${route.join('/')}`, ...options);
        }
        route.push(key);
        return this.createProxy(route);
      },
      apply: (...[, _, args]) => {
        route.push(...args.filter((x) => x != null));
        return this.createProxy(route);
      }
    }) as unknown as Routes;
  }
}

export class CDN {
  static createProxy(route = [] as string[]): CDNRoutes {
    const noop = () => {
      return;
    };
    return new Proxy(noop, {
      get: (_, key: string) => {
        if (key === 'get') {
          return (value?: string) => {
            const lastRoute = `${CDN_URL}/${route.join('/')}`;
            if (value) {
              if (typeof value !== 'string') {
                // rome-ignore lint/style/noParameterAssign: ?!
                value = String(value);
              }
              return `${lastRoute}/${value}`;
            }
            return lastRoute;
          };
        }
        route.push(key);
        return this.createProxy(route);
      },
      apply: (...[, _, args]) => {
        route.push(...args.filter((x) => x != null));
        return this.createProxy(route);
      }
    }) as unknown as CDNRoutes;
  }
}
