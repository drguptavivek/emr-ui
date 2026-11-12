'use client';

import { useEffect, useId, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import { SvgIcon } from './icons';
import { webProps } from './l1-interactive-shared';
import { useEmrLabels } from './labels';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

// ---------------------------------------------------------------------------
// 10. EmrDialog
// ---------------------------------------------------------------------------

export function EmrDialog({
  open,
  title,
  description,
  size = 'md',
  role = 'dialog',
  dismissible = true,
  headingId,
  footer,
  children,
  onCloseRequested,
}: {
  open: boolean;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  role?: 'dialog' | 'alertdialog';
  dismissible?: boolean;
  headingId?: string;
  footer?: ReactNode;
  children?: ReactNode;
  onCloseRequested: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const resolvedHeadingId = headingId ?? `${generatedId}-title`;
  const descId = `${generatedId}-desc`;
  const closeRef = useRef(onCloseRequested);
  closeRef.current = onCloseRequested;

  useEffect(() => {
    if (!open || !dismissible || Platform.OS !== 'web') return;
    const g = globalThis as {
      addEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
      removeEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
    };
    const onKey = (e: { key?: string }) => {
      if (e.key === 'Escape') closeRef.current();
    };
    g.addEventListener?.('keydown', onKey);
    return () => g.removeEventListener?.('keydown', onKey);
  }, [open, dismissible]);

  if (!open) return null;

  const isFullscreen = size === 'fullscreen';
  const maxWidth = size === 'sm' ? 400 : size === 'lg' ? 760 : 560;

  return (
    <Modal
      visible={open}
      transparent={!isFullscreen}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (dismissible) onCloseRequested();
      }}
    >
      <Pressable
        aria-label={dismissible ? labels.close : undefined}
        disabled={!dismissible}
        onPress={() => {
          if (dismissible) onCloseRequested();
        }}
        style={[
          styles.dialogBackdrop,
          isFullscreen && { padding: 0, backgroundColor: t.surface },
        ]}
      >
        <Pressable
          {...(webProps({
            role,
            'aria-modal': true,
            'aria-labelledby': resolvedHeadingId,
            'aria-describedby': description ? descId : undefined,
          }) as object)}
          accessible
          accessibilityLabel={title}
          onPress={() => undefined}
          style={[
            isFullscreen ? styles.dialogFullscreen : [styles.dialogCard, { maxWidth }],
            {
              backgroundColor: t.surface,
              borderColor: t.border,
            },
          ]}
        >
          <View style={[styles.dialogHeader, { borderBottomColor: t.border }]}>
            <View style={styles.dialogTitleCol}>
              <Text
                role="heading"
                nativeID={resolvedHeadingId}
                style={{
                  color: t.text,
                  fontSize: t.textLg,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: fontFamily(t),
                }}
              >
                {title}
              </Text>
              {description ? (
                <Text
                  nativeID={descId}
                  style={{
                    color: t.textMuted,
                    fontSize: t.textSm,
                    fontFamily: fontFamily(t),
                  }}
                >
                  {description}
                </Text>
              ) : null}
            </View>
            {dismissible ? (
              <Pressable
                role="button"
                aria-label={labels.close}
                onPress={onCloseRequested}
                style={({ pressed, focused }: PressState) => [
                  styles.closeBtn,
                  focusRing(t, focused),
                  {
                    minWidth: 44,
                    minHeight: 44,
                    backgroundColor: pressed ? t.surfaceRaised : 'transparent',
                  },
                ]}
              >
                <SvgIcon name="close" size={18} color={t.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <ScrollView style={styles.dialogBodyScroll} contentContainerStyle={styles.dialogBody}>
            {children}
          </ScrollView>
          {footer ? (
            <View style={[styles.dialogFooter, { borderTopColor: t.border, backgroundColor: t.surfaceSoft }]}>
              {footer}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// 11. EmrPopover
// ---------------------------------------------------------------------------

export function EmrPopover({
  open,
  label = 'Popover',
  align = 'start',
  trigger,
  children,
  onOpenChange,
}: {
  open: boolean;
  label?: string;
  align?: 'start' | 'end';
  trigger: ReactNode;
  children?: ReactNode;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const { width: winW, height: winH } = useWindowDimensions();
  const anchorRef = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const onOpenRef = useRef(onOpenChange);
  onOpenRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return;
    if (anchorRef.current && typeof anchorRef.current.measureInWindow === 'function') {
      anchorRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) setAnchor({ x, y, width, height });
        else setAnchor(null);
      });
    }
    if (Platform.OS !== 'web') return;
    const g = globalThis as {
      addEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
      removeEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
    };
    const onKey = (e: { key?: string }) => {
      if (e.key === 'Escape') onOpenRef.current(false);
    };
    g.addEventListener?.('keydown', onKey);
    return () => g.removeEventListener?.('keydown', onKey);
  }, [open]);

  const popoverW = Math.min(340, Math.max(220, winW - 24));
  const anchored = Boolean(anchor && winW >= 440);
  const rawLeft = anchor ? (align === 'end' ? anchor.x + anchor.width - popoverW : anchor.x) : 12;
  const left = Math.max(12, Math.min(rawLeft, winW - popoverW - 12));
  const flipUp = Boolean(anchor && anchor.y + anchor.height + 240 > winH && anchor.y > 240);
  const top = anchor ? (flipUp ? Math.max(12, anchor.y - 220) : anchor.y + anchor.height + 6) : 64;

  return (
    <View ref={anchorRef} collapsable={false} style={styles.popoverTriggerWrap}>
      {trigger}
      {open ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => onOpenChange(false)}
        >
          <Pressable
            aria-label={labels.close}
            onPress={() => onOpenChange(false)}
            style={anchored ? styles.popoverAnchoredBackdrop : styles.dialogBackdrop}
          >
            <Pressable
              {...(webProps({ role: 'dialog', 'aria-label': label }) as object)}
              accessible
              accessibilityLabel={label}
              onPress={() => undefined}
              style={[
                anchored
                  ? [
                      styles.popoverCardAnchored,
                      {
                        left,
                        top,
                        width: popoverW,
                      },
                    ]
                  : styles.popoverCardSheet,
                { backgroundColor: t.surface, borderColor: t.border },
              ]}
            >
              {children}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 12. EmrTooltip
// ---------------------------------------------------------------------------

export function EmrTooltip({
  content,
  controlId,
  disabled,
  children,
}: {
  content: string;
  controlId?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const tipId = controlId ?? `${generatedId}-tooltip`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const g = globalThis as {
      addEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
      removeEventListener?: (type: string, fn: (e: { key?: string }) => void) => void;
    };
    const onKey = (e: { key?: string }) => {
      if (e.key === 'Escape') setVisible(false);
    };
    g.addEventListener?.('keydown', onKey);
    return () => g.removeEventListener?.('keydown', onKey);
  }, [visible]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const hoverHandlers =
    Platform.OS === 'web'
      ? {
          onMouseEnter: () => setVisible(true),
          onMouseLeave: () => setVisible(false),
          onFocus: () => setVisible(true),
          onBlur: () => setVisible(false),
          'aria-describedby': visible ? tipId : undefined,
        }
      : null;

  return (
    <View
      {...(hoverHandlers as object)}
      style={[styles.tooltipWrap, visible ? styles.tooltipWrapOpen : undefined]}
    >
      {children}
      {visible ? (
        <View
          pointerEvents="none"
          nativeID={tipId}
          {...(webProps({ role: 'tooltip' }) as object)}
          style={[
            styles.tooltipBubble,
            {
              backgroundColor: t.text,
              borderColor: t.border,
            },
          ]}
        >
          <Text
            style={{
              color: t.surface,
              fontSize: t.textXs,
              fontFamily: fontFamily(t),
              fontWeight: fontWeight(t.weightMedium),
            }}
          >
            {content}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dialogBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  dialogCard: {
    width: '100%',
    maxHeight: '88%',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  dialogFullscreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dialogTitleCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  closeBtn: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBodyScroll: {
    flexShrink: 1,
  },
  dialogBody: {
    padding: 18,
    gap: 12,
  },
  dialogFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  popoverTriggerWrap: {
    alignSelf: 'flex-start',
  },
  popoverAnchoredBackdrop: {
    flex: 1,
  },
  popoverCardAnchored: {
    position: 'absolute',
    maxHeight: 320,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  popoverCardSheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  tooltipWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  tooltipWrapOpen: {
    zIndex: 50,
  },
  tooltipBubble: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 6,
    maxWidth: 260,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    zIndex: 50,
  },
});
