export const DEFAULT_TOOLS = [
  { id: 'search',    label: 'Web search',      tokensPerCall: 1500, enabled: true  },
  { id: 'code',      label: 'Code execution',  tokensPerCall: 500,  enabled: false },
  { id: 'rag',       label: 'RAG / retrieval', tokensPerCall: 2500, enabled: false },
  { id: 'browser',   label: 'Browser / scrape',tokensPerCall: 3000, enabled: false },
  { id: 'api',       label: 'External API',    tokensPerCall: 300,  enabled: false },
]
