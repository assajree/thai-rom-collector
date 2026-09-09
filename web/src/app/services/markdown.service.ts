import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  render(source: string): string {
    const escaped = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = escaped.split(/\r?\n/); let html = ''; let inCode = false;
    for (const line of lines) {
      if (line.startsWith('```')) { html += inCode ? '</code></pre>' : '<pre><code>'; inCode = !inCode; continue; }
      if (inCode) { html += `${line}\n`; continue; }
      if (!line.trim()) continue;
      if (/^### /.test(line)) html += `<h3>${line.slice(4)}</h3>`;
      else if (/^## /.test(line)) html += `<h2>${line.slice(3)}</h2>`;
      else if (/^# /.test(line)) html += `<h1>${line.slice(2)}</h1>`;
      else if (/^[-*] /.test(line)) html += `<ul><li>${this.inline(line.slice(2))}</li></ul>`;
      else if (/^> /.test(line)) html += `<blockquote>${this.inline(line.slice(2))}</blockquote>`;
      else html += `<p>${this.inline(line)}</p>`;
    }
    return html + (inCode ? '</code></pre>' : '');
  }
  private inline(value: string): string {
    return value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }
}
