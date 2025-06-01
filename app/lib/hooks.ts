import * as React from 'react'
import { redisApi } from './api'
import { 
  RedisConnection, 
  RedisKey, 
  RedisKeyDetails, 
  RedisServerInfo, 
  RedisCommandResult, 
  KeysQueryParams, 
  ConnectionFormData,
  DashboardStats 
} from './types'

// Simple state management without external dependencies
const { useState, useEffect } = React

// Mock query client for now
interface QueryResult<T> {
  data?: T
  isLoading: boolean
  error?: Error
  refetch: () => void
}

interface MutationResult<T> {
  mutateAsync: (variables: any) => Promise<T>
  isPending: boolean
}

// Simple cache store
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

function useQuery<T>(key: string[], queryFn: () => Promise<T>, enabled = true): QueryResult<T> {
  const [data, setData] = useState<T | undefined>()
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | undefined>()

  const fetchData = async () => {
    if (!enabled) return

    const cacheKey = JSON.stringify(key)
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(undefined)
      const result = await queryFn()
      setData(result)
      cache.set(cacheKey, { data: result, timestamp: Date.now() })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [JSON.stringify(key), enabled])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  }
}

function useMutation<T>(mutationFn: (variables: any) => Promise<T>): MutationResult<T> {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (variables: any): Promise<T> => {
    setIsPending(true)
    try {
      const result = await mutationFn(variables)
      // Invalidate relevant cache entries
      cache.clear()
      return result
    } finally {
      setIsPending(false)
    }
  }

  return {
    mutateAsync,
    isPending
  }
}

// Connection Hooks
export function useConnections() {
  return useQuery(['connections'], async () => {
    const response = await redisApi.getConnections()
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useTestConnection() {
  return useMutation(async (connectionData: ConnectionFormData) => {
    const response = await redisApi.testConnection(connectionData)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useConnect() {
  return useMutation(async (connectionData: ConnectionFormData) => {
    const response = await redisApi.connect(connectionData)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useDisconnect() {
  return useMutation(async (connectionId: string) => {
    const response = await redisApi.disconnect(connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useSaveConnection() {
  return useMutation(async (connection: Omit<RedisConnection, 'id' | 'isConnected'>) => {
    const response = await redisApi.saveConnection(connection)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useUpdateConnection() {
  return useMutation(async ({ id, connection }: { id: string; connection: Partial<RedisConnection> }) => {
    const response = await redisApi.updateConnection(id, connection)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useDeleteConnection() {
  return useMutation(async (id: string) => {
    const response = await redisApi.deleteConnection(id)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

// Server Info Hooks
export function useServerInfo(connectionId?: string, enabled = true) {
  return useQuery(['server-info', connectionId], async () => {
    const response = await redisApi.getServerInfo(connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled)
}

export function useDashboardStats(connectionId?: string, enabled = true) {
  return useQuery(['dashboard-stats', connectionId], async () => {
    const response = await redisApi.getDashboardStats(connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled)
}

// Key Management Hooks
export function useKeys(params: KeysQueryParams = {}, enabled = true) {
  return useQuery(['keys', params], async () => {
    const response = await redisApi.getKeys(params)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled)
}

export function useKeyDetails(keyName: string, connectionId?: string, enabled = true) {
  return useQuery(['key-details', keyName, connectionId], async () => {
    const response = await redisApi.getKeyDetails(keyName, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled && !!keyName)
}

export function useDeleteKey() {
  return useMutation(async ({ keyName, connectionId }: { keyName: string; connectionId?: string }) => {
    const response = await redisApi.deleteKey(keyName, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useDeleteKeys() {
  return useMutation(async ({ keyNames, connectionId }: { keyNames: string[]; connectionId?: string }) => {
    const response = await redisApi.deleteKeys(keyNames, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useRenameKey() {
  return useMutation(async ({ oldKey, newKey, connectionId }: { oldKey: string; newKey: string; connectionId?: string }) => {
    const response = await redisApi.renameKey(oldKey, newKey, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useSetKeyTtl() {
  return useMutation(async ({ keyName, ttl, connectionId }: { keyName: string; ttl: number; connectionId?: string }) => {
    const response = await redisApi.setKeyTtl(keyName, ttl, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

// Command Execution Hooks
export function useExecuteCommand() {
  return useMutation(async ({ command, connectionId }: { command: string; connectionId?: string }) => {
    const response = await redisApi.executeCommand(command, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useCommandHistory(connectionId?: string, limit = 50, enabled = true) {
  return useQuery(['command-history', connectionId], async () => {
    const response = await redisApi.getCommandHistory(connectionId, limit)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled)
}

// Search and Filtering Hooks
export function useSearchKeys(pattern: string, connectionId?: string, enabled = true) {
  return useQuery(['search-keys', pattern, connectionId], async () => {
    const response = await redisApi.searchKeys(pattern, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled && !!pattern && pattern.length > 0)
}

export function useKeysByType(type: string, connectionId?: string, enabled = true) {
  return useQuery(['keys-by-type', type, connectionId], async () => {
    const response = await redisApi.getKeysByType(type, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled && !!type)
}

// Memory Analysis Hooks
export function useMemoryUsage(keyName?: string, connectionId?: string, enabled = true) {
  return useQuery(['memory-usage', keyName, connectionId], async () => {
    const response = await redisApi.getMemoryUsage(keyName, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled && !!keyName)
}

export function useTopKeysByMemory(limit = 100, connectionId?: string, enabled = true) {
  return useQuery(['top-keys', limit, connectionId], async () => {
    const response = await redisApi.getKeysByMemoryUsage(limit, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled)
}

// Bulk Operations Hooks
export function useFlushDatabase() {
  return useMutation(async ({ database, connectionId }: { database?: number; connectionId?: string }) => {
    const response = await redisApi.flushDatabase(database, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useFlushAllDatabases() {
  return useMutation(async (connectionId?: string) => {
    const response = await redisApi.flushAllDatabases(connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

// Pub/Sub Hooks
export function useChannels(pattern = '*', connectionId?: string, enabled = true) {
  return useQuery(['channels', pattern, connectionId], async () => {
    const response = await redisApi.getChannels(pattern, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  }, enabled)
}

export function usePublishMessage() {
  return useMutation(async ({ channel, message, connectionId }: { channel: string; message: string; connectionId?: string }) => {
    const response = await redisApi.publishMessage(channel, message, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

// Import/Export Hooks
export function useExportKeys() {
  return useMutation(async ({ keys, format, connectionId }: { keys: string[]; format: 'json' | 'redis'; connectionId?: string }) => {
    const response = await redisApi.exportKeys(keys, format, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}

export function useImportKeys() {
  return useMutation(async ({ data, format, connectionId }: { data: string; format: 'json' | 'redis'; connectionId?: string }) => {
    const response = await redisApi.importKeys(data, format, connectionId)
    if (!response.success) throw new Error(response.error)
    return response.data!
  })
}