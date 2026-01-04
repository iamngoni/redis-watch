import { createClient, RedisClientType } from 'redis'

// Store active connections in memory (in production, use a proper session store)
const connections = new Map<string, RedisClientType>()

export async function connectToRedis(
  id: string,
  host: string,
  port: number,
  password?: string
) {
  try {
    // Close existing connection if any
    if (connections.has(id)) {
      await connections.get(id)?.quit()
    }

    const client = createClient({
      host,
      port,
      password,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    }) as RedisClientType

    client.on('error', (err) => console.error('Redis error:', err))

    await client.connect()
    connections.set(id, client)

    return { success: true, message: 'Connected to Redis' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect',
    }
  }
}

export async function getRedisInfo(id: string) {
  const client = connections.get(id)
  if (!client) {
    return { success: false, error: 'Not connected' }
  }

  try {
    const info = await client.info()
    return { success: true, info }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get info',
    }
  }
}

export async function getRedisKeys(id: string, pattern: string = '*') {
  const client = connections.get(id)
  if (!client) {
    return { success: false, error: 'Not connected' }
  }

  try {
    const keys = await client.keys(pattern)
    
    // Get type and TTL for each key
    const keyDetails = await Promise.all(
      keys.map(async (key) => {
        const type = await client.type(key)
        const ttl = await client.ttl(key)
        return { name: key, type, ttl }
      })
    )

    return { success: true, keys: keyDetails }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get keys',
    }
  }
}

export async function executeRedisCommand(id: string, command: string) {
  const client = connections.get(id)
  if (!client) {
    return { success: false, error: 'Not connected' }
  }

  try {
    const parts = command.trim().split(/\s+/)
    const result = await client.sendCommand(parts as any)
    return { success: true, result: JSON.stringify(result, null, 2) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Command failed',
    }
  }
}

export async function getServerMetrics(id: string) {
  const client = connections.get(id)
  if (!client) {
    return { success: false, error: 'Not connected' }
  }

  try {
    const info = await client.info('server')
    const stats = await client.info('stats')
    const memory = await client.info('memory')

    return {
      success: true,
      server: info,
      stats,
      memory,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics',
    }
  }
}

export async function disconnectRedis(id: string) {
  const client = connections.get(id)
  if (client) {
    await client.quit()
    connections.delete(id)
  }
  return { success: true }
}
