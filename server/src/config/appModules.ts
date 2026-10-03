export const APP_MODULES = ['tasks', 'review', 'notes', 'habits', 'finance', 'nutrition'] as const;

export type AppModule = (typeof APP_MODULES)[number];

export const ALL_APP_MODULES: AppModule[] = [...APP_MODULES];

export function isAppModule(value: string): value is AppModule {
  return (APP_MODULES as readonly string[]).includes(value);
}

export function normalizeAppModules(values: unknown): AppModule[] {
  if (!Array.isArray(values)) return [];
  const unique = new Set<AppModule>();
  for (const value of values) {
    if (typeof value === 'string' && isAppModule(value)) {
      unique.add(value);
    }
  }
  return APP_MODULES.filter((module) => unique.has(module));
}
