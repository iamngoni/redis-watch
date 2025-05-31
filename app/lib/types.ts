export interface RedisConnection {
  id: string
  name: string
  host: string
  port: number
  password?: string
  isConnected: boolean
  lastConnected?: Date
  url: string
}

export interface RedisKey {
  name: string
  type: RedisDataType
  ttl: number
  size?: number
  encoding?: string
  memoryUsage?: number
}

export type RedisDataType = 'string' | 'list' | 'set' | 'zset' | 'hash' | 'stream' | 'none'

export interface RedisKeyDetails extends RedisKey {
  value: any
  metadata: {
    encoding: string
    refCount: number
    lastAccess: number
    memoryUsage: number
  }
}

export interface RedisServerInfo {
  version: string
  mode: 'standalone' | 'sentinel' | 'cluster'
  role: 'master' | 'slave'
  connectedClients: number
  usedMemory: number
  usedMemoryHuman: string
  totalSystemMemory: number
  maxMemory: number
  maxMemoryHuman: string
  keyspaceHits: number
  keyspaceMisses: number
  totalConnectionsReceived: number
  totalCommandsProcessed: number
  instantaneousOpsPerSec: number
  uptime: number
  databases: RedisDatabase[]
}

export interface RedisDatabase {
  db: number
  keys: number
  expires: number
  avgTtl: number
}

export interface RedisCommandResult {
  command: string
  result: any
  error?: string
  executionTime: number
  timestamp: Date
}

export interface RedisCommandHistory {
  id: string
  command: string
  result: any
  error?: string
  executionTime: number
  timestamp: Date
  connectionId: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

export interface KeysQueryParams {
  pattern?: string
  type?: RedisDataType
  page?: number
  pageSize?: number
  sortBy?: 'name' | 'type' | 'ttl' | 'size'
  sortOrder?: 'asc' | 'desc'
}

export interface ConnectionFormData {
  name: string
  host: string
  port: number
  password?: string
  testConnection?: boolean
}

export interface DashboardStats {
  totalKeys: number
  totalMemory: number
  connectedClients: number
  opsPerSecond: number
  hitRate: number
  keyspaceByType: Record<RedisDataType, number>
  memoryByDatabase: Record<string, number>
}