import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|mjs|ts)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  // L5 anatomy outlines, served where stories resolve recipe assets.
  staticDirs: [{ from: '../../emr-controller/assets/anatomy', to: '/assets/anatomy' }],
  framework: {
    name: '@storybook/angular',
    options: {}
  }
};

export default config;
