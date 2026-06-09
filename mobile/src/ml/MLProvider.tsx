import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { PIPELINE_HTML } from './pipeline.html'
import { MlClassification, PipelineResponse, toMlClassification } from './types'

export type MlStatus = 'loading' | 'ready' | 'error'

export type MlStage = 'router' | 'extract' | 'describe'

type MLContextValue = {
  status: MlStatus
  loadDetail: string
  loadPct: number
  errorMessage: string | null
  // Classifies a base64 data URL and resolves with the mapped result.
  // onStage fires as the on-device pipeline moves through its stages.
  classify: (dataUrl: string, onStage?: (stage: MlStage) => void) => Promise<MlClassification>
}

const MLContext = createContext<MLContextValue | null>(null)

type Pending = {
  resolve: (value: MlClassification) => void
  reject: (reason: Error) => void
  onStage?: (stage: MlStage) => void
}

type MLProviderProps = {
  children: ReactNode
}

export const MLProvider = ({ children }: MLProviderProps) => {
  const webViewRef = useRef<WebView>(null)
  const pendingRef = useRef<Map<string, Pending>>(new Map())
  const requestCounter = useRef(0)
  const readyWaiters = useRef<Array<() => void>>([])
  // Mirrors `status` synchronously so classify() never reads a stale closure.
  const statusRef = useRef<MlStatus>('loading')
  const errorRef = useRef<string | null>(null)

  const [status, setStatus] = useState<MlStatus>('loading')
  const [loadDetail, setLoadDetail] = useState('Starting on-device model')
  const [loadPct, setLoadPct] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const flushReadyWaiters = () => {
    const waiters = readyWaiters.current
    readyWaiters.current = []
    waiters.forEach((resolve) => resolve())
  }

  const handleMessage = (event: WebViewMessageEvent) => {
    let payload: any
    try {
      payload = JSON.parse(event.nativeEvent.data)
    } catch {
      return
    }

    switch (payload.type) {
      case 'status': {
        statusRef.current = payload.state
        setStatus(payload.state)
        if (payload.state === 'loading' && payload.detail) {
          setLoadDetail(payload.detail)
        }
        if (payload.state === 'ready') {
          setLoadPct(100)
          flushReadyWaiters()
        }
        if (payload.state === 'error') {
          const message: string = payload.message ?? 'Model failed to load'
          errorRef.current = message
          setErrorMessage(message)
          const error = new Error(message)
          pendingRef.current.forEach((pending) => pending.reject(error))
          pendingRef.current.clear()
          flushReadyWaiters()
        }
        break
      }
      case 'load': {
        if (typeof payload.pct === 'number') {
          setLoadPct(payload.pct)
        }
        break
      }
      case 'progress': {
        const pending = pendingRef.current.get(payload.requestId)
        pending?.onStage?.(payload.stage as MlStage)
        break
      }
      case 'result': {
        const pending = pendingRef.current.get(payload.requestId)
        if (pending) {
          pendingRef.current.delete(payload.requestId)
          pending.resolve(toMlClassification(payload.data as PipelineResponse))
        }
        break
      }
      case 'error': {
        const pending = pendingRef.current.get(payload.requestId)
        if (pending) {
          pendingRef.current.delete(payload.requestId)
          pending.reject(new Error(payload.message ?? 'Classification failed'))
        }
        break
      }
      default:
        break
    }
  }

  const waitForReady = (): Promise<void> => {
    if (statusRef.current === 'ready') {
      return Promise.resolve()
    }
    if (statusRef.current === 'error') {
      return Promise.reject(new Error(errorRef.current ?? 'Model failed to load'))
    }
    return new Promise((resolve) => {
      readyWaiters.current.push(resolve)
    })
  }

  const classify = async (
    dataUrl: string,
    onStage?: (stage: MlStage) => void,
  ): Promise<MlClassification> => {
    await waitForReady()
    if (!webViewRef.current) {
      throw new Error('ML engine is not available')
    }

    requestCounter.current += 1
    const requestId = `req-${requestCounter.current}`

    return new Promise<MlClassification>((resolve, reject) => {
      pendingRef.current.set(requestId, { resolve, reject, onStage })
      const script = `window.__mlClassify(${JSON.stringify(requestId)}, ${JSON.stringify(dataUrl)}); true;`
      webViewRef.current?.injectJavaScript(script)
    })
  }

  useEffect(() => {
    return () => {
      const error = new Error('ML engine unmounted')
      pendingRef.current.forEach((pending) => pending.reject(error))
      pendingRef.current.clear()
    }
  }, [])

  const value = useMemo<MLContextValue>(
    () => ({ status, loadDetail, loadPct, errorMessage, classify }),
    [status, loadDetail, loadPct, errorMessage],
  )

  return (
    <MLContext.Provider value={value}>
      {children}
      <View style={styles.hidden} pointerEvents="none">
        <WebView
          ref={webViewRef}
          source={{ html: PIPELINE_HTML, baseUrl: 'https://cityfix.local/' }}
          originWhitelist={['*']}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          androidLayerType="software"
          mixedContentMode="always"
          onError={(syntheticEvent) => {
            const message: string = syntheticEvent.nativeEvent.description ?? 'WebView error'
            statusRef.current = 'error'
            errorRef.current = message
            setStatus('error')
            setErrorMessage(message)
            const error = new Error(message)
            pendingRef.current.forEach((pending) => pending.reject(error))
            pendingRef.current.clear()
            flushReadyWaiters()
          }}
        />
      </View>
    </MLContext.Provider>
  )
}

export const useML = () => {
  const context = useContext(MLContext)
  if (!context) {
    throw new Error('useML must be used within an MLProvider')
  }
  return context
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    left: -1000,
    top: -1000,
    opacity: 0,
  },
})
