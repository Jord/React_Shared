import type {ProxyOptions} from "vite";
import type {HorizonRuntimeConfig} from "@horizon/config";
import {horizonServiceDetails} from "@horizon/config";


export function generateRuntimeConfigWithProxiedServices(
    runtimeConfig: HorizonRuntimeConfig,
    proxyHorizonServices: string[],
    port: number,
): HorizonRuntimeConfig {
    const generated = {
        ...runtimeConfig,
        horizon: {
            ...runtimeConfig.horizon,
            services: {
                ...runtimeConfig.horizon?.services,
            }
        }
    };

    for (const serviceCode of proxyHorizonServices) {
        generated.horizon.services[serviceCode] = {
            ...generated.horizon.services[serviceCode],
            host: `http://localhost:${port}`,
        }
    }
    return generated;
}

export function generateProxyConfig(suiteCode: string, runtimeConfig: HorizonRuntimeConfig, proxyHorizonServices: string[]) {
    const proxy: Record<string, string | ProxyOptions> = {};
    for (const serviceCode of proxyHorizonServices) {
        const horizonService = horizonServiceDetails(suiteCode, serviceCode, runtimeConfig);
        proxy[horizonService.basePath] = {
            target: horizonService.host,
            changeOrigin: true,
        };
    }
    return proxy;
}