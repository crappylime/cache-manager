import { DynamicModule, Module } from '@nestjs/common';
import { Events } from 'cache-manager';
import { CACHE_MANAGER } from './cache.constants';
import { ConfigurableModuleClass } from './cache.module-definition';
import { createCacheManager } from './cache.providers';
import {
  CacheModuleAsyncOptions,
  CacheModuleOptions,
} from './interfaces/cache-module.interface';
import EventEmitter from 'node:events';

/**
 * This is just the same as the `Cache` interface from `cache-manager` but you can
 * use this as a provider token as well.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export abstract class Cache {}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Cache {
  get: <T>(key: string) => Promise<T | null>;
  mget: <T>(keys: string[]) => Promise<(Awaited<T> | null)[]>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<T>;
  mset: <T>(
    list: Array<{
      key: string;
      value: T;
      ttl?: number;
    }>,
  ) => Promise<
    {
      key: string;
      value: T;
      ttl?: number;
    }[]
  >;
  del: (key: string) => Promise<boolean>;
  mdel: (keys: string[]) => Promise<boolean>;
  clear: () => Promise<boolean>;
  wrap: <T>(
    key: string,
    fnc: () => T | Promise<T>,
    ttl?: number | ((value: T) => number),
    refreshThreshold?: number,
  ) => Promise<T>;
  on: <E extends keyof Events>(
    event: E,
    listener: Events[E],
  ) => EventEmitter<[never]>;
  off: <E extends keyof Events>(
    event: E,
    listener: Events[E],
  ) => EventEmitter<[never]>;
}

/**
 * Module that provides Nest cache-manager.
 *
 * @see [Caching](https://docs.nestjs.com/techniques/caching)
 *
 * @publicApi
 */
@Module({
  providers: [
    createCacheManager(),
    {
      provide: Cache,
      useExisting: CACHE_MANAGER,
    },
  ],
  exports: [CACHE_MANAGER, Cache],
})
export class CacheModule extends ConfigurableModuleClass {
  /**
   * Configure the cache manager statically.
   *
   * @param options options to configure the cache manager
   *
   * @see [Customize caching](https://docs.nestjs.com/techniques/caching#customize-caching)
   */
  static register<StoreConfig extends Record<any, any> = Record<string, any>>(
    options: CacheModuleOptions<StoreConfig> = {} as any,
  ): DynamicModule {
    return {
      global: options.isGlobal,
      ...super.register(options),
    };
  }

  /**
   * Configure the cache manager dynamically.
   *
   * @param options method for dynamically supplying cache manager configuration
   * options
   *
   * @see [Async configuration](https://docs.nestjs.com/techniques/caching#async-configuration)
   */
  static registerAsync<
    StoreConfig extends Record<any, any> = Record<string, any>,
  >(options: CacheModuleAsyncOptions<StoreConfig>): DynamicModule {
    const moduleDefinition = super.registerAsync(options);

    return {
      global: options.isGlobal,
      ...moduleDefinition,
      providers: options.extraProviders
        ? moduleDefinition.providers.concat(options.extraProviders)
        : moduleDefinition.providers,
    };
  }
}
