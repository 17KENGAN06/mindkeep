import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import mark from '../../assets/icon.png';

type BrandMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function BrandMark({ size = 56, style, imageStyle }: BrandMarkProps) {
  return (
    <View style={[{ width: size, height: size }, styles.wrap, style]}>
      <Image
        accessibilityLabel="MindKeep"
        source={mark}
        style={[{ width: size, height: size, borderRadius: size * 0.22 }, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
