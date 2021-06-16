<img src="https://raw.githubusercontent.com/d8corp/innet/main/logo.svg" align="left" width="90" height="90" alt="InnetJs logo by Mikhail Lysikov">

# &nbsp; @innet/for

&nbsp;

[![NPM](https://img.shields.io/npm/v/@innet/for.svg)](https://github.com/d8corp/innet-for/blob/main/CHANGELOG.md)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@innet/for)](https://bundlephobia.com/result?p=@innet/for)
[![downloads](https://img.shields.io/npm/dm/@innet/for.svg)](https://www.npmjs.com/package/@innet/for)
[![license](https://img.shields.io/npm/l/@innet/for)](https://github.com/d8corp/innet-for/blob/main/LICENSE)  

This plugin helps if you need to loop over lists of data based on an array, Set, Map, etc.

[![stars](https://img.shields.io/github/stars/d8corp/innet-for?style=social)](https://github.com/d8corp/innet-for/stargazers)
[![watchers](https://img.shields.io/github/watchers/d8corp/innet-for?style=social)](https://github.com/d8corp/innet-for/watchers)

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
Provide the plugin into the third argument of [innet](https://www.npmjs.com/package/innet)
```typescript
import innet from 'innet'
import For from '@innet/for'
import App from './App.tsx'

innet({type: App}, undefined, {for: For})
```
Then just use it anywhere in the app.
```typescript jsx
<for of={['foo', 'bar', 'baz']}>
  {(value, index) => <div>#{index}: {value}</div>}
</for>
```

##### Index
You can get index of an element by the second argument.
```typescript jsx
<for of={['foo', 'bar', 'baz']}>
  {(value, index) => <div>#{index}: {value}</div>}
</for>
```

##### Key
You can use `key` attribute to bind HTML element with the list item.
```typescript jsx
<for of={[{_id: 1}, {_id: 2}]} key='_id'>
  {(item, i) => <div>{i}: {item._id}</div>}
</for>
```

Or you can use a function to identify the item.
```typescript jsx
<for of={[{_id: 1}, {_id: 2}]} key={item => item._id}>
  {(item, i) => <div>{i}: {item._id}</div>}
</for>
```
##### Else
You can show something when the list is empty.
```typescript jsx
<for of={[]}>
  {() => <div>The function will not run</div>}
  This text is shown 'cause of the array is empty.
  <p>
    Any children after the first function is shown!
  </p>
</for>
```
##### Size
You can limit the list by `size` property.
```typescript jsx
<for of={['foo', 'bar', 'baz']} size={2}>
  {item => <div>{item}</div>}
</for>
```
*The property can be a function to react on a state changes.*
##### State
You can use state of list to react on the changes.
```typescript jsx
const data = new State(['foo'])

innet((
  <for of={() => data.value}>
    {(item, i) => <div>{i}: {item}</div>}
  </for>
), undefined, {for: For})

data.value.push('bar')
data.update()
```
### Issues
If you find a bug or have a suggestion, please file an issue on [GitHub](https://github.com/d8corp/innet-for/issues).  
[![issues](https://img.shields.io/github/issues-raw/d8corp/innet-for)](https://github.com/d8corp/innet-for/issues)
