import { Asset } from 'expo-asset'
import { ImageSourcePropType } from 'react-native'
import { sampleIssues } from '../data/sampleIssues'

const sampleAssetModules = sampleIssues
  .map((issue) => issue.image)
  .filter((image) => image.kind === 'asset')
  .map((image) => image.source as ImageSourcePropType)

let preloadPromise: Promise<void> | null = null

export const preloadSampleIssueAssets = () => {
  if (!preloadPromise) {
    preloadPromise = Asset.loadAsync(sampleAssetModules).then(() => undefined)
  }
  return preloadPromise
}
