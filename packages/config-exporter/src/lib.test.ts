import { describe, expect, it, vi } from "vitest";
import { buildSelectors, fetchSelector, formatOutput, nestKeys } from "./lib";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal mock of AppConfigurationClient — only the method we call. */
function makeMockClient(settings: Array<{ key: string; value?: string }>) {
  const listConfigurationSettings = vi.fn().mockImplementation(() =>
    (async function* () {
      for (const s of settings) yield s;
    })(),
  );
  // Cast through unknown so we don't have to satisfy the full Azure SDK type.
  const client = { listConfigurationSettings } as unknown as Parameters<typeof fetchSelector>[0];
  return { client, listConfigurationSettings };
}

// ---------------------------------------------------------------------------
// buildSelectors
// ---------------------------------------------------------------------------

describe("buildSelectors", () => {
  const ENV = "production";
  const APP = "my-app";

  it("returns exactly 4 selectors", () => {
    expect(buildSelectors(ENV, APP)).toHaveLength(4);
  });

  it("selector 0: all horizon keys with no label, strips horizon: prefix", () => {
    const [s] = buildSelectors(ENV, APP);
    expect(s).toEqual({ keyFilter: "horizon:*", labelFilter: null, trimKeyPrefix: "horizon:" });
  });

  it("selector 1: all horizon keys with the environment label, strips horizon: prefix", () => {
    const selectors = buildSelectors(ENV, APP);
    expect(selectors[1]).toEqual({
      keyFilter: "horizon:*",
      labelFilter: ENV,
      trimKeyPrefix: "horizon:",
    });
  });

  it("selector 2: app-specific horizon keys with no label, strips app/horizon: prefix", () => {
    const selectors = buildSelectors(ENV, APP);
    expect(selectors[2]).toEqual({
      keyFilter: `${APP}/horizon:*`,
      labelFilter: null,
      trimKeyPrefix: `${APP}/horizon:`,
    });
  });

  it("selector 3: app-specific horizon keys with env label, strips app/horizon: prefix", () => {
    const selectors = buildSelectors(ENV, APP);
    expect(selectors[3]).toEqual({
      keyFilter: `${APP}/horizon:*`,
      labelFilter: ENV,
      trimKeyPrefix: `${APP}/horizon:`,
    });
  });

  it("uses the supplied envLabel and appName verbatim", () => {
    const selectors = buildSelectors("staging", "portal");
    expect(selectors[1]?.labelFilter).toBe("staging");
    expect(selectors[2]?.keyFilter).toBe("portal/horizon:*");
    expect(selectors[2]?.trimKeyPrefix).toBe("portal/horizon:");
  });
});

// ---------------------------------------------------------------------------
// nestKeys
// ---------------------------------------------------------------------------

describe("nestKeys", () => {
  it("returns an empty object for empty input", () => {
    expect(nestKeys({}, ":")).toEqual({});
  });

  it("preserves a flat key that contains no separator", () => {
    expect(nestKeys({ name: "Alice" }, ":")).toEqual({ name: "Alice" });
  });

  it("nests a single-level key", () => {
    expect(nestKeys({ "a:b": "val" }, ":")).toEqual({ a: { b: "val" } });
  });

  it("nests a deeply nested key", () => {
    expect(nestKeys({ "a:b:c": "deep" }, ":")).toEqual({ a: { b: { c: "deep" } } });
  });

  it("merges sibling keys under the same parent", () => {
    expect(nestKeys({ "a:x": "1", "a:y": "2" }, ":")).toEqual({
      a: { x: "1", y: "2" },
    });
  });

  it("handles a mix of flat and nested keys", () => {
    expect(nestKeys({ "a:b": "1", top: "2" }, ":")).toEqual({
      a: { b: "1" },
      top: "2",
    });
  });

  it("replaces a primitive value with an object when a deeper key conflicts", () => {
    // "a" starts as undefined, then "a:b" makes it an object — normal flow
    const result = nestKeys({ "a:b": "nested" }, ":");
    expect(result).toEqual({ a: { b: "nested" } });
  });

  it("uses a custom separator", () => {
    expect(nestKeys({ "x/y/z": "val" }, "/")).toEqual({ x: { y: { z: "val" } } });
  });

  it("preserves undefined values", () => {
    const result = nestKeys({ "a:b": undefined }, ":");
    expect(result).toEqual({ a: { b: undefined } });
  });

  it("last entry wins when two keys map to the same leaf path", () => {
    // Build an object where JS preserves insertion order; second 'a:b' wins.
    const flat: Record<string, string> = {};
    flat["a:b"] = "first";
    flat["a:c"] = "sibling";
    // Reassign same key so the last assignment wins when nestKeys iterates
    const flat2 = { ...flat, "a:b": "second" };
    expect(nestKeys(flat2, ":")).toEqual({ a: { b: "second", c: "sibling" } });
  });
});

// ---------------------------------------------------------------------------
// formatOutput
// ---------------------------------------------------------------------------

describe("formatOutput", () => {
  const data = { foo: "bar", count: 42 };
  const json = JSON.stringify(data, null, 2);

  it("outputs plain JSON for a .json file, ignoring wrapVar", () => {
    expect(formatOutput(data, "config.json", "window.CONFIG")).toBe(`${json}\n`);
  });

  it("outputs a JS variable assignment for a .js file with wrapVar", () => {
    expect(formatOutput(data, "horizonConfig.js", "window.__HORIZON_CONFIG__")).toBe(
      `window.__HORIZON_CONFIG__ = ${json};\n`,
    );
  });

  it("outputs plain JSON for a .js file when wrapVar is undefined", () => {
    expect(formatOutput(data, "config.js", undefined)).toBe(`${json}\n`);
  });

  it("outputs plain JSON for a .js file when wrapVar is an empty string", () => {
    expect(formatOutput(data, "config.js", "")).toBe(`${json}\n`);
  });

  it("always ends with a trailing newline", () => {
    expect(formatOutput(data, "config.json", undefined)).toMatch(/\n$/);
    expect(formatOutput(data, "config.js", "window.X")).toMatch(/\n$/);
  });

  it("uses 2-space indented JSON", () => {
    const output = formatOutput({ a: 1 }, "out.json", undefined);
    expect(output).toContain('  "a": 1');
  });
});

// ---------------------------------------------------------------------------
// fetchSelector
// ---------------------------------------------------------------------------

describe("fetchSelector", () => {
  it("returns an empty object when no settings are returned", async () => {
    const { client } = makeMockClient([]);
    const result = await fetchSelector(client, { keyFilter: "horizon:*", labelFilter: null });
    expect(result).toEqual({});
  });

  it("returns all key-value pairs from the client", async () => {
    const { client } = makeMockClient([
      { key: "horizon:feature", value: "true" },
      { key: "horizon:timeout", value: "30" },
    ]);
    const result = await fetchSelector(client, { keyFilter: "horizon:*", labelFilter: null });
    expect(result).toEqual({
      "horizon:feature": "true",
      "horizon:timeout": "30",
    });
  });

  it("strips the key prefix when trimKeyPrefix matches", async () => {
    const { client } = makeMockClient([
      { key: "my-app/setting", value: "val" },
      { key: "my-app/nested:key", value: "nested" },
    ]);
    const result = await fetchSelector(client, {
      keyFilter: "my-app/*",
      labelFilter: null,
      trimKeyPrefix: "my-app/",
    });
    expect(result).toEqual({
      setting: "val",
      "nested:key": "nested",
    });
  });

  it("leaves keys unchanged when they do not start with trimKeyPrefix", async () => {
    const { client } = makeMockClient([{ key: "other-app/setting", value: "val" }]);
    const result = await fetchSelector(client, {
      keyFilter: "my-app/*",
      labelFilter: null,
      trimKeyPrefix: "my-app/",
    });
    expect(result).toEqual({ "other-app/setting": "val" });
  });

  it("passes null labelFilter to the SDK as the no-label sentinel (\\0)", async () => {
    const { client, listConfigurationSettings } = makeMockClient([]);
    await fetchSelector(client, { keyFilter: "horizon:*", labelFilter: null });
    expect(listConfigurationSettings).toHaveBeenCalledWith({
      keyFilter: "horizon:*",
      labelFilter: "\0",
    });
  });

  it("passes a non-null labelFilter to the SDK as-is", async () => {
    const { client, listConfigurationSettings } = makeMockClient([]);
    await fetchSelector(client, { keyFilter: "horizon:*", labelFilter: "production" });
    expect(listConfigurationSettings).toHaveBeenCalledWith({
      keyFilter: "horizon:*",
      labelFilter: "production",
    });
  });

  it("preserves undefined setting values", async () => {
    const { client } = makeMockClient([{ key: "horizon:empty", value: undefined }]);
    const result = await fetchSelector(client, { keyFilter: "horizon:*", labelFilter: null });
    expect(result).toEqual({ "horizon:empty": undefined });
  });

  it("later settings overwrite earlier ones with the same key", async () => {
    const { client } = makeMockClient([
      { key: "horizon:x", value: "first" },
      { key: "horizon:x", value: "second" },
    ]);
    const result = await fetchSelector(client, { keyFilter: "horizon:*", labelFilter: null });
    expect(result["horizon:x"]).toBe("second");
  });
});
