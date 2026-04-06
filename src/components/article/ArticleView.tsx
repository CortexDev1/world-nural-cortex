'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { DOMAIN_COLORS, DOMAIN_LABELS, type Domain } from '@/lib/types';

interface CrossRef {
  id: string;
  label: string;
  domain: Domain;
}

interface ArticleViewProps {
  id: string;
  title: string;
  description?: string;
  content?: string;
  domain: Domain;
  tags?: string[];
  wordCount?: number;
  crossReferences?: CrossRef[];
  date?: string;
  itemType?: string;
}

export function ArticleView({
  id: _id,
  title,
  description,
  content,
  domain,
  tags = [],
  wordCount,
  crossReferences = [],
  date,
  itemType = 'skill',
}: ArticleViewProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const color = DOMAIN_COLORS[domain];
  const domainLabel = DOMAIN_LABELS[domain];

  useEffect(() => {
    if (!content) return;
    const raw = marked.parse(content) as string;
    const clean = DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'ul', 'ol', 'li', 'blockquote',
        'strong', 'em', 'code', 'pre', 'hr',
        'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'br', 'span',
      ],
      ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'target', 'rel'],
    });
    setHtmlContent(clean);
  }, [content]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-muted mb-8">
        <Link href="/" className="hover:text-gold transition-colors">Home</Link>
        <span>/</span>
        <Link href="/explore" className="hover:text-gold transition-colors">Explore</Link>
        <span>/</span>
        <Link href={`/explore/${domain}`} className="hover:text-gold transition-colors" style={{ color }}>
          {domainLabel}
        </Link>
        <span>/</span>
        <span className="text-text truncate max-w-[200px]">{title}</span>
      </nav>

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
            {domainLabel}
          </span>
          <span className="text-xs text-muted uppercase tracking-wider">{itemType}</span>
          {wordCount && <span className="text-xs text-muted">{wordCount.toLocaleString()} words</span>}
          {date && <span className="text-xs text-muted font-mono">{date}</span>}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-4 leading-tight">{title}</h1>
        {description && <p className="text-muted leading-relaxed text-lg">{description}</p>}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {tags.map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-full glass-panel text-muted">{tag}</span>
          ))}
        </div>
      )}

      {htmlContent ? (
        <div
          className="prose-nural mb-12"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : description ? (
        <div className="glass-panel p-6 mb-12">
          <p className="text-muted leading-relaxed">{description}</p>
        </div>
      ) : null}

      {crossReferences.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
            Cross-References
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {crossReferences.map((ref) => (
              <Link key={ref.id} href={`/article/${ref.id}`} className="glass-panel p-4 flex items-center gap-3 transition-all duration-200 hover:border-gold/30">
                <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: DOMAIN_COLORS[ref.domain] }} />
                <span className="text-sm text-text truncate">{ref.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
