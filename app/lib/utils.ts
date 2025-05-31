// Simple className utility function to avoid dependency issues
export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDuration(seconds: number) {
  if (seconds < 0) return 'No TTL'
  if (seconds === 0) return 'Expired'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}

export function parseRedisResponse(response: any): string {
  if (response === null || response === undefined) return '(nil)'
  if (typeof response === 'string') return response
  if (typeof response === 'number') return response.toString()
  if (Array.isArray(response)) {
    return response.map((item, index) => `${index + 1}) ${parseRedisResponse(item)}`).join('\n')
  }
  if (typeof response === 'object') {
    return JSON.stringify(response, null, 2)
  }
  return String(response)
}

export function isValidRedisUrl(url: string): boolean {
  try {
    // More lenient Redis URL validation
    if (!url) return false
    
    // Allow simple host:port format
    const hostPortPattern = /^[a-zA-Z0-9.-]+:\d+$/
    if (hostPortPattern.test(url)) return true
    
    // Allow redis:// and rediss:// URLs
    const redisUrlPattern = /^rediss?:\/\/[a-zA-Z0-9.-]+(:\d+)?(\/.*)?(#.*)?(\?.*)?$/
    if (redisUrlPattern.test(url)) return true
    
    // Fallback to URL constructor for other cases
    const parsed = new URL(url)
    return ['redis:', 'rediss:', 'http:', 'https:'].includes(parsed.protocol)
  } catch {
    // If URL constructor fails, try simple validation
    const simplePattern = /^[a-zA-Z0-9.-]+(:\d+)?$/
    return simplePattern.test(url)
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}