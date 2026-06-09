import { Asset } from 'expo-asset'
import { ImageSourcePropType } from 'react-native'
import { SampleIssueImage } from '../types'
import { supabase } from './supabase'

const BUCKET = 'report-photos'

const getPhotoExtension = (localUri: string) => {
  const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase()
  if (ext === 'png') {
    return { ext: 'png', contentType: 'image/png' }
  }
  if (ext === 'webp') {
    return { ext: 'webp', contentType: 'image/webp' }
  }
  return { ext: 'jpg', contentType: 'image/jpeg' }
}

export const resolveAssetUri = async (source: ImageSourcePropType): Promise<string> => {
  const asset = Asset.fromModule(source)
  await asset.downloadAsync()
  if (!asset.localUri) {
    throw new Error('Could not resolve bundled image asset')
  }
  return asset.localUri
}

export const uploadReportPhoto = async (
  userId: string,
  reportId: string,
  localUri: string,
): Promise<string> => {
  const { ext, contentType } = getPhotoExtension(localUri)
  const path = `${userId}/${reportId}.${ext}`

  const response = await fetch(localUri)
  const arrayBuffer = await response.arrayBuffer()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType, upsert: true })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export const uploadSampleIssuePhoto = async (
  userId: string,
  reportId: string,
  image: SampleIssueImage,
): Promise<string | null> => {
  if (image.kind !== 'asset') {
    return null
  }

  const localUri = await resolveAssetUri(image.source)
  return uploadReportPhoto(userId, reportId, localUri)
}
