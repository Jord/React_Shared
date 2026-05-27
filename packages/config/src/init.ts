import type { HorizonApplicationCode, HorizonConfigOptions, HorizonRuntimeConfig, HorizonServiceCode, ResolvedHorizonConfig } from "./types";
import { horizonApplicationDetails, horizonServiceDetails, resolveSuiteCode } from "./helpers";

const BASE_SERVICE_CODES: HorizonServiceCode[] = [
    'access-control',
    'action-items',
    'auth',
    'comments',
    'cross-references',
    'file-management',
    'globals',
    'jwt',
    'logging',
    'sky-project-costing',
    'timesheets'
];
const BASE_APP_CODES: HorizonApplicationCode[] = [
    'access-control',
    'auth',
    'sidebar-data-portal',
    'timesheets'
];

let _config: ResolvedHorizonConfig<string, string> | null = null;

export function initHorizonConfig<
    TServices extends string = never,
    TApps extends string = never
>(options?: HorizonConfigOptions<TServices, TApps>): ResolvedHorizonConfig<TServices, TApps> {
    const raw = (typeof window !== 'undefined' ? window.__HORIZON_CONFIG__ : undefined) ?? {};

    const horizonConfig: HorizonRuntimeConfig = {
        defaultSuiteCode:     raw.defaultSuiteCode     ?? '',
        defaultServiceHost:   raw.defaultServiceHost   ?? '',
        defaultApplicationHost: raw.defaultApplicationHost ?? '',
        services:     raw.services     ?? {},
        applications: raw.applications ?? {},
        ...(raw.options !== undefined && { options: raw.options }),
    };

    const suiteCode = resolveSuiteCode(horizonConfig);

    const allServiceCodes = [...BASE_SERVICE_CODES, ...(options?.services ?? [])];
    const allAppCodes     = [...BASE_APP_CODES,     ...(options?.apps     ?? [])];

    const services = Object.fromEntries(
        allServiceCodes.map(code => [code, horizonServiceDetails(suiteCode, code, horizonConfig)])
    ) as ResolvedHorizonConfig<TServices, TApps>['services'];

    const applications = Object.fromEntries(
        allAppCodes.map(code => [code, horizonApplicationDetails(suiteCode, code, horizonConfig)])
    ) as ResolvedHorizonConfig<TServices, TApps>['applications'];

    const config: ResolvedHorizonConfig<TServices, TApps> = {
        suiteCode,
        defaultServiceHost:     horizonConfig.defaultServiceHost,
        defaultApplicationHost: horizonConfig.defaultApplicationHost,
        services,
        applications,
        options: horizonConfig.options ?? {},
    };

    _config = config as ResolvedHorizonConfig<string, string>;
    return config;
}

export function getHorizonConfig(): ResolvedHorizonConfig<string, string> {
    if (!_config) throw new Error('Horizon config has not been initialized. Call initHorizonConfig() first.');
    return _config;
}
