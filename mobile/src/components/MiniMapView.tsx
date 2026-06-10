import { ActivityIndicator, Platform, View, ViewStyle } from 'react-native'
import MapView, { Marker, Region } from 'react-native-maps'

type MiniMapViewProps = {
  style?: ViewStyle
  latitude?: number
  longitude?: number
  isLoading?: boolean
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8d9199' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2c2d32' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1014' }],
  },
]

const WireframeMap = ({ style }: { style?: ViewStyle }) => (
  <View style={[{ backgroundColor: '#1a1d22', overflow: 'hidden' }, style]}>
    <View style={{ position: 'absolute', top: '42%', left: 0, right: 0, height: 16, backgroundColor: '#2a2e38' }} />
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: '38%', width: 16, backgroundColor: '#2a2e38' }} />
    <View style={{ position: 'absolute', top: '6%', left: '4%', right: '62%', bottom: '52%', backgroundColor: '#222428', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '6%', left: '56%', right: '24%', bottom: '52%', backgroundColor: '#222428', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '6%', left: '78%', right: '3%', bottom: '52%', backgroundColor: '#1e2026', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '58%', left: '4%', right: '62%', bottom: '26%', backgroundColor: '#222428', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '58%', left: '56%', right: '24%', bottom: '26%', backgroundColor: '#222428', borderRadius: 3 }} />
    <View style={{
      position: 'absolute',
      top: '34%',
      left: '36%',
      alignItems: 'center',
    }}>
      <View style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#4F8EF7',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' }} />
      </View>
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 7,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#4F8EF7',
        marginTop: -1,
      }} />
    </View>
  </View>
)

export const MiniMapView = ({ style, latitude, longitude, isLoading = false }: MiniMapViewProps) => {
  if (isLoading) {
    return (
      <View style={[{ backgroundColor: '#1a1d22', alignItems: 'center', justifyContent: 'center' }, style]}>
        <ActivityIndicator color="#4F8EF7" />
      </View>
    )
  }

  if (latitude == null || longitude == null) {
    return <WireframeMap style={style} />
  }

  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  }

  return (
    <MapView
      style={style}
      region={region}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      customMapStyle={Platform.OS === 'android' ? DARK_MAP_STYLE : undefined}
      userInterfaceStyle="dark"
    >
      <Marker coordinate={{ latitude, longitude }} pinColor="#4F8EF7" />
    </MapView>
  )
}
