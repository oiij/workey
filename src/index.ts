/* eslint-disable ts/no-unsafe-function-type */
import { createWebWorkerBlobUrl } from './utils'

export interface WorkerOptions {
  dependencies?: string[]
  localDependencies?: Function[]
  timeout?: number
}
export type WebWorkerStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'RUNNING'
  | 'ERROR'
  | 'TIMEOUT_EXPIRED'
export function createWorker<T extends (...fnArgs: any[]) => any>(fn: T, options?: WorkerOptions) {
  const { dependencies = [], localDependencies = [], timeout = false } = options || {}
  const blobUrl = createWebWorkerBlobUrl(fn, dependencies, localDependencies)
  const worker = new Worker(blobUrl)
  let workerStatus: WebWorkerStatus = 'PENDING'
  let timeoutId: number | undefined
  function workerTerminate(status: WebWorkerStatus = 'PENDING') {
    if (worker) {
      worker.terminate()
      URL.revokeObjectURL(blobUrl)
      window.clearTimeout(timeoutId)
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
      worker.onmessage = (e) => {
        const [status, result] = e.data as [WebWorkerStatus, ReturnType<T>]
        if (status === 'SUCCESS') {
          workerTerminate(status)
          return resolve(result)
        }
        else {
          workerTerminate('ERROR')
          return reject(result)
        }
      }
      worker.postMessage([[...args]])
      worker.addEventListener('error', (e) => {
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
