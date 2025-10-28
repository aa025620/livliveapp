
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fourfs.livlive',
  appName: "Liv'Live",
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
