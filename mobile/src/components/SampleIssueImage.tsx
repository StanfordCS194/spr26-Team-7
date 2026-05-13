import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
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
    <View style={[styles.placeholder, { backgroundColor: image.backgroundColor, borderColor: image.accent }, style]}>
      <View style={[styles.iconBubble, { backgroundColor: image.accent }]}>
        <Text style={styles.icon}>{image.icon}</Text>
      </View>
      <Text style={[styles.label, { color: image.accent }]}>{image.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  iconBubble: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
})
