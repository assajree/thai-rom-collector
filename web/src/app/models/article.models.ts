export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type ArticleDraft = Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>;
