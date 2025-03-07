/* eslint-disable ts/no-unsafe-function-type */
import { Worker } from 'node:worker_threads'
import { depsParser } from './utils'

export interface WorkerOptions {
  localDependencies?: Function[]
  timeout?: number
}
export type WebWorkerStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'RUNNING'
  | 'ERROR'
  | 'TIMEOUT_EXPIRED'

export function createNodeWorker<T extends (...fnArgs: any[]) => any>(fn: T, options?: WorkerOptions) {
  const { localDependencies = [], timeout = false } = options || {}

  const worker = new Worker(`
    const { parentPort } = require('worker_threads');
    const https = require('node:https');
    parentPort?.on('message', async(e) => {
    ${depsParser([], localDependencies)}
    const userFuncArgs = e[0]
    Promise.resolve((${fn}).apply(undefined,userFuncArgs))
      .then((result) => {
        parentPort?.postMessage(['SUCCESS', result])
      })
      .catch((error) => {
        parentPort?.postMessage(['ERROR', error])
      })
  })
    `, {
    eval: true,
  })
  let workerStatus: WebWorkerStatus = 'PENDING'
  let timeoutId: number | undefined
  function workerTerminate(status: WebWorkerStatus = 'PENDING') {
    if (worker) {
      worker.terminate()
      clearTimeout(timeoutId)
      workerStatus = status
    }
  }
  function callWorker(...args: Parameters<T>) {
    if (workerStatus === 'RUNNING') {
      console.warn('Worker is running.')
      return Promise.reject(new Error('Worker is running.'))
    }
    return new Promise<ReturnType<T>>((resolve, reject) => {
      workerStatus = 'RUNNING'
      worker.on('message', (e) => {
        const [status, result] = e as [WebWorkerStatus, ReturnType<T>]
        if (status === 'SUCCESS') {
          workerTerminate(status)
          return resolve(result)
        }
        else {
          workerTerminate('ERROR')
          return reject(result)
        }
      })
      worker.postMessage([[...args]])
      worker.addListener('error', (e) => {
        workerTerminate('ERROR')
        return reject(e)
      })
      if (timeout) {
        timeoutId = setTimeout(
          () => workerTerminate('TIMEOUT_EXPIRED'),
          timeout,
        ) as any
        return reject(new Error('Timeout expired.'))
      }
    })
  }
  return {
    worker,
    callWorker,
  }
}
