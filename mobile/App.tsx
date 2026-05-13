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
import { demoReport } from './src/data/mockData';
import { AppTab, IssueCategory, ReportRecord, ReportStatus, TimelineEntry } from './src/types';
import { MapReport, MapReportCategoryId } from './src/data/mockMapReports';
import { ChronicSpot } from './src/data/dashboard311';

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
  'Open':        'In Review',
  'In Progress': 'In Progress',
  'Closed':      'Resolved',
};

function mapReportToRecord(r: MapReport): ReportRecord {
  return {
    id:          r.id,
    category:    CATEGORY_LABEL[r.categoryId],
    status:      STATUS_MAP[r.status] ?? 'Submitted',
    description: r.description,
    address:     r.address,
    assignedTo:  r.assignedTo,
    timeline:    r.timeline as TimelineEntry[],
  };
}

type ReportStep = 'camera' | 'analyzing' | 'classify' | 'duplicate' | 'confirmation' | 'issueStatus';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('report');
  const [reportStep, setReportStep] = useState<ReportStep>('camera');
  const [classification, setClassification] = useState<Classification | null>(null);
  const [merged, setMerged] = useState(false);
  const [isSignedIn,    setIsSignedIn]    = useState(false);
  const [mapReport,     setMapReport]     = useState<MapReport | null>(null);
  const [chronicSpot,   setChronicSpot]   = useState<ChronicSpot | null>(null);

  const handleResetFlow = () => {
    setReportStep('camera');
    setClassification(null);
    setMerged(false);
  };

  const renderReportFlow = () => {
    if (reportStep === 'camera') {
      return <ReportCameraScreen onCapture={() => setReportStep('analyzing')} />;
    }
    if (reportStep === 'analyzing') {
      return <AnalyzingScreen onDone={() => setReportStep('classify')} />;
    }
    if (reportStep === 'classify') {
      return (
        <ClassificationScreen
          onBack={() => setReportStep('camera')}
          onConfirm={(c) => {
            setClassification(c);
            setReportStep('duplicate');
          }}
        />
      );
    }
    if (reportStep === 'duplicate') {
      return (
        <DuplicateScreen
          onMerge={() => { setMerged(true); setReportStep('confirmation'); }}
          onNew={() => { setMerged(false); setReportStep('confirmation'); }}
          onBack={() => setReportStep('classify')}
        />
      );
    }
    if (reportStep === 'issueStatus') {
      return (
        <IssueStatusScreen
          report={demoReport}
          onBack={() => setReportStep('confirmation')}
        />
      );
    }
    return (
      <ReportConfirmationScreen
        merged={merged}
        classification={classification}
        onDone={handleResetFlow}
        onViewIssue={() => setReportStep('issueStatus')}
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
          onToggleAuth={() => setIsSignedIn(prev => !prev)}
        />
      );
    }
    return renderReportFlow();
  };

  // Only show bottom nav when not deep in the report flow
  const showNav =
    currentTab === 'dashboard' ||
    currentTab === 'profile' ||
    (currentTab === 'report' && reportStep === 'camera');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>{renderCurrentTab()}</View>
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
