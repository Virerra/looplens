import { useState, useMemo } from 'react'
import { usePricing } from './hooks/usePricing'
import { DEFAULT_TOOLS } from './data/tools'
import { simulateLoop, simulateFanout, toolTokensPerCall, fmtCost, fmtK } from './utils/simulate'
import LeftPanel from './components/LeftPanel'
import PriceStatusBar from './components/ui/PriceStatusBar'
import TabBar from './components/ui/TabBar'
import SimTab from './components/tabs/SimTab'
import MultiAgentTab from './components/tabs/MultiAgentTab'
import CacheTab from './components/tabs/CacheTab'
import CompareTab from './components/tabs/CompareTab'
import OptimizeTab from './components/tabs/OptimizeTab'
import ExportTab from './components/tabs/ExportTab'
import './App.css'

const TABS = ['Simulation', 'Multi-Agent', 'Caching', 'Compare', 'Optimize', 'Export']

export default function App() {
  const { models, status, verifiedDate, error } = usePricing()

  const [mode, setMode]             = useState('single')
  const [modelId, setModelId]       = useState('claude-sonnet-4-6')
  const [iterations, setIterations] = useState(8)
  const [systemTokens, setSystemTokens]       = useState(1200)
  const [initialContext, setInitialContext]   = useState(3000)
  const [inputPerIter, setInputPerIter]       = useState(500)
  const [outputPerIter, setOutputPerIter]     = useState(800)
  const [accumulation, setAccumulation]       = useState('full')
  const [windowSize, setWindowSize]           = useState(4)
  const [toolCallsPerIter, setToolCallsPerIter] = useState(2)
  const [tools, setTools]           = useState(DEFAULT_TOOLS)
  const [orchModelId, setOrchModelId]   = useState('claude-sonnet-4-6')
  const [numAgents, setNumAgents]       = useState(4)
  const [orchContext, setOrchContext]   = useState(2000)
  const [passContext, setPassContext]   = useState(true)
  const [cacheEnabled, setCacheEnabled]         = useState(false)
  const [cachePrefixTokens, setCachePrefixTokens] = useState(1200)
  const [cacheHitRate, setCacheHitRate]         = useState(80)
  const [runsPerDay, setRunsPerDay]             = useState(10)
  const [apiKey, setApiKey] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  const selectedModel = useMemo(
    () => models.find(m => m.id === modelId) ?? models[0],
    [models, modelId]
  )
  const orchModel = useMemo(
    () => models.find(m => m.id === orchModelId) ?? models[0],
    [models, orchModelId]
  )

  const caching = { enabled: cacheEnabled, prefixTokens: cachePrefixTokens, hitRate: cacheHitRate }
  const toolTok = toolTokensPerCall(tools)

  const loopResult = useMemo(() => simulateLoop({
    model: selectedModel, iterations, systemTokens, initialContext,
    inputPerIter, outputPerIter, toolCallsPerIter, toolTokens: toolTok,
    accumulation, windowSize, caching,
  }), [selectedModel, iterations, systemTokens, initialContext, inputPerIter,
       outputPerIter, toolCallsPerIter, toolTok, accumulation, windowSize, JSON.stringify(caching)])

  const fanoutResult = useMemo(() => {
    if (mode !== 'fanout') return null
    return simulateFanout({
      orchModel, subModel: selectedModel, iterations, systemTokens,
      orchContextTokens: orchContext, subContextTokens: initialContext,
      inputPerIter, outputPerIter, toolCallsPerIter, toolTokens: toolTok,
      accumulation, windowSize, numAgents, passContextToSubs: passContext, caching,
    })
  }, [mode, orchModel, selectedModel, iterations, systemTokens, orchContext,
      initialContext, inputPerIter, outputPerIter, toolCallsPerIter, toolTok,
      accumulation, windowSize, numAgents, passContext, JSON.stringify(caching)])

  const allModelResults = useMemo(() =>
    models.map(m => ({
      model: m,
      result: simulateLoop({
        model: m, iterations, systemTokens, initialContext, inputPerIter,
        outputPerIter, toolCallsPerIter, toolTokens: toolTok,
        accumulation, windowSize, caching,
      }),
    })).sort((a, b) => a.result.totalCost - b.result.totalCost),
    [models, iterations, systemTokens, initialContext, inputPerIter,
     outputPerIter, toolCallsPerIter, toolTok, accumulation, windowSize, JSON.stringify(caching)]
  )

  const noCache = useMemo(() => simulateLoop({
    model: selectedModel, iterations, systemTokens, initialContext,
    inputPerIter, outputPerIter, toolCallsPerIter, toolTokens: toolTok,
    accumulation, windowSize, caching: { enabled: false, prefixTokens: 0, hitRate: 0 },
  }), [selectedModel, iterations, systemTokens, initialContext, inputPerIter,
       outputPerIter, toolCallsPerIter, toolTok, accumulation, windowSize])

  const shared = {
    models, selectedModel, orchModel, mode, setMode,
    modelId, setModelId, iterations, setIterations,
    systemTokens, setSystemTokens, initialContext, setInitialContext,
    inputPerIter, setInputPerIter, outputPerIter, setOutputPerIter,
    accumulation, setAccumulation, windowSize, setWindowSize,
    toolCallsPerIter, setToolCallsPerIter, tools, setTools,
    orchModelId, setOrchModelId, numAgents, setNumAgents,
    orchContext, setOrchContext, passContext, setPassContext,
    cacheEnabled, setCacheEnabled, cachePrefixTokens, setCachePrefixTokens,
    cacheHitRate, setCacheHitRate, runsPerDay, setRunsPerDay,
    apiKey, setApiKey, loopResult, fanoutResult, allModelResults,
    noCache, caching, toolTok, fmtCost, fmtK,
  }

  const tabContent = [
    <SimTab key="sim" {...shared} />,
    <MultiAgentTab key="multi" {...shared} />,
    <CacheTab key="cache" {...shared} />,
    <CompareTab key="cmp" {...shared} />,
    <OptimizeTab key="opt" {...shared} />,
    <ExportTab key="exp" {...shared} />,
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">Loop<span className="logo-dim">Lens</span><span className="logo-version">v1.0</span></div>
        <PriceStatusBar status={status} verifiedDate={verifiedDate} error={error} />
      </header>
      <div className="app-layout">
        <LeftPanel {...shared} />
        <main className="app-right">
          <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />
          <div className="tab-body">{tabContent[activeTab]}</div>
        </main>
      </div>
      <footer className="app-footer">
        Free · open source · no account needed ·{' '}
        <a href="https://github.com/Virerra/looplens" target="_blank" rel="noreferrer">GitHub ↗</a>
      </footer>
    </div>
  )
}
