import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  render(source: string): string {
    const lines = this.escape(source).split(/\r?\n/);
    const html: string[] = [];
    let code: string[] | null = null;
    let list: string[] = [];

    const closeList = () => { if (list.length) { html.push(`<ul>${list.join('')}</ul>`); list = []; } };
    const closeCode = () => { if (code) { html.push(`<pre><code>${code.join('\n')}</code></pre>`); code = null; } };

    for (const line of lines) {
      if (line.startsWith('```')) { if (code) closeCode(); else { closeList(); code = []; } continue; }
      if (code) { code.push(line); continue; }
      if (!line.trim()) { closeList(); continue; }

      const item = line.match(/^[-*] (.+)$/);
      if (item) { list.push(`<li>${this.inline(item[1])}</li>`); continue; }
      closeList();
      if (/^(---|\*\*\*|___)\s*$/.test(line)) html.push('<hr>');
      else if (/^#{1,6} /.test(line)) { const match = line.match(/^(#{1,6}) (.+)$/)!; const level = match[1].length; html.push(`<h${level}>${this.inline(match[2])}</h${level}>`); }
      else if (/^> /.test(line)) html.push(`<blockquote>${this.inline(line.slice(2))}</blockquote>`);
      else html.push(`<p>${this.inline(line)}</p>`);
    }
    closeList(); closeCode();
    return html.join('');
  }

  private escape(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  private inline(value: string): string {
    return value
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (_match, alt, url) => `<img src="${url}" alt="${alt}" loading="lazy">`)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
}
