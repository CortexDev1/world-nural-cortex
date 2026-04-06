'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  totalNodes: number;
}

export function SearchBar({ totalNodes }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="glass-panel flex items-center gap-3 px-4 py-3 transition-all duration-300 focus-within:border-[rgba(201,168,76,0.5)]">
        {/* Search Icon */}
        <svg
          className="w-5 h-5 text-gold/60 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${totalNodes} knowledge nodes...`}
          className="flex-1 bg-transparent text-text placeholder:text-muted/60 outline-none text-sm"
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-muted hover:text-text transition-colors text-xs cursor-pointer"
          >
            Clear
          </button>
        )}

        <button
          type="submit"
          className="text-xs text-noir bg-gold hover:bg-[#e8d48a] px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer"
        >
          Search
        </button>
      </div>
    </form>
  );
}
