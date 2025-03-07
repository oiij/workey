/* eslint-disable ts/no-unsafe-function-type */

/**
 *
 * Concatenates the dependencies into a comma separated string.
 * this string will then be passed as an argument to the "importScripts" function
 *
 * @param deps array of string
 * @param localDeps array of function
 * @returns a string composed by the concatenation of the array
 * elements "deps" and "importScripts".
 *
 * @example
 * depsParser(['demo1', 'demo2']) // return importScripts('demo1', 'demo2')
 */
export function depsParser(deps: string[], localDeps: Function[]) {
  if (deps.length === 0 && localDeps.length === 0)
    return ''

  const depsString = deps.map(dep => `'${dep}'`).toString()
  const depsFunctionString = localDeps.filter(dep => typeof dep === 'function').map((fn) => {
    const str = fn.toString()
    if (str.trim().startsWith('function')) {
      return str
    }
    else {
      const name = fn.name
      return `const ${name} = ${str}`
    }
  }).join(';')
  const importString = `importScripts(${depsString});`

  return `${depsString.trim() === '' ? '' : importString} ${depsFunctionString}`
}

/**
 * This function accepts as a parameter a function "userFunc"
 * And as a result returns an anonymous function.
 * This anonymous function, accepts as arguments,
 * the parameters to pass to the function "useArgs" and returns a Promise
 * This function can be used as a wrapper, only inside a Worker
 * because it depends by "postMessage".
 *
 * @param userFunc {Function} fn the function to run with web worker
 *
 * @returns returns a function that accepts the parameters
 * to be passed to the "userFunc" function
 */
export function jobRunnerWebWorker(userFunc: Function) {
  return (e: MessageEvent) => {
    const userFuncArgs = e.data[0]

    // eslint-disable-next-line prefer-spread
    return Promise.resolve(userFunc.apply(undefined, userFuncArgs))
      .then((result) => {
        postMessage(['SUCCESS', result])
      })
      .catch((error) => {
        postMessage(['ERROR', error])
      })
  }
}

/**
 * Converts the "fn" function into the syntax needed to be executed within a web worker
 *
 * @param fn the function to run with web worker
 * @param deps array of strings, imported into the worker through "importScripts"
 * @param localDeps array of function, local dependencies
 *
 * @returns a blob url, containing the code of "fn" as a string
 *
 * @example
 * createWorkerBlobUrl((a,b) => a+b, [])
 * // return "onmessage=return Promise.resolve((a,b) => a + b)
 * .then(postMessage(['SUCCESS', result]))
 * .catch(postMessage(['ERROR', error])"
 */
export function createWebWorkerBlobUrl(fn: Function, deps: string[], localDeps: Function[]) {
  const blobCode = `${depsParser(deps, localDeps)}; onmessage=(${jobRunnerWebWorker})(${fn})`
  const blob = new Blob([blobCode], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  return url
}
