# Installation Guide

## Install Blackborne

Blackborne requires `react` and `react-dom` as peer dependencies.

### Using npm

```sh
npm install blackborne
```

### Using yarn

```sh
yarn add blackborne
```

### Using pnpm

```sh
pnpm add blackborne
```

## Tailwind CSS Configuration

If you're using Tailwind CSS, make sure to add the Blackborne plugins to your Tailwind configuration:

```js
/** @type {import('tailwindcss').Config} */
import BlackBornePlugins from 'blackborne/plugins';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/blackborne/**/*.{js,jsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [BlackBornePlugins]
};
```

## Peer Dependencies

Ensure that you have the required peer dependencies installed:

```sh
npm install react@^19.0.0 react-dom@^19.0.0 react-router-dom@^7.1.1
```

## Importing Components

After installation, you can import components into your project:

```js
import { Button } from 'blackborne';

function App() {
  return <Button>Click Me</Button>;
}
```
