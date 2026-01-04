import * as React from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  connectServer,
  getKeysServer,
  executeCommandServer,
  disconnectServer,
} from '../lib/api'

interface RedisConnection {
  id: string
  name: string
  host: string
  port: number
  isConnected: boolean
}

interface ConnectionFormProps {
  onConnect: (connection: { name: string; host: string; port: number }) => void
}

function ConnectionForm({ onConnect }: ConnectionFormProps) {
  const [name, setName] = React.useState('Local Redis')
  const [host, setHost] = React.useState('127.0.0.1')
  const [port, setPort] = React.useState(6379)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConnect({ name, host, port })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Connect to Redis</h3>
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Host</label>
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Port</label>
        <input
          type="number"
          value={port}
          onChange={(e) => setPort(parseInt(e.target.value))}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Connect
      </button>
    </form>
  )
}

interface KeyItemProps {
  keyName: string
  keyType: string
  ttl: number
}

function KeyItem({ keyName, keyType, ttl }: KeyItemProps) {
  return (
    <div className="border-b py-2 flex justify-between items-center">
      <div>
        <span className="font-mono text-sm">{keyName}</span>
        <span className="ml-2 px-2 py-1 bg-gray-100 text-xs rounded">{keyType}</span>
      </div>
      <span className="text-sm text-gray-500">{ttl === -1 ? 'No TTL' : `${ttl}s`}</span>
    </div>
  )
}

interface KeyBrowserProps {
  isConnected: boolean
  connectionId?: string
}

function KeyBrowser({ isConnected, connectionId }: KeyBrowserProps) {
  const [pattern, setPattern] = React.useState('*')

  const { data, isLoading, error } = useQuery({
    queryKey: ['redis-keys', connectionId, pattern],
    queryFn: () => getKeysServer(connectionId!, pattern),
    enabled: isConnected && !!connectionId,
    refetchInterval: 5000, // Poll every 5 seconds
  })

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-gray-500">Not connected to Redis</div>
    )
  }

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading keys...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading keys: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  const keys = (data as any)?.keys || []

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Redis Keys</h3>
      <div className="mb-4">
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="Key pattern (e.g., user:*)"
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="space-y-1">
        {keys.length === 0 ? (
          <div className="text-center text-gray-500">No keys found</div>
        ) : (
          keys.map((key: any, index: number) => (
            <KeyItem
              key={index}
              keyName={key.name}
              keyType={key.type}
              ttl={key.ttl}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CommandExecutorProps {
  isConnected: boolean
  connectionId?: string
}

function CommandExecutor({ isConnected, connectionId }: CommandExecutorProps) {
  const [command, setCommand] = React.useState('')

  const mutation = useMutation({
    mutationFn: (cmd: string) =>
      executeCommandServer({ id: connectionId!, command: cmd }),
  })

  const executeCommand = () => {
    if (!isConnected || !command.trim()) return
    mutation.mutate(command)
  }

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-gray-500">Not connected to Redis</div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Redis Commands</h3>
      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') executeCommand()
            }}
            placeholder="Enter Redis command (e.g., GET mykey)"
            className="w-full border rounded px-3 py-2 font-mono"
          />
          <button
            onClick={executeCommand}
            disabled={mutation.isPending}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Executing...' : 'Execute'}
          </button>
        </div>
        {mutation.data && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Result:</h4>
            <div className="bg-gray-100 p-3 rounded">
              <pre className="text-sm overflow-auto max-h-64">
                {(mutation.data as any).result || (mutation.data as any).error}
              </pre>
            </div>
          </div>
        )}
        {mutation.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {mutation.error instanceof Error ? mutation.error.message : 'Command failed'}
          </div>
        )}
      </div>
    </div>
  )
}

export function RedisDashboard() {
  const [activeTab, setActiveTab] = React.useState('connections')
  const [connection, setConnection] = React.useState<RedisConnection | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const connectMutation = useMutation({
    mutationFn: (data: { name: string; host: string; port: number }) =>
      connectServer({
        id: Date.now().toString(),
        host: data.host,
        port: data.port,
      }),
    onSuccess: (result, variables) => {
      if ((result as any).success) {
        const newConnection: RedisConnection = {
          id: Date.now().toString(),
          name: variables.name,
          host: variables.host,
          port: variables.port,
          isConnected: true,
        }
        setConnection(newConnection)
        setActiveTab('keys')
        setError(null)
      } else {
        setError((result as any).error)
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    },
  })

  const handleConnect = (data: { name: string; host: string; port: number }) => {
    connectMutation.mutate(data)
  }

  const handleDisconnect = async () => {
    if (connection) {
      await disconnectServer(connection.id)
      setConnection(null)
      setActiveTab('connections')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Redis Watch</h1>
            {connection && (
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {connection.name}
                </span>
                <button
                  onClick={handleDisconnect}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
          <nav className="mt-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('connections')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'connections'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Connections
              </button>
              <button
                onClick={() => setActiveTab('keys')}
                disabled={!connection?.isConnected}
                className={`px-4 py-2 rounded ${
                  activeTab === 'keys'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                } ${!connection?.isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Keys
              </button>
              <button
                onClick={() => setActiveTab('commands')}
                disabled={!connection?.isConnected}
                className={`px-4 py-2 rounded ${
                  activeTab === 'commands'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                } ${!connection?.isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Commands
              </button>
            </div>
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'connections' && (
            <ConnectionForm
              onConnect={handleConnect}
            />
          )}
          {activeTab === 'keys' && (
            <KeyBrowser
              isConnected={!!connection?.isConnected}
              connectionId={connection?.id}
            />
          )}
          {activeTab === 'commands' && (
            <CommandExecutor
              isConnected={!!connection?.isConnected}
              connectionId={connection?.id}
            />
          )}
        </div>
      </div>
    </div>
  )
}
