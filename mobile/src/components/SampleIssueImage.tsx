import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SampleIssueImage as SampleIssueImageType } from '../types'

type SampleIssueImageProps = {
  image: SampleIssueImageType
  style?: StyleProp<ImageStyle & ViewStyle>
}

export const SampleIssueImage = ({ image, style }: SampleIssueImageProps) => {
  if (image.kind === 'asset') {
    return <Image source={image.source} style={style} resizeMode="cover" accessibilityLabel={image.alt} />
  }

  return (
    <View style={[styles.placeholder, { backgroundColor: image.backgroundColor }, style]}>
      <MaterialCommunityIcons name={image.icon as any} size={44} color={image.accent} />
      <Text style={styles.label}>{image.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8D939E',
    textAlign: 'center',
  },
})
