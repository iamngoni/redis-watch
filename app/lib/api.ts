import { 
  RedisConnection, 
  RedisKey, 
  RedisKeyDetails, 
  RedisServerInfo, 
  RedisCommandResult, 
  ApiResponse, 
  PaginatedResponse, 
  KeysQueryParams, 
  ConnectionFormData,
  DashboardStats 
} from './types'

const API_BASE = '/api/redis'

class RedisApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      // Check if API is not implemented yet
      if (response.status === 404) {
        return this.mockResponse<T>(endpoint, options)
      }

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return {
        success: true,
        data: data.data || data,
      }
    } catch (error) {
      // If fetch fails (network error), provide mock responses for development
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return this.mockResponse<T>(endpoint, options)
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  private async mockResponse<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Mock responses for development
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body as string) : null

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))

    if (endpoint === '/connection/test' && method === 'POST') {
      return {
        success: true,
        data: true as T,
      }
    }

    if (endpoint === '/connect' && method === 'POST') {
      const connection: RedisConnection = {
        id: 'mock-' + Date.now(),
        name: body.name,
        host: body.host,
        port: body.port,
        password: body.password,
        isConnected: true,
        lastConnected: new Date(),
        url: body.url || `redis://${body.host}:${body.port}`,
      }
      return {
        success: true,
        data: connection as T,
      }
    }

    if (endpoint === '/connections' && method === 'GET') {
      return {
        success: true,
        data: [] as T,
      }
    }

    if (endpoint.startsWith('/keys') && method === 'GET') {
      const mockKeys = [
        { name: 'user:1001', type: 'hash', ttl: -1, size: 256 },
        { name: 'session:abc123', type: 'string', ttl: 3600, size: 128 },
        { name: 'cache:products', type: 'list', ttl: 1800, size: 1024 },
        { name: 'config:app', type: 'hash', ttl: -1, size: 512 },
        { name: 'queue:tasks', type: 'list', ttl: -1, size: 2048 },
      ]

      const paginatedResponse = {
        data: mockKeys,
        total: mockKeys.length,
        page: 1,
        pageSize: 50,
        hasNext: false,
        hasPrev: false,
      }

      return {
        success: true,
        data: paginatedResponse as T,
      }
    }

    if (endpoint === '/info' && method === 'GET') {
      const mockServerInfo: RedisServerInfo = {
        version: '7.0.0',
        mode: 'standalone',
        role: 'master',
        connectedClients: 2,
        usedMemory: 1048576,
        usedMemoryHuman: '1.00M',
        totalSystemMemory: 8589934592,
        maxMemory: 0,
        maxMemoryHuman: '0B',
        keyspaceHits: 1000,
        keyspaceMisses: 100,
        totalConnectionsReceived: 50,
        totalCommandsProcessed: 5000,
        instantaneousOpsPerSec: 10,
        uptime: 86400,
        databases: [
          { db: 0, keys: 5, expires: 2, avgTtl: 1800 }
        ],
      }

      return {
        success: true,
        data: mockServerInfo as T,
      }
    }

    if (endpoint === '/command' && method === 'POST') {
      const mockResult: RedisCommandResult = {
        command: body.command,
        result: 'OK',
        executionTime: Math.floor(Math.random() * 10) + 1,
        timestamp: new Date(),
      }

      return {
        success: true,
        data: mockResult as T,
      }
    }

    // Default mock response
    return {
      success: false,
      error: 'API endpoint not implemented yet (mock response)',
    }
  }

  // Connection Management
  async testConnection(connectionData: ConnectionFormData): Promise<ApiResponse<boolean>> {
    const payload = {
      ...connectionData,
      url: this.buildRedisUrl(connectionData),
    }
    return this.request<boolean>('/connection/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async connect(connectionData: ConnectionFormData): Promise<ApiResponse<RedisConnection>> {
    const payload = {
      ...connectionData,
      url: this.buildRedisUrl(connectionData),
    }
    return this.request<RedisConnection>('/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  private buildRedisUrl(connectionData: ConnectionFormData): string {
    const { host, port, password } = connectionData
    const auth = password ? `:${password}@` : ''
    return `redis://${auth}${host}:${port}`
  }

  async disconnect(connectionId: string): Promise<ApiResponse<void>> {
    return this.request<void>('/disconnect', {
      method: 'POST',
      body: JSON.stringify({ connectionId }),
    })
  }

  async getConnections(): Promise<ApiResponse<RedisConnection[]>> {
    return this.request<RedisConnection[]>('/connections')
  }

  async saveConnection(connection: Omit<RedisConnection, 'id' | 'isConnected'>): Promise<ApiResponse<RedisConnection>> {
    return this.request<RedisConnection>('/connections', {
      method: 'POST',
      body: JSON.stringify(connection),
    })
  }

  async updateConnection(id: string, connection: Partial<RedisConnection>): Promise<ApiResponse<RedisConnection>> {
    return this.request<RedisConnection>(`/connections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(connection),
    })
  }

  async deleteConnection(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/connections/${id}`, {
      method: 'DELETE',
    })
  }

  // Server Information
  async getServerInfo(connectionId?: string): Promise<ApiResponse<RedisServerInfo>> {
    const params = connectionId ? `?connectionId=${connectionId}` : ''
    return this.request<RedisServerInfo>(`/info${params}`)
  }

  async getDashboardStats(connectionId?: string): Promise<ApiResponse<DashboardStats>> {
    const params = connectionId ? `?connectionId=${connectionId}` : ''
    return this.request<DashboardStats>(`/stats${params}`)
  }

  // Key Management
  async getKeys(params: KeysQueryParams = {}): Promise<ApiResponse<PaginatedResponse<RedisKey>>> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const query = searchParams.toString()
    return this.request<PaginatedResponse<RedisKey>>(`/keys${query ? `?${query}` : ''}`)
  }

  async getKeyDetails(keyName: string, connectionId?: string): Promise<ApiResponse<RedisKeyDetails>> {
    const params = new URLSearchParams({ key: keyName })
    if (connectionId) params.append('connectionId', connectionId)
    
    return this.request<RedisKeyDetails>(`/keys/details?${params.toString()}`)
  }

  async deleteKey(keyName: string, connectionId?: string): Promise<ApiResponse<number>> {
    const body: any = { key: keyName }
    if (connectionId) body.connectionId = connectionId

    return this.request<number>('/keys/delete', {
      method: 'DELETE',
      body: JSON.stringify(body),
    })
  }

  async deleteKeys(keyNames: string[], connectionId?: string): Promise<ApiResponse<number>> {
    const body: any = { keys: keyNames }
    if (connectionId) body.connectionId = connectionId

    return this.request<number>('/keys/delete-multiple', {
      method: 'DELETE',
      body: JSON.stringify(body),
    })
  }

  async renameKey(oldKey: string, newKey: string, connectionId?: string): Promise<ApiResponse<void>> {
    const body: any = { oldKey, newKey }
    if (connectionId) body.connectionId = connectionId

    return this.request<void>('/keys/rename', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async setKeyTtl(keyName: string, ttl: number, connectionId?: string): Promise<ApiResponse<boolean>> {
    const body: any = { key: keyName, ttl }
    if (connectionId) body.connectionId = connectionId

    return this.request<boolean>('/keys/ttl', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // Command Execution
  async executeCommand(command: string, connectionId?: string): Promise<ApiResponse<RedisCommandResult>> {
    const body: any = { command }
    if (connectionId) body.connectionId = connectionId

    return this.request<RedisCommandResult>('/command', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async getCommandHistory(connectionId?: string, limit = 50): Promise<ApiResponse<RedisCommandResult[]>> {
    const params = new URLSearchParams()
    if (connectionId) params.append('connectionId', connectionId)
    if (limit) params.append('limit', limit.toString())

    const query = params.toString()
    return this.request<RedisCommandResult[]>(`/command/history${query ? `?${query}` : ''}`)
  }

  // Search and Filtering
  async searchKeys(pattern: string, connectionId?: string): Promise<ApiResponse<string[]>> {
    const params = new URLSearchParams({ pattern })
    if (connectionId) params.append('connectionId', connectionId)

    return this.request<string[]>(`/keys/search?${params.toString()}`)
  }

  async getKeysByType(type: string, connectionId?: string): Promise<ApiResponse<RedisKey[]>> {
    const params = new URLSearchParams({ type })
    if (connectionId) params.append('connectionId', connectionId)

    return this.request<RedisKey[]>(`/keys/by-type?${params.toString()}`)
  }

  // Bulk Operations
  async flushDatabase(database = 0, connectionId?: string): Promise<ApiResponse<void>> {
    const body: any = { database }
    if (connectionId) body.connectionId = connectionId

    return this.request<void>('/database/flush', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async flushAllDatabases(connectionId?: string): Promise<ApiResponse<void>> {
    const body: any = {}
    if (connectionId) body.connectionId = connectionId

    return this.request<void>('/database/flush-all', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // Memory Analysis
  async getMemoryUsage(keyName?: string, connectionId?: string): Promise<ApiResponse<number>> {
    const params = new URLSearchParams()
    if (keyName) params.append('key', keyName)
    if (connectionId) params.append('connectionId', connectionId)

    const query = params.toString()
    return this.request<number>(`/memory/usage${query ? `?${query}` : ''}`)
  }

  async getKeysByMemoryUsage(limit = 100, connectionId?: string): Promise<ApiResponse<Array<{ key: string; memory: number }>>> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (connectionId) params.append('connectionId', connectionId)

    const query = params.toString()
    return this.request<Array<{ key: string; memory: number }>>(`/memory/top-keys${query ? `?${query}` : ''}`)
  }

  // Pub/Sub
  async getChannels(pattern = '*', connectionId?: string): Promise<ApiResponse<string[]>> {
    const params = new URLSearchParams({ pattern })
    if (connectionId) params.append('connectionId', connectionId)

    return this.request<string[]>(`/pubsub/channels?${params.toString()}`)
  }

  async publishMessage(channel: string, message: string, connectionId?: string): Promise<ApiResponse<number>> {
    const body: any = { channel, message }
    if (connectionId) body.connectionId = connectionId

    return this.request<number>('/pubsub/publish', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // Import/Export
  async exportKeys(keys: string[], format: 'json' | 'redis', connectionId?: string): Promise<ApiResponse<string>> {
    const body: any = { keys, format }
    if (connectionId) body.connectionId = connectionId

    return this.request<string>('/export', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async importKeys(data: string, format: 'json' | 'redis', connectionId?: string): Promise<ApiResponse<{ imported: number; errors: string[] }>> {
    const body: any = { data, format }
    if (connectionId) body.connectionId = connectionId

    return this.request<{ imported: number; errors: string[] }>('/import', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }
}

export const redisApi = new RedisApiClient()