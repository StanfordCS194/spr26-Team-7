import { Asset } from 'expo-asset'
import { File } from 'expo-file-system'
import { ImageSourcePropType } from 'react-native'

const mimeFromUri = (uri: string): string => {
  const lower = uri.split('?')[0].toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

const fileUriToDataUrl = async (uri: string): Promise<string> => {
  if (uri.startsWith('data:')) {
    return uri
  }
  const base64 = await new File(uri).base64()
  return `data:${mimeFromUri(uri)};base64,${base64}`
}

// Resolves a bundled asset (require(...)) into a base64 data URL the WebView can decode.
export const assetToDataUrl = async (source: ImageSourcePropType): Promise<string> => {
  const asset = Asset.fromModule(source as number)
  await asset.downloadAsync()
  const uri = asset.localUri ?? asset.uri
  return fileUriToDataUrl(uri)
}

// Resolves a captured-photo file URI into a base64 data URL.
export const uriToDataUrl = (uri: string): Promise<string> => fileUriToDataUrl(uri)
