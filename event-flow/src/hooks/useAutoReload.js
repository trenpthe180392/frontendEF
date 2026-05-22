import { useEffect, useRef } from 'react'

function useAutoReload(loadData, { enabled = true, intervalMs = 30000 } = {}) {
  const loadDataRef = useRef(loadData)

  useEffect(() => {
    loadDataRef.current = loadData
  }, [loadData])

  useEffect(() => {
    if (!enabled) return undefined

    function reloadWhenVisible() {
      if (document.visibilityState === 'visible') {
        loadDataRef.current?.()
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDataRef.current?.()
      }
    }, intervalMs)

    window.addEventListener('focus', reloadWhenVisible)
    document.addEventListener('visibilitychange', reloadWhenVisible)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', reloadWhenVisible)
      document.removeEventListener('visibilitychange', reloadWhenVisible)
    }
  }, [enabled, intervalMs])
}

export default useAutoReload
