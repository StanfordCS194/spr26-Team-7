import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { BottomNav } from './src/components/BottomNav';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ReportCameraScreen } from './src/screens/ReportCameraScreen';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { ClassificationScreen, Classification } from './src/screens/ClassificationScreen';
import { ReportConfirmationScreen } from './src/screens/ReportConfirmationScreen';
import { IssueStatusScreen } from './src/screens/IssueStatusScreen';
import { RecurringIssueDetailScreen } from './src/screens/RecurringIssueDetailScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { SampleIssuePickerScreen } from './src/screens/SampleIssuePickerScreen';
import { AppTab, IssueCategory, ReportRecord, ReportStatus, SampleIssueRecord } from './src/types';
import { DISTRICT_CENTERS, MapReport, MapReportCategoryId } from './src/data/mockMapReports';
import { ChronicSpot } from './src/data/dashboard311';
import { sampleIssues } from './src/data/sampleIssues';

const CATEGORY_LABEL: Record<MapReportCategoryId, IssueCategory> = {
  pothole:     'Pothole',
  streetlight: 'Streetlight Outage',
  graffiti:    'Graffiti',
  dumping:     'Illegal Dumping',
  vehicle:     'Vehicle Concerns',
  container:   'Illegal Dumping',
  encampment:  'Encampment Concerns',
  junk:        'Illegal Dumping',
};

const CATEGORY_TO_ID: Record<string, MapReportCategoryId> = {
  'Pothole':             'pothole',
  'Streetlight Outage':  'streetlight',
  'Graffiti':            'graffiti',
  'Illegal Dumping':     'dumping',
  'Vehicle Concerns':    'vehicle',
  'Encampment Concerns': 'encampment',
};

function buildUserMapReport(
  c: Classification,
  sampleIssue: SampleIssueRecord | null,
): MapReport {
  const categoryId = CATEGORY_TO_ID[c.category] ?? 'pothole';
  const districtMatch = (sampleIssue?.district ?? '').match(/\d+/);
  const district = districtMatch ? parseInt(districtMatch[0], 10) : 3;
  const center = DISTRICT_CENTERS[district] ?? DISTRICT_CENTERS[3];
  return {
    id:          `user-${Date.now()}`,
    categoryId,
    title:       c.tag,
    address:     `${c.locationMain}, ${c.locationSub}`,
    district,
    lat:         sampleIssue?.latitude  ?? center.latitude,
    lon:         sampleIssue?.longitude ?? center.longitude,
    status:      'Submitted',
    createdAt:   new Date(),
    description: c.desc,
    assignedTo:  sampleIssue?.assignedTo ?? 'San Jose 311',
    timeline:    [{ label: 'Submitted', dateText: 'Just now' }],
  };
}

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



type ReportStep = 'picker' | 'camera' | 'analyzing' | 'classify' | 'confirmation' | 'submitted-view';

export default function App() {
  const [currentTab, setCurrentTab]                   = useState<AppTab>('report');
  const [reportStep, setReportStep]                   = useState<ReportStep>('camera');
  const [classification, setClassification]           = useState<Classification | null>(null);
  const [isSignedIn, setIsSignedIn]                   = useState(false);
  const [mapReport, setMapReport]                     = useState<MapReport | null>(null);
  const [chronicSpot, setChronicSpot]                 = useState<ChronicSpot | null>(null);
  const [selectedSampleIssue, setSelectedSampleIssue] = useState<SampleIssueRecord | null>(null);
  const [userSubmissions, setUserSubmissions]         = useState<{ mapReport: MapReport; sampleIssue: SampleIssueRecord | null }[]>([]);
  const [focusReport, setFocusReport]                 = useState<MapReport | null>(null);

  const handleAuthenticate = () => {
    setIsSignedIn(true);
    setCurrentTab('report');
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setCurrentTab('report');
    setUserSubmissions([]);
    setFocusReport(null);
    setMapReport(null);
    setChronicSpot(null);
    handleResetFlow();
  };

  const handleResetFlow = () => {
    setReportStep('camera');
    setClassification(null);
    setSelectedSampleIssue(null);
  };

  const renderReportFlow = () => {
    if (reportStep === 'picker') {
      return (
        <SampleIssuePickerScreen
          onSelectIssue={(issueId) => {
            const nextIssue = sampleIssues.find((issue) => issue.id === issueId) ?? null;
            setSelectedSampleIssue(nextIssue);
            setReportStep('classify');
          }}
          onOpenCamera={() => {
            setSelectedSampleIssue(null);
            setReportStep('camera');
          }}
        />
      );
    }
    if (reportStep === 'camera') {
      return (
        <ReportCameraScreen
          onCapture={() => setReportStep('analyzing')}
          onOpenLibrary={() => setReportStep('picker')}
        />
      );
    }
    if (reportStep === 'analyzing') {
      return <AnalyzingScreen onDone={() => setReportStep('classify')} />;
    }
    if (reportStep === 'classify') {
      return (
        <ClassificationScreen
          onBack={() => setReportStep(selectedSampleIssue ? 'picker' : 'camera')}
          onConfirm={(c) => {
            setClassification(c);
            const newMapReport = buildUserMapReport(c, selectedSampleIssue);
            setUserSubmissions(prev => [...prev, { mapReport: newMapReport, sampleIssue: selectedSampleIssue }]);
            setFocusReport(newMapReport);
            setReportStep('confirmation');
          }}
          selectedSampleIssue={selectedSampleIssue}
        />
      );
    }
    if (reportStep === 'submitted-view' && selectedSampleIssue) {
      const submittedRecord: SampleIssueRecord = {
        ...selectedSampleIssue,
        status: 'Submitted',
        timeline: selectedSampleIssue.timeline.map((entry, i) => ({
          ...entry,
          reached: i === 0,
          dateText: i === 0 ? 'Just submitted' : entry.dateText,
        })),
      };
      return (
        <IssueStatusScreen
          report={submittedRecord}
          onBack={() => setReportStep('confirmation')}
          onToggleFollow={() => {}}
        />
      );
    }
    return (
      <ReportConfirmationScreen
        merged={false}
        classification={classification}
        onDone={handleResetFlow}
        selectedSampleIssue={selectedSampleIssue}
        onViewIssue={selectedSampleIssue ? () => setReportStep('submitted-view') : undefined}
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
        const userSub = userSubmissions.find(s => s.mapReport.id === mapReport.id);
        if (userSub?.sampleIssue) {
          const submittedRecord: SampleIssueRecord = {
            ...userSub.sampleIssue,
            status: 'Submitted',
            timeline: userSub.sampleIssue.timeline.map((entry, i) => ({
              ...entry,
              reached: i === 0,
              dateText: i === 0 ? 'Just submitted' : entry.dateText,
            })),
          };
          return (
            <IssueStatusScreen
              report={submittedRecord}
              onBack={() => setMapReport(null)}
              onToggleFollow={() => {}}
            />
          );
        }
        return (
          <IssueStatusScreen
            report={mapReportToRecord(mapReport)}
            onBack={() => setMapReport(null)}
            onToggleFollow={() => {}}
          />
        );
      }
      return (
        <DashboardScreen
          onViewReport={(r) => setMapReport(r)}
          onViewChronicSpot={(spot) => setChronicSpot(spot)}
          extraReports={userSubmissions.map(s => s.mapReport)}
          focusReport={focusReport}
          onFocusConsumed={() => setFocusReport(null)}
          reportImages={Object.fromEntries(
            userSubmissions
              .filter(s => s.sampleIssue?.image)
              .map(s => [s.mapReport.id, s.sampleIssue!.image])
          )}
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
      (currentTab === 'report' && reportStep === 'camera'));

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
