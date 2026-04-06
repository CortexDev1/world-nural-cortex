'use client';

import { useState } from 'react';
import type { Domain } from '@/lib/types';
import { DOMAIN_COLORS, DOMAIN_LABELS } from '@/lib/types';
import { THEMES, type ThemeId } from '@/lib/themes';

export interface GraphSettingsValues {
  theme: ThemeId;
  showArrows: boolean;
  textFadeThreshold: number;
  nodeSize: number;
  linkThickness: number;
  centerForce: number;
  repelForce: number;
  linkForce: number;
  linkDistance: number;
  colorBy: 'domain' | 'type' | 'none';
  showOrphans: boolean;
}

export const DEFAULT_SETTINGS: GraphSettingsValues = {
  theme: 'dark',
  showArrows: false,
  textFadeThreshold: 1.0,
  nodeSize: 4,
  linkThickness: 1,
  centerForce: 50,
  repelForce: 120,
  linkForce: 30,
  linkDistance: 80,
  colorBy: 'domain',
  showOrphans: true,
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="obsidian-section">
      <button
        onClick={() => setOpen((v) => !v)}
        className="obsidian-section-header"
      >
        <span>{title}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        >
          <path d="M4 2l4 4-4 4" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="obsidian-section-body">{children}</div>}
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <div className="obsidian-slider-row">
      <div className="obsidian-slider-label">
        <span>{label}</span>
        <span className="obsidian-slider-value">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="obsidian-slider"
      />
    </div>
  );
}

interface GraphSettingsProps {
  settings: GraphSettingsValues;
  onChange: (patch: Partial<GraphSettingsValues>) => void;
}

export function GraphSettings({ settings, onChange }: GraphSettingsProps) {
  const domains = Object.entries(DOMAIN_COLORS) as [Domain, string][];

  return (
    <div className="obsidian-panel-inner">
      <Section title="Theme" defaultOpen={true}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {(Object.keys(THEMES) as ThemeId[]).map((tid) => (
            <button
              key={tid}
              onClick={() => onChange({ theme: tid })}
              style={{
                padding: '8px 0',
                borderRadius: '6px',
                border: settings.theme === tid ? '1px solid #888' : '1px solid transparent',
                background: THEMES[tid].canvasBg,
                color: THEMES[tid].textPrimary,
                fontSize: '11px',
                fontWeight: settings.theme === tid ? 600 : 400,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {THEMES[tid].label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Filters">
        <div className="obsidian-toggle-row">
          <span>Orphans</span>
          <button
            className={`obsidian-toggle ${settings.showOrphans ? 'obsidian-toggle-on' : ''}`}
            onClick={() => onChange({ showOrphans: !settings.showOrphans })}
            aria-label="Toggle orphans"
          />
        </div>
      </Section>

      <Section title="Groups">
        <div className="obsidian-label">Color by</div>
        <div className="obsidian-radio-group">
          {(['domain', 'type', 'none'] as const).map((opt) => (
            <button
              key={opt}
              className={`obsidian-radio-btn ${settings.colorBy === opt ? 'obsidian-radio-active' : ''}`}
              onClick={() => onChange({ colorBy: opt })}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        <div className="obsidian-domain-list">
          {domains.map(([domain, color]) => (
            <div key={domain} className="obsidian-domain-row">
              <span className="obsidian-domain-dot" style={{ background: color }} />
              <span className="obsidian-domain-name">{DOMAIN_LABELS[domain]}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Display">
        <div className="obsidian-toggle-row">
          <span>Arrows</span>
          <button
            className={`obsidian-toggle ${settings.showArrows ? 'obsidian-toggle-on' : ''}`}
            onClick={() => onChange({ showArrows: !settings.showArrows })}
            aria-label="Toggle arrows"
          />
        </div>
        <SliderRow
          label="Text fade threshold"
          value={settings.textFadeThreshold}
          min={0}
          max={5}
          step={0.1}
          onChange={(v) => onChange({ textFadeThreshold: v })}
        />
        <SliderRow
          label="Node size"
          value={settings.nodeSize}
          min={1}
          max={10}
          step={0.5}
          onChange={(v) => onChange({ nodeSize: v })}
        />
        <SliderRow
          label="Link thickness"
          value={settings.linkThickness}
          min={0.1}
          max={3}
          step={0.1}
          onChange={(v) => onChange({ linkThickness: v })}
        />
      </Section>

      <Section title="Forces">
        <SliderRow
          label="Center force"
          value={settings.centerForce}
          min={0}
          max={100}
          step={1}
          onChange={(v) => onChange({ centerForce: v })}
        />
        <SliderRow
          label="Repel force"
          value={settings.repelForce}
          min={0}
          max={500}
          step={5}
          onChange={(v) => onChange({ repelForce: v })}
        />
        <SliderRow
          label="Link force"
          value={settings.linkForce}
          min={0}
          max={100}
          step={1}
          onChange={(v) => onChange({ linkForce: v })}
        />
        <SliderRow
          label="Link distance"
          value={settings.linkDistance}
          min={10}
          max={300}
          step={5}
          onChange={(v) => onChange({ linkDistance: v })}
        />
      </Section>
    </div>
  );
}
