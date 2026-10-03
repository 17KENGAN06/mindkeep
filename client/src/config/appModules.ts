export const APP_MODULES = ['tasks', 'review', 'notes', 'habits', 'finance', 'nutrition'] as const;

export type AppModule = (typeof APP_MODULES)[number];

export const ALL_APP_MODULES: AppModule[] = [...APP_MODULES];

export const MODULE_HOME_KEY: Record<AppModule, string> = {
  tasks: 'tasks',
  review: 'learning',
  notes: 'notes',
  habits: 'habits',
  finance: 'finance',
  nutrition: 'nutrition',
};

export function isAppModule(value: string): value is AppModule {
  return (APP_MODULES as readonly string[]).includes(value);
}

export function needsOnboarding(
  user: { onboardingCompleted?: boolean; enabledModules?: string[] } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.onboardingCompleted === true) return false;
  if (user.onboardingCompleted === false) return true;
  return Array.isArray(user.enabledModules) && user.enabledModules.length === 0;
}

export function selectedModules(
  user: { onboardingCompleted?: boolean; enabledModules?: string[] } | null | undefined,
): AppModule[] {
  if (needsOnboarding(user)) {
    return (user?.enabledModules ?? []).filter(isAppModule);
  }
  const enabled = (user?.enabledModules ?? []).filter(isAppModule);
  return enabled.length > 0 ? enabled : [...APP_MODULES];
}

export function userHasModule(
  user: { onboardingCompleted?: boolean; enabledModules?: string[] } | null | undefined,
  module: AppModule,
): boolean {
  if (!user || needsOnboarding(user)) return false;
  const enabled = (user.enabledModules ?? []).filter(isAppModule);
  if (enabled.length === 0) return true;
  return enabled.includes(module);
}
