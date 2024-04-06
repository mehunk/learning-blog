# Migrate from CRA to Vite

## Introduction

Date：April 4th, 2024 

### Environment

- Vite: 5.2.8
- Node.js: 20.12.0
- vite-tsconfig-paths: 4.3.2
- vite-plugin-svgr: 4.2.0

## Install

```shell
$ npm install -D vite @vitejs/plugin-react
```

## Update config and related files

### Create config files

Create a config file `vite.config.ts` in root directory.

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

### index.html

Move `index.html` to root directory.

### Correct the extension name of each file 

Rename all files exporting React component with extension name `.js` or `.tsx` to `.jsx` or `.tsx`.

### Set proxy

Set proxy in the config file `vite.config.ts`.

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

## Install corresponding plugins

### vite-tsconfig-paths

To ensure that Vite can resolve paths according to TypeScript configuration, we need to install the `vite-tsconfig-paths` plugin.

### vite-plugin-svgr

To continue using syntax similar to `export { ReactComponent as LogoImage } from "./logo.svg";` to import SVG files, we need to install the `vite-plugin-svgr`plugin additionally.

## Incompatible libraries

### jsonwebtoken

`jsonwebtoken` uses some of Node.js's built-in modules, but Vite does not expose Node.js's built-in modules globally, so it prompts errors when some functions cannot be found.

There are several solutions, such as exposing the required built-in modules globally through configuration, but this solution is not reasonable.

The simplest solution is to directly use "jose" to replace `jsonwebtoken`. Although the APIs are not completely compatible, they are similar, and only a few modifications are needed.

## Other break changes

### \<xxx\> is not defined

- global is not defined
- require is not defined
- process is not defined

Define global variables in the `vite.config.ts` configuration file.

```javascript
export default defineConfig({
  define: {
    global: {},
    'process.env': {
      ...process.env,
      PUBLIC_URL: ''
    }
  }
})
```

## Replace scripts

Replace the previous `react-scripts` with commands related to vite.

```json
{
  "scripts": {
    "start": "vite",
    "build": "tsc && vite build"
  }
}
```

## Reference

- [Migrating a Create React App project to Vite](https://darekkay.com/blog/create-react-app-to-vite/)