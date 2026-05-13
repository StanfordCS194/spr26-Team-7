import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { BottomNav } from './src/components/BottomNav';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ReportCameraScreen } from './src/screens/ReportCameraScreen';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { ClassificationScreen, Classification } from './src/screens/ClassificationScreen';
import { DuplicateScreen } from './src/screens/DuplicateScreen';
import { ReportConfirmationScreen } from './src/screens/ReportConfirmationScreen';
import { AppTab, ReportRecord } from './src/types';
import { AuthScreen } from './src/screens/AuthScreen';
import { IssueStatusScreen } from './src/screens/IssueStatusScreen';
import { useAuth } from './src/providers/AuthProvider';
import {
  createReportFromClassification,
  fetchDashboardReports,
  incrementReportPhotoCount,
  setReportFollow,
} from './src/lib/reports';

type ReportStep = 'camera' | 'analyzing' | 'classify' | 'duplicate' | 'confirmation';

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
  const { session, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<AppTab>('report');
  const [reportStep, setReportStep] = useState<ReportStep>('camera');
  const [classification, setClassification] = useState<Classification | null>(null);
  const [merged, setMerged] = useState(false);
  const [issues, setIssues] = useState<ReportRecord[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const isSignedIn = Boolean(session);

  const loadIssues = useCallback(async () => {
    if (!session?.user) {
      setIssues([]);
      return;
    }

    setIssuesLoading(true);
    try {
      const nextIssues = await fetchDashboardReports(session.user.id);
      setIssues(nextIssues);
    } catch {
      setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    if (session) {
      return;
    }

    setCurrentTab('report');
    setSelectedIssueId(null);
    setReportStep('camera');
    setClassification(null);
    setMerged(false);
  }, [session]);

  const handleResetFlow = () => {
    setReportStep('camera');
    setClassification(null);
    setMerged(false);
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
    if (!selectedIssueId || !session?.user) {
      return;
    }

    const selectedIssue = issues.find((issue) => issue.id === selectedIssueId);
    if (!selectedIssue) {
      return;
    }

    const nextFollowing = !selectedIssue.isFollowing;
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === selectedIssueId
          ? { ...issue, isFollowing: nextFollowing }
          : issue
      )
    );

    void setReportFollow(session.user.id, selectedIssueId, nextFollowing).catch(() => {
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === selectedIssueId
            ? { ...issue, isFollowing: selectedIssue.isFollowing }
            : issue
        )
      );
    });
  };

  const handleAddIssuePhoto = () => {
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

    void incrementReportPhotoCount(selectedIssueId).catch(() => {});
  };

  const handleCompleteReport = async (nextMerged: boolean) => {
    if (classification && session?.user) {
      try {
        await createReportFromClassification(session.user.id, classification, {
          merged: nextMerged,
        });
        await loadIssues();
      } catch {
        // Keep the confirmation screen even if persistence fails.
      }
    }

    setMerged(nextMerged);
    setReportStep('confirmation');
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
          onMerge={() => {
            void handleCompleteReport(true);
          }}
          onNew={() => {
            if (classification) {
              postDifferentIssueReport(classification);
            }
            void handleCompleteReport(false);
          }}
          onBack={() => setReportStep('classify')}
        />
      );
    }
    return (
      <ReportConfirmationScreen
        merged={merged}
        classification={classification}
        onDone={handleResetFlow}
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
      return <DashboardScreen issues={issues} isLoading={issuesLoading} onOpenIssue={handleOpenIssue} />;
    }
    if (currentTab === 'profile') {
      return <ProfileScreen />;
    }
    return renderReportFlow();
  };

  const showNav =
    isSignedIn &&
    !selectedIssue &&
    (
      currentTab === 'dashboard' ||
      currentTab === 'profile' ||
      (currentTab === 'report' && reportStep === 'camera')
    );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {isSignedIn ? (
          renderCurrentTab()
        ) : (
          <AuthScreen />
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
