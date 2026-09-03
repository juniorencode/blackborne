import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  /*
   * Stories live beside the components they document, not in this app. A story
   * that drifts from its component is worse than no story, and co-location is
   * what keeps them moving together. They are excluded from the published
   * build, so nothing here reaches a consumer.
   */
  stories: ['../../../packages/blackborne/src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: { name: '@storybook/react-vite', options: {} },

  /*
   * Off by default. Storybook's telemetry is anonymous and opt-out, but a
   * repository should not send usage data on behalf of whoever clones it. Turn
   * it on deliberately if you want to.
   */
  core: { disableTelemetry: true }
};

export default config;
