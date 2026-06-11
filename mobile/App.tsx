import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuth } from './src/providers/AuthProvider';
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
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AppTab, IssueCategory, ReportRecord, ReportStatus, SampleIssueImage, SampleIssueRecord } from './src/types';
import { MapReport, MapReportCategoryId } from './src/data/mockMapReports';
import { ChronicSpotV2 } from './src/data/dashboard311v2';
import { sampleIssues } from './src/data/sampleIssues';
import { DashboardProvider } from './src/context/DashboardContext';
import { postSubmission } from './src/api/serverApi';
import { sendReportEmail } from './src/lib/reportEmail';
import { confirmSj311Submission, submitSanJose311Report, Sj311SubmitSession } from './src/lib/sanjose311/submitReport';
import { SanJose311SubmitScreen } from './src/screens/SanJose311SubmitScreen';
import { ProfileReport } from './src/lib/profileStats';
import { createReport, fetchReportByExternalId, fetchReportsByIds, fetchUserReports, getSampleIssueIdFromRow, ReportRow, reportRowToMapReport, updateReportText } from './src/lib/reports';
import { fetchFollowedReportIds, followReport, unfollowReport } from './src/lib/reportFollows';
import { MlClassification } from './src/ml/types';
import { formatDistrictLabel, lookupDistrictFromCoordinates } from './src/lib/districtLookup';

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

const CATEGORY_ID_BY_LABEL: Record<string, MapReportCategoryId> = {
  Pothole:                'pothole',
  'Streetlight Outage':   'streetlight',
  Graffiti:               'graffiti',
  'Illegal Dumping':      'dumping',
  'Vehicle Concerns':     'vehicle',
  'Encampment Concerns':  'encampment',
};

const STATUS_MAP: Record<string, ReportStatus> = {
  'Submitted':   'Submitted',
  'Open':        'Received',
  'In Progress': 'In Progress',
  'Closed':      'Resolved',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_DASHBOARD_FOLLOWS_KEY_PREFIX = 'cityfix:dashboard-follows:';
const LOCAL_REPORT_PHOTOS_KEY_PREFIX = 'cityfix:report-photos:';
const ONBOARDING_COMPLETE_KEY = 'cityfix:onboarding-complete';

function mapReportToRecord(r: MapReport, isFollowing = false): ReportRecord {
  const category = CATEGORY_LABEL[r.categoryId];
  return {
    id:                  r.id,
    title:               r.title,
    category,
    tag:                 category,
    district:            formatDistrictLabel(r.district),
    status:              STATUS_MAP[r.status] ?? 'Submitted',
    description:         r.description,
    address:             r.address,
    assignedTo:          r.assignedTo,
    estimatedResolution: '2–3 weeks',
    reportCount:         1,
    isFollowing,
    isUserOwned:         true,
    photoCount:          0,
    latitude:            r.lat,
    longitude:           r.lon,
    pin:                 { top: 0, left: 0, color: '#5B9BF8' },
    timeline:            r.timeline.map((t, i) => ({
      label:    (STATUS_MAP[t.label] ?? t.label) as ReportStatus,
      dateText: t.dateText,
      reached:  t.reached ?? i === 0,
    })),
  };
}


function makeSubmissionId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function classificationToRecord(c: Classification, id: string): ReportRecord {
  const fallbackLat = 37.338
  const fallbackLon = -121.886
  const lat = c.latitude ?? fallbackLat
  const lon = c.longitude ?? fallbackLon

  return {
    id,
    title:               c.tag,
    category:            c.category as IssueCategory,
    tag:                 c.tag,
    district:            formatDistrictLabel(lookupDistrictFromCoordinates(lat, lon)),
    status:              'Submitted',
    description:         c.desc,
    address:             c.locationMain,
    assignedTo:          'Pending assignment',
    estimatedResolution: '2–3 weeks',
    reportCount:         1,
    isFollowing:         false,
    isUserOwned:         true,
    photoCount:          0,
    latitude:            c.latitude,
    longitude:           c.longitude,
    pin:                 { top: 50, left: 50, color: '#5B9BF8' },
    timeline:            [{ label: 'Submitted', dateText: 'Just now', reached: true }],
  }
}

type ReportSubmission = {
  mapReport: MapReport;
  sampleIssue: SampleIssueRecord | null;
  externalId?: string | null;
  image?: SampleIssueImage | null;
};

const rowToSubmission = (row: ReportRow): ReportSubmission => ({
  mapReport: reportRowToMapReport(row),
  externalId: row.external_id,
  sampleIssue: (() => {
    const sampleIssueId = getSampleIssueIdFromRow(row);
    return sampleIssueId
      ? sampleIssues.find((issue) => issue.id === sampleIssueId) ?? null
      : null;
  })(),
});

const dashboardSubmissionFromExternalId = (_externalId: string): ReportSubmission | null => {
  // Reports are now in Supabase; dashboard issues resolve via fetchReportByExternalId
  return null;
};

const localDashboardFollowsKey = (userId: string) =>
  `${LOCAL_DASHBOARD_FOLLOWS_KEY_PREFIX}${userId}`;

const readLocalDashboardFollowIds = async (userId: string): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(localDashboardFollowsKey(userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const writeLocalDashboardFollowIds = async (userId: string, reportIds: string[]) => {
  await AsyncStorage.setItem(
    localDashboardFollowsKey(userId),
    JSON.stringify(Array.from(new Set(reportIds))),
  );
};

const localReportPhotosKey = (userId: string) =>
  `${LOCAL_REPORT_PHOTOS_KEY_PREFIX}${userId}`;

const isStoredUriImage = (value: unknown): value is Extract<SampleIssueImage, { kind: 'uri' }> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const image = value as Partial<Extract<SampleIssueImage, { kind: 'uri' }>>;
  return image.kind === 'uri' && typeof image.uri === 'string' && typeof image.alt === 'string';
};

const readLocalReportPhotos = async (userId: string): Promise<Record<string, Extract<SampleIssueImage, { kind: 'uri' }>>> => {
  const raw = await AsyncStorage.getItem(localReportPhotosKey(userId));
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, Extract<SampleIssueImage, { kind: 'uri' }>] =>
        typeof entry[0] === 'string' && isStoredUriImage(entry[1]),
      ),
    );
  } catch {
    return {};
  }
};

const writeLocalReportPhoto = async (
  userId: string,
  reportId: string,
  image: SampleIssueImage | null,
) => {
  const currentPhotos = await readLocalReportPhotos(userId);
  if (image?.kind === 'uri') {
    currentPhotos[reportId] = image;
  } else {
    delete currentPhotos[reportId];
  }

  await AsyncStorage.setItem(localReportPhotosKey(userId), JSON.stringify(currentPhotos));
};

const toProfileReport = (mapReport: MapReport): ProfileReport => ({
  id: mapReport.id,
  title: mapReport.title,
  category: CATEGORY_LABEL[mapReport.categoryId],
  status: mapReport.status,
  submittedAt: mapReport.createdAt,
});

const createGuestMapReport = (
  classification: Classification,
  selectedSampleIssue: SampleIssueRecord | null,
): MapReport => {
  const fallbackCenter = { latitude: 37.338, longitude: -121.886 };
  const lat = classification.latitude ?? selectedSampleIssue?.latitude ?? fallbackCenter.latitude;
  const lon = classification.longitude ?? selectedSampleIssue?.longitude ?? fallbackCenter.longitude;
  const district = lookupDistrictFromCoordinates(lat, lon);

  return {
    id: `guest-${Date.now()}`,
    categoryId: CATEGORY_ID_BY_LABEL[classification.category] ?? 'pothole',
    title: classification.tag,
    address: `${classification.locationMain}, ${classification.locationSub}`,
    district,
    lat,
    lon,
    status: 'Submitted',
    createdAt: new Date(),
    description: classification.desc,
    assignedTo: selectedSampleIssue?.assignedTo ?? 'Dept. of Public Works',
    timeline: [{ label: 'Submitted', dateText: 'Just now' }],
  };
};

type ReportStep = 'picker' | 'camera' | 'analyzing' | 'classify' | 'sj311_submit' | 'confirmation' | 'tracking' | 'submitted-view';

export default function App() {
  const { session, user, isLoading, signOut } = useAuth();
  const isSignedIn = Boolean(session);
  const [currentTab, setCurrentTab]                   = useState<AppTab>('report');
  const [isGuestSession, setIsGuestSession]           = useState(false);
  const [showAuthScreen, setShowAuthScreen]           = useState(false);
  const [showOnboarding, setShowOnboarding]           = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [reportStep, setReportStep]                   = useState<ReportStep>('camera');
  const [sj311SubmitSession, setSj311SubmitSession] = useState<Sj311SubmitSession | null>(null);
  const [classification, setClassification]           = useState<Classification | null>(null);
  const [mapReport, setMapReport]                     = useState<MapReport | null>(null);
  const [chronicSpot, setChronicSpot]                 = useState<ChronicSpotV2 | null>(null);
  const [selectedSampleIssue, setSelectedSampleIssue] = useState<SampleIssueRecord | null>(null);
  const [mlResult, setMlResult]                       = useState<MlClassification | null>(null);
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null);
  const [pendingRecord, setPendingRecord]             = useState<ReportRecord | null>(null);
  const [reportImage, setReportImage]                 = useState<SampleIssueImage | null>(null);
  const [userSubmissions, setUserSubmissions]         = useState<ReportSubmission[]>([]);
  const [followedSubmissions, setFollowedSubmissions] = useState<ReportSubmission[]>([]);
  const [focusReport, setFocusReport]                 = useState<MapReport | null>(null);
  const [isSendingReport, setIsSendingReport]         = useState(false);
  const [isLoadingReports, setIsLoadingReports]       = useState(false);
  const [followedReportIds, setFollowedReportIds]     = useState<Set<string>>(new Set());
  const [followUpdatingId, setFollowUpdatingId]       = useState<string | null>(null);

  const isFollowingReport = (reportId: string) =>
    followedReportIds.has(reportId) ||
    followedSubmissions.some((submission) => submission.externalId === reportId);

  const findReportSubmission = (reportId: string) =>
    userSubmissions.find((s) => s.mapReport.id === reportId)
    ?? followedSubmissions.find((s) => s.mapReport.id === reportId || s.externalId === reportId);

  const loadFollowedSubmissions = async (
    followIds: string[],
    localDashboardFollowIds: string[] = [],
  ) => {
    const rows = await fetchReportsByIds(followIds);
    const databaseSubmissions = rows.map(rowToSubmission);
    const databaseExternalIds = new Set(
      databaseSubmissions
        .map((submission) => submission.externalId)
        .filter((externalId): externalId is string => Boolean(externalId)),
    );
    const localDashboardSubmissions = localDashboardFollowIds
      .filter((externalId) => !databaseExternalIds.has(externalId))
      .map(dashboardSubmissionFromExternalId)
      .filter((submission): submission is ReportSubmission => Boolean(submission));

    return [...databaseSubmissions, ...localDashboardSubmissions];
  };

  const updateSubmissionImage = (reportId: string, image: SampleIssueImage | null) => {
    setUserSubmissions((prev) =>
      prev.map((submission) =>
        submission.mapReport.id === reportId
          ? { ...submission, image }
          : submission,
      ),
    );
  };

  const saveSubmissionImage = async (reportId: string, image: SampleIssueImage | null) => {
    updateSubmissionImage(reportId, image);
    if (!user?.id) {
      return;
    }

    try {
      await writeLocalReportPhoto(user.id, reportId, image);
    } catch (error) {
      console.warn('[report_photos] local save failed', error);
    }
  };

  const imageFromPickerResult = (
    result: ImagePicker.ImagePickerResult,
    alt: string,
  ): SampleIssueImage | null => {
    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset?.uri) {
      Alert.alert('No photo selected', 'Please try again.');
      return null;
    }

    return { kind: 'uri', uri: asset.uri, alt };
  };

  const replaceReportPhotoFromCamera = async (reportId: string) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission needed', 'Allow camera access to take a report photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
      });
      const image = imageFromPickerResult(result, 'Updated report photo');
      if (image) {
        void saveSubmissionImage(reportId, image);
      }
    } catch (error) {
      console.error('[image_picker] report photo camera failed', error);
      Alert.alert('Could not open camera', 'Please try again.');
    }
  };

  const replaceReportPhotoFromLibrary = async (reportId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ['images'],
        quality: 0.85,
      });
      const image = imageFromPickerResult(result, 'Updated report photo');
      if (image) {
        void saveSubmissionImage(reportId, image);
      }
    } catch (error) {
      console.error('[image_picker] report photo library failed', error);
      Alert.alert('Could not open photo library', 'Please try again.');
    }
  };

  const openReportPhotoEditor = (reportId: string, hasPhoto: boolean) => {
    Alert.alert(
      'Edit photo',
      undefined,
      [
        {
          text: 'Take new photo',
          onPress: () => void replaceReportPhotoFromCamera(reportId),
        },
        {
          text: 'Choose from library',
          onPress: () => void replaceReportPhotoFromLibrary(reportId),
        },
        ...(hasPhoto
          ? [
              {
                text: 'Remove photo',
                style: 'destructive' as const,
                onPress: () => void saveSubmissionImage(reportId, null),
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

  async function handleSaveReportTextEdits(
    reportId: string,
    edits: {
      title: string;
      description: string;
      locationMain: string;
      locationSub: string;
    },
  ) {
    const applyEdits = (submission: ReportSubmission): ReportSubmission => {
      if (submission.mapReport.id !== reportId) {
        return submission;
      }

      return {
        ...submission,
        mapReport: {
          ...submission.mapReport,
          title: edits.title,
          description: edits.description,
          address: `${edits.locationMain}, ${edits.locationSub}`,
        },
      };
    };

    const existingSubmission = userSubmissions.find((submission) => submission.mapReport.id === reportId);
    if (user?.id && UUID_PATTERN.test(reportId)) {
      try {
        const updatedRow = await updateReportText(reportId, edits);
        const updatedMapReport = reportRowToMapReport(updatedRow);
        setUserSubmissions((prev) =>
          prev.map((submission) =>
            submission.mapReport.id === reportId
              ? { ...submission, mapReport: updatedMapReport, externalId: updatedRow.external_id }
              : submission,
          ),
        );
      } catch (error) {
        console.error('[reports] update text failed', error);
        Alert.alert('Could not save changes', 'Please try again.');
        return;
      }
    } else {
      setUserSubmissions((prev) => prev.map(applyEdits));
    }

    Alert.alert(
      'Send updated report?',
      'Do you want to open your email app and send the updated report to the city?',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: () => {
            const category =
              existingSubmission?.sampleIssue?.category ??
              (existingSubmission ? CATEGORY_LABEL[existingSubmission.mapReport.categoryId] : 'Pothole');
            const updatedClassification: Classification = {
              category,
              tag: edits.title,
              desc: edits.description,
              locationMain: edits.locationMain,
              locationSub: edits.locationSub,
              latitude: existingSubmission?.mapReport.lat,
              longitude: existingSubmission?.mapReport.lon,
            };

            void (async () => {
              const outcome = await sendReportEmail(updatedClassification, user?.email);
              if (outcome === 'cancelled') {
                Alert.alert('Report not sent', 'Send the email to submit the updated report to the city.');
                return;
              }
              if (outcome === 'needs_confirmation') {
                await confirmEmailWasSent();
              }
            })();
          },
        },
      ],
    );
  }

  const handleToggleFollow = async (reportId: string) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Sign in to follow reports.');
      return;
    }

    setFollowUpdatingId(reportId);
    try {
      const wasFollowing = isFollowingReport(reportId);
      const existingSubmission = findReportSubmission(reportId);
      let dashboardRow: ReportRow | null = null;
      if (!UUID_PATTERN.test(reportId)) {
        try {
          dashboardRow = await fetchReportByExternalId(reportId);
        } catch (error) {
          console.warn('[reports] dashboard external lookup failed; using local follow fallback', error);
        }
      }
      const targetReportId = existingSubmission?.mapReport.id ?? dashboardRow?.id ?? reportId;
      const targetSubmission =
        existingSubmission ??
        (dashboardRow ? rowToSubmission(dashboardRow) : dashboardSubmissionFromExternalId(reportId));

      if (!UUID_PATTERN.test(targetReportId)) {
        const localSubmission = targetSubmission ?? dashboardSubmissionFromExternalId(reportId);
        if (!localSubmission) {
          Alert.alert('Could not follow issue', 'This dashboard issue is missing from the local issue list.');
          return;
        }

        const localFollowIds = await readLocalDashboardFollowIds(user.id);
        const nextLocalFollowIds = wasFollowing
          ? localFollowIds.filter((id) => id !== reportId)
          : [...localFollowIds, reportId];
        await writeLocalDashboardFollowIds(user.id, nextLocalFollowIds);

        setFollowedReportIds((prev) => {
          const next = new Set(prev);
          if (wasFollowing) {
            next.delete(reportId);
          } else {
            next.add(reportId);
          }
          return next;
        });
        setFollowedSubmissions((prev) => {
          if (wasFollowing) {
            return prev.filter((s) => s.externalId !== reportId && s.mapReport.id !== reportId);
          }
          if (prev.some((s) => s.externalId === reportId || s.mapReport.id === reportId)) {
            return prev;
          }
          return [localSubmission, ...prev];
        });
        return;
      }

      setFollowedReportIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) {
          next.delete(reportId);
          next.delete(targetReportId);
        } else {
          next.add(reportId);
          next.add(targetReportId);
        }
        return next;
      });
      if (wasFollowing) {
        setFollowedSubmissions((prev) =>
          prev.filter((s) => s.mapReport.id !== targetReportId && s.externalId !== reportId),
        );
      }

      if (wasFollowing) {
        await unfollowReport(user.id, targetReportId);
      } else {
        await followReport(user.id, targetReportId);
        if (targetSubmission) {
          setFollowedSubmissions((prev) => {
            if (prev.some((s) => s.mapReport.id === targetReportId || s.externalId === reportId)) {
              return prev;
            }
            return [targetSubmission, ...prev];
          });
        }
      }
    } catch (error) {
      console.error('[report_follows] update failed', error);
      setFollowedReportIds(new Set(followedReportIds));
      void (async () => {
        const localDashboardFollowIds = user?.id ? await readLocalDashboardFollowIds(user.id) : [];
        const followed = await loadFollowedSubmissions(Array.from(followedReportIds), localDashboardFollowIds);
        setFollowedSubmissions(followed);
      })();
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
      const statusImage =
        userSub.image !== undefined ? userSub.image : userSub.sampleIssue.image;
      const submittedRecord: SampleIssueRecord = {
        ...userSub.sampleIssue,
        status: STATUS_MAP[mapReport.status] ?? 'Submitted',
        title: mapReport.title,
        locationName: mapReport.address,
        address: mapReport.address,
        latitude: mapReport.lat,
        longitude: mapReport.lon,
        district: formatDistrictLabel(mapReport.district),
        description: mapReport.description,
        isFollowing: isFollowingReport(reportId),
        timeline: mapReport.timeline.map((entry, i) => ({
          label:    (STATUS_MAP[entry.label] ?? entry.label) as ReportStatus,
          dateText: entry.dateText,
          reached:  entry.reached ?? i === 0,
        })),
      };

      return (
        <IssueStatusScreen
          report={submittedRecord}
          reportImage={statusImage}
          onBack={onBack}
          onToggleFollow={() => void handleToggleFollow(reportId)}
          isFollowUpdating={isFollowUpdating}
          onEditPhoto={
            userSubmissions.some((submission) => submission.mapReport.id === reportId)
              ? () => openReportPhotoEditor(
                  reportId,
                  Boolean(statusImage),
                )
              : undefined
          }
          onSaveEdits={
            userSubmissions.some((submission) => submission.mapReport.id === reportId)
              ? (edits) => handleSaveReportTextEdits(reportId, edits)
              : undefined
          }
        />
      );
    }

    return (
      <IssueStatusScreen
        report={mapReportToRecord(mapReport, isFollowingReport(reportId))}
        reportImage={userSub?.image ?? null}
        onBack={onBack}
        onToggleFollow={() => void handleToggleFollow(reportId)}
        isFollowUpdating={isFollowUpdating}
        onEditPhoto={
          userSubmissions.some((submission) => submission.mapReport.id === reportId)
            ? () => openReportPhotoEditor(reportId, Boolean(userSub?.image))
            : undefined
        }
        onSaveEdits={
          userSubmissions.some((submission) => submission.mapReport.id === reportId)
            ? (edits) => handleSaveReportTextEdits(reportId, edits)
            : undefined
        }
      />
    );
  };

  useEffect(() => {
    let isMounted = true;

    const loadOnboardingStatus = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        if (isMounted) {
          setShowOnboarding(storedValue !== 'true');
        }
      } catch {
        if (isMounted) {
          setShowOnboarding(true);
        }
      } finally {
        if (isMounted) {
          setIsCheckingOnboarding(false);
        }
      }
    };

    void loadOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const completeOnboarding = async () => {
    setShowOnboarding(false);
    if (!isSignedIn) {
      return;
    }

    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.warn('[onboarding] completion save failed', error);
    }
  };

  const continueAsGuest = () => {
    setIsGuestSession(true);
    setShowOnboarding(true);
  };

  useEffect(() => {
    if (isSignedIn) {
      setIsGuestSession(false);
      setShowAuthScreen(false);
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
        const [rows, followIds, localDashboardFollowIds, localReportPhotos] = await Promise.all([
          fetchUserReports(user.id),
          fetchFollowedReportIds(user.id),
          readLocalDashboardFollowIds(user.id),
          readLocalReportPhotos(user.id),
        ]);
        if (!isMounted) {
          return;
        }

        setFollowedReportIds(new Set([...followIds, ...localDashboardFollowIds]));
        setUserSubmissions(rows.map((row) => ({ ...rowToSubmission(row), image: localReportPhotos[row.id] })));
        const followed = await loadFollowedSubmissions(followIds, localDashboardFollowIds);
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
      const mapReport = createGuestMapReport(c, selectedSampleIssue);
      setUserSubmissions((prev) => [
        { mapReport, sampleIssue: selectedSampleIssue, image: selectedSampleIssue?.image ?? reportImage },
        ...prev,
      ]);
      setFocusReport(mapReport);
      setReportStep('confirmation');
      return;
    }

    try {
      const row = await createReport(user.id, c, selectedSampleIssue);
      const mapReport = reportRowToMapReport(row);
      const submissionImage = selectedSampleIssue?.image ?? reportImage;

      setUserSubmissions((prev) => [
        { mapReport, sampleIssue: selectedSampleIssue, image: submissionImage },
        ...prev,
      ]);
      if (submissionImage?.kind === 'uri') {
        try {
          await writeLocalReportPhoto(user.id, mapReport.id, submissionImage);
        } catch (error) {
          console.warn('[report_photos] initial local save failed', error);
        }
      }
      setFocusReport(mapReport);

      const subId = makeSubmissionId();
      setPendingSubmissionId(subId);
      setPendingRecord(mapReportToRecord(mapReport));
      void postSubmission({
        id:          subId,
        lat:         mapReport.lat,
        lon:         mapReport.lon,
        category:    c.category,
        submittedAt: new Date().toISOString(),
      }).catch(() => {});

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
      const { session } = await submitSanJose311Report(c, { email: user?.email ?? null });
      setSj311SubmitSession(session);
      setReportStep('sj311_submit');
    } catch (error) {
      console.error('[sj311] prepare failed', error);
      Alert.alert(
        'Could not open 311 form',
        'CityFix could not prepare the San José 311 submission. Please try again.',
      );
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleSj311Cancel = () => {
    setSj311SubmitSession(null);
    setReportStep('classify');
  };

  const handleSj311Submitted = async () => {
    if (!classification) {
      return;
    }

    const confirmed = await confirmSj311Submission();
    if (!confirmed) {
      return;
    }

    setSj311SubmitSession(null);
    await completeReportSubmission(classification);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Still reset local state if sign-out fails.
    }
    setIsGuestSession(false);
    setCurrentTab('report');
    setUserSubmissions([]);
    setFollowedSubmissions([]);
    setFollowedReportIds(new Set());
    setFocusReport(null);
    setMapReport(null);
    setChronicSpot(null);
    handleResetFlow();
  };

  const handleResetFlow = () => {
    setReportStep('camera');
    setClassification(null);
    setSelectedSampleIssue(null);
    setMlResult(null);
    setPendingSubmissionId(null);
    setPendingRecord(null);
    setReportImage(null);
    setSj311SubmitSession(null);
  };

  const renderReportFlow = () => {
    if (reportStep === 'picker') {
      return (
        <SampleIssuePickerScreen
          onSelectIssue={(issueId) => {
            const nextIssue = sampleIssues.find((issue) => issue.id === issueId) ?? null;
            setSelectedSampleIssue(nextIssue);
            setMlResult(null);
            setReportImage(nextIssue?.image ?? null);
            setReportStep('analyzing');
          }}
          onOpenCamera={() => {
            setSelectedSampleIssue(null);
            setReportImage(null);
            setReportStep('camera');
          }}
        />
      );
    }
    if (reportStep === 'camera') {
      return (
        <ReportCameraScreen
          onCapture={(image) => {
            setSelectedSampleIssue(null);
            setReportImage(image);
            setReportStep('analyzing');
          }}
          onOpenLibrary={(image) => {
            setSelectedSampleIssue(null);
            setReportImage(image);
            setReportStep('analyzing');
          }}
        />
      );
    }
    if (reportStep === 'analyzing') {
      return (
        <AnalyzingScreen
          image={selectedSampleIssue?.image ?? reportImage}
          onDone={(result) => {
            setMlResult(result);
            setReportStep('classify');
          }}
        />
      );
    }
    if (reportStep === 'classify') {
      return (
        <ClassificationScreen
          onBack={() => setReportStep(selectedSampleIssue ? 'picker' : 'camera')}
          onConfirm={handleConfirmReport}
          isSubmitting={isSendingReport}
          selectedSampleIssue={selectedSampleIssue}
          mlResult={mlResult}
          reportImage={selectedSampleIssue?.image ?? reportImage}
        />
      );
    }
    if (reportStep === 'sj311_submit' && sj311SubmitSession) {
      return (
        <SanJose311SubmitScreen
          session={sj311SubmitSession}
          onCancel={handleSj311Cancel}
          onSubmitted={handleSj311Submitted}
        />
      );
    }
    if (reportStep === 'submitted-view') {
      const submission = selectedSampleIssue
        ? userSubmissions.find((s) => s.sampleIssue?.id === selectedSampleIssue.id)
        : userSubmissions.find((s) => s.mapReport.id === focusReport?.id);
      if (submission) {
        return renderIssueStatus(
          submission.mapReport,
          submission,
          () => setReportStep('confirmation'),
        );
      }
    }
    if (reportStep === 'tracking' && pendingRecord && pendingSubmissionId) {
      return (
        <IssueStatusScreen
          report={pendingRecord}
          submissionId={pendingSubmissionId}
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
        reportImage={selectedSampleIssue?.image ?? reportImage}
        onTrackStatus={pendingSubmissionId ? () => setReportStep('tracking') : undefined}
        onViewIssue={focusReport ? () => setReportStep('submitted-view') : undefined}
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
          onViewReport={(r) => setMapReport(r)}
          onViewChronicSpot={(spot) => setChronicSpot(spot)}
          extraReports={userSubmissions.map(s => s.mapReport)}
          focusReport={focusReport}
          onFocusConsumed={() => setFocusReport(null)}
          reportImages={Object.fromEntries(
            userSubmissions
              .map(s => [s.mapReport.id, s.image ?? s.sampleIssue?.image])
              .filter((entry): entry is [string, SampleIssueImage] => Boolean(entry[1]))
          )}
        />
      );
    }
    if (currentTab === 'profile') {
      if (!isSignedIn && showAuthScreen) {
        return (
          <AuthScreen
            onContinueAsGuest={() => {
              setShowAuthScreen(false);
              continueAsGuest();
              setCurrentTab('report');
            }}
          />
        );
      }

      if (mapReport) {
        const userSub = findReportSubmission(mapReport.id);
        return renderIssueStatus(mapReport, userSub, () => setMapReport(null));
      }

      const profileReports = userSubmissions.map(({ mapReport }) => toProfileReport(mapReport));
      const followingReports = followedSubmissions.map(({ mapReport }) => toProfileReport(mapReport));

      return (
        <ProfileScreen
          isSignedIn={isSignedIn}
          onToggleAuth={isSignedIn ? handleSignOut : () => setShowAuthScreen(true)}
          displayName={
            typeof user?.user_metadata?.full_name === 'string'
              ? user.user_metadata.full_name
              : null
          }
          email={user?.email ?? null}
          memberSince={user?.created_at ?? null}
          reports={profileReports}
          followingReports={followingReports}
          onReplayOnboarding={() => setShowOnboarding(true)}
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
    !showOnboarding &&
    !chronicSpot &&
    !mapReport &&
    (currentTab === 'dashboard' ||
      currentTab === 'profile' ||
      (currentTab === 'report' && reportStep === 'camera'));

  if (isLoading || isLoadingReports || isCheckingOnboarding) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="light" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F8EF7" />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DashboardProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="light" />
          <View style={styles.container}>
            {(isSignedIn || isGuestSession) && showOnboarding ? (
              <OnboardingScreen onDone={() => void completeOnboarding()} />
            ) : isSignedIn || isGuestSession ? (
              renderCurrentTab()
            ) : (
              <AuthScreen onContinueAsGuest={continueAsGuest} />
            )}
          </View>
          {showNav && (
            <BottomNav
              currentTab={currentTab}
              onChangeTab={(tab) => {
                setShowAuthScreen(false);
                setCurrentTab(tab);
              }}
            />
          )}
        </SafeAreaView>
      </DashboardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18191C' },
  container: { flex: 1, backgroundColor: '#18191C' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
