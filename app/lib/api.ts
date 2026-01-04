import { serverFn } from '@tanstack/react-start/server'
import {
  connectToRedis,
  getRedisInfo,
  getRedisKeys,
  executeRedisCommand,
  getServerMetrics,
  disconnectRedis,
} from '../server/redis'

export const connectServer = serverFn(
  { method: 'POST' },
  async (data: { id: string; host: string; port: number; password?: string }) => {
    return connectToRedis(data.id, data.host, data.port, data.password)
  }
)

export const getInfoServer = serverFn(
  { method: 'GET' },
  async (id: string) => {
    return getRedisInfo(id)
  }
)

export const getKeysServer = serverFn(
  { method: 'GET' },
  async (id: string, pattern: string = '*') => {
    return getRedisKeys(id, pattern)
  }
)

export const executeCommandServer = serverFn(
  { method: 'POST' },
  async (data: { id: string; command: string }) => {
    return executeRedisCommand(data.id, data.command)
  }
)

export const getMetricsServer = serverFn(
  { method: 'GET' },
  async (id: string) => {
    return getServerMetrics(id)
  }
)

export const disconnectServer = serverFn(
  { method: 'POST' },
  async (id: string) => {
    return disconnectRedis(id)
  }
)
