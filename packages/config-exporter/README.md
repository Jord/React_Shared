# @horizon/config-exporter

This package exports App Configuration values as a Javascript or JSON file.

> Note: When developing this locally, use `npx .` instead of `npx @horizon/config` 

## Azure Pipelines

This package is used in our React Azure Pipelines at deployment time.
A config.js file is generated and injected into the deployed app under the `public/config.js` path.
The index.html file should be updated to include a script tag that loads this config.js file.

## Usage

### Export to JavaScript file

Specify the Horizon application code and environment label that will be used to export the configuration.

```bash
npx @horizon/config-exporter \
  --application-code <application-code> \
  --environment-label <environment-label> 
```

The default export format is a javascript file `config.js` of this format:

```shell
window.__HORIZON_CONFIG__ = { ...exportedConfig }
```

### Export to JSON file

If you want to export the configuration as a JSON file, specify an `--output` file that ends in `.json`.

```bash
npx @horizon/config-exporter \
  --application-code <application-code> \
  --environment-label <environment-label> \> \
  --output config.json
```

## Authentication

The export expects the environment to be already authenticated with Azure App Configuration.
No explicit login step is performed by the script.

Uses [`DefaultAzureCredential`](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/defaultazurecredential), which resolves credentials in this order:

- **CI / Azure VMs** — managed identity or service principal environment variables (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`)
- **Local development** — `az login` (Azure CLI)

## Publishing

```bash
cd packages/config-exporter
npm publish --registry https://pkgs.dev.azure.com/your-org/_packaging/your-feed/npm/registry/
```
