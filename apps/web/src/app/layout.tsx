import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ExitStorm — Community-Powered Micro-SaaS Exit Machine',
  description: 'Track contributions, analyze projects, and build toward exits.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
