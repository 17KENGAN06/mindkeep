export type BlogTopicId = 'spaced-repetition' | 'pomodoro' | 'pareto';

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
export const blogTopics: BlogTopicId[] = ['spaced-repetition', 'pomodoro', 'pareto'];

export const blogArticles: BlogArticleMeta[] = [
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
