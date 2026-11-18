import type { ReactNode } from 'react';
import '../../../../emr-ui/node_modules/@fontsource-variable/inter/index.css';
import '../../../../emr-ui/src/lib/foundations/emr.css';
import { RNWStyleRegistry } from './rnw-style-registry';

export const metadata = { title: 'EMR Components' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="emr-theme-light" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        <RNWStyleRegistry>{children}</RNWStyleRegistry>
      </body>
    </html>
  );
}
