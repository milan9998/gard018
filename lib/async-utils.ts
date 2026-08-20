export class OperationTimeoutError extends Error {
  constructor(message = "Operacija je istekla") {
    super(message)
    this.name = "OperationTimeoutError"
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message?: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new OperationTimeoutError(message)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}
