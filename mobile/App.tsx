import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from './src/providers/AuthProvider';
import { BottomNav } from './src/components/BottomNav';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ProfileSettingsScreen } from './src/screens/ProfileSettingsScreen';
import { ReportCameraScreen } from './src/screens/ReportCameraScreen';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { ClassificationScreen, Classification } from './src/screens/ClassificationScreen';
import { ReportConfirmationScreen } from './src/screens/ReportConfirmationScreen';
import { IssueStatusScreen } from './src/screens/IssueStatusScreen';
import { RecurringIssueDetailScreen } from './src/screens/RecurringIssueDetailScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { SampleIssuePickerScreen } from './src/screens/SampleIssuePickerScreen';
import { AppTab, IssueCategory, ReportRecord, ReportStatus, SampleIssueRecord } from './src/types';
import { MapReport, MapReportCategoryId } from './src/data/mockMapReports';
import { ChronicSpot } from './src/data/dashboard311';
import { sampleIssues } from './src/data/sampleIssues';
import { sendReportEmail } from './src/lib/reportEmail';
import { ProfileReport } from './src/lib/profileStats';
import { createReport, fetchReportsByIds, fetchUserReports, getSampleIssueIdFromRow, ReportRow, reportRowToMapReport, updateReportPhotoUrl } from './src/lib/reports';
import { uploadSampleIssuePhoto } from './src/lib/reportPhotos';
import { SampleIssueImage } from './src/types';
import { fetchFollowedReportIds, followReport, unfollowReport } from './src/lib/reportFollows';
import {
  DEFAULT_USER_SETTINGS,
  loadUserSettings,
  saveUserSettings,
  UserSettings,
} from './src/lib/userSettings';
import { preloadSampleIssueAssets } from './src/lib/preloadSampleAssets';

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

const STATUS_MAP: Record<string, ReportStatus> = {
  'Submitted':   'Submitted',
  'Open':        'Received',
  'In Progress': 'In Progress',
  'Closed':      'Resolved',
};

function mapReportToRecord(r: MapReport, isFollowing = false): ReportRecord {
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
    isFollowing,
    isUserOwned:         true,
    photoCount:          r.photoUrl ? 1 : 0,
    photoUrl:            r.photoUrl,
    pin:                 { top: 0, left: 0, color: '#5B9BF8' },
    timeline:            r.timeline.map((t, i) => ({
      label:    (STATUS_MAP[t.label] ?? t.label) as ReportStatus,
      dateText: t.dateText,
      reached:  i === 0,
    })),
  };
}



type ReportSubmission = { mapReport: MapReport; sampleIssue: SampleIssueRecord | null };

const submissionReportImage = (submission: ReportSubmission): SampleIssueImage | null => {
  if (submission.sampleIssue?.image) {
    return submission.sampleIssue.image;
  }
  if (submission.mapReport.photoUrl) {
    return {
      kind: 'uri',
      uri: submission.mapReport.photoUrl,
      alt: submission.mapReport.title,
    };
  }
  return null;
};

const rowToSubmission = (row: ReportRow): ReportSubmission => ({
  mapReport: reportRowToMapReport(row),
  sampleIssue: (() => {
    const sampleIssueId = getSampleIssueIdFromRow(row);
    return sampleIssueId
      ? sampleIssues.find((issue) => issue.id === sampleIssueId) ?? null
      : null;
  })(),
});

const toProfileReport = (mapReport: MapReport): ProfileReport => ({
  id: mapReport.id,
  title: mapReport.title,
  category: CATEGORY_LABEL[mapReport.categoryId],
  status: mapReport.status,
  submittedAt: mapReport.createdAt,
});

type ReportStep = 'picker' | 'camera' | 'analyzing' | 'classify' | 'confirmation' | 'submitted-view';

export default function App() {
  const { session, user, isLoading, signOut } = useAuth();
  const isSignedIn = Boolean(session);
  const [currentTab, setCurrentTab]                   = useState<AppTab>('report');
  const [reportStep, setReportStep]                   = useState<ReportStep>('camera');
  const [classification, setClassification]           = useState<Classification | null>(null);
  const [mapReport, setMapReport]                     = useState<MapReport | null>(null);
  const [chronicSpot, setChronicSpot]                 = useState<ChronicSpot | null>(null);
  const [selectedSampleIssue, setSelectedSampleIssue] = useState<SampleIssueRecord | null>(null);
  const [isManualReport, setIsManualReport]           = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [userSettings, setUserSettings]               = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [userSubmissions, setUserSubmissions]         = useState<ReportSubmission[]>([]);
  const [followedSubmissions, setFollowedSubmissions] = useState<ReportSubmission[]>([]);
  const [focusReport, setFocusReport]                 = useState<MapReport | null>(null);
  const [isSendingReport, setIsSendingReport]         = useState(false);
  const [isLoadingReports, setIsLoadingReports]       = useState(false);
  const [followedReportIds, setFollowedReportIds]     = useState<Set<string>>(new Set());
  const [followUpdatingId, setFollowUpdatingId]       = useState<string | null>(null);

  const isFollowingReport = (reportId: string) => followedReportIds.has(reportId);

  const updateUserSettings = (patch: Partial<UserSettings>) => {
    setUserSettings((prev) => {
      const next = { ...prev, ...patch };
      void saveUserSettings(next);
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      const settings = await loadUserSettings();
      if (isMounted) {
        setUserSettings(settings);
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const findReportSubmission = (reportId: string) =>
    userSubmissions.find((s) => s.mapReport.id === reportId)
    ?? followedSubmissions.find((s) => s.mapReport.id === reportId);

  const loadFollowedSubmissions = async (followIds: string[]) => {
    const rows = await fetchReportsByIds(followIds);
    return rows.map(rowToSubmission);
  };

  const handleToggleFollow = async (reportId: string) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Sign in to follow reports.');
      return;
    }

    const wasFollowing = isFollowingReport(reportId);
    const submissionBeforeToggle = findReportSubmission(reportId);
    setFollowUpdatingId(reportId);
    setFollowedReportIds((prev) => {
      const next = new Set(prev);
      if (wasFollowing) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
    if (wasFollowing) {
      setFollowedSubmissions((prev) => prev.filter((s) => s.mapReport.id !== reportId));
    }

    try {
      if (wasFollowing) {
        await unfollowReport(user.id, reportId);
      } else {
        await followReport(user.id, reportId);
        if (submissionBeforeToggle) {
          setFollowedSubmissions((prev) => {
            if (prev.some((s) => s.mapReport.id === reportId)) {
              return prev;
            }
            return [submissionBeforeToggle, ...prev];
          });
        } else {
          const rows = await fetchReportsByIds([reportId]);
          if (rows[0]) {
            setFollowedSubmissions((prev) => [rowToSubmission(rows[0]), ...prev]);
          }
        }
      }
    } catch (error) {
      console.error('[report_follows] update failed', error);
      setFollowedReportIds(new Set(followedReportIds));
      void loadFollowedSubmissions(Array.from(followedReportIds)).then(setFollowedSubmissions);
      Alert.alert('Could not update follow', 'Please try again.');
    } finally {
      setFollowUpdatingId(null);
    }
  };

  const renderIssueStatus = (
    mapReport: MapReport,
    userSub: ReportSubmission | undefined,
    onBack: () => void,
  ) => {
    const reportId = mapReport.id;
    const isFollowUpdating = followUpdatingId === reportId;

    if (userSub?.sampleIssue) {
      const submittedRecord: SampleIssueRecord = {
        ...userSub.sampleIssue,
        status: STATUS_MAP[mapReport.status] ?? 'Submitted',
        title: mapReport.title,
        isFollowing: isFollowingReport(reportId),
        timeline: mapReport.timeline.map((entry, i) => ({
          label: (STATUS_MAP[entry.label] ?? entry.label) as ReportStatus,
          dateText: entry.dateText,
          reached: i === 0,
        })),
      };

      return (
        <IssueStatusScreen
          report={submittedRecord}
          onBack={onBack}
          onToggleFollow={() => void handleToggleFollow(reportId)}
          isFollowUpdating={isFollowUpdating}
        />
      );
    }

    return (
      <IssueStatusScreen
        report={mapReportToRecord(mapReport, isFollowingReport(reportId))}
        onBack={onBack}
        onToggleFollow={() => void handleToggleFollow(reportId)}
        isFollowUpdating={isFollowUpdating}
      />
    );
  };

  useEffect(() => {
    if (isSignedIn) {
      void preloadSampleIssueAssets();
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!user?.id) {
      setUserSubmissions([]);
      setFollowedSubmissions([]);
      setFollowedReportIds(new Set());
      return;
    }

    let isMounted = true;

    const loadUserData = async () => {
      setIsLoadingReports(true);
      try {
        const [rows, followIds] = await Promise.all([
          fetchUserReports(user.id),
          fetchFollowedReportIds(user.id),
        ]);
        if (!isMounted) {
          return;
        }

        setFollowedReportIds(new Set(followIds));
        setUserSubmissions(rows.map(rowToSubmission));
        const followed = await loadFollowedSubmissions(followIds);
        if (!isMounted) {
          return;
        }
        setFollowedSubmissions(followed);
      } catch (error) {
        console.error('[reports] load failed', error);
        if (isMounted) {
          Alert.alert('Could not load reports', 'Check your connection and try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingReports(false);
        }
      }
    };

    void loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const confirmEmailWasSent = () =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm email sent',
        'Tap Send in your email app to submit the report to the city, then confirm here.',
        [
          { text: 'Not yet', style: 'cancel', onPress: () => resolve(false) },
          { text: 'I sent it', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });

  const completeReportSubmission = async (c: Classification) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Sign in to save your report.');
      return;
    }

    try {
      let row = await createReport(user.id, c, selectedSampleIssue);

      if (selectedSampleIssue?.image) {
        try {
          const photoUrl = await uploadSampleIssuePhoto(user.id, row.id, selectedSampleIssue.image);
          if (photoUrl) {
            row = await updateReportPhotoUrl(row.id, photoUrl);
          }
        } catch (uploadError) {
          console.error('[reports] photo upload failed', uploadError);
          Alert.alert(
            'Photo not saved',
            'Your report was saved, but the photo could not be uploaded. Check your connection and try again.',
          );
        }
      }

      const mapReport = reportRowToMapReport(row);

      setUserSubmissions((prev) => [
        { mapReport, sampleIssue: selectedSampleIssue },
        ...prev,
      ]);
      setFocusReport(mapReport);
      setReportStep('confirmation');
    } catch (error) {
      console.error('[reports] create failed', error);
      Alert.alert(
        'Could not save report',
        'Your email may have been sent, but the report was not saved to your account. Please try again.',
      );
    }
  };

  const handleConfirmReport = async (c: Classification) => {
    setClassification(c);
    setIsSendingReport(true);

    try {
      const outcome = await sendReportEmail(c, user?.email);

      if (outcome === 'cancelled') {
        Alert.alert('Report not sent', 'Send the email to submit your report to the city.');
        return;
      }

      if (outcome === 'needs_confirmation') {
        const confirmed = await confirmEmailWasSent();
        if (!confirmed) {
          return;
        }
      }

      await completeReportSubmission(c);
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Still reset local state if sign-out fails.
    }
    setCurrentTab('report');
    setUserSubmissions([]);
    setFollowedSubmissions([]);
    setFollowedReportIds(new Set());
    setFocusReport(null);
    setMapReport(null);
    setChronicSpot(null);
    setShowProfileSettings(false);
    handleResetFlow();
  };

  const handleResetFlow = () => {
    setReportStep('camera');
    setClassification(null);
    setSelectedSampleIssue(null);
    setIsManualReport(false);
  };

  const handleStartManualReport = () => {
    setSelectedSampleIssue(null);
    setIsManualReport(true);
    setReportStep('classify');
  };

  const renderReportFlow = () => {
    if (reportStep === 'picker') {
      return (
        <SampleIssuePickerScreen
          onSelectIssue={(issueId) => {
            const nextIssue = sampleIssues.find((issue) => issue.id === issueId) ?? null;
            setSelectedSampleIssue(nextIssue);
            setIsManualReport(false);
            setReportStep('classify');
          }}
          onOpenCamera={() => {
            setSelectedSampleIssue(null);
            setIsManualReport(false);
            setReportStep('camera');
          }}
        />
      );
    }
    if (reportStep === 'camera') {
      return (
        <ReportCameraScreen
          onCapture={() => {
            setIsManualReport(false);
            setReportStep('analyzing');
          }}
          onOpenLibrary={() => {
            setIsManualReport(false);
            setReportStep('picker');
          }}
          onReportWithoutPhoto={handleStartManualReport}
        />
      );
    }
    if (reportStep === 'analyzing') {
      return (
        <AnalyzingScreen
          onDone={() => {
            setIsManualReport(false);
            setReportStep('classify');
          }}
        />
      );
    }
    if (reportStep === 'classify') {
      return (
        <ClassificationScreen
          onBack={() => {
            if (isManualReport) {
              setIsManualReport(false);
              setReportStep('camera');
              return;
            }
            setReportStep(selectedSampleIssue ? 'picker' : 'camera');
          }}
          onConfirm={handleConfirmReport}
          isSubmitting={isSendingReport}
          selectedSampleIssue={isManualReport ? null : selectedSampleIssue}
          variant={isManualReport ? 'manual' : 'photo'}
          locationEnabled={userSettings.locationEnabled}
          homeDistrict={userSettings.homeDistrict}
        />
      );
    }
    if (reportStep === 'submitted-view' && selectedSampleIssue) {
      const submission = userSubmissions.find((s) => s.sampleIssue?.id === selectedSampleIssue.id);
      if (submission) {
        return renderIssueStatus(
          submission.mapReport,
          submission,
          () => setReportStep('confirmation'),
        );
      }
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
        const userSub = findReportSubmission(mapReport.id);
        return renderIssueStatus(mapReport, userSub, () => setMapReport(null));
      }
      return (
        <DashboardScreen
          homeDistrict={userSettings.homeDistrict}
          onHomeDistrictChange={(homeDistrict) => updateUserSettings({ homeDistrict })}
          onViewReport={(r) => setMapReport(r)}
          onViewChronicSpot={(spot) => setChronicSpot(spot)}
          extraReports={userSubmissions.map(s => s.mapReport)}
          focusReport={focusReport}
          onFocusConsumed={() => setFocusReport(null)}
          reportImages={Object.fromEntries(
            userSubmissions
              .map((submission) => {
                const image = submissionReportImage(submission);
                return image ? [submission.mapReport.id, image] as const : null;
              })
              .filter((entry): entry is [string, SampleIssueImage] => entry !== null),
          )}
        />
      );
    }
    if (currentTab === 'profile') {
      if (mapReport) {
        const userSub = findReportSubmission(mapReport.id);
        return renderIssueStatus(mapReport, userSub, () => setMapReport(null));
      }

      if (showProfileSettings) {
        return (
          <ProfileSettingsScreen
            onBack={() => setShowProfileSettings(false)}
            locationEnabled={userSettings.locationEnabled}
            homeDistrict={userSettings.homeDistrict}
            onLocationEnabledChange={(locationEnabled) => updateUserSettings({ locationEnabled })}
            onHomeDistrictChange={(homeDistrict) => updateUserSettings({ homeDistrict })}
          />
        );
      }

      const profileReports = userSubmissions.map(({ mapReport }) => toProfileReport(mapReport));
      const followingReports = followedSubmissions.map(({ mapReport }) => toProfileReport(mapReport));

      return (
        <ProfileScreen
          isSignedIn={isSignedIn}
          onToggleAuth={handleSignOut}
          onOpenSettings={() => setShowProfileSettings(true)}
          displayName={
            typeof user?.user_metadata?.full_name === 'string'
              ? user.user_metadata.full_name
              : null
          }
          email={user?.email ?? null}
          memberSince={user?.created_at ?? null}
          reports={profileReports}
          followingReports={followingReports}
          onViewReport={(reportId) => {
            const match = findReportSubmission(reportId);
            if (match) {
              setMapReport(match.mapReport);
            }
          }}
        />
      );
    }
    return renderReportFlow();
  };

  const showNav =
    isSignedIn &&
    !chronicSpot &&
    !mapReport &&
    !showProfileSettings &&
    (currentTab === 'dashboard' ||
      currentTab === 'profile' ||
      (currentTab === 'report' && reportStep === 'camera'));

  if (isLoading || isLoadingReports) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F8EF7" />
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
            setShowProfileSettings(false);
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
