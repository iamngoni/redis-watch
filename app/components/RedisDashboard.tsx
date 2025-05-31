import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RedisProvider, useRedisContext } from '../lib/context'
import { useConnections, useConnect } from '../lib/hooks'
import { RedisConnection } from '../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Alert, AlertDescription, AlertTitle } from './Alert'
import { Badge } from './Badge'
import { ConnectionManager } from './ConnectionManager'
import { KeyBrowser } from './KeyBrowser'
import { CommandExecutor } from './CommandExecutor'
import { ServerMetrics } from './ServerMetrics'
import { AlertTriangle, Database, Terminal, Settings, Activity } from 'lucide-react'
import { cn } from '../lib/utils'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

type DashboardTab = 'connections' | 'keys' | 'commands' | 'metrics'

interface TabButtonProps {
  tab: DashboardTab
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: (tab: DashboardTab) => void
  disabled?: boolean
}

function TabButton({ tab, active, icon, label, onClick, disabled }: TabButtonProps) {
  return (
    <button
      onClick={() => onClick(tab)}
      disabled={disabled}
      className={cn(
        "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('connections')
  const { activeConnection, setActiveConnection, error, clearError } = useRedisContext()
  const { data: connections, isLoading } = useConnections()
  const connectMutation = useConnect()

  // Auto-connect to local Redis on first load
  useEffect(() => {
    if (!activeConnection && connections && connections.length === 0) {
      const localConnection = {
        name: 'Local Redis',
        host: '127.0.0.1',
        port: 6379,
      }
      
      connectMutation.mutate(localConnection, {
        onSuccess: (connection) => {
          setActiveConnection(connection)
          setActiveTab('keys')
        },
        onError: (error) => {
          console.error('Failed to connect to local Redis:', error)
          // Error will be handled by the error state in context
        }
      })
    }
  }, [connections, activeConnection, connectMutation, setActiveConnection])

  const handleTabChange = (tab: DashboardTab) => {
    if (tab !== 'connections' && !activeConnection) {
      return // Don't allow navigation to other tabs without connection
    }
    setActiveTab(tab)
  }

  const isConnected = !!activeConnection?.isConnected

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold flex items-center space-x-2">
                <Database className="h-6 w-6 text-primary" />
                <span>Redis Dashboard</span>
              </h1>
              {activeConnection && (
                <Badge variant={isConnected ? 'success' : 'destructive'}>
                  {isConnected ? 'Connected' : 'Disconnected'}: {activeConnection.name}
                </Badge>
              )}
            </div>
            
            <nav className="flex items-center space-x-2">
              <TabButton
                tab="connections"
                active={activeTab === 'connections'}
                icon={<Settings className="h-4 w-4" />}
                label="Connections"
                onClick={handleTabChange}
              />
              <TabButton
                tab="keys"
                active={activeTab === 'keys'}
                icon={<Database className="h-4 w-4" />}
                label="Keys"
                onClick={handleTabChange}
                disabled={!isConnected}
              />
              <TabButton
                tab="commands"
                active={activeTab === 'commands'}
                icon={<Terminal className="h-4 w-4" />}
                label="Commands"
                onClick={handleTabChange}
                disabled={!isConnected}
              />
              <TabButton
                tab="metrics"
                active={activeTab === 'metrics'}
                icon={<Activity className="h-4 w-4" />}
                label="Metrics"
                onClick={handleTabChange}
                disabled={!isConnected}
              />
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Connection Error Banner */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Local Redis Connection Error */}
        {!activeConnection && !isLoading && connections?.length === 0 && (
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Unable to connect to local Redis</AlertTitle>
            <AlertDescription>
              Could not connect to Redis at 127.0.0.1:6379. Please ensure Redis is running or configure a custom connection.
            </AlertDescription>
          </Alert>
        )}

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'connections' && <ConnectionManager />}
          {activeTab === 'keys' && isConnected && <KeyBrowser />}
          {activeTab === 'commands' && isConnected && <CommandExecutor />}
          {activeTab === 'metrics' && isConnected && <ServerMetrics />}
          
          {/* No Connection State */}
          {activeTab !== 'connections' && !isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>No Active Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Please establish a connection to a Redis server to access this feature.
                </p>
                <Button onClick={() => setActiveTab('connections')}>
                  Manage Connections
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export function RedisDashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <RedisProvider>
        <DashboardContent />
        <ReactQueryDevtools initialIsOpen={false} />
      </RedisProvider>
    </QueryClientProvider>
  )
}