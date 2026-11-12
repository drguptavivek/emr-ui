import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type {
  EmrBottomTabBarIntent,
  EmrBottomTabItem,
  EmrLoginFormIntent,
  EmrLoginFormModel,
  EmrPinPadIntent,
  EmrPinPadModel,
  EmrSearchGroup,
  EmrSheetIntent,
  EmrSyncPillIntent,
  EmrSyncPillModel,
  EmrTone,
  EmrTopBarIntent,
  EmrTopBarModel,
} from '@drguptavivek/emr-controller';
import { EmrFieldFrameComponent } from '../fields/emr-field-frame.component';

export { EmrToastComponent } from '../primitives/emr-feedback.component';

const DEFAULT_MOBILE_SHELL_LABELS = {
  pinDelete: 'Delete',
  pinSubmit: 'Submit PIN',
  pinForgot: 'Forgot PIN?',
  signIn: 'Sign in',
  signingIn: 'Signing in…',
  tabs: 'Main navigation',
  scan: 'Scan',
  dismiss: 'Dismiss',
  syncDetails: 'Sync details',
  back: 'Back',
  close: 'Close',
  closeAria: 'Close panel',
  panel: 'Panel',
  openNavigation: 'Open navigation',
  search: 'Search',
  searchPlaceholder: 'Search patients, barcodes, records',
  noResults: 'No matching results',
  searching: 'Searching…',
  userMenu: 'User menu',
};
export type EmrMobileShellLabels = typeof DEFAULT_MOBILE_SHELL_LABELS;

const TONE_GLYPH: Record<EmrTone, string> = {
  neutral: '•',
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✕',
};

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'delete', '0', 'submit'] as const;

export function moveHighlight(current: number, key: string, count: number): number {
  if (count <= 0) return -1;
  if (key === 'ArrowDown') return current < 0 || current >= count - 1 ? 0 : current + 1;
  if (key === 'ArrowUp') return current <= 0 ? count - 1 : current - 1;
  return current;
}

export function locateHighlight(sizes: readonly number[], index: number): { group: number; result: number } | null {
  let rest = index;
  for (let group = 0; group < sizes.length; group++) {
    if (rest >= 0 && rest < sizes[group]) return { group, result: rest };
    rest -= sizes[group];
  }
  return null;
}

let nextShellId = 0;

/**
 * L4 PIN pad: counts digits entered, shows error/lockout text with glyph, supports biometric & forgot actions.
 */
@Component({
  selector: 'emr-pin-pad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <div class="emr-pin">
      <h2 class="emr-pin__title">{{ m.title }}</h2>
      @if (m.prompt) {
        <p class="emr-pin__prompt">{{ m.prompt }}</p>
      }
      <div class="emr-pin__dots" role="img" [attr.aria-label]="m.digitsEntered + ' of ' + m.length + ' digits entered'">
        @for (dot of dotIndices(); track dot) {
          <span class="emr-pin__dot" [class.emr-pin__dot--filled]="dot < m.digitsEntered"></span>
        }
      </div>
      <div class="emr-pin__status">
        @if (m.error) {
          <p class="emr-pin__error" role="alert">{{ glyph('danger') }} {{ m.error }}</p>
        }
        @if (m.locked && m.lockoutMessage) {
          <p class="emr-pin__warn" role="alert">{{ glyph('warning') }} {{ m.lockoutMessage }}</p>
        }
      </div>
      <div class="emr-pin__grid">
        @for (k of keys; track k) {
          <button
            type="button"
            class="emr-pin__key"
            [class.emr-pin__key--submit]="k === 'submit'"
            [attr.aria-label]="keyLabel(k)"
            [attr.aria-disabled]="m.locked ? 'true' : null"
            (click)="onKey(k)"
          >
            <span aria-hidden="true">{{ keyGlyph(k) }}</span>
          </button>
        }
      </div>
      @if (m.biometric?.available) {
        <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'biometricRequested' })">
          {{ m.biometric!.label }}
        </button>
      }
      @if (showForgot()) {
        <button type="button" class="emr-button emr-button--ghost" (click)="intent.emit({ type: 'forgotRequested' })">
          {{ l.pinForgot }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-pin { display: grid; gap: 14px; justify-items: center; max-width: 360px; margin: 0 auto; }
    .emr-pin__title { margin: 0; font-size: var(--emr-text-xl); font-weight: var(--emr-weight-bold); text-align: center; }
    .emr-pin__prompt { margin: 0; font-size: var(--emr-text-md); color: var(--emr-text-muted); text-align: center; }
    .emr-pin__dots { display: flex; gap: 14px; padding: 6px 0; }
    .emr-pin__dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--emr-primary); background: transparent; }
    .emr-pin__dot--filled { background: var(--emr-primary); }
    .emr-pin__status { min-height: 24px; display: flex; align-items: center; justify-content: center; }
    .emr-pin__error { margin: 0; font-size: var(--emr-text-md); color: var(--emr-danger); text-align: center; }
    .emr-pin__warn { margin: 0; font-size: var(--emr-text-md); color: var(--emr-warning); text-align: center; }
    .emr-pin__grid { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .emr-pin__key {
      min-height: var(--emr-control-height);
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface);
      color: var(--emr-text);
      font-family: inherit;
      font-size: var(--emr-text-xl);
      font-weight: var(--emr-weight-medium);
      cursor: pointer;
    }
    .emr-pin__key--submit { background: var(--emr-primary-soft); }
    .emr-pin__key[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
    .emr-pin__key:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
  `],
})
export class EmrPinPadComponent {
  readonly model = input.required<EmrPinPadModel>();
  readonly showForgot = input(false);
  readonly labels = input<Partial<EmrMobileShellLabels>>({});
  readonly intent = output<EmrPinPadIntent>();

  protected readonly keys = PIN_KEYS;
  protected readonly text = computed(() => ({ ...DEFAULT_MOBILE_SHELL_LABELS, ...this.labels() }));
  protected readonly dotIndices = computed(() => Array.from({ length: this.model().length }, (_, i) => i));

  protected glyph(tone: EmrTone): string {
    return TONE_GLYPH[tone];
  }

  protected keyGlyph(k: (typeof PIN_KEYS)[number]): string {
    return k === 'delete' ? '⌫' : k === 'submit' ? '✓' : k;
  }

  protected keyLabel(k: (typeof PIN_KEYS)[number]): string {
    const l = this.text();
    return k === 'delete' ? l.pinDelete : k === 'submit' ? l.pinSubmit : k;
  }

  protected onKey(k: (typeof PIN_KEYS)[number]): void {
    if (this.model().locked) return;
    if (k === 'delete') this.intent.emit({ type: 'deleted' });
    else if (k === 'submit') this.intent.emit({ type: 'submitted' });
    else this.intent.emit({ type: 'digitPressed', digit: k });
  }
}

/**
 * L4 Login form: controlled username, local password draft emitted only on submitRequested, and busy state.
 */
@Component({
  selector: 'emr-login-form',
  standalone: true,
  imports: [EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <form class="emr-login" novalidate (submit)="$event.preventDefault(); onSubmit()">
      @if (m.title) {
        <h2 class="emr-login__title">{{ m.title }}</h2>
      }
      <emr-field-frame [controlId]="uid + '-user'" [label]="m.usernameLabel">
        <input
          class="emr-control"
          type="text"
          [id]="uid + '-user'"
          [value]="m.username"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          (input)="onUserInput($event)"
        />
      </emr-field-frame>
      <emr-field-frame [controlId]="uid + '-pass'" [label]="m.passwordLabel" [error]="m.error ?? ''">
        <input
          class="emr-control"
          type="password"
          [id]="uid + '-pass'"
          [value]="password()"
          [attr.aria-invalid]="m.error ? 'true' : null"
          autocomplete="current-password"
          (input)="onPasswordInput($event)"
        />
      </emr-field-frame>
      <button type="submit" class="emr-button">
        {{ m.busy ? l.signingIn : l.signIn }}
      </button>
    </form>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-login { display: grid; gap: 16px; max-width: 400px; }
    .emr-login__title { margin: 0; font-size: var(--emr-text-xl); font-weight: var(--emr-weight-bold); }
  `],
})
export class EmrLoginFormComponent {
  readonly model = input.required<EmrLoginFormModel>();
  readonly labels = input<Partial<EmrMobileShellLabels>>({});
  readonly intent = output<EmrLoginFormIntent>();

  protected readonly uid = `emr-login-${++nextShellId}`;
  protected readonly password = signal('');
  protected readonly text = computed(() => ({ ...DEFAULT_MOBILE_SHELL_LABELS, ...this.labels() }));

  protected onUserInput(event: Event): void {
    this.intent.emit({ type: 'usernameChanged', value: (event.target as HTMLInputElement).value });
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected onSubmit(): void {
    const m = this.model();
    if (!m.busy) {
      this.intent.emit({ type: 'submitRequested', username: m.username, password: this.password() });
    }
  }
}

/**
 * L4 Bottom tab bar with raised centre Scan button.
 */
@Component({
  selector: 'emr-bottom-tab-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let l = text();
    <nav class="emr-btb" [style.padding-bottom.px]="bottomInset()">
      <div class="emr-btb__row" role="tablist" [attr.aria-label]="l.tabs">
        @for (item of leftItems(); track item.id) {
          <button
            type="button"
            role="tab"
            class="emr-btb__tab"
            [class.emr-btb__tab--active]="item.id === activeId()"
            [attr.aria-selected]="item.id === activeId()"
            (click)="intent.emit({ type: 'tabSelected', id: item.id })"
          >
            <span>{{ item.label }}</span>
            @if (item.badge; as b) {
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}</span>
            }
          </button>
        }
        <button
          type="button"
          class="emr-btb__scan"
          [attr.aria-label]="l.scan"
          (click)="intent.emit({ type: 'scanRequested' })"
        >
          <span aria-hidden="true" class="emr-btb__scan-icon">▣</span>
          <span class="emr-btb__scan-label">{{ l.scan }}</span>
        </button>
        @for (item of rightItems(); track item.id) {
          <button
            type="button"
            role="tab"
            class="emr-btb__tab"
            [class.emr-btb__tab--active]="item.id === activeId()"
            [attr.aria-selected]="item.id === activeId()"
            (click)="intent.emit({ type: 'tabSelected', id: item.id })"
          >
            <span>{{ item.label }}</span>
            @if (item.badge; as b) {
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}</span>
            }
          </button>
        }
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-btb { border-top: 1px solid var(--emr-border); background: var(--emr-surface); }
    .emr-btb__row { display: flex; align-items: flex-end; }
    .emr-btb__tab {
      flex: 1;
      min-width: 0;
      min-height: 56px;
      padding: 6px 8px;
      border: 0;
      border-top: 3px solid transparent;
      background: transparent;
      color: var(--emr-text);
      font-family: inherit;
      font-size: var(--emr-text-sm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      cursor: pointer;
    }
    .emr-btb__tab--active {
      border-top-color: var(--emr-primary);
      color: var(--emr-primary);
      font-weight: var(--emr-weight-bold);
    }
    .emr-btb__tab:focus-visible, .emr-btb__scan:focus-visible {
      outline: 3px solid var(--emr-focus);
      outline-offset: -3px;
    }
    .emr-btb__scan {
      width: 64px;
      height: 64px;
      margin: -16px 6px 4px;
      border-radius: 50%;
      border: 1px solid var(--emr-primary);
      background: var(--emr-primary);
      color: var(--emr-primary-contrast);
      font-family: inherit;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .emr-btb__scan-icon { font-size: var(--emr-text-lg); line-height: 1; }
    .emr-btb__scan-label { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
  `],
})
export class EmrBottomTabBarComponent {
  readonly items = input.required<readonly EmrBottomTabItem[]>();
  readonly activeId = input.required<string>();
  readonly bottomInset = input(0);
  readonly labels = input<Partial<EmrMobileShellLabels>>({});
  readonly intent = output<EmrBottomTabBarIntent>();

  protected readonly text = computed(() => ({ ...DEFAULT_MOBILE_SHELL_LABELS, ...this.labels() }));
  protected readonly splitIndex = computed(() => Math.ceil(this.items().length / 2));
  protected readonly leftItems = computed(() => this.items().slice(0, this.splitIndex()));
  protected readonly rightItems = computed(() => this.items().slice(this.splitIndex()));
}

/**
 * L4 Sync status pill: glyph + label; tappable when interactive is true.
 */
@Component({
  selector: 'emr-sync-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    @if (interactive()) {
      <button
        type="button"
        class="emr-sync-pill emr-sync-pill--btn"
        [attr.data-tone]="m.tone"
        [attr.aria-label]="ariaText() + '. ' + l.syncDetails"
        (click)="intent.emit({ type: 'syncDetailsRequested' })"
      >
        <span aria-hidden="true">{{ glyph(m.tone) }}</span>
        <span>{{ m.label }}</span>
      </button>
    } @else {
      <span
        role="status"
        class="emr-sync-pill"
        [attr.data-tone]="m.tone"
        [attr.aria-label]="ariaText()"
      >
        <span aria-hidden="true">{{ glyph(m.tone) }}</span>
        <span>{{ m.label }}</span>
      </span>
    }
  `,
  styles: [`
    :host { display: inline-block; font-family: var(--emr-font-family); }
    .emr-sync-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface-soft);
      color: var(--emr-text);
      font-size: var(--emr-text-sm);
      font-weight: var(--emr-weight-bold);
    }
    .emr-sync-pill--btn {
      min-height: var(--emr-control-height);
      cursor: pointer;
      font-family: inherit;
    }
    .emr-sync-pill--btn:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    .emr-sync-pill[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); border-color: var(--emr-info); }
    .emr-sync-pill[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); border-color: var(--emr-success); }
    .emr-sync-pill[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); border-color: var(--emr-warning); }
    .emr-sync-pill[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); border-color: var(--emr-danger); }
  `],
})
export class EmrSyncPillComponent {
  readonly model = input.required<EmrSyncPillModel>();
  readonly interactive = input(false);
  readonly labels = input<Partial<EmrMobileShellLabels>>({});
  readonly intent = output<EmrSyncPillIntent>();

  protected readonly text = computed(() => ({ ...DEFAULT_MOBILE_SHELL_LABELS, ...this.labels() }));
  protected readonly ariaText = computed(() => [this.model().label, this.model().detail].filter(Boolean).join(', '));

  protected glyph(tone: EmrTone): string {
    return TONE_GLYPH[tone];
  }
}

/**
 * L4 Sheet / modal panel: side panel on wide viewports, bottom sheet on narrow viewports.
 */
@Component({
  selector: 'emr-sheet',
  standalone: true,
  imports: [CdkTrapFocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      @let l = text();
      <div class="emr-sheet-backdrop" (keydown.escape)="intent.emit({ type: 'closeRequested' })">
        <div class="emr-sheet-backdrop__scrim" aria-hidden="true" (click)="intent.emit({ type: 'closeRequested' })"></div>
        <section
          class="emr-sheet"
          role="dialog"
          aria-modal="true"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          [attr.aria-label]="title() || l.panel"
          tabindex="-1"
        >
          <header class="emr-sheet__header">
            @if (showBack()) {
              <button
                type="button"
                class="emr-button emr-button--small emr-button--ghost"
                (click)="intent.emit({ type: 'backRequested' })"
              >
                {{ l.back }}
              </button>
            }
            <h2 class="emr-sheet__title">{{ title() }}</h2>
            <button
              type="button"
              class="emr-button emr-button--small emr-button--ghost"
              [attr.aria-label]="l.closeAria"
              (click)="intent.emit({ type: 'closeRequested' })"
            >
              {{ l.close }}
            </button>
          </header>
          <div class="emr-sheet__body">
            <ng-content />
          </div>
          @if (showFooter()) {
            <footer class="emr-sheet__footer">
              <ng-content select="[emrSheetFooter]" />
            </footer>
          }
        </section>
      </div>
    }
  `,
  styles: [`
    :host { display: block; font-family: var(--emr-font-family); color: var(--emr-text); }
    .emr-sheet-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      justify-content: flex-end;
    }
    .emr-sheet-backdrop__scrim {
      position: absolute;
      inset: 0;
      background: var(--emr-text);
      opacity: 0.35;
    }
    .emr-sheet {
      position: relative;
      z-index: 1;
      width: min(480px, 100%);
      height: 100%;
      background: var(--emr-surface);
      border-left: 1px solid var(--emr-border);
      display: flex;
      flex-direction: column;
    }
    .emr-sheet__header {
      min-height: var(--emr-control-height);
      padding: 8px 12px;
      border-bottom: 1px solid var(--emr-border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .emr-sheet__title { margin: 0; flex: 1; min-width: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
    .emr-sheet__body { flex: 1; overflow-y: auto; padding: 12px; }
    .emr-sheet__footer { padding: 12px; border-top: 1px solid var(--emr-border); display: flex; flex-wrap: wrap; gap: 8px; }
  `],
})
export class EmrSheetComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly showBack = input(false);
  readonly showFooter = input(false);
  readonly labels = input<Partial<EmrMobileShellLabels>>({});
  readonly intent = output<EmrSheetIntent>();

  protected readonly text = computed(() => ({ ...DEFAULT_MOBILE_SHELL_LABELS, ...this.labels() }));
}

/**
 * L4 Top-bar search combobox with grouped results overlay and keyboard highlight navigation.
 */
@Component({
  selector: 'emr-top-bar-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let l = text();
    <div class="emr-tbs">
      <div class="emr-tbs__field">
        <input
          class="emr-control"
          type="text"
          role="combobox"
          [attr.aria-label]="l.search"
          [attr.aria-expanded]="showing()"
          [attr.aria-controls]="uid + '-list'"
          aria-autocomplete="list"
          [attr.aria-activedescendant]="activeOptionId()"
          autocomplete="off"
          [value]="query()"
          [placeholder]="l.searchPlaceholder"
          (input)="onQueryInput($event)"
          (focus)="intent.emit({ type: 'searchOpenRequested' })"
          (keydown)="onKeyDown($event)"
        />
        @if (showing()) {
          <div class="emr-tbs__overlay" [id]="uid + '-list'" role="listbox" [attr.aria-label]="l.search">
            @if (loading()) {
              <div class="emr-tbs__status">{{ l.searching }}</div>
            } @else if (totalResults() === 0) {
              <div class="emr-tbs__status">{{ l.noResults }}</div>
            }
            @for (g of groups(); track g.id) {
              @if (g.results.length > 0) {
                <div role="group" [attr.aria-label]="g.label">
                  <div class="emr-tbs__group-title">{{ g.label }}</div>
                  @for (r of g.results; track r.id) {
                    @let idx = flatIndexFor(g.id, r.id);
                    @let active = idx === activeHighlight();
                    <button
                      type="button"
                      role="option"
                      class="emr-tbs__option"
                      [class.emr-tbs__option--active]="active"
                      [id]="uid + '-o' + idx"
                      [attr.aria-selected]="active"
                      (click)="intent.emit({ type: 'resultSelected', groupId: g.id, id: r.id })"
                    >
                      <span class="emr-tbs__option-main">
                        <strong>{{ r.label }}</strong>
                        @if (r.sub) { <span class="emr-tbs__option-sub">{{ r.sub }}</span> }
                      </span>
                      @if (r.badge; as b) {
                        <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}</span>
                      }
                    </button>
                  }
                </div>
              }
            }
          </div>
        }
      </div>
      <button
        type="button"
        class="emr-button emr-button--outline"
        [disabled]="loading()"
        (click)="intent.emit({ type: 'queryChanged', query: query() })"
      >
        {{ loading() ? l.searching : l.search }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-tbs { display: flex; align-items: center; gap: 8px; }
    .emr-tbs__field { flex: 1; min-width: 0; position: relative; }
    .emr-tbs__overlay {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      z-index: 1000;
      max-height: 320px;
      overflow-y: auto;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
    }
    .emr-tbs__status { padding: 12px; font-size: var(--emr-text-sm); color: var(--emr-text-muted); }
    .emr-tbs__group-title {
      padding: 8px 12px 4px;
      font-size: var(--emr-text-xs);
      font-weight: var(--emr-weight-bold);
      color: var(--emr-text-muted);
      background: var(--emr-surface-soft);
    }
    .emr-tbs__option {
      width: 100%;
      min-height: var(--emr-control-height);
      padding: 8px 12px;
      border: 0;
      background: var(--emr-surface);
      color: var(--emr-text);
      font-family: inherit;
      font-size: var(--emr-text-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      text-align: left;
      cursor: pointer;
    }
    .emr-tbs__option--active { background: var(--emr-primary-soft); }
    .emr-tbs__option:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: -3px; }
    .emr-tbs__option-main { display: grid; gap: 2px; flex: 1; min-width: 0; }
    .emr-tbs__option-sub { font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
  `],
})
export class EmrTopBarSearchComponent {
  readonly query = input('');
  readonly open = input(false);
  readonly loading = input(false);
  readonly groups = input<readonly EmrSearchGroup[]>([]);
  readonly labels = input<Partial<EmrMobileShellLabels>>({});
  readonly intent = output<EmrTopBarIntent>();

  protected readonly uid = `emr-tbs-${++nextShellId}`;
  protected readonly highlight = signal(-1);
  protected readonly text = computed(() => ({ ...DEFAULT_MOBILE_SHELL_LABELS, ...this.labels() }));
  protected readonly sizes = computed(() => this.groups().map((g) => g.results.length));
  protected readonly totalResults = computed(() => this.sizes().reduce((a, b) => a + b, 0));
  protected readonly activeHighlight = computed(() => {
    const h = this.highlight();
    return h < this.totalResults() ? h : -1;
  });
  protected readonly showing = computed(() => {
    const hasContent = this.totalResults() > 0 || this.loading() || this.query().trim() !== '';
    return this.open() && hasContent;
  });
  protected readonly activeOptionId = computed(() => {
    const a = this.activeHighlight();
    return a >= 0 ? `${this.uid}-o${a}` : null;
  });

  protected flatIndexFor(groupId: string, resultId: string): number {
    let idx = 0;
    for (const g of this.groups()) {
      for (const r of g.results) {
        if (g.id === groupId && r.id === resultId) return idx;
        idx++;
      }
    }
    return -1;
  }

  protected onQueryInput(event: Event): void {
    this.highlight.set(-1);
    this.intent.emit({ type: 'queryChanged', query: (event.target as HTMLInputElement).value });
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.open()) {
        event.preventDefault();
        this.intent.emit({ type: 'searchCloseRequested' });
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const loc = locateHighlight(this.sizes(), this.activeHighlight());
      if (loc) {
        const g = this.groups()[loc.group];
        const r = g.results[loc.result];
        this.intent.emit({ type: 'resultSelected', groupId: g.id, id: r.id });
      } else {
        this.intent.emit({ type: 'queryChanged', query: this.query() });
      }
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) {
        this.intent.emit({ type: 'searchOpenRequested' });
        return;
      }
      this.highlight.update((h) => moveHighlight(h < this.totalResults() ? h : -1, event.key, this.totalResults()));
    }
  }
}

/**
 * L4 Top bar: nav toggle, application title, global EmrTopBarSearch, and user menu trigger.
 */
@Component({
  selector: 'emr-top-bar',
  standalone: true,
  imports: [EmrTopBarSearchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <header class="emr-top-bar" role="banner">
      @if (m.showNavToggle) {
        <button
          type="button"
          class="emr-button emr-button--small emr-button--ghost"
          [attr.aria-label]="l.openNavigation"
          (click)="intent.emit({ type: 'navToggleRequested' })"
        >
          ☰
        </button>
      }
      @if (m.title) {
        <h1 class="emr-top-bar__title">{{ m.title }}</h1>
      }
      <div class="emr-top-bar__search">
        <emr-top-bar-search
          [query]="m.search.query"
          [open]="m.search.open"
          [loading]="!!m.search.loading"
          [groups]="m.search.groups"
          [labels]="labels()"
          (intent)="intent.emit($event)"
        />
      </div>
      <button
        type="button"
        class="emr-button emr-button--outline"
        [attr.aria-label]="l.userMenu"
        (click)="intent.emit({ type: 'menuRequested' })"
      >
        {{ m.userLabel ?? l.userMenu }}
      </button>
    </header>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-top-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--emr-border);
      background: var(--emr-surface);
    }
    .emr-top-bar__title { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
    .emr-top-bar__search { flex: 1 1 260px; max-width: 560px; }
  `],
})
export class EmrTopBarComponent {
  readonly model = input.required<EmrTopBarModel>();
  readonly labels = input<Partial<EmrMobileShellLabels>>({});
  readonly intent = output<EmrTopBarIntent>();

  protected readonly text = computed(() => ({ ...DEFAULT_MOBILE_SHELL_LABELS, ...this.labels() }));
}
