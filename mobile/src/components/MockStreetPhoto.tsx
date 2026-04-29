import { Image, View, ViewStyle } from 'react-native';

export const MockStreetPhoto = ({ style }: { style?: ViewStyle }) => (
  <Image
    source={{ uri: "https://images.squarespace-cdn.com/content/v1/573365789f726693272dc91a/1704992146415-CI272VYXPALWT52IGLUB/AdobeStock_201419293.jpeg?format=1500w" }}
    style={style}
    resizeMode="cover"
  />
);

// export const MockStreetPhoto = ({ style }: { style?: ViewStyle }) => (
//   <View style={[{ backgroundColor: '#6b7280', overflow: 'hidden' }, style]}>
//     {/* Sky */}
//     <View style={{ flex: 4, backgroundColor: '#87CEEB' }} />
//     {/* Sidewalk strip */}
//     <View style={{ flex: 0.8, backgroundColor: '#9ca3af' }} />
//     {/* Road */}
//     <View style={{ flex: 2.5, backgroundColor: '#4b5563' }} />
//     {/* Pothole outer */}
//     <View style={{
//       position: 'absolute',
//       top: '59%',
//       left: '40%',
//       width: 44,
//       height: 20,
//       borderRadius: 22,
//       backgroundColor: '#374151',
//     }} />
//     {/* Pothole inner */}
//     <View style={{
//       position: 'absolute',
//       top: '60%',
//       left: '42%',
//       width: 36,
//       height: 15,
//       borderRadius: 18,
//       backgroundColor: '#111827',
//     }} />
//     {/* Crack left */}
//     <View style={{
//       position: 'absolute',
//       top: '63%',
//       left: '34%',
//       width: 18,
//       height: 1.5,
//       backgroundColor: '#374151',
//       transform: [{ rotate: '-20deg' }],
//     }} />
//     {/* Crack right */}
//     <View style={{
//       position: 'absolute',
//       top: '63%',
//       left: '56%',
//       width: 18,
//       height: 1.5,
//       backgroundColor: '#374151',
//       transform: [{ rotate: '20deg' }],
//     }} />
//   </View>
// );
