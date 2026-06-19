import { useState, useEffect } from 'react'
import fallbackModels from '../data/models.json'

const LITELLM_URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

const CACHE_KEY = 'looplens_prices_v1'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours — re-fetch at most 4× per day

// Maps our model IDs to their LiteLLM keys (set in models.json as litellmKey)
function mergeLivePrices(ourModels, litellmData) {
  return ourModels.map((model) => {
    const key = model.litellmKey
    const live = litellmData[key]
    if (!live) return { ...model, priceSource: 'fallback' }

    return {
      ...model,
      input: live.input_cost_per_token != null
        ? live.input_cost_per_token * 1_000_000
        : model.input,
      output: live.output_cost_per_token != null
        ? live.output_cost_per_token * 1_000_000
        : model.output,
      cacheRead: live.cache_read_input_token_cost != null
        ? live.cache_read_input_token_cost * 1_000_000
        : model.cacheRead,
      contextWindow: live.max_tokens ?? model.contextWindow,
      priceSource: 'live',
      liveVerified: new Date().toISOString(),
    }
  })
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // sessionStorage quota exceeded or unavailable — silently skip
  }
}

export function usePricing() {
  const [models, setModels] = useState(
    fallbackModels.models.map((m) => ({ ...m, priceSource: 'fallback' }))
  )
  const [status, setStatus] = useState('loading') // 'loading' | 'live' | 'fallback' | 'cached'
  const [verifiedDate, setVerifiedDate] = useState(fallbackModels._meta.verified)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      setModels(cached)
      setStatus('cached')
      setVerifiedDate(new Date().toLocaleDateString())
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000) // 8s timeout

    fetch(LITELLM_URL, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((litellmData) => {
        const merged = mergeLivePrices(fallbackModels.models, litellmData)
        writeCache(merged)
        setModels(merged)
        setStatus('live')
        setVerifiedDate(new Date().toLocaleDateString())
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          setError('Live pricing timed out — using verified fallback prices.')
        } else {
          setError('Could not fetch live prices — using verified fallback prices.')
        }
        setStatus('fallback')
        setVerifiedDate(fallbackModels._meta.verified)
      })
      .finally(() => clearTimeout(timeout))

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [])

  return { models, status, verifiedDate, error }
}
