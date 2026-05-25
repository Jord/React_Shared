import { AppConfigurationClient } from "@azure/app-configuration";
import { DefaultAzureCredential } from "@azure/identity";
import { writeFileSync } from "fs";
import { parseArgs } from "util";
import { buildSelectors, fetchSelector, formatOutput, nestKeys } from "./lib";

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

function buildClient(): AppConfigurationClient {
  const endpoint = args.endpoint ?? `https://${args.name}.azconfig.io`;
  return new AppConfigurationClient(endpoint, new DefaultAzureCredential());
}

async function main(envLabel: string, appCode: string) {
  const client = buildClient();
  const selectors = buildSelectors(envLabel, appCode);

  // Fetch all selectors in parallel, preserving order for merge (last wins on conflict)
  const configs = await Promise.all(selectors.map((s) => fetchSelector(client, s)));
  const flat = Object.assign({}, ...configs) as Record<string, unknown>;
  const merged = args.separator ? nestKeys(flat, args.separator) : flat;

  const output = formatOutput(merged, args.output, args["wrap-var"]);
  writeFileSync(args.output, output);
  console.log(`Wrote ${Object.keys(merged).length} keys to ${args.output}`);
}

main(environmentLabel, applicationCode).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
