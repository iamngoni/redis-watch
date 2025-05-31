import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { RedisConnection } from './types'

interface RedisContextType {
  activeConnection: RedisConnection | null
  setActiveConnection: (connection: RedisConnection | null) => void
  savedConnections: RedisConnection[]
  setSavedConnections: (connections: RedisConnection[]) => void
  isConnecting: boolean
  setIsConnecting: (connecting: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void
}

const RedisContext = createContext<RedisContextType | undefined>(undefined)

interface RedisProviderProps {
  children: ReactNode
}

export function RedisProvider({ children }: RedisProviderProps) {
  const [activeConnection, setActiveConnection] = useState<RedisConnection | null>(null)
  const [savedConnections, setSavedConnections] = useState<RedisConnection[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved connections from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('redis-connections')
    if (stored) {
      try {
        const connections = JSON.parse(stored)
        setSavedConnections(connections)
        
        // Try to restore last active connection
        const lastActive = localStorage.getItem('redis-last-active')
        if (lastActive) {
          const lastConnection = connections.find((c: RedisConnection) => c.id === lastActive)
          if (lastConnection) {
            setActiveConnection(lastConnection)
          }
        }
      } catch (e) {
        console.error('Failed to load saved connections:', e)
      }
    }
  }, [])

  // Save connections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('redis-connections', JSON.stringify(savedConnections))
  }, [savedConnections])

  // Save active connection ID to localStorage
  useEffect(() => {
    if (activeConnection) {
      localStorage.setItem('redis-last-active', activeConnection.id)
    } else {
      localStorage.removeItem('redis-last-active')
    }
  }, [activeConnection])

  const clearError = () => setError(null)

  const value: RedisContextType = {
    activeConnection,
    setActiveConnection,
    savedConnections,
    setSavedConnections,
    isConnecting,
    setIsConnecting,
    error,
    setError,
    clearError,
  }

  return (
    <RedisContext.Provider value={value}>
      {children}
    </RedisContext.Provider>
  )
}

export function useRedisContext() {
  const context = useContext(RedisContext)
  if (context === undefined) {
    throw new Error('useRedisContext must be used within a RedisProvider')
  }
  return context
}