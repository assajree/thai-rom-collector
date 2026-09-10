import { Component, Input } from '@angular/core';
import { DatePipe, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Article } from '../models/article.models';
import { MarkdownService } from '../services/markdown.service';

@Component({ selector: 'app-article-preview', standalone: true, imports: [RouterLink, DatePipe, NgIf], templateUrl: './article-preview.component.html', styleUrl: './article-preview.component.css' })
export class ArticlePreviewComponent {
  @Input({ required: true }) article!: Partial<Article>;
  @Input() backLink = false;
  constructor(private readonly markdown: MarkdownService) {}
  rendered(): string { return this.markdown.render(this.article.content ?? ''); }
}
