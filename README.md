# workey

这个库可以将 WebWorker 代码在同一文件内运行 不需要引入WebWorker文件

## 安装

```bash
pnpm add workey
```

## 使用

```ts
import { createWorker } from 'workey'
function add(a: number, b: number) {
  return a + b
}
const { callWorker: worker } = createWorker((foo: string) => {
  const arr = Array.from({ length: 1000000 }, (_, i) => i)
  return {
    arr: arr.reduce((pre, cur) => add(pre, cur), 0),
    foo,
    dayjs: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  }
}, {
  dependencies: ['https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js'],
  localDependencies: [add],
})
worker('foo').then((res) => {
  console.log(res)
}).catch((err) => {
  console.log(err)
})
```

## NodeJS

```ts
import { createNodeWorker } from 'workey/node'
function add(a: number, b: number) {
  return a + b
}
const { callWorker: worker } = createNodeWorker((foo: string) => {
  const arr = Array.from({ length: 1000000 }, (_, i) => i)
  return {
    arr: arr.reduce((pre, cur) => add(pre, cur), 0),
    foo,
    // dayjs: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  }
}, {
  // dependencies: ['https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js'], // NodeJs环境无法引入远程脚本
  localDependencies: [add],
})
worker('foo').then((res) => {
  console.log(res)
}).catch((err) => {
  console.log(err)
})
```

## 配置

```ts
interface WorkerOptions {
  dependencies?: string[] //nodejs disabled
  // eslint-disable-next-line ts/no-unsafe-function-type
  localDependencies?: Function[]
  timeout?: number
}
```
