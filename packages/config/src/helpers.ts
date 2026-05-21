import type { HorizonApplicationDetails, HorizonRuntimeConfig, HorizonServiceDetails } from "./types";

export function resolveSuiteCode(horizonConfig: HorizonRuntimeConfig): string {
    const pathSuiteCode = window.location.pathname.split('/')[1];
    return (pathSuiteCode) ? pathSuiteCode : (horizonConfig.defaultSuiteCode ?? '');
}

export function horizonServiceDetails(suiteCode: string, serviceCode: string, horizonConfig: HorizonRuntimeConfig): HorizonServiceDetails {
    const serviceConfig = horizonConfig.services[serviceCode] ?? {};
    const host = serviceConfig.host ?? horizonConfig.defaultServiceHost;
    const basePath = serviceConfig.basePath ?? `/api/${suiteCode}/${serviceCode}`;
    return { host, basePath, url: `${host}${basePath}` };
}

export function horizonApplicationDetails(suiteCode: string, applicationCode: string, horizonConfig: HorizonRuntimeConfig): HorizonApplicationDetails {
    const appConfig = horizonConfig.applications[applicationCode] ?? {};
    const host = appConfig.host ?? horizonConfig.defaultApplicationHost;
    const basePath = appConfig.basePath ?? `/${suiteCode}/${applicationCode}`;
    return { host, basePath, url: `${host}${basePath}` };
}
