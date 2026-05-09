'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  TestTube,
} from 'lucide-react'
import { toast } from 'sonner'

interface ProviderConfig {
  id: string
  name: string
  provider_key: string
  is_active: boolean
  is_fallback: boolean
  stats?: {
    totalQueries: number
    successRate: number
    avgLatencyMs: number
    errorCount: number
    lastUsed: string | null
  }
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [testQuery, setTestQuery] = useState('coffee grinder')
  const [switching, setSwitching] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  async function fetchProviders() {
    const res = await fetch('/api/admin/providers')
    const data = await res.json()
    setProviders(data.providers ?? [])
    setLoading(false)
  }

  async function handleSwitch(id: string, setAsFallback = false) {
    setSwitching(id)
    const res = await fetch('/api/admin/provider/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: id, setAsFallback }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(`Provider ${setAsFallback ? 'fallback' : 'active'} updated`)
      fetchProviders()
    } else {
      toast.error(data.error)
    }
    setSwitching(null)
  }

  async function handleTest(providerKey: string) {
    setTesting(providerKey)
    const res = await fetch('/api/providers/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerKey, query: testQuery }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(`${providerKey}: ${data.resultsCount} results in ${data.latencyMs}ms`)
    } else {
      toast.error(`${providerKey} failed: ${data.error}`)
    }
    setTesting(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SERP Providers</h1>
        <p className="text-gray-500 mt-1">Manage and monitor your search data providers.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-medium text-gray-900 mb-3">Test Provider</h2>
        <div className="flex gap-3">
          <Input
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Test query..."
            className="h-10 max-w-xs"
          />
        </div>
      </div>

      <div className="space-y-4">
        {providers.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${p.is_active ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <Activity className={`h-4 w-4 ${p.is_active ? 'text-emerald-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    {p.is_active && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>
                    )}
                    {p.is_fallback && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Fallback</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{p.provider_key}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest(p.provider_key)}
                  disabled={testing === p.provider_key}
                  className="h-8 text-xs"
                >
                  {testing === p.provider_key ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <TestTube className="h-3 w-3 mr-1" />
                  )}
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSwitch(p.id, true)}
                  disabled={switching === p.id}
                  className="h-8 text-xs"
                >
                  Set Fallback
                </Button>
                <Button
                  size="sm"
                  className={`h-8 text-xs ${p.is_active ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                  onClick={() => handleSwitch(p.id)}
                  disabled={switching === p.id || p.is_active}
                >
                  {p.is_active ? (
                    <>
                      <ToggleRight className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-3 w-3 mr-1" />
                      Set Active
                    </>
                  )}
                </Button>
              </div>
            </div>

            {p.stats && (
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <div className="text-xs text-gray-400">Total Queries</div>
                  <div className="text-lg font-semibold text-gray-900">{p.stats.totalQueries}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                  <div className={`text-lg font-semibold ${p.stats.successRate >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {p.stats.successRate}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Avg Latency</div>
                  <div className="text-lg font-semibold text-gray-900">{p.stats.avgLatencyMs}ms</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Errors</div>
                  <div className={`text-lg font-semibold ${p.stats.errorCount > 0 ? 'text-red-400' : 'text-gray-900'}`}>
                    {p.stats.errorCount}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
