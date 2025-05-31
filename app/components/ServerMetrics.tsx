import React from 'react'
import { useDashboardStats, useServerInfo } from '../lib/hooks'
import { useRedisContext } from '../lib/context'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Alert, AlertDescription } from './Alert'
import { 
  Activity, 
  Database, 
  Clock, 
  Users, 
  HardDrive, 
  Zap,
  TrendingUp,
  Server,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { formatBytes, formatDuration } from '../lib/utils'
import { cn } from '../lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

function MetricCard({ title, value, subtitle, icon, trend, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
    destructive: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
  }

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    destructive: 'text-red-600 dark:text-red-400',
  }

  return (
    <Card className={cn('transition-colors', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              {trend && (
                <TrendingUp className={cn(
                  "h-4 w-4",
                  trend === 'up' ? "text-green-500" : trend === 'down' ? "text-red-500" : "text-muted-foreground"
                )} />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center", iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DatabaseCardProps {
  database: { db: number; keys: number; expires: number; avgTtl: number }
}

function DatabaseCard({ database }: DatabaseCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Database {database.db}</h4>
          <Badge variant="outline">{database.keys} keys</Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Keys:</span>
            <span>{database.keys.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">With TTL:</span>
            <span>{database.expires.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg TTL:</span>
            <span>{formatDuration(database.avgTtl)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ServerMetrics() {
  const { activeConnection } = useRedisContext()
  
  const { 
    data: serverInfo, 
    isLoading: isLoadingInfo, 
    error: infoError 
  } = useServerInfo(
    activeConnection?.id, 
    !!activeConnection?.isConnected
  )

  const { 
    data: dashboardStats, 
    isLoading: isLoadingStats, 
    error: statsError 
  } = useDashboardStats(
    activeConnection?.id, 
    !!activeConnection?.isConnected
  )

  const isLoading = isLoadingInfo || isLoadingStats
  const error = infoError || statsError

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load server metrics: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const hitRate = serverInfo ? 
    (serverInfo.keyspaceHits / (serverInfo.keyspaceHits + serverInfo.keyspaceMisses) * 100) || 0 
    : 0

  const memoryUsagePercent = serverInfo?.maxMemory ? 
    (serverInfo.usedMemory / serverInfo.maxMemory * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <Activity className="h-6 w-6" />
          <span>Server Metrics</span>
        </h2>
        {serverInfo && (
          <div className="flex items-center space-x-2">
            <Badge variant="success">
              Redis {serverInfo.version}
            </Badge>
            <Badge variant="outline">
              {serverInfo.mode} - {serverInfo.role}
            </Badge>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Keys"
          value={dashboardStats?.totalKeys || 0}
          icon={<Database className="h-6 w-6" />}
          variant="default"
        />
        
        <MetricCard
          title="Connected Clients"
          value={serverInfo?.connectedClients || 0}
          icon={<Users className="h-6 w-6" />}
          variant="default"
        />
        
        <MetricCard
          title="Operations/sec"
          value={serverInfo?.instantaneousOpsPerSec || 0}
          icon={<Zap className="h-6 w-6" />}
          variant="success"
        />
        
        <MetricCard
          title="Hit Rate"
          value={`${hitRate.toFixed(1)}%`}
          subtitle={`${serverInfo?.keyspaceHits || 0} hits, ${serverInfo?.keyspaceMisses || 0} misses`}
          icon={<TrendingUp className="h-6 w-6" />}
          variant={hitRate > 80 ? 'success' : hitRate > 60 ? 'warning' : 'destructive'}
        />
      </div>

      {/* Memory and Server Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5" />
              <span>Memory Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverInfo && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used Memory</span>
                    <span className="font-mono">{serverInfo.usedMemoryHuman}</span>
                  </div>
                  
                  {serverInfo.maxMemory > 0 && (
                    <>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all",
                            memoryUsagePercent > 90 ? "bg-red-500" : 
                            memoryUsagePercent > 70 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${Math.min(memoryUsagePercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{memoryUsagePercent.toFixed(1)}% used</span>
                        <span>Max: {serverInfo.maxMemoryHuman}</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">System Memory</p>
                    <p className="font-mono">{formatBytes(serverInfo.totalSystemMemory)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peak Memory</p>
                    <p className="font-mono">{serverInfo.usedMemoryHuman}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Server Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverInfo && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span>{formatDuration(serverInfo.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Connections</span>
                  <span>{serverInfo.totalConnectionsReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commands Processed</span>
                  <span>{serverInfo.totalCommandsProcessed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{serverInfo.mode}</Badge>
                    <Badge variant="outline">{serverInfo.role}</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Information */}
      {serverInfo?.databases && serverInfo.databases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {serverInfo.databases.map((db) => (
                <DatabaseCard key={db.db} database={db} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Type Distribution */}
      {dashboardStats?.keyspaceByType && (
        <Card>
          <CardHeader>
            <CardTitle>Key Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(dashboardStats.keyspaceByType).map(([type, count]) => (
                <div key={type} className="text-center p-3 rounded-lg border">
                  <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground capitalize">{type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}