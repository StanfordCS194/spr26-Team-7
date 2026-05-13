import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { BottomNav } from './src/components/BottomNav';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ReportCameraScreen } from './src/screens/ReportCameraScreen';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { ClassificationScreen, Classification } from './src/screens/ClassificationScreen';
import { DuplicateScreen } from './src/screens/DuplicateScreen';
import { ReportConfirmationScreen } from './src/screens/ReportConfirmationScreen';
import { AppTab, ReportRecord, SampleIssueImage, SampleIssueRecord } from './src/types';
import { AuthScreen } from './src/screens/AuthScreen';
import { IssueStatusScreen } from './src/screens/IssueStatusScreen';
import { dashboardIssues } from './src/data/mockData';
import { SampleIssuePickerScreen } from './src/screens/SampleIssuePickerScreen';
import { sampleIssues } from './src/data/sampleIssues';

type ReportStep = 'picker' | 'camera' | 'analyzing' | 'classify' | 'duplicate' | 'confirmation' | 'issue';

const REPORT_API_BASE = (
  process.env.EXPO_PUBLIC_REPORT_API_URL ?? 'http://127.0.0.1:3001'
).replace(/\/$/, '');

const postDifferentIssueReport = (c: Classification) => {
  const url = `${REPORT_API_BASE}/api/report-different-issue`;
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: c.category,
      tag: c.tag,
      desc: c.desc,
      locationMain: c.locationMain,
      locationSub: c.locationSub,
    }),
  }).catch(() => {});
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('report');
  const [reportStep, setReportStep] = useState<ReportStep>('picker');
  const [classification, setClassification] = useState<Classification | null>(null);
  const [merged, setMerged] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [issues, setIssues] = useState<ReportRecord[]>(dashboardIssues);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedSampleIssue, setSelectedSampleIssue] = useState<SampleIssueRecord | null>(null);
  const [reportImages, setReportImages] = useState<SampleIssueImage[]>([]);

  const handleAuthenticate = () => {
    setIsSignedIn(true);
    setCurrentTab('dashboard');
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setCurrentTab('report');
    setSelectedIssueId(null);
    handleResetFlow();
  };

  const handleResetFlow = () => {
    setReportStep('picker');
    setClassification(null);
    setMerged(false);
    setSelectedSampleIssue(null);
    setReportImages([]);
  };

  const selectedIssue = selectedIssueId
    ? issues.find((issue) => issue.id === selectedIssueId) ?? null
    : null;

  const handleOpenIssue = (issueId: string) => {
    setSelectedIssueId(issueId);
  };

  const handleCloseIssue = () => {
    setSelectedIssueId(null);
  };

  const handleToggleFollow = () => {
    if (!selectedIssueId) {
      return;
    }
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === selectedIssueId
          ? { ...issue, isFollowing: !issue.isFollowing }
          : issue
      )
    );
  };

  const handleAddIssuePhoto = () => {
    if (selectedSampleIssue) {
      handleResetFlow();
      return;
    }
    if (!selectedIssueId) {
      return;
    }
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === selectedIssueId
          ? { ...issue, photoCount: issue.photoCount + 1 }
          : issue
      )
    );
  };

  const renderReportFlow = () => {
    if (reportStep === 'picker') {
      return (
        <SampleIssuePickerScreen
          onSelectIssue={(issueId) => {
            const nextIssue = sampleIssues.find((issue) => issue.id === issueId) ?? null;
            setSelectedSampleIssue(nextIssue);
            setReportStep('issue');
          }}
          onOpenCamera={() => {
            setSelectedSampleIssue(null);
            setReportStep('camera');
          }}
        />
      );
    }
    if (reportStep === 'issue' && selectedSampleIssue) {
      return (
        <IssueStatusScreen
          report={selectedSampleIssue}
          onBack={handleResetFlow}
          onToggleFollow={() => {}}
          onAddPhoto={handleResetFlow}
          primaryActionLabel="Continue demo report"
          onPrimaryAction={() => setReportStep('classify')}
        />
      );
    }
    if (reportStep === 'camera') {
      return (
        <ReportCameraScreen
          photos={reportImages}
          onChangePhotos={setReportImages}
          onCapture={() => setReportStep('analyzing')}
          onBack={handleResetFlow}
        />
      );
    }
    if (reportStep === 'analyzing') {
      return (
        <AnalyzingScreen
          onDone={() => setReportStep('classify')}
          image={reportImages[0] ?? null}
        />
      );
    }
    if (reportStep === 'classify') {
      return (
        <ClassificationScreen
          onBack={() => setReportStep(selectedSampleIssue ? 'issue' : 'camera')}
          onConfirm={(c) => {
            setClassification(c);
            setReportStep('duplicate');
          }}
          selectedSampleIssue={selectedSampleIssue}
          reportImage={reportImages[0] ?? null}
        />
      );
    }
    if (reportStep === 'duplicate') {
      return (
        <DuplicateScreen
          onMerge={() => { setMerged(true); setReportStep('confirmation'); }}
          onNew={() => {
            if (classification) {
              postDifferentIssueReport(classification);
            }
            setMerged(false);
            setReportStep('confirmation');
          }}
          onBack={() => setReportStep('classify')}
          selectedSampleIssue={selectedSampleIssue}
        />
      );
    }
    return (
      <ReportConfirmationScreen
        merged={merged}
        classification={classification}
        onDone={handleResetFlow}
        selectedSampleIssue={selectedSampleIssue}
        reportImage={reportImages[0] ?? null}
      />
    );
  };

  const renderCurrentTab = () => {
    if (currentTab === 'dashboard') {
      if (selectedIssue) {
        return (
          <IssueStatusScreen
            report={selectedIssue}
            onBack={handleCloseIssue}
            onToggleFollow={handleToggleFollow}
            onAddPhoto={handleAddIssuePhoto}
          />
        );
      }
      return <DashboardScreen issues={issues} onOpenIssue={handleOpenIssue} />;
    }
    if (currentTab === 'profile') {
      return (
        <ProfileScreen
          isSignedIn={isSignedIn}
          onToggleAuth={handleSignOut}
        />
      );
    }
    return renderReportFlow();
  };

  const showNav =
    isSignedIn &&
    !selectedIssue &&
    (
      currentTab === 'dashboard' ||
      currentTab === 'profile' ||
      (currentTab === 'report' && reportStep === 'picker')
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {isSignedIn ? (
          renderCurrentTab()
        ) : (
          <AuthScreen onAuthenticate={handleAuthenticate} />
        )}
      </View>
      {showNav && (
        <BottomNav
          currentTab={currentTab}
          onChangeTab={(tab) => {
            setSelectedIssueId(null);
            setCurrentTab(tab);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
});
