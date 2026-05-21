import { AppConfigurationClient } from "@azure/app-configuration";
import { DefaultAzureCredential } from "@azure/identity";
import { writeFileSync } from "fs";
import { parseArgs } from "util";

const { values: args } = parseArgs({
  options: {
    name:                { type: "string", default: "ReactHorizonAppConfig" },
    "environment-label": { type: "string" },
    "application-code":  { type: "string" },
    output:              { type: "string", default: "horizonConfig.js" },
    "wrap-var":          { type: "string", default: "window.__HORIZON_CONFIG__" },
    separator:           { type: "string", default: ":" },
    endpoint:            { type: "string" },
  } as const,
  strict: true,
});

const environmentLabel = args["environment-label"];
const applicationCode = args["application-code"];

if (!environmentLabel) {
  console.error("Error: --environment-label is required");
  process.exit(1);
}
if (!applicationCode) {
  console.error("Error: --application-code is required");
  process.exit(1);
}

interface Selector {
  keyFilter: string;
  labelFilter: string | null;
  trimKeyPrefix?: string;
}

function buildSelectors(envLabel: string, appName: string): Selector[] {
  return [
    { keyFilter: "horizon:*", labelFilter: null },
    { keyFilter: "horizon:*", labelFilter: envLabel },
    { keyFilter: `${appName}/*`, labelFilter: null, trimKeyPrefix: `${appName}/` },
    { keyFilter: `${appName}/*`, labelFilter: envLabel, trimKeyPrefix: `${appName}/` },
  ];
}

function buildClient(): AppConfigurationClient {
  const endpoint = args.endpoint ?? `https://${args.name}.azconfig.io`;
  return new AppConfigurationClient(endpoint, new DefaultAzureCredential());
}

async function fetchSelector(
  client: AppConfigurationClient,
  selector: Selector,
): Promise<Record<string, string | undefined>> {
  const result: Record<string, string | undefined> = {};
  for await (const setting of client.listConfigurationSettings({
    labelFilter: selector.labelFilter ?? "\0",
    keyFilter: selector.keyFilter,
  })) {
    const key =
      selector.trimKeyPrefix !== undefined && setting.key.startsWith(selector.trimKeyPrefix)
        ? setting.key.slice(selector.trimKeyPrefix.length)
        : setting.key;
    result[key] = setting.value;
  }
  return result;
}

function nestKeys(flat: Record<string, unknown>, separator: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(separator);
    let obj = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (typeof obj[part] !== "object" || obj[part] === null) {
        obj[part] = {};
      }
      obj = obj[part] as Record<string, unknown>;
    }
    obj[parts[parts.length - 1]!] = value;
  }
  return result;
}

async function main(envLabel: string, appCode: string) {
  const client = buildClient();
  const selectors = buildSelectors(envLabel, appCode);

  // Fetch all selectors in parallel, preserving order for merge (last wins on conflict)
  const configs = await Promise.all(selectors.map((s) => fetchSelector(client, s)));
  const flat = Object.assign({}, ...configs) as Record<string, unknown>;
  const merged = args.separator ? nestKeys(flat, args.separator) : flat;

  const json = JSON.stringify(merged, null, 2);
  const isJson = args.output.endsWith(".json");
  const output = isJson || !args["wrap-var"] ? `${json}\n` : `${args["wrap-var"]} = ${json};\n`;

  writeFileSync(args.output, output);
  console.log(`Wrote ${Object.keys(merged).length} keys to ${args.output}`);
}

main(environmentLabel, applicationCode).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
