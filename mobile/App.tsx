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
import { AppTab } from './src/types';

type ReportStep = 'camera' | 'analyzing' | 'classify' | 'duplicate' | 'confirmation';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('report');
  const [reportStep, setReportStep] = useState<ReportStep>('camera');
  const [classification, setClassification] = useState<Classification | null>(null);
  const [merged, setMerged] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

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
      return <DashboardScreen />;
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
