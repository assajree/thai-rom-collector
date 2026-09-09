import { Injectable, inject } from '@angular/core';
import { Database, get, ref, remove, set, query, orderByChild, equalTo } from '@angular/fire/database';
import { Article, ArticleDraft } from '../models/article.models';

@Injectable({ providedIn: 'root' })
export class ArticleRepository {
  private readonly db = inject(Database); private readonly path = 'articles';
  async all(includeDrafts = false): Promise<Article[]> {
    const source = includeDrafts ? ref(this.db, this.path) : query(ref(this.db, this.path), orderByChild('status'), equalTo('published'));
    const value = (await get(source)).val() ?? {};
    return Object.entries(value as Record<string, Partial<Article>>).map(([id, article]) => ({ ...article, id } as Article))
      .filter(article => includeDrafts || String(article.status).toLowerCase() === 'published')
      .sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
  }
  async bySlug(slug: string): Promise<Article | null> { return (await this.all()).find(x => x.slug === slug) ?? null; }
  async byId(id: string): Promise<Article | null> { const value = (await get(ref(this.db, `${this.path}/${id}`))).val(); return value ? { ...(value as Omit<Article, 'id'>), id } : null; }
  async save(draft: ArticleDraft, id?: string): Promise<string> {
    const now = new Date().toISOString(); const existing = id ? await this.byId(id) : null;
    const article: Omit<Article, 'id'> = { ...draft, createdAt: existing?.createdAt ?? now, updatedAt: now, publishedAt: draft.status === 'published' ? (existing?.publishedAt ?? now) : null };
    const articleId = id ?? crypto.randomUUID(); await set(ref(this.db, `${this.path}/${articleId}`), article); return articleId;
  }
  async delete(id: string): Promise<void> { await remove(ref(this.db, `${this.path}/${id}`)); }
}
