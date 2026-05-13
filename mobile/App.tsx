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
import { IssueStatusScreen } from './src/screens/IssueStatusScreen';
import { RecurringIssueDetailScreen } from './src/screens/RecurringIssueDetailScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { SampleIssuePickerScreen } from './src/screens/SampleIssuePickerScreen';
import { AppTab, IssueCategory, ReportRecord, ReportStatus, SampleIssueRecord } from './src/types';
import { MapReport, MapReportCategoryId } from './src/data/mockMapReports';
import { ChronicSpot } from './src/data/dashboard311';
import { sampleIssues } from './src/data/sampleIssues';

const CATEGORY_LABEL: Record<MapReportCategoryId, IssueCategory> = {
  pothole:     'Pothole',
  streetlight: 'Streetlight Outage',
  graffiti:    'Graffiti',
  dumping:     'Illegal Dumping',
  vehicle:     'Vehicle Concerns',
  container:   'Illegal Dumping',
  encampment:  'Encampment',
  junk:        'Junk Pickup',
};

const STATUS_MAP: Record<string, ReportStatus> = {
  'Submitted':   'Submitted',
  'Open':        'Received',
  'In Progress': 'In Progress',
  'Closed':      'Resolved',
};

function mapReportToRecord(r: MapReport): ReportRecord {
  const category = CATEGORY_LABEL[r.categoryId];
  return {
    id:                  r.id,
    title:               r.title,
    category,
    tag:                 category,
    district:            `San Jose District ${r.district}`,
    status:              STATUS_MAP[r.status] ?? 'Submitted',
    description:         r.description,
    address:             r.address,
    assignedTo:          r.assignedTo,
    estimatedResolution: '2–3 weeks',
    reportCount:         1,
    isFollowing:         false,
    isUserOwned:         false,
    photoCount:          0,
    pin:                 { top: 0, left: 0, color: '#5B9BF8' },
    timeline:            r.timeline.map((t, i) => ({
      label:    (STATUS_MAP[t.label] ?? t.label) as ReportStatus,
      dateText: t.dateText,
      reached:  i === 0,
    })),
  };
}

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

type ReportStep = 'picker' | 'issue' | 'camera' | 'analyzing' | 'classify' | 'duplicate' | 'confirmation';

export default function App() {
  const [currentTab, setCurrentTab]                   = useState<AppTab>('report');
  const [reportStep, setReportStep]                   = useState<ReportStep>('picker');
  const [classification, setClassification]           = useState<Classification | null>(null);
  const [merged, setMerged]                           = useState(false);
  const [isSignedIn, setIsSignedIn]                   = useState(false);
  const [mapReport, setMapReport]                     = useState<MapReport | null>(null);
  const [chronicSpot, setChronicSpot]                 = useState<ChronicSpot | null>(null);
  const [selectedSampleIssue, setSelectedSampleIssue] = useState<SampleIssueRecord | null>(null);

  const handleAuthenticate = () => {
    setIsSignedIn(true);
    setCurrentTab('dashboard');
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setCurrentTab('report');
    handleResetFlow();
  };

  const handleResetFlow = () => {
    setReportStep('picker');
    setClassification(null);
    setMerged(false);
    setSelectedSampleIssue(null);
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
      return <ReportCameraScreen onCapture={() => setReportStep('analyzing')} />;
    }
    if (reportStep === 'analyzing') {
      return <AnalyzingScreen onDone={() => setReportStep('classify')} />;
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
      />
    );
  };

  const renderCurrentTab = () => {
    if (currentTab === 'dashboard') {
      if (chronicSpot) {
        return (
          <RecurringIssueDetailScreen
            spot={chronicSpot}
            onBack={() => setChronicSpot(null)}
          />
        );
      }
      if (mapReport) {
        return (
          <IssueStatusScreen
            report={mapReportToRecord(mapReport)}
            onBack={() => setMapReport(null)}
            onToggleFollow={() => {}}
            onAddPhoto={() => {}}
          />
        );
      }
      return (
        <DashboardScreen
          onViewReport={(r) => setMapReport(r)}
          onViewChronicSpot={(spot) => setChronicSpot(spot)}
        />
      );
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
    !chronicSpot &&
    !mapReport &&
    (currentTab === 'dashboard' ||
      currentTab === 'profile' ||
      (currentTab === 'report' && reportStep === 'picker'));

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
          onChangeTab={(tab) => setCurrentTab(tab)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
});
