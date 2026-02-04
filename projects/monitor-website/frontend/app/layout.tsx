import type { Metadata } from 'next';
import './globals.css';
import SidebarLayout from '@/components/SidebarLayout';

export const metadata: Metadata = {
  title: 'Monitor Website - Dashboard',
  description: 'Website Monitoring Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-background">
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
