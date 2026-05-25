import type { AppConfigurationClient } from "@azure/app-configuration";

export interface Selector {
  keyFilter: string;
  labelFilter: string | null;
  trimKeyPrefix?: string;
}

/**
 * Builds the four selectors used to fetch config from Azure App Configuration.
 * Order matters: later selectors override earlier ones during merge (last wins).
 *   1. horizon global keys  — no label  (base defaults)
 *   2. horizon global keys  — env label (env overrides for shared keys)
 *   3. app-specific keys    — no label  (app-level defaults)
 *   4. app-specific keys    — env label (highest precedence)
 */
export function buildSelectors(envLabel: string, appName: string): Selector[] {
  return [
    { keyFilter: "horizon:*", labelFilter: null, trimKeyPrefix: 'horizon:' },
    { keyFilter: "horizon:*", labelFilter: envLabel, trimKeyPrefix: 'horizon:'  },
    { keyFilter: `${appName}/horizon:*`, labelFilter: null, trimKeyPrefix: `${appName}/horizon:` },
    { keyFilter: `${appName}/horizon:*`, labelFilter: envLabel, trimKeyPrefix: `${appName}/horizon:` },
  ];
}

/**
 * Fetches all configuration settings matching a single selector and returns
 * them as a flat key→value map. Optionally strips a key prefix.
 * Null labelFilter is passed to the SDK as "\0" (the no-label sentinel).
 */
export async function fetchSelector(
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

/**
 * Transforms a flat key→value map into a nested object using the given
 * separator.  e.g. { "a:b:c": "val" } → { a: { b: { c: "val" } } }
 * When keys conflict at the same path, later entries win.
 */
export function nestKeys(flat: Record<string, unknown>, separator: string): Record<string, unknown> {
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

/**
 * Serialises the merged config to a string ready to write to disk.
 * - .json extension  → plain JSON (wrapVar is ignored)
 * - .js + wrapVar    → `<wrapVar> = <json>;`
 * - .js + no wrapVar → plain JSON
 * All outputs end with a trailing newline.
 */
export function formatOutput(
  merged: Record<string, unknown>,
  outputPath: string,
  wrapVar: string | undefined,
): string {
  const json = JSON.stringify(merged, null, 2);
  const isJson = outputPath.endsWith(".json");
  return isJson || !wrapVar ? `${json}\n` : `${wrapVar} = ${json};\n`;
}
