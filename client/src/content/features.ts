/**
 * Feature landing pages (`/features/<slug>`). Texts live in `landing.pages.<slug>` in each
 * locale JSON. Pure module: the prerender script imports it too.
 */
export const featureSlugs = ['spaced-repetition', 'calorie-tracker', 'budget-tracker', 'daily-planner'] as const;

export type FeatureSlug = (typeof featureSlugs)[number];

export function isFeatureSlug(value: string | undefined): value is FeatureSlug {
  return featureSlugs.includes(value as FeatureSlug);
}
