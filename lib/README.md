# @innet/for
[![NPM](https://img.shields.io/npm/v/@innet/for.svg)](https://github.com/d8corp/innet-for/blob/main/CHANGELOG.md)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@innet/for)](https://bundlephobia.com/result?p=@innet/for)
[![downloads](https://img.shields.io/npm/dm/@innet/for.svg)](https://www.npmjs.com/package/@innet/for)
[![license](https://img.shields.io/npm/l/@innet/for)](https://github.com/d8corp/innet-for/blob/main/LICENSE)  
This plugin helps to render a list of elements.

### Installation
npm
```bash
npm i @innet/for
```
yarn
```bash
yarn add @innet/for
```

Or just download a minified js file
[here](https://github.com/d8corp/innet-for/blob/main/lib/innet-for.min.js)

### Using
```typescript jsx
import innet from 'innet'
import For from '@innet/for'

innet((
  <for of={['foo', 'bar', 'baz']}>
    {(item, i) => <div>{i}: {item}</div>}
  </for>
), undefined, {for: For})
```

### Issues
If you find a bug or have a suggestion, please file an issue on [GitHub](https://github.com/d8corp/innet-for/issues).  
[![issues](https://img.shields.io/github/issues-raw/d8corp/innet-for)](https://github.com/d8corp/innet-for/issues)
> ---
[![stars](https://img.shields.io/github/stars/d8corp/innet-for?style=social)](https://github.com/d8corp/innet-for/stargazers)
[![watchers](https://img.shields.io/github/watchers/d8corp/innet-for?style=social)](https://github.com/d8corp/innet-for/watchers)
