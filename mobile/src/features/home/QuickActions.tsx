import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';

export type QuickAction = {
  key: string;
  icon: AppIconName;
  label: string;
  /** Small live value next to the label ("3/8"). */
  value?: string;
  busy?: boolean;
  onPress: () => void;
};

/** The few things logged many times a day, one tap each (the "+" sheet holds the rest). */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const { colors } = useTheme();
  if (actions.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {actions.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={action.value ? `${action.label}, ${action.value}` : action.label}
          disabled={action.busy}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: `${colors.panel}e6`, borderColor: colors.line },
            pressed && {
              backgroundColor: `${colors.brand}1a`,
              borderColor: `${colors.brand}66`,
              transform: [{ scale: 0.97 }],
            },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: `${colors.brand}1f` }]}>
            {action.busy ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : (
              <AppIcon name={action.icon} color={colors.brand} size={15} />
            )}
          </View>
          <Text style={[styles.label, { color: colors.ink }]}>{action.label}</Text>
          {action.value ? (
            <Text style={[styles.value, { color: colors.brand }]}>{action.value}</Text>
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Bleeds to the screen edges so chips can scroll past the page padding.
  scroll: { marginBottom: 14, marginHorizontal: -20 },
  row: { gap: 8, paddingHorizontal: 20 },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingLeft: 6,
    paddingRight: 14,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  label: { fontFamily: fonts.semibold, fontSize: 13.5 },
  value: { fontFamily: fonts.bold, fontSize: 12.5 },
});
