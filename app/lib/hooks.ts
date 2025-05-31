import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

// Query Keys
export const queryKeys = {
  connections: ['connections'] as const,
  connection: (id: string) => ['connections', id] as const,
  serverInfo: (connectionId?: string) => ['server-info', connectionId] as const,
  dashboardStats: (connectionId?: string) => ['dashboard-stats', connectionId] as const,
  keys: (params: KeysQueryParams) => ['keys', params] as const,
  keyDetails: (keyName: string, connectionId?: string) => ['key-details', keyName, connectionId] as const,
  commandHistory: (connectionId?: string) => ['command-history', connectionId] as const,
  memoryUsage: (keyName?: string, connectionId?: string) => ['memory-usage', keyName, connectionId] as const,
  topKeys: (limit: number, connectionId?: string) => ['top-keys', limit, connectionId] as const,
  channels: (pattern: string, connectionId?: string) => ['channels', pattern, connectionId] as const,
}

// Connection Hooks
export function useConnections() {
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: async () => {
      const response = await redisApi.getConnections()
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    staleTime: 30000, // 30 seconds
  })
}

export function useTestConnection() {
  return useMutation({
    mutationFn: async (connectionData: ConnectionFormData) => {
      const response = await redisApi.testConnection(connectionData)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
  })
}

export function useConnect() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (connectionData: ConnectionFormData) => {
      const response = await redisApi.connect(connectionData)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections })
    },
  })
}

export function useDisconnect() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await redisApi.disconnect(connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections })
    },
  })
}

export function useSaveConnection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (connection: Omit<RedisConnection, 'id' | 'isConnected'>) => {
      const response = await redisApi.saveConnection(connection)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections })
    },
  })
}

export function useUpdateConnection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, connection }: { id: string; connection: Partial<RedisConnection> }) => {
      const response = await redisApi.updateConnection(id, connection)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections })
    },
  })
}

export function useDeleteConnection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await redisApi.deleteConnection(id)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections })
    },
  })
}

// Server Info Hooks
export function useServerInfo(connectionId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.serverInfo(connectionId),
    queryFn: async () => {
      const response = await redisApi.getServerInfo(connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled,
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000, // 5 seconds
  })
}

export function useDashboardStats(connectionId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboardStats(connectionId),
    queryFn: async () => {
      const response = await redisApi.getDashboardStats(connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled,
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000, // 5 seconds
  })
}

// Key Management Hooks
export function useKeys(params: KeysQueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.keys(params),
    queryFn: async () => {
      const response = await redisApi.getKeys(params)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled,
    staleTime: 30000, // 30 seconds
  })
}

export function useKeyDetails(keyName: string, connectionId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.keyDetails(keyName, connectionId),
    queryFn: async () => {
      const response = await redisApi.getKeyDetails(keyName, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled: enabled && !!keyName,
    staleTime: 10000, // 10 seconds
  })
}

export function useDeleteKey() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ keyName, connectionId }: { keyName: string; connectionId?: string }) => {
      const response = await redisApi.deleteKey(keyName, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
    },
  })
}

export function useDeleteKeys() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ keyNames, connectionId }: { keyNames: string[]; connectionId?: string }) => {
      const response = await redisApi.deleteKeys(keyNames, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
    },
  })
}

export function useRenameKey() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ oldKey, newKey, connectionId }: { oldKey: string; newKey: string; connectionId?: string }) => {
      const response = await redisApi.renameKey(oldKey, newKey, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
    },
  })
}

export function useSetKeyTtl() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ keyName, ttl, connectionId }: { keyName: string; ttl: number; connectionId?: string }) => {
      const response = await redisApi.setKeyTtl(keyName, ttl, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.keyDetails(variables.keyName, variables.connectionId) })
    },
  })
}

// Command Execution Hooks
export function useExecuteCommand() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ command, connectionId }: { command: string; connectionId?: string }) => {
      const response = await redisApi.executeCommand(command, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries based on command type
      const command = variables.command.toLowerCase()
      
      if (command.includes('del') || command.includes('delete') || command.includes('set') || command.includes('expire')) {
        queryClient.invalidateQueries({ queryKey: ['keys'] })
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
      }
      
      if (command.includes('flushdb') || command.includes('flushall')) {
        queryClient.invalidateQueries({ queryKey: ['keys'] })
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
      }
      
      // Always invalidate command history
      queryClient.invalidateQueries({ queryKey: queryKeys.commandHistory(variables.connectionId) })
    },
  })
}

export function useCommandHistory(connectionId?: string, limit = 50, enabled = true) {
  return useQuery({
    queryKey: queryKeys.commandHistory(connectionId),
    queryFn: async () => {
      const response = await redisApi.getCommandHistory(connectionId, limit)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled,
    staleTime: 10000, // 10 seconds
  })
}

// Search and Filtering Hooks
export function useSearchKeys(pattern: string, connectionId?: string, enabled = true) {
  return useQuery({
    queryKey: ['search-keys', pattern, connectionId],
    queryFn: async () => {
      const response = await redisApi.searchKeys(pattern, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled: enabled && !!pattern && pattern.length > 0,
    staleTime: 30000, // 30 seconds
  })
}

export function useKeysByType(type: string, connectionId?: string, enabled = true) {
  return useQuery({
    queryKey: ['keys-by-type', type, connectionId],
    queryFn: async () => {
      const response = await redisApi.getKeysByType(type, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled: enabled && !!type,
    staleTime: 30000, // 30 seconds
  })
}

// Memory Analysis Hooks
export function useMemoryUsage(keyName?: string, connectionId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.memoryUsage(keyName, connectionId),
    queryFn: async () => {
      const response = await redisApi.getMemoryUsage(keyName, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled: enabled && !!keyName,
    staleTime: 30000, // 30 seconds
  })
}

export function useTopKeysByMemory(limit = 100, connectionId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.topKeys(limit, connectionId),
    queryFn: async () => {
      const response = await redisApi.getKeysByMemoryUsage(limit, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled,
    staleTime: 60000, // 1 minute
  })
}

// Bulk Operations Hooks
export function useFlushDatabase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ database, connectionId }: { database?: number; connectionId?: string }) => {
      const response = await redisApi.flushDatabase(database, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
    },
  })
}

export function useFlushAllDatabases() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (connectionId?: string) => {
      const response = await redisApi.flushAllDatabases(connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
    },
  })
}

// Pub/Sub Hooks
export function useChannels(pattern = '*', connectionId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.channels(pattern, connectionId),
    queryFn: async () => {
      const response = await redisApi.getChannels(pattern, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    enabled,
    staleTime: 30000, // 30 seconds
  })
}

export function usePublishMessage() {
  return useMutation({
    mutationFn: async ({ channel, message, connectionId }: { channel: string; message: string; connectionId?: string }) => {
      const response = await redisApi.publishMessage(channel, message, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
  })
}

// Import/Export Hooks
export function useExportKeys() {
  return useMutation({
    mutationFn: async ({ keys, format, connectionId }: { keys: string[]; format: 'json' | 'redis'; connectionId?: string }) => {
      const response = await redisApi.exportKeys(keys, format, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
  })
}

export function useImportKeys() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ data, format, connectionId }: { data: string; format: 'json' | 'redis'; connectionId?: string }) => {
      const response = await redisApi.importKeys(data, format, connectionId)
      if (!response.success) throw new Error(response.error)
      return response.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
    },
  })
}