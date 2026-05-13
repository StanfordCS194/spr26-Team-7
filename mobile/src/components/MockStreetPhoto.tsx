import { Image, ImageStyle, StyleProp } from 'react-native';

export const MockStreetPhoto = ({ style }: { style?: StyleProp<ImageStyle> }) => (
  <Image
    source={require('../../assets/pothole.jpg')}
    style={[{ overflow: 'hidden' }, style]}
    resizeMode="cover"
  />
);
