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
  theme: 'cosmos',
  showArrows: true,
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
          <span>Show tags</span>
          <button className="obsidian-toggle obsidian-toggle-on" aria-label="Show tags" />
        </div>
        <div className="obsidian-toggle-row">
          <span>Attachments</span>
          <button className="obsidian-toggle obsidian-toggle-on" aria-label="Attachments" />
        </div>
        <div className="obsidian-toggle-row">
          <span>Existing files only</span>
          <button className="obsidian-toggle obsidian-toggle-on" aria-label="Existing files only" />
        </div>
        <div className="obsidian-toggle-row">
          <span>Show orphans</span>
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
        <div className="obsidian-domain-list" style={{ marginTop: 8 }}>
          {domains.map(([domain, color]) => (
            <div key={domain} className="obsidian-domain-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>{DOMAIN_LABELS[domain]}</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>×</button>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: '6px', marginTop: '8px', background: 'var(--input-bg)', border: '1px solid var(--panel-border)', borderRadius: 4, color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>+ Add group</button>
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
        <div className="obsidian-toggle-row">
          <span>Synaptic pulses</span>
          <button className="obsidian-toggle obsidian-toggle-on" aria-label="Synaptic pulses" />
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
        <button style={{ width: '100%', padding: '6px', marginTop: '4px', background: 'var(--input-bg)', border: '1px solid var(--panel-border)', borderRadius: 4, color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>Animate</button>
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

      <Section title="Neural Intelligence" defaultOpen={true}>
        <div className="obsidian-toggle-row">
          <span>AI-discovered links</span>
          <button className="obsidian-toggle obsidian-toggle-on" aria-label="AI links" />
        </div>
        <div className="obsidian-toggle-row">
          <span>Semantic clusters</span>
          <button className="obsidian-toggle obsidian-toggle-on" aria-label="Clusters" />
        </div>
        <div className="obsidian-toggle-row">
          <span>Knowledge gaps</span>
          <button className="obsidian-toggle obsidian-toggle-on" aria-label="Gaps" />
        </div>
        <div className="obsidian-toggle-row">
          <span>Temporal decay</span>
          <button className="obsidian-toggle obsidian-toggle-on" aria-label="Decay" />
        </div>
      </Section>

      <Section title="AI Actions" defaultOpen={false}>
        <div style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
          Run AI analysis on the knowledge graph
        </div>
      </Section>
    </div>
  );
}
