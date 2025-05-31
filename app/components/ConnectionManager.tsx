import React, { useState } from 'react'
import { useConnections, useSaveConnection, useConnect, useDisconnect, useDeleteConnection, useTestConnection } from '../lib/hooks'
import { useRedisContext } from '../lib/context'
import { ConnectionFormData, RedisConnection } from '../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Input } from './Input'
import { Alert, AlertDescription } from './Alert'
import { Badge } from './Badge'
import { Plus, Trash2, Edit, Play, Square, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface ConnectionFormProps {
  connection?: RedisConnection
  onSave: (data: ConnectionFormData) => void
  onCancel: () => void
  isLoading?: boolean
  isTestLoading?: boolean
  testResult?: { success: boolean; message?: string }
  onTest: (data: ConnectionFormData) => void
}

function ConnectionForm({ connection, onSave, onCancel, isLoading, isTestLoading, testResult, onTest }: ConnectionFormProps) {
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: connection?.name || '',
    host: connection?.host || 'localhost',
    port: connection?.port || 6379,
    password: connection?.password || '',
  })

  const [errors, setErrors] = useState<Partial<ConnectionFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<ConnectionFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.host.trim()) {
      newErrors.host = 'Host is required'
    } else if (!/^[a-zA-Z0-9.-]+$/.test(formData.host)) {
      newErrors.host = 'Invalid host format'
    }

    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handleTest = () => {
    if (validateForm()) {
      onTest(formData)
    }
  }

  const updateField = (field: keyof ConnectionFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Connection Name
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="My Redis Server"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="host" className="block text-sm font-medium mb-1">
            Host
          </label>
          <Input
            id="host"
            value={formData.host}
            onChange={(e) => updateField('host', e.target.value)}
            placeholder="localhost"
            className={errors.host ? 'border-destructive' : ''}
          />
          {errors.host && <p className="text-sm text-destructive mt-1">{errors.host}</p>}
        </div>

        <div>
          <label htmlFor="port" className="block text-sm font-medium mb-1">
            Port
          </label>
          <Input
            id="port"
            type="number"
            value={formData.port}
            onChange={(e) => updateField('port', parseInt(e.target.value) || 0)}
            placeholder="6379"
            min="1"
            max="65535"
            className={errors.port ? 'border-destructive' : ''}
          />
          {errors.port && <p className="text-sm text-destructive mt-1">{errors.port}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password (optional)
        </label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
          placeholder="Leave empty if no password"
        />
      </div>

      {testResult && (
        <Alert variant={testResult.success ? 'success' : 'destructive'}>
          <AlertDescription className="flex items-center space-x-2">
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span>
              {testResult.success 
                ? 'Connection successful!' 
                : `Connection failed: ${testResult.message || 'Unknown error'}`
              }
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={isTestLoading}
        >
          {isTestLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Test Connection
        </Button>

        <div className="space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {connection ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  )
}

interface ConnectionCardProps {
  connection: RedisConnection
  onEdit: (connection: RedisConnection) => void
  onDelete: (connection: RedisConnection) => void
  onConnect: (connection: RedisConnection) => void
  onDisconnect: (connection: RedisConnection) => void
  isActive: boolean
  isConnecting?: boolean
}

function ConnectionCard({ 
  connection, 
  onEdit, 
  onDelete, 
  onConnect, 
  onDisconnect, 
  isActive,
  isConnecting 
}: ConnectionCardProps) {
  return (
    <Card className={cn("transition-colors", isActive && "ring-2 ring-primary")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{connection.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={connection.isConnected ? 'success' : 'outline'}>
              {connection.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            {isActive && (
              <Badge variant="info">Active</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p><strong>Host:</strong> {connection.host}:{connection.port}</p>
          <p><strong>URL:</strong> {connection.url}</p>
          {connection.lastConnected && (
            <p><strong>Last Connected:</strong> {new Date(connection.lastConnected).toLocaleString()}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(connection)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(connection)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>

          <div>
            {connection.isConnected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDisconnect(connection)}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Square className="h-4 w-4 mr-1" />
                )}
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onConnect(connection)}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ConnectionManager() {
  const [showForm, setShowForm] = useState(false)
  const [editingConnection, setEditingConnection] = useState<RedisConnection | undefined>()
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | undefined>()

  const { activeConnection, setActiveConnection } = useRedisContext()
  const { data: connections = [], isLoading } = useConnections()
  const saveConnectionMutation = useSaveConnection()
  const connectMutation = useConnect()
  const disconnectMutation = useDisconnect()
  const deleteConnectionMutation = useDeleteConnection()
  const testConnectionMutation = useTestConnection()

  const handleSaveConnection = async (data: ConnectionFormData) => {
    try {
      // Build URL more carefully to avoid pattern errors
      const authPart = data.password ? `:${encodeURIComponent(data.password)}@` : ''
      const url = `redis://${authPart}${data.host}:${data.port}`
      
      const connection = await saveConnectionMutation.mutateAsync({
        ...data,
        url,
        lastConnected: editingConnection?.lastConnected,
      })
      
      setShowForm(false)
      setEditingConnection(undefined)
      setTestResult(undefined)
    } catch (error) {
      console.error('Failed to save connection:', error)
    }
  }

  const handleConnect = async (connection: RedisConnection) => {
    try {
      // Validate connection data before attempting to connect
      if (!connection.host || !connection.port) {
        throw new Error('Invalid connection configuration')
      }
      
      const result = await connectMutation.mutateAsync({
        name: connection.name,
        host: connection.host.trim(),
        port: connection.port,
        password: connection.password?.trim() || undefined,
      })
      
      setActiveConnection(result)
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const handleDisconnect = async (connection: RedisConnection) => {
    try {
      await disconnectMutation.mutateAsync(connection.id)
      
      if (activeConnection?.id === connection.id) {
        setActiveConnection(null)
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const handleDelete = async (connection: RedisConnection) => {
    if (window.confirm(`Are you sure you want to delete "${connection.name}"?`)) {
      try {
        await deleteConnectionMutation.mutateAsync(connection.id)
        
        if (activeConnection?.id === connection.id) {
          setActiveConnection(null)
        }
      } catch (error) {
        console.error('Failed to delete connection:', error)
      }
    }
  }

  const handleTestConnection = async (data: ConnectionFormData) => {
    try {
      setTestResult(undefined)
      
      // Validate and clean data before testing
      const cleanData = {
        ...data,
        host: data.host.trim(),
        password: data.password?.trim() || undefined,
      }
      
      const result = await testConnectionMutation.mutateAsync(cleanData)
      setTestResult({ success: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setTestResult({ 
        success: false, 
        message: errorMessage.includes('pattern') ? 'Invalid connection format. Please check host and port.' : errorMessage
      })
    }
  }

  const handleEdit = (connection: RedisConnection) => {
    setEditingConnection(connection)
    setShowForm(true)
    setTestResult(undefined)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingConnection(undefined)
    setTestResult(undefined)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Redis Connections</h2>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingConnection ? 'Edit Connection' : 'Add New Connection'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectionForm
              connection={editingConnection}
              onSave={handleSaveConnection}
              onCancel={handleCancel}
              isLoading={saveConnectionMutation.isPending}
              isTestLoading={testConnectionMutation.isPending}
              testResult={testResult}
              onTest={handleTestConnection}
            />
          </CardContent>
        </Card>
      )}

      {connections.length === 0 && !showForm ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No Redis connections configured yet.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isActive={activeConnection?.id === connection.id}
              isConnecting={connectMutation.isPending || disconnectMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}