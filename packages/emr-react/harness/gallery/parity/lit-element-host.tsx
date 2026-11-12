'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useEmrTheme } from '../../../src';

interface LitBundleModule {
  registerAllEmrElements?: () => void;
}

let bundlePromise: Promise<void> | null = null;

export function resolveSitePublicUrl(assetPath: string): string {
  if (typeof window === 'undefined') return assetPath;
  const { origin, pathname } = window.location;
  const rootPath = pathname.replace(/\/(gallery|clinical-notes)\/?$/, '/').replace(/\/?$/, '/');
  return `${origin}${rootPath}${assetPath.replace(/^\.?\//, '')}`;
}

export function ensureEmrElementsRegistered(): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (!bundlePromise) {
    const bundleUrl = resolveSitePublicUrl('lit/emr-elements.bundle.js');
    bundlePromise = (async () => {
      const importUrl = new Function('u', 'return import(u)') as (url: string) => Promise<LitBundleModule>;
      const mod = await importUrl(bundleUrl);
      if (typeof mod.registerAllEmrElements === 'function') {
        mod.registerAllEmrElements();
      }
    })().catch((err: unknown) => {
      bundlePromise = null;
      throw err;
    });
  }
  return bundlePromise;
}

export interface LitElementHostProps {
  tag: string;
  props?: Record<string, unknown>;
  attrs?: Record<string, string | boolean | undefined>;
  events?: Record<string, (detail: unknown, event: CustomEvent<unknown>) => void>;
  slotHtml?: string;
}

/**
 * Mounts a live `@drguptavivek/emr-elements` custom element (`<emr-*>`) on web,
 * keeping JS properties, HTML attributes, light-DOM slotted markup, and
 * CustomEvent listeners synchronized with React state.
 */
export function LitElementHost({ tag, props, attrs, events, slotHtml }: LitElementHostProps) {
  const t = useEmrTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const elRef = useRef<HTMLElement | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    Platform.OS === 'web' ? 'loading' : 'ready',
  );
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    ensureEmrElementsRegistered()
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Create custom element & attach stable CustomEvent delegators when `tag` or `status` changes
  const eventNamesKey = Object.keys(events ?? {}).sort().join(',');

  useEffect(() => {
    if (Platform.OS !== 'web' || status !== 'ready') return;
    const host = containerRef.current;
    if (!host) return;

    host.innerHTML = '';
    const el = document.createElement(tag);
    el.style.display = 'block';
    el.style.width = '100%';
    elRef.current = el;

    const names = eventNamesKey ? eventNamesKey.split(',') : [];
    const removers: Array<() => void> = [];
    for (const eventName of names) {
      const listener = (ev: Event) => {
        const handler = eventsRef.current?.[eventName];
        if (!handler) return;
        const customEv = ev as CustomEvent<unknown>;
        handler(customEv.detail, customEv);
      };
      el.addEventListener(eventName, listener);
      removers.push(() => el.removeEventListener(eventName, listener));
    }

    if (slotHtml !== undefined) {
      el.innerHTML = slotHtml;
    }
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === false) el.removeAttribute(k);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        (el as unknown as Record<string, unknown>)[k] = v;
      }
    }

    host.appendChild(el);

    return () => {
      for (const off of removers) off();
      if (el.parentNode === host) host.removeChild(el);
      if (elRef.current === el) elRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, status, eventNamesKey]);

  // Sync JS properties, attributes, and slotted HTML whenever React re-renders
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (slotHtml !== undefined && el.innerHTML !== slotHtml) {
      el.innerHTML = slotHtml;
    }
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === false) el.removeAttribute(k);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        (el as unknown as Record<string, unknown>)[k] = v;
      }
    }
  }, [props, attrs, slotHtml, status]);

  if (Platform.OS !== 'web') {
    return (
      <View style={{ padding: 12, borderWidth: 1, borderColor: t.border, borderRadius: 8, backgroundColor: t.surfaceSoft }}>
        <Text style={{ color: t.textMuted, fontSize: t.textSm }}>
          Lit Web Components (`&lt;{tag}&gt;`) run in the Web DOM (`pnpm site`).
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={{ padding: 12, borderWidth: 1, borderColor: t.danger, borderRadius: 8, backgroundColor: t.dangerSoft }}>
        <Text style={{ color: t.danger, fontSize: t.textSm, fontWeight: '600' }}>
          Could not load ./lit/emr-elements.bundle.js: {errorMsg}
        </Text>
      </View>
    );
  }

  return createElement('div', {
    ref: containerRef,
    'data-parity-lit-host': tag,
    style: { width: '100%' },
  });
}
