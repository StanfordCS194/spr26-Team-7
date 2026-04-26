import { View, ViewStyle } from 'react-native';

type MiniMapViewProps = {
  style?: ViewStyle;
};

export const MiniMapView = ({ style }: MiniMapViewProps) => (
  <View style={[{ backgroundColor: '#e8e4dc', overflow: 'hidden' }, style]}>
    {/* Horizontal street */}
    <View style={{ position: 'absolute', top: '42%', left: 0, right: 0, height: 16, backgroundColor: '#f5f3ef' }} />
    {/* Vertical street */}
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: '38%', width: 16, backgroundColor: '#f5f3ef' }} />
    {/* City blocks */}
    <View style={{ position: 'absolute', top: '6%', left: '4%', right: '62%', bottom: '52%', backgroundColor: '#d4cfc7', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '6%', left: '56%', right: '24%', bottom: '52%', backgroundColor: '#d4cfc7', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '6%', left: '78%', right: '3%', bottom: '52%', backgroundColor: '#cdc8c0', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '58%', left: '4%', right: '62%', bottom: '26%', backgroundColor: '#d4cfc7', borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: '58%', left: '56%', right: '24%', bottom: '26%', backgroundColor: '#d4cfc7', borderRadius: 3 }} />
    {/* GPS accuracy ring */}
    <View style={{
      position: 'absolute',
      top: '30%',
      left: '33%',
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: 'rgba(37,99,235,0.3)',
    }} />
    {/* Pin — static, always at intersection center */}
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
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' }} />
      </View>
      {/* Triangle tail */}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 7,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#2563eb',
        marginTop: -1,
      }} />
    </View>
  </View>
);
