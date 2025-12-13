import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.balance.app',
  appName: 'Balance',
  webDir: 'out',
  server: {
    // TODO: Replace with your actual production URL
    url: 'https://task-tracker-v6xe.vercel.app',
    cleartext: true
  }
};

export default config;