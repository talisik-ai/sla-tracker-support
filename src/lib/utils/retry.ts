export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  onRetry: () => {},
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number
): number {
  const delay = initialDelay * Math.pow(backoffFactor, attempt - 1)
  return Math.min(delay, maxDelay)
}

function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  if ('code' in error) {
    const code = (error as { code?: string }).code
    if (code === 'ECONNABORTED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
      return true
    }
  }

  if ('response' in error) {
    const status = (error as { response?: { status?: number } }).response?.status
    if (status && (status >= 500 || status === 429 || status === 408)) {
      return true
    }
  }

  return false
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (!isRetryableError(error) || attempt > config.maxRetries) {
        throw lastError
      }

      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffFactor
      )

      console.warn(`[Retry] Attempt ${attempt} failed. Retrying in ${delay}ms...`)
      config.onRetry(attempt, lastError)
      await sleep(delay)
    }
  }

  throw lastError!
}

