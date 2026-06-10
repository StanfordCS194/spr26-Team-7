import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SampleIssueImage } from '../components/SampleIssueImage'

import { dashboard311 } from '../data/dashboard311'
import { ReportRecord, SampleIssueImage as SampleIssueImageData, SampleIssueRecord } from '../types'

const CATEGORY_ICON: Record<string, string> = {
  'Pothole':             'road-variant',
  'Streetlight Outage':  'lightbulb-on-outline',
  'Graffiti':            'format-paint',
  'Illegal Dumping':     'trash-can-outline',
  'Vehicle Concerns':    'car',
  'Encampment Concerns': 'tent',
}

const CATEGORY_COLOR: Record<string, string> = {
  'Pothole':             '#E8514A',
  'Streetlight Outage':  '#5B9BF8',
  'Graffiti':            '#3ECF82',
  'Illegal Dumping':     '#F0A030',
  'Vehicle Concerns':    '#E8514A',
  'Encampment Concerns': '#A78BFA',
}

type IssueStatusScreenProps = {
  report: ReportRecord | SampleIssueRecord
  onBack: () => void
  onToggleFollow: () => void
  isFollowUpdating?: boolean
  reportImage?: SampleIssueImageData | null
  onEditPhoto?: () => void
  onSaveEdits?: (edits: {
    title: string
    description: string
    locationMain: string
    locationSub: string
  }) => void
  primaryActionLabel?: string
  onPrimaryAction?: () => void
}

export const IssueStatusScreen = ({
  report,
  onBack,
  onToggleFollow,
  isFollowUpdating = false,
  reportImage,
  onEditPhoto,
  onSaveEdits,
  primaryActionLabel,
  onPrimaryAction,
}: IssueStatusScreenProps) => {
  const isSampleIssue = 'image' in report
  const canEdit = Boolean(onEditPhoto || onSaveEdits)
  const locationMainValue = isSampleIssue ? report.locationName : report.address
  const [isEditingText, setIsEditingText] = useState(false)
  const [draftTitle, setDraftTitle] = useState(report.title)
  const [draftDescription, setDraftDescription] = useState(report.description)
  const [draftLocationMain, setDraftLocationMain] = useState(locationMainValue)
  const [draftLocationSub, setDraftLocationSub] = useState(report.address)
  const displayImage = reportImage !== undefined ? reportImage : isSampleIssue ? report.image : null
  const showPhotoCount = report.photoCount > 0 && Boolean(displayImage)
  const coordinatesText = isSampleIssue
    ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
    : null

  const d3IssueTypes = dashboard311.districts['3']?.issueTypes ?? []
  const issueMetrics = d3IssueTypes.find(t => t.name === report.category)

  useEffect(() => {
    setDraftTitle(report.title)
    setDraftDescription(report.description)
    setDraftLocationMain(locationMainValue)
    setDraftLocationSub(report.address)
  }, [locationMainValue, report.address, report.description, report.title])

  const handleCancelEdits = () => {
    setDraftTitle(report.title)
    setDraftDescription(report.description)
    setDraftLocationMain(locationMainValue)
    setDraftLocationSub(report.address)
    setIsEditingText(false)
  }

  const handleSaveEdits = () => {
    onSaveEdits?.({
      title: draftTitle.trim() || report.title,
      description: draftDescription.trim() || report.description,
      locationMain: draftLocationMain.trim() || locationMainValue,
      locationSub: draftLocationSub.trim() || report.address,
    })
    setIsEditingText(false)
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.issueId}>{report.id}</Text>
            {isEditingText ? (
              <TextInput
                value={draftTitle}
                onChangeText={setDraftTitle}
                style={styles.titleInput}
                placeholderTextColor="#55595F"
              />
            ) : (
              <Text style={styles.issueTitle}>{report.title}</Text>
            )}
          </View>
          {canEdit ? (
            <Pressable
              style={styles.editTextButton}
              onPress={() => (isEditingText ? handleCancelEdits() : setIsEditingText(true))}
              accessibilityRole="button"
            >
              <Text style={styles.editTextButtonText}>{isEditingText ? 'Cancel' : 'Edit'}</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={styles.photoCard}
          onPress={onEditPhoto}
          disabled={!onEditPhoto}
          accessibilityRole="button"
          accessibilityLabel={onEditPhoto ? 'Edit report photo' : 'Report photo'}
        >
          {displayImage ? (
            <SampleIssueImage image={displayImage} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons
                name={(CATEGORY_ICON[report.category] ?? 'alert-circle-outline') as any}
                size={44}
                color={CATEGORY_COLOR[report.category] ?? '#8D939E'}
              />
              <Text style={styles.photoPlaceholderLabel}>{report.category}</Text>
            </View>
          )}
          {showPhotoCount ? (
            <View style={styles.photoOverlay}>
              <Text style={styles.photoOverlayText}>{report.photoCount} photo{report.photoCount === 1 ? '' : 's'}</Text>
            </View>
          ) : null}
          {onEditPhoto ? (
            <View style={styles.photoEditBadge}>
              <MaterialCommunityIcons name="pencil" size={15} color="#F2F3F5" />
            </View>
          ) : null}
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapArea}>
            <Image source={require('../../assets/new-map.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View
              style={[
                styles.mapPin,
                {
                  top: `${report.pin.top}%`,
                  left: `${report.pin.left}%`,
                  backgroundColor: report.pin.color,
                },
              ]}
            />
          </View>
          {isEditingText ? (
            <>
              <TextInput
                value={draftLocationMain}
                onChangeText={setDraftLocationMain}
                style={styles.input}
                placeholder="Location"
                placeholderTextColor="#55595F"
              />
              <TextInput
                value={draftLocationSub}
                onChangeText={setDraftLocationSub}
                style={styles.input}
                placeholder="Address"
                placeholderTextColor="#55595F"
              />
            </>
          ) : (
            <>
              <Text style={styles.value}>{locationMainValue}</Text>
              <Text style={styles.secondaryValue}>{report.address}</Text>
            </>
          )}
          {coordinatesText ? <Text style={styles.metaValue}>Coordinates: {coordinatesText}</Text> : null}
          <View style={styles.tagRow}>
            <InfoPill label={report.district} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          {isEditingText ? (
            <TextInput
              multiline
              value={draftDescription}
              onChangeText={setDraftDescription}
              style={[styles.input, styles.descriptionInput]}
              placeholderTextColor="#55595F"
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.bodyText}>{report.description}</Text>
          )}
        </View>

        {isEditingText ? (
          <View style={styles.editActionRow}>
            <Pressable style={styles.saveEditButton} onPress={handleSaveEdits} accessibilityRole="button">
              <Text style={styles.saveEditButtonText}>Save Changes</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          {report.timeline.map((entry, index) => (
            <View key={`${entry.label}-${index}`} style={styles.timelineRow}>
              <View style={[styles.dot, entry.reached ? styles.dotReached : styles.dotPending]} />
              <View style={styles.timelineTextWrap}>
                <Text style={styles.timelineLabel}>{entry.label}</Text>
                <Text style={styles.timelineDate}>{entry.dateText}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <InsightRow
            label="Avg. resolution time"
            value={issueMetrics ? issueMetrics.all.avgTimeLabel : report.estimatedResolution}
          />
          <InsightRow
            label="Resolution rate"
            value={issueMetrics
              ? `${issueMetrics.all.resolvedPct}% of District 3 cases resolved`
              : `${report.reportCount} ${report.reportCount === 1 ? 'person' : 'people'} reported or confirmed this issue`}
          />
          <InsightRow label="Assigned team" value={report.assignedTo} />
        </View>

        <View style={styles.actionRow}>
          {primaryActionLabel && onPrimaryAction ? (
            <Pressable
              style={styles.followButton}
              onPress={onPrimaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.followButtonText}>{primaryActionLabel}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.followButton,
                report.isFollowing ? styles.followButtonActive : null,
                isFollowUpdating ? styles.followButtonDisabled : null,
              ]}
              onPress={onToggleFollow}
              disabled={isFollowUpdating}
              accessibilityRole="button"
              accessibilityState={{ disabled: isFollowUpdating, selected: report.isFollowing }}
            >
              <Text style={[styles.followButtonText, report.isFollowing ? styles.followButtonTextActive : null]}>
                {isFollowUpdating
                  ? 'Updating…'
                  : report.isFollowing
                    ? 'Following for updates'
                    : 'Follow this issue'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const InsightRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <View style={styles.insightRow}>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.insightValue}>{value}</Text>
    </View>
  )
}

const InfoPill = ({ label }: { label: string }) => {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillText}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },
  content: { padding: 14, gap: 14, paddingBottom: 32 },
  headingRow: { gap: 10 },
  headingCopy: { gap: 6 },
  issueId: { fontSize: 13, fontWeight: '700', color: '#8D939E', letterSpacing: 0.4 },
  issueTitle: { fontSize: 24, fontWeight: '900', color: '#F2F3F5', lineHeight: 30 },
  titleInput: {
    borderWidth: 1,
    borderColor: '#35373D',
    borderRadius: 12,
    backgroundColor: '#222428',
    color: '#F2F3F5',
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editTextButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#2C2D32',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editTextButtonText: { color: '#F2F3F5', fontWeight: '800', fontSize: 13 },
  badge: {
    backgroundColor: '#F0A03028',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeResolved: {
    backgroundColor: '#4F8EF728',
  },
  badgeText: { color: '#F0A030', fontWeight: '700' },
  badgeTextResolved: { color: '#4F8EF7' },
  photoCard: {
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2C2D32',
  },
  photoOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(17,24,39,0.8)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoOverlayText: {
    color: '#F2F3F5',
    fontWeight: '700',
    fontSize: 12,
  },
  photoEditBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: 16, backgroundColor: '#222428', padding: 14, gap: 10 },
  sectionTitle: { color: '#F2F3F5', fontWeight: '800', fontSize: 18 },
  mapArea: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#2C2D32',
  },
  mapPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  value: { color: '#F2F3F5', fontWeight: '700', fontSize: 16, lineHeight: 22 },
  secondaryValue: { color: '#8D939E', fontWeight: '500', lineHeight: 21 },
  metaValue: { color: '#8D939E', fontWeight: '600', fontSize: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoPill: {
    backgroundColor: '#2C2D32',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoPillText: { color: '#8D939E', fontWeight: '700', fontSize: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineTextWrap: { flex: 1, gap: 2 },
  dot: { width: 12, height: 12, borderRadius: 999, marginTop: 6 },
  dotReached: { backgroundColor: '#4F8EF7' },
  dotPending: { backgroundColor: '#35373D' },
  timelineLabel: { fontSize: 16, fontWeight: '700', color: '#F2F3F5' },
  timelineDate: { color: '#8D939E', fontWeight: '500', lineHeight: 20 },
  bodyText: { color: '#8D939E', lineHeight: 22, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#35373D',
    borderRadius: 12,
    backgroundColor: '#2C2D32',
    color: '#F2F3F5',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontWeight: '600',
  },
  descriptionInput: { minHeight: 110, lineHeight: 22 },
  editActionRow: { gap: 10 },
  saveEditButton: {
    borderRadius: 14,
    backgroundColor: '#4F8EF7',
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveEditButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  insightRow: { gap: 4 },
  insightLabel: { color: '#8D939E', fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  insightValue: { color: '#F2F3F5', fontWeight: '600', lineHeight: 22 },
  actionRow: { gap: 10 },
  followButton: {
    borderRadius: 14,
    backgroundColor: '#4F8EF7',
    paddingVertical: 16,
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: '#2C2D32',
    borderWidth: 1,
    borderColor: '#35373D',
  },
  followButtonDisabled: { opacity: 0.6 },
  followButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  followButtonTextActive: { color: '#F2F3F5' },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#35373D',
  },
  closeButton: {
    backgroundColor: '#2C2D32',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: '#8D939E', fontSize: 14, fontWeight: '600' },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#2C2D32',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  photoPlaceholderLabel: {
    color: '#8D939E',
    fontSize: 13,
    fontWeight: '600',
  },
})
