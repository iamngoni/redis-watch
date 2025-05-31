import React, { useState, useRef, useEffect } from 'react'
import { useExecuteCommand, useCommandHistory } from '../lib/hooks'
import { useRedisContext } from '../lib/context'
import { RedisCommandResult } from '../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Textarea } from './Textarea'
import { Alert, AlertDescription } from './Alert'
import { Badge } from './Badge'
import { 
  Play, 
  Terminal, 
  History, 
  Copy, 
  Check, 
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn, parseRedisResponse } from '../lib/utils'

interface CommandResultProps {
  result: RedisCommandResult
}

function CommandResult({ result }: CommandResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const textToCopy = result.error || parseRedisResponse(result.result)
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
            {result.command}
          </code>
          <Badge variant={result.error ? 'destructive' : 'success'}>
            {result.error ? 'Error' : 'Success'}
          </Badge>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{result.executionTime}ms</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      
      <div className={cn(
        "bg-muted/50 rounded-md p-3 font-mono text-sm border-l-4",
        result.error ? "border-destructive" : "border-green-500"
      )}>
        <pre className="whitespace-pre-wrap overflow-auto max-h-48">
          {result.error || parseRedisResponse(result.result)}
        </pre>
      </div>
    </div>
  )
}

interface CommandHistoryProps {
  history: RedisCommandResult[]
  onCommandSelect: (command: string) => void
}

function CommandHistory({ history, onCommandSelect }: CommandHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No command history yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-auto">
      {history.slice(0, 50).map((cmd, index) => (
        <div 
          key={index}
          className="group flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/50 cursor-pointer"
          onClick={() => onCommandSelect(cmd.command)}
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              cmd.error ? "bg-destructive" : "bg-green-500"
            )} />
            <code className="text-sm font-mono truncate">{cmd.command}</code>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{cmd.executionTime}ms</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(cmd.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  )
}

const REDIS_COMMANDS = [
  // String commands
  'GET key',
  'SET key value',
  'DEL key',
  'EXISTS key',
  'EXPIRE key seconds',
  'TTL key',
  'INCR key',
  'DECR key',
  
  // List commands
  'LPUSH key value',
  'RPUSH key value',
  'LPOP key',
  'RPOP key',
  'LLEN key',
  'LRANGE key start stop',
  
  // Set commands
  'SADD key member',
  'SREM key member',
  'SMEMBERS key',
  'SCARD key',
  
  // Hash commands
  'HSET key field value',
  'HGET key field',
  'HDEL key field',
  'HGETALL key',
  'HKEYS key',
  'HVALS key',
  
  // Server commands
  'INFO',
  'DBSIZE',
  'FLUSHDB',
  'PING',
  'TIME',
  'CLIENT LIST',
  
  // Key management
  'KEYS pattern',
  'SCAN cursor',
  'TYPE key',
  'RENAME old-key new-key',
]

export function CommandExecutor() {
  const [command, setCommand] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [results, setResults] = useState<RedisCommandResult[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { activeConnection } = useRedisContext()
  const executeCommandMutation = useExecuteCommand()
  const { data: commandHistory = [] } = useCommandHistory(
    activeConnection?.id,
    50,
    !!activeConnection?.isConnected
  )

  const filteredSuggestions = REDIS_COMMANDS.filter(cmd =>
    cmd.toLowerCase().includes(command.toLowerCase()) && command.length > 0
  ).slice(0, 10)

  const handleExecute = async () => {
    if (!command.trim()) return

    try {
      const result = await executeCommandMutation.mutateAsync({
        command: command.trim(),
        connectionId: activeConnection?.id,
      })
      
      setResults(prev => [result, ...prev.slice(0, 49)]) // Keep last 50 results
      setCommand('')
      setShowSuggestions(false)
    } catch (error) {
      console.error('Command execution failed:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleExecute()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleCommandSelect = (selectedCommand: string) => {
    setCommand(selectedCommand)
    setShowSuggestions(false)
    textareaRef.current?.focus()
  }

  const clearResults = () => {
    setResults([])
  }

  useEffect(() => {
    if (command.length > 0) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [command])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <Terminal className="h-6 w-6" />
          <span>Redis Commands</span>
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          {results.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearResults}
            >
              Clear Results
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Command Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execute Redis Command</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter Redis command (e.g., GET mykey, HGETALL myhash, INFO)..."
                  className="font-mono resize-none"
                  rows={3}
                />
                
                {/* Command Suggestions */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-10 max-h-48 overflow-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:bg-muted font-mono text-sm"
                        onClick={() => handleCommandSelect(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Enter</kbd> to execute
                </div>
                <Button
                  onClick={handleExecute}
                  disabled={!command.trim() || executeCommandMutation.isPending}
                >
                  {executeCommandMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Command Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span>Results</span>
                  <Badge variant="outline">{results.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-auto">
                  {results.map((result, index) => (
                    <CommandResult key={index} result={result} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Redis Command Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Common Commands</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li><code>GET key</code> - Get value</li>
                    <li><code>SET key value</code> - Set value</li>
                    <li><code>KEYS *</code> - List all keys</li>
                    <li><code>INFO</code> - Server info</li>
                    <li><code>DBSIZE</code> - Key count</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Patterns</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li><code>*</code> - Match any characters</li>
                    <li><code>?</code> - Match single character</li>
                    <li><code>[abc]</code> - Match a, b, or c</li>
                    <li><code>[a-z]</code> - Match range</li>
                    <li><code>\*</code> - Escape special chars</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Command History Sidebar */}
        {showHistory && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Command History</span>
                  {commandHistory.length > 0 && (
                    <Badge variant="outline">{commandHistory.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommandHistory
                  history={commandHistory}
                  onCommandSelect={handleCommandSelect}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Connection Status Alert */}
      {!activeConnection?.isConnected && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Not connected to Redis. Commands cannot be executed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}