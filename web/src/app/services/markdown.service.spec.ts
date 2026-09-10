import { MarkdownService } from './markdown.service';

describe('MarkdownService', () => {
  const service = new MarkdownService();

  it('renders headings, inline styles, links, images and rules', () => {
    const html = service.render('# Title\n\n**bold** *italic* `code`\n\n[link](https://example.com)\n\n![cover](https://example.com/cover.png)\n\n---');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('<img src="https://example.com/cover.png" alt="cover" loading="lazy">');
    expect(html).toContain('<hr>');
  });

  it('renders all heading levels from h1 to h6', () => {
    const html = service.render('# one\n## two\n### three\n#### four\n##### five\n###### six');
    for (let level = 1; level <= 6; level++) expect(html).toContain(`<h${level}>`);
  });

  it('groups consecutive list items into one list', () => {
    expect(service.render('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('keeps code blocks literal and closes an unfinished block', () => {
    const html = service.render('```\n<strong>literal</strong>\n');
    expect(html).toContain('&lt;strong&gt;literal&lt;/strong&gt;');
    expect(html).toContain('</code></pre>');
  });

  it('escapes HTML and rejects unsafe image URLs', () => {
    const html = service.render('<script>alert(1)</script>\n![bad](javascript:alert(1))');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
  });
});
