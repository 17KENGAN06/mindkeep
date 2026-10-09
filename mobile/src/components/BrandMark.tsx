import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import mark from '../../assets/brand/mark.png';

type BrandMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

/** The site's logo (client/public/logo.svg) rendered to a PNG with transparent rounded corners. */
export function BrandMark({ size = 56, style, imageStyle }: BrandMarkProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image accessibilityLabel="MindKeep" source={mark} style={[{ width: size, height: size }, imageStyle]} />
    </View>
  );
}
