/* global process */
import type { Plugin } from "vite";
import fs from 'node:fs';
import path from 'node:path';
import {generateProxyConfig, generateRuntimeConfigWithProxiedServices } from "./helpers";
import type {HorizonRuntimeConfig} from "@horizon/config";

export interface HorizonPluginOptions {
  suiteCode: string;
  applicationCode: string;
  port: number;
  proxyHorizonServices?: string[];
  horizonConfig?: HorizonRuntimeConfig;
}

export function createHorizonPlugin(options: HorizonPluginOptions): Plugin {
  const {
    suiteCode = 'zord',
    applicationCode,
    port,
    proxyHorizonServices = [],
    horizonConfig,
  } = options;

  if (!port) throw new Error('[horizonDevPlugin] This applications local dev port is required — see https://jordinternational.atlassian.net/wiki/x/BYANCg');
  if (!suiteCode) throw new Error('[horizonDevPlugin] suiteCode is required');
  if (!applicationCode) throw new Error('[horizonDevPlugin] applicationCode is required');

  const appBasePath = `/${suiteCode}/${applicationCode}/`;
  let projectRoot = process.cwd();

  return {
    name: 'horizon',
    apply: 'serve',

    configResolved(config) {
      projectRoot = config.root;
    },

    config() {

      const proxy = horizonConfig ? generateProxyConfig(suiteCode, horizonConfig, proxyHorizonServices) : {};

      return {
        base: appBasePath,
        server: { port, strictPort: true, proxy },
      };
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== `${appBasePath}horizonConfig.js`) return next();
        if (fs.existsSync(path.resolve(projectRoot, 'public/horizonConfig.js'))) return next();
        if (!horizonConfig) return next();

        const generated = generateRuntimeConfigWithProxiedServices(
            horizonConfig,
            proxyHorizonServices,
            port,
        );

        res.setHeader('Content-Type', 'application/javascript');
        res.end(`window.__HORIZON_CONFIG__ = ${JSON.stringify(generated, null, 2)};\n`);
      });
    },
  };
}
