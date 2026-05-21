export type HorizonServiceCode = 'auth' | 'timesheets' | 'access-control' | 'common' | 'access-tokens' | 'logging' | 'file-attachment' | 'cross-references' | 'sky' | 'globals';

export type HorizonApplicationCode = 'timesheets' | 'access-control' | 'auth' | 'sidebar-data-portal';

export type HorizonServiceRuntimeConfig = {
    host?: string;
    basePath?: string;
}

export type HorizonApplicationRuntimeConfig = {
    host?: string;
    basePath?: string;
}

export type HorizonServiceDetails = {
    host: string;
    basePath: string;
    url: string;
}

export type HorizonApplicationDetails = {
    host: string;
    basePath: string;
    url: string;
}

export type HorizonRuntimeConfig = {
    defaultSuiteCode: string; // temporary until all applications are migrated
    defaultServiceHost: string;
    defaultApplicationHost: string;
    services: Record<string, HorizonServiceRuntimeConfig>;
    applications: Record<string, HorizonApplicationRuntimeConfig>;
    options?: Record<string, string>;
}

export type HorizonConfigOptions<
    TServices extends string = never,
    TApps extends string = never
> = {
    services?: TServices[];
    apps?: TApps[];
}

export type ResolvedHorizonConfig<
    TServices extends string = never,
    TApps extends string = never
> = {
    suiteCode: string;
    defaultServiceHost: string;
    defaultApplicationHost: string;
    services: Record<HorizonServiceCode | TServices, HorizonServiceDetails>;
    applications: Record<HorizonApplicationCode | TApps, HorizonApplicationDetails>;
    options: Record<string, string>;
}

declare global {
    interface Window {
        __HORIZON_CONFIG__?: Partial<HorizonRuntimeConfig>;
    }
}
