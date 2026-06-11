import { useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { Sj311SubmitSession } from '../lib/sanjose311/submitReport'

type SanJose311SubmitScreenProps = {
  session: Sj311SubmitSession
  onCancel: () => void
  onSubmitted: () => void
}

type AutofillMessage =
  | { type: 'autofill_started'; portalLabel?: string }
  | { type: 'autofill_complete'; filled?: string[]; needsPhoto?: boolean; photoNote?: string }
  | { type: 'autofill_error'; message?: string }

export const SanJose311SubmitScreen = ({
  session,
  onCancel,
  onSubmitted,
}: SanJose311SubmitScreenProps) => {
  const webViewRef = useRef<WebView>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autofillStatus, setAutofillStatus] = useState('Opening San José 311…')
  const [filledFields, setFilledFields] = useState<string[]>([])

  const injectedScript = useMemo(() => session.autofillScript, [session.autofillScript])

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as AutofillMessage
      if (message.type === 'autofill_started') {
        setAutofillStatus(`Selecting ${message.portalLabel ?? 'service'}…`)
        return
      }
      if (message.type === 'autofill_complete') {
        setFilledFields(message.filled ?? [])
        setAutofillStatus(
          message.needsPhoto
            ? 'Fields pre-filled. Add a photo on the 311 form, then submit.'
            : 'Fields pre-filled. Review and submit on the 311 site.',
        )
        return
      }
      if (message.type === 'autofill_error') {
        setAutofillStatus('Autofill partially failed. Complete the form manually on the 311 site.')
      }
    } catch {
      // Ignore non-JSON messages from the portal.
    }
  }

  const handleReloadAutofill = () => {
    setAutofillStatus('Retrying autofill…')
    webViewRef.current?.injectJavaScript(injectedScript)
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable
          onPress={onCancel}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel 311 submission"
        >
          <Text style={styles.headerButtonText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Submit to San José 311</Text>
        <Pressable
          onPress={onSubmitted}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Confirm 311 submission complete"
        >
          <Text style={[styles.headerButtonText, styles.headerButtonPrimary]}>Done</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.instructions} contentContainerStyle={styles.instructionsContent}>
        <Text style={styles.status}>{autofillStatus}</Text>
        {session.instructions.map((line) => (
          <Text key={line} style={styles.instruction}>
            • {line}
          </Text>
        ))}
        {filledFields.length > 0 ? (
          <Text style={styles.filledSummary}>
            Pre-filled: {filledFields.join(', ')}
          </Text>
        ) : null}
        <Pressable
          onPress={handleReloadAutofill}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Retry autofill"
        >
          <Text style={styles.retryButtonText}>Retry autofill</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.webviewWrap}>
        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#5B9BF8" />
            <Text style={styles.loadingText}>Loading 311 portal…</Text>
          </View>
        ) : null}
        <WebView
          ref={webViewRef}
          source={{ uri: session.portalUrl }}
          onLoadEnd={() => {
            setIsLoading(false)
            webViewRef.current?.injectJavaScript(injectedScript)
          }}
          onMessage={handleMessage}
          injectedJavaScript={injectedScript}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          setSupportMultipleWindows={false}
          style={styles.webview}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#18191C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2D32',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerButton: {
    minWidth: 64,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: '#9AA0A6',
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtonPrimary: {
    color: '#5B9BF8',
    textAlign: 'right',
  },
  instructions: {
    maxHeight: 150,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2D32',
  },
  instructionsContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  status: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instruction: {
    color: '#9AA0A6',
    fontSize: 12,
    lineHeight: 17,
  },
  filledSummary: {
    color: '#5B9BF8',
    fontSize: 12,
    marginTop: 4,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 4,
  },
  retryButtonText: {
    color: '#5B9BF8',
    fontSize: 12,
    fontWeight: '600',
  },
  webviewWrap: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18191C',
    zIndex: 2,
    gap: 8,
  },
  loadingText: {
    color: '#9AA0A6',
    fontSize: 13,
  },
})
