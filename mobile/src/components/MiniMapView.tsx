import { View, ViewStyle } from 'react-native';

type MiniMapViewProps = {
  style?: ViewStyle;
};

export const MiniMapView = ({ style }: MiniMapViewProps) => (
  <View style={[{ backgroundColor: '#1a1d22', overflow: 'hidden' }, style]}>
    {/* Horizontal street */}
    <View style={{ position: 'absolute', top: '42%', left: 0, right: 0, height: 16, backgroundColor: '#2a2e38' }} />
    {/* Vertical street */}
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: '38%', width: 16, backgroundColor: '#2a2e38' }} />
    {/* City blocks */}
    <View style={{ position: 'absolute', top: '6%', left: '4%', right: '62%', bottom: '52%', backgroundColor: '#222428', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '6%', left: '56%', right: '24%', bottom: '52%', backgroundColor: '#222428', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '6%', left: '78%', right: '3%', bottom: '52%', backgroundColor: '#1e2026', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '58%', left: '4%', right: '62%', bottom: '26%', backgroundColor: '#222428', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '58%', left: '56%', right: '24%', bottom: '26%', backgroundColor: '#222428', borderRadius: 3 }} />
    {/* Pin */}
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
);
