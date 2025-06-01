import * as React from 'react'

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

  return React.createElement(
    'form',
    { onSubmit: handleSubmit, className: 'space-y-4 p-4 border rounded-lg' },
    React.createElement('h3', { className: 'text-lg font-semibold' }, 'Connect to Redis'),
    React.createElement(
      'div',
      null,
      React.createElement('label', { className: 'block text-sm font-medium' }, 'Name'),
      React.createElement('input', {
        type: 'text',
        value: name,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
        className: 'w-full border rounded px-3 py-2'
      })
    ),
    React.createElement(
      'div',
      null,
      React.createElement('label', { className: 'block text-sm font-medium' }, 'Host'),
      React.createElement('input', {
        type: 'text',
        value: host,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHost(e.target.value),
        className: 'w-full border rounded px-3 py-2'
      })
    ),
    React.createElement(
      'div',
      null,
      React.createElement('label', { className: 'block text-sm font-medium' }, 'Port'),
      React.createElement('input', {
        type: 'number',
        value: port,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPort(parseInt(e.target.value)),
        className: 'w-full border rounded px-3 py-2'
      })
    ),
    React.createElement(
      'button',
      {
        type: 'submit',
        className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
      },
      'Connect'
    )
  )
}

interface KeyItemProps {
  keyName: string
  keyType: string
  ttl: number
}

function KeyItem({ keyName, keyType, ttl }: KeyItemProps) {
  return React.createElement(
    'div',
    { className: 'border-b py-2 flex justify-between items-center' },
    React.createElement(
      'div',
      null,
      React.createElement('span', { className: 'font-mono text-sm' }, keyName),
      React.createElement('span', { className: 'ml-2 px-2 py-1 bg-gray-100 text-xs rounded' }, keyType)
    ),
    React.createElement('span', { className: 'text-sm text-gray-500' }, ttl === -1 ? 'No TTL' : `${ttl}s`)
  )
}

interface KeyBrowserProps {
  isConnected: boolean
}

function KeyBrowser({ isConnected }: KeyBrowserProps) {
  const [keys, setKeys] = React.useState([
    { name: 'user:1001', type: 'hash', ttl: -1 },
    { name: 'session:abc123', type: 'string', ttl: 3600 },
    { name: 'cache:products', type: 'list', ttl: 1800 }
  ])

  if (!isConnected) {
    return React.createElement(
      'div',
      { className: 'p-4 text-center text-gray-500' },
      'Not connected to Redis'
    )
  }

  return React.createElement(
    'div',
    { className: 'p-4' },
    React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Redis Keys'),
    React.createElement(
      'div',
      { className: 'space-y-1' },
      ...keys.map((key, index) =>
        React.createElement(KeyItem, {
          key: index,
          keyName: key.name,
          keyType: key.type,
          ttl: key.ttl
        })
      )
    )
  )
}

interface CommandExecutorProps {
  isConnected: boolean
}

function CommandExecutor({ isConnected }: CommandExecutorProps) {
  const [command, setCommand] = React.useState('')
  const [result, setResult] = React.useState('')

  const executeCommand = () => {
    if (!isConnected) return
    
    // Mock command execution
    if (command.toLowerCase().startsWith('get ')) {
      setResult('"hello world"')
    } else if (command.toLowerCase() === 'info') {
      setResult('redis_version:7.0.0\nrole:master\nconnected_clients:1')
    } else {
      setResult('OK')
    }
  }

  if (!isConnected) {
    return React.createElement(
      'div',
      { className: 'p-4 text-center text-gray-500' },
      'Not connected to Redis'
    )
  }

  return React.createElement(
    'div',
    { className: 'p-4' },
    React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Redis Commands'),
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        null,
        React.createElement('input', {
          type: 'text',
          value: command,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCommand(e.target.value),
          placeholder: 'Enter Redis command (e.g., GET mykey)',
          className: 'w-full border rounded px-3 py-2 font-mono'
        }),
        React.createElement(
          'button',
          {
            onClick: executeCommand,
            className: 'mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'
          },
          'Execute'
        )
      ),
      result && React.createElement(
        'div',
        { className: 'bg-gray-100 p-3 rounded' },
        React.createElement('pre', { className: 'text-sm' }, result)
      )
    )
  )
}

export function RedisDashboard() {
  const [activeTab, setActiveTab] = React.useState('connections')
  const [connection, setConnection] = React.useState<RedisConnection | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleConnect = async (connectionData: { name: string; host: string; port: number }) => {
    try {
      setError(null)
      // Mock connection - in real app this would call the API
      const newConnection: RedisConnection = {
        id: Date.now().toString(),
        name: connectionData.name,
        host: connectionData.host,
        port: connectionData.port,
        isConnected: true
      }
      setConnection(newConnection)
      setActiveTab('keys')
    } catch (err) {
      setError('Failed to connect to Redis server')
    }
  }

  return React.createElement(
    'div',
    { className: 'min-h-screen bg-gray-50' },
    React.createElement(
      'div',
      { className: 'bg-white shadow' },
      React.createElement(
        'div',
        { className: 'max-w-7xl mx-auto px-4 py-4' },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement(
            'h1',
            { className: 'text-2xl font-bold text-gray-900' },
            'Redis Dashboard'
          ),
          connection && React.createElement(
            'span',
            { className: 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm' },
            `Connected: ${connection.name}`
          )
        ),
        React.createElement(
          'nav',
          { className: 'mt-4' },
          React.createElement(
            'div',
            { className: 'flex space-x-4' },
            React.createElement(
              'button',
              {
                onClick: () => setActiveTab('connections'),
                className: `px-4 py-2 rounded ${activeTab === 'connections' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`
              },
              'Connections'
            ),
            React.createElement(
              'button',
              {
                onClick: () => setActiveTab('keys'),
                disabled: !connection?.isConnected,
                className: `px-4 py-2 rounded ${activeTab === 'keys' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'} ${!connection?.isConnected ? 'opacity-50 cursor-not-allowed' : ''}`
              },
              'Keys'
            ),
            React.createElement(
              'button',
              {
                onClick: () => setActiveTab('commands'),
                disabled: !connection?.isConnected,
                className: `px-4 py-2 rounded ${activeTab === 'commands' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'} ${!connection?.isConnected ? 'opacity-50 cursor-not-allowed' : ''}`
              },
              'Commands'
            )
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'max-w-7xl mx-auto px-4 py-6' },
      error && React.createElement(
        'div',
        { className: 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4' },
        error
      ),
      React.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow' },
        activeTab === 'connections' && React.createElement(ConnectionForm, { onConnect: handleConnect }),
        activeTab === 'keys' && React.createElement(KeyBrowser, { isConnected: !!connection?.isConnected }),
        activeTab === 'commands' && React.createElement(CommandExecutor, { isConnected: !!connection?.isConnected })
      )
    )
  )
}