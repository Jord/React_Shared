// Please keep this consistent with Confluence Service Registry: https://jordinternational.atlassian.net/wiki/x/AgC6AQ
export type HorizonServiceCode =
    'access-control' |
    'acknowledgements' |
    'action-items' |
    'auth' |
    'comments' |
    'companies' |
    'cost-code-import' |
    'cross-references' |
    'dms' |
    'email' |
    'file-management' |
    'globals' |
    'jm-face-scan-reports' |
    'jm-reporting' |
    'jwt' |
    'project-hub' |
    'project-hub-email-and-docs' |
    'project-references' |
    'project-summaries' |
    'logging' |
    'qaproc-data-archive' |
    'report-scheduler' |
    'server-configuration' |
    'sky-project-costing' |
    'stamping' |
    'timesheets'
;

// Please keep this consistent with Confluence Application Registry: https://jordinternational.atlassian.net/wiki/x/BYANCg
export type HorizonApplicationCode =
    'access-control' |
    'auth' |
    'companies' |
    'dms' |
    'error-logs' |
    'file-management' |
    'globals' |
    'jm-face-scan-reports' |
    'jm-reporting' |
    'project-hub' |
    'project-hub-email-and-docs' |
    'project-summaries' |
    'project-references' |
    'outlook-sidebar' |
    'redirect-manager' |
    'report-scheduler' |
    'server-configuration' |
    'sidebar-data-portal' |
    'sky-project-costing' |
    'stamping' |
    'timesheets';

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
