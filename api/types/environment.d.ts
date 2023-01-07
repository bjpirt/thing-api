export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      METRICS_TABLE?: string
      DATASETS_TABLE?: string
      IS_OFFLINE?: string
      JEST_WORKER_ID?: string
    }
  }
}
