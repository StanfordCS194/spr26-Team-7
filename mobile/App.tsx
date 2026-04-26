import { StatusBar } from 'expo-status-bar'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { useMemo, useState } from 'react'
import { BottomNav } from './src/components/BottomNav'
import { demoReport, initialDraft } from './src/data/mockData'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { IssueStatusScreen } from './src/screens/IssueStatusScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'
import { ReportCameraScreen } from './src/screens/ReportCameraScreen'
import { ReportConfirmationScreen } from './src/screens/ReportConfirmationScreen'
import { ReportPreviewScreen } from './src/screens/ReportPreviewScreen'
import { ReportReviewScreen } from './src/screens/ReportReviewScreen'
import { ReportSubmittingScreen } from './src/screens/ReportSubmittingScreen'
import { AppTab, ReportDraft } from './src/types'

type ReportFlowStep = 'camera' | 'preview' | 'review' | 'submitting' | 'confirmation' | 'status'

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('report')
  const [reportStep, setReportStep] = useState<ReportFlowStep>('camera')
  const [draft, setDraft] = useState<ReportDraft>(initialDraft)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [lastSubmitWasPlusOne, setLastSubmitWasPlusOne] = useState(false)

  const confirmationCount = useMemo(() => (lastSubmitWasPlusOne ? 39 : 38), [lastSubmitWasPlusOne])

  const handleResetFlow = () => {
    setDraft(initialDraft)
    setReportStep('camera')
    setLastSubmitWasPlusOne(false)
  }

  const renderReportFlow = () => {
    if (reportStep === 'camera') {
      return <ReportCameraScreen onCapture={() => setReportStep('preview')} />
    }

    if (reportStep === 'preview') {
      return <ReportPreviewScreen onBack={() => setReportStep('camera')} onContinue={() => setReportStep('review')} />
    }

    if (reportStep === 'review') {
      return (
        <ReportReviewScreen
          draft={draft}
          onBack={() => setReportStep('preview')}
          onUpdateDraft={setDraft}
          onSubmit={(isPlusOne) => {
            setLastSubmitWasPlusOne(isPlusOne)
            setReportStep('submitting')
          }}
        />
      )
    }

    if (reportStep === 'submitting') {
      return <ReportSubmittingScreen onDone={() => setReportStep('confirmation')} />
    }

    if (reportStep === 'confirmation') {
      return (
        <ReportConfirmationScreen
          caseNumber={demoReport.id}
          neighborhood={draft.neighborhood}
          totalInArea={confirmationCount}
          onViewIssue={() => setReportStep('status')}
          onReportAnother={handleResetFlow}
        />
      )
    }

    return <IssueStatusScreen report={demoReport} onBack={() => setReportStep('confirmation')} />
  }

  const renderCurrentTab = () => {
    if (currentTab === 'dashboard') {
      return <DashboardScreen />
    }
    if (currentTab === 'profile') {
      return <ProfileScreen isSignedIn={isSignedIn} onToggleAuth={() => setIsSignedIn((prev) => !prev)} />
    }
    return renderReportFlow()
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>{renderCurrentTab()}</View>
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setCurrentTab(tab)
          if (tab === 'report' && reportStep === 'status') {
            setReportStep('confirmation')
          }
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
})
