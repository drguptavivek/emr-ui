import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  EmrBottomTabItem,
  EmrLoginFormModel,
  EmrPinPadModel,
  EmrSyncPillModel,
  EmrToastModel,
  EmrTopBarModel,
} from '@drguptavivek/emr-controller';
import {
  EmrBottomTabBarComponent,
  EmrLoginFormComponent,
  EmrPinPadComponent,
  EmrSheetComponent,
  EmrSyncPillComponent,
  EmrToastComponent,
  EmrTopBarComponent,
  EmrTopBarSearchComponent,
} from '../domain/emr-mobile-and-web-shell.component';

const meta: Meta = {
  title: 'EMR / Shell & Auth',
  decorators: [
    moduleMetadata({
      imports: [
        EmrPinPadComponent,
        EmrLoginFormComponent,
        EmrBottomTabBarComponent,
        EmrSyncPillComponent,
        EmrToastComponent,
        EmrSheetComponent,
        EmrTopBarSearchComponent,
        EmrTopBarComponent,
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'L4 Mobile & Web Shell components: EmrPinPad, EmrLoginForm, EmrBottomTabBar, EmrSyncPill, EmrToast, EmrSheet, EmrTopBarSearch, and EmrTopBar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const pinModel: EmrPinPadModel = {
  mode: 'unlock',
  title: 'Unlock workstation',
  prompt: 'Enter your 4-digit clinical PIN',
  length: 4,
  digitsEntered: 2,
  biometric: { label: 'Use fingerprint', available: true },
};

export const PinPadDefault: Story = {
  render: () => ({
    props: { model: pinModel },
    template: `<div class="emr-story-surface"><emr-pin-pad [model]="model" [showForgot]="true" /></div>`,
  }),
};

const loginModel: EmrLoginFormModel = {
  title: 'Sign in to EMR',
  usernameLabel: 'Staff ID or username',
  passwordLabel: 'Password',
  username: 'dr.patel',
};

export const LoginFormDefault: Story = {
  render: () => ({
    props: { model: loginModel },
    template: `<div class="emr-story-surface"><emr-login-form [model]="model" /></div>`,
  }),
};

const tabs: EmrBottomTabItem[] = [
  { id: 'queue', label: 'Queue', badge: { label: '8', tone: 'info' } },
  { id: 'patients', label: 'Patients' },
  { id: 'drafts', label: 'Drafts', badge: { label: '2', tone: 'warning' } },
  { id: 'profile', label: 'Profile' },
];

export const BottomTabBarDefault: Story = {
  render: () => ({
    props: { items: tabs },
    template: `<div class="emr-story-surface" style="padding-top: 24px"><emr-bottom-tab-bar [items]="items" activeId="queue" /></div>`,
  }),
};

const syncModel: EmrSyncPillModel = {
  label: 'Synced 2m ago',
  tone: 'success',
  detail: 'All offline records uploaded',
};

export const SyncPillDefault: Story = {
  render: () => ({
    props: { model: syncModel },
    template: `<div class="emr-story-surface"><emr-sync-pill [model]="model" [interactive]="true" /></div>`,
  }),
};

const toastModel: EmrToastModel = {
  id: 't-1',
  tone: 'success',
  message: 'Spectacle prescription saved to offline queue.',
  actionLabel: 'Undo',
};

export const ToastDefault: Story = {
  render: () => ({
    props: { model: toastModel },
    template: `<div class="emr-story-surface"><emr-toast [model]="model" /></div>`,
  }),
};

export const SheetOpen: Story = {
  render: () => ({
    template: `
      <div class="emr-story-surface" style="min-height: 280px">
        <emr-sheet [open]="true" title="Patient details" [showBack]="true">
          <p style="margin: 0">Projected sheet body content.</p>
        </emr-sheet>
      </div>
    `,
  }),
};

const topBarModel: EmrTopBarModel = {
  title: 'RPC Eye Care EMR',
  showNavToggle: true,
  userLabel: 'Dr. S. Patel',
  search: {
    query: '17-26',
    open: false,
    groups: [
      {
        id: 'patients',
        label: 'Patients',
        results: [
          {
            id: 'p-1',
            label: 'Test Patient A (64 y · F)',
            sub: 'PEC 17-26-000123',
            badge: { label: 'Verified', tone: 'success' },
          },
        ],
      },
    ],
  },
};

export const TopBarDefault: Story = {
  render: () => ({
    props: { model: topBarModel },
    template: `<div class="emr-story-surface"><emr-top-bar [model]="model" /></div>`,
  }),
};

export const TopBarSearchOpen: Story = {
  render: () => ({
    props: { groups: topBarModel.search.groups },
    template: `
      <div class="emr-story-surface" style="min-height: 220px">
        <emr-top-bar-search query="17-26" [open]="true" [groups]="groups" />
      </div>
    `,
  }),
};
