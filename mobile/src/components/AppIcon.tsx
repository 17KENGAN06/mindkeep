import { Ionicons } from '@expo/vector-icons';

export type AppIconName = keyof typeof Ionicons.glyphMap;

type AppIconProps = {
  name: AppIconName;
  color: string;
  size?: number;
};

export function AppIcon({ name, color, size = 22 }: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
