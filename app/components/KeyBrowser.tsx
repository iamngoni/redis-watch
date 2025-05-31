import React, { useState, useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table'
import { useKeys, useDeleteKey, useDeleteKeys, useKeyDetails } from '../lib/hooks'
import { useRedisContext } from '../lib/context'
import { RedisKey, RedisDataType } from '../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Input } from './Input'
import { Badge } from './Badge'
import { Alert, AlertDescription } from './Alert'
import { 
  Search, 
  Trash2, 
  Eye, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Clock,
  Database
} from 'lucide-react'
import { cn, formatDuration, formatBytes } from '../lib/utils'

const columnHelper = createColumnHelper<RedisKey>()

const dataTypeColors: Record<RedisDataType, string> = {
  string: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  list: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  set: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  zset: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  hash: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  stream: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
  none: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
}

interface KeyDetailsModalProps {
  keyName: string
  onClose: () => void
}

function KeyDetailsModal({ keyName, onClose }: KeyDetailsModalProps) {
  const { activeConnection } = useRedisContext()
  const { data: keyDetails, isLoading, error } = useKeyDetails(
    keyName, 
    activeConnection?.id, 
    true
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Key Details: {keyName}</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load key details: {error.message}
              </AlertDescription>
            </Alert>
          ) : keyDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge className={dataTypeColors[keyDetails.type]}>
                    {keyDetails.type.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">TTL</p>
                  <p className="text-sm">{formatDuration(keyDetails.ttl)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Encoding</p>
                  <p className="text-sm">{keyDetails.metadata?.encoding || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Memory</p>
                  <p className="text-sm">
                    {keyDetails.metadata?.memoryUsage 
                      ? formatBytes(keyDetails.metadata.memoryUsage)
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Value</p>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                    {typeof keyDetails.value === 'string' 
                      ? keyDetails.value 
                      : JSON.stringify(keyDetails.value, null, 2)
                    }
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function KeyBrowser() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [selectedKeyForDetails, setSelectedKeyForDetails] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<RedisDataType | ''>('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })

  const { activeConnection } = useRedisContext()
  const { 
    data: keysResponse, 
    isLoading, 
    error, 
    refetch 
  } = useKeys({
    pattern: globalFilter || '*',
    type: typeFilter || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sorting[0]?.id as 'name' | 'type' | 'ttl' | 'size' || 'name',
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
  }, !!activeConnection?.isConnected)

  const deleteKeyMutation = useDeleteKey()
  const deleteKeysMutation = useDeleteKeys()

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-gray-300"
        />
      ),
    }),
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Key Name
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('type', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Type
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ getValue }) => {
        const type = getValue()
        return (
          <Badge className={dataTypeColors[type]}>
            {type.toUpperCase()}
          </Badge>
        )
      },
    }),
    columnHelper.accessor('ttl', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          TTL
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ getValue }) => {
        const ttl = getValue()
        return (
          <span className={cn(
            "flex items-center space-x-1 text-sm",
            ttl < 0 ? "text-muted-foreground" : ttl < 60 ? "text-destructive" : ""
          )}>
            <Clock className="h-3 w-3" />
            <span>{formatDuration(ttl)}</span>
          </span>
        )
      },
    }),
    columnHelper.accessor('size', {
      header: 'Size',
      cell: ({ getValue }) => {
        const size = getValue()
        return size ? formatBytes(size) : 'N/A'
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedKeyForDetails(row.original.name)}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteKey(row.original.name)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    }),
  ], [])

  const table = useReactTable({
    data: keysResponse?.data || [],
    columns,
    pageCount: keysResponse ? Math.ceil(keysResponse.total / pagination.pageSize) : 0,
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection: selectedKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' 
        ? updater(selectedKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {}))
        : updater
      setSelectedKeys(Object.keys(newSelection).filter(key => newSelection[key]))
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  const handleDeleteKey = async (keyName: string) => {
    if (window.confirm(`Are you sure you want to delete key "${keyName}"?`)) {
      try {
        await deleteKeyMutation.mutateAsync({
          keyName,
          connectionId: activeConnection?.id,
        })
      } catch (error) {
        console.error('Failed to delete key:', error)
      }
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedKeys.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedKeys.length} selected keys?`)) {
      try {
        await deleteKeysMutation.mutateAsync({
          keyNames: selectedKeys,
          connectionId: activeConnection?.id,
        })
        setSelectedKeys([])
      } catch (error) {
        console.error('Failed to delete keys:', error)
      }
    }
  }

  const handleRefresh = () => {
    refetch()
    setSelectedKeys([])
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load keys: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <Database className="h-6 w-6" />
          <span>Keys</span>
          {keysResponse && (
            <Badge variant="outline">
              {keysResponse.total.toLocaleString()} total
            </Badge>
          )}
        </h2>
        <div className="flex items-center space-x-2">
          {selectedKeys.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={deleteKeysMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedKeys.length} Selected
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search keys (supports patterns: *, ?, [abc])"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as RedisDataType | '')}
                  className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">All Types</option>
                  <option value="string">String</option>
                  <option value="list">List</option>
                  <option value="set">Set</option>
                  <option value="zset">Sorted Set</option>
                  <option value="hash">Hash</option>
                  <option value="stream">Stream</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="h-12 px-4 text-left align-middle font-medium">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())
                            }
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-4 align-middle">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="h-24 text-center">
                          No keys found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      keysResponse?.total || 0
                    )}{' '}
                    of {keysResponse?.total || 0} entries
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={table.getState().pagination.pageIndex + 1}
                      onChange={(e) => {
                        const page = e.target.value ? Number(e.target.value) - 1 : 0
                        table.setPageIndex(page)
                      }}
                      className="w-16 rounded border border-input px-2 py-1 text-center text-sm"
                      min="1"
                      max={table.getPageCount()}
                    />
                    <span className="text-sm text-muted-foreground">
                      of {table.getPageCount()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedKeyForDetails && (
        <KeyDetailsModal
          keyName={selectedKeyForDetails}
          onClose={() => setSelectedKeyForDetails(null)}
        />
      )}
    </div>
  )
}