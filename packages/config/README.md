# @horizon/config

Runtime configuration loader for Horizon React applications.

* Reads `window.__HORIZON_CONFIG__`
* resolves the current suite code from the URL
* pre-computes service and application URLs using the default + override convention.

> To generate the `config.js` file at deployment time, see [`@horizon/config-exporter`](../config-exporter).

---

## How it works

At deployment time, a `config.js` file is injected into the app's HTML:

```html
<script src="./config.js"></script>
```

That file sets `window.__HORIZON_CONFIG__`:

```js
window.__HORIZON_CONFIG__ = {
  horizon: {
    defaultServiceHost: "https://alpha.example.com",
    defaultApplicationHost: "https://alpha.example.com",
    services: {
      "access-control": { basePath: "/access-control-service" }
    },
    applications: {},
    options: {}
  }
};
```

Call `initHorizonConfig()` once at app startup before React renders. It reads the window config, resolves all URLs, and stores the result in a singleton.

---

## Usage

### Basic setup

```ts
// main.tsx
import { initHorizonConfig } from '@horizon/config';

const config = initHorizonConfig();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

### With app-specific services and applications

If your app uses services or applications beyond the base Horizon set, declare them in the options. They are resolved using the same default + override convention as the built-in ones.

```ts
const config = initHorizonConfig({
  services: ['billing-api', 'reporting-api'] as const,
  apps: ['portal'] as const,
});
```

The `as const` is required for TypeScript to infer the literal types and provide autocomplete.

### Accessing config

Use the return value of `initHorizonConfig` directly — export it from a module so it's importable anywhere in the app:

```ts
// horizonConfig.ts
import { initHorizonConfig } from '@horizon/config';

export const horizonConfig = initHorizonConfig({
  services: ['billing-api'] as const,
});
```

```ts
// someService.ts
import { horizonConfig } from './horizonConfig';

const response = await fetch(horizonConfig.services['billing-api'].url);
```

Alternatively, `getHorizonConfig()` is available as a global accessor. It returns a loosely-typed version (no key inference) and throws if called before `initHorizonConfig()`.

```ts
import { getHorizonConfig } from '@horizon/config';

const config = getHorizonConfig();
```

---

## Resolved config shape

```ts
type ResolvedHorizonConfig = {
  suiteCode: string;               // resolved from URL pathname
  defaultServiceHost: string;
  defaultApplicationHost: string;
  services: Record<ServiceCode, HorizonServiceDetails>;
  applications: Record<AppCode, HorizonApplicationDetails>;
  options: Record<string, string>;
}

type HorizonServiceDetails = {
  host: string;
  basePath: string;
  url: string;      // host + basePath
}

type HorizonApplicationDetails = {
  host: string;
  basePath: string;
  url: string;      // host + basePath
}
```

---

## URL resolution convention

**Services** default to: `{defaultServiceHost}/api/{suiteCode}/{serviceCode}`

**Applications** default to: `{defaultApplicationHost}/{suiteCode}/{applicationCode}`

Override either `host` or `basePath` (or both) per-service/application in `window.__HORIZON_CONFIG__`:

```js
services: {
  "my-service": {
    host: "https://other.example.com",   // overrides defaultServiceHost
    basePath: "/custom/path"             // overrides the default path pattern
  }
}
```

---

## Base service and application codes

The following codes are included in every resolved config without needing to be declared in options:

**Services:** `timesheets`, `access-control`, `common`, `access-tokens`, `logging`, `file-attachment`

**Applications:** `timesheets`, `access-control`, `auth`, `sidebar-data-portal`
