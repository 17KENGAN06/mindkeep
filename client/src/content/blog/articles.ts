import type { FeatureSlug } from '../features';

export type BlogTopicId = 'spaced-repetition' | 'pomodoro' | 'pareto' | 'nutrition' | 'budget';

export type BlogArticleMeta = {
  slug: string;
  topic: BlogTopicId;
  /** ISO date YYYY-MM-DD */
  publishedAt: string;
  author: string;
  /** Originator credited in the article */
  originator: string;
};

/**
 * Article catalog — add a new item here, then fill
 * `blog.articles.<slug>` in each locale JSON.
 */
export const blogTopics: BlogTopicId[] = ['spaced-repetition', 'pomodoro', 'pareto', 'nutrition', 'budget'];

/** The feature page each topic points readers to. */
export const topicFeature: Record<BlogTopicId, FeatureSlug> = {
  'spaced-repetition': 'spaced-repetition',
  pomodoro: 'daily-planner',
  pareto: 'spaced-repetition',
  nutrition: 'calorie-tracker',
  budget: 'budget-tracker',
};

/** Newest first. */
export const blogArticles: BlogArticleMeta[] = [
  {
    slug: 'how-to-track-expenses',
    topic: 'budget',
    publishedAt: '2026-11-06',
    author: 'Mindkeep Editorial',
    originator: 'Elizabeth Warren',
  },
  {
    slug: 'how-to-count-calories',
    topic: 'nutrition',
    publishedAt: '2026-11-04',
    author: 'Mindkeep Editorial',
    originator: 'Wilbur Atwater',
  },
  {
    slug: 'how-to-memorize-vocabulary',
    topic: 'spaced-repetition',
    publishedAt: '2026-11-02',
    author: 'Mindkeep Editorial',
    originator: 'Paul Nation',
  },
  {
    slug: 'spaced-repetition-memory',
    topic: 'spaced-repetition',
    publishedAt: '2026-07-10',
    author: 'Mindkeep Editorial',
    originator: 'Hermann Ebbinghaus',
  },
  {
    slug: 'pomodoro-focus',
    topic: 'pomodoro',
    publishedAt: '2026-07-14',
    author: 'Mindkeep Editorial',
    originator: 'Francesco Cirillo',
  },
  {
    slug: 'pareto-learning-results',
    topic: 'pareto',
    publishedAt: '2026-07-18',
    author: 'Mindkeep Editorial',
    originator: 'Vilfredo Pareto',
  },
];

export function getArticleBySlug(slug: string): BlogArticleMeta | undefined {
  return blogArticles.find((article) => article.slug === slug);
}

export function getArticlesByTopic(topic: BlogTopicId): BlogArticleMeta[] {
  return blogArticles.filter((article) => article.topic === topic);
}
