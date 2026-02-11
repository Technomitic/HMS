import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Medix | Digital Hospital Platform',
  description: 'State-of-the-art digital hospital platform. Book appointments, access records, and connect with specialists.',
  keywords: 'hospital, healthcare, digital, appointments, doctors, medical',
  openGraph: {
    title: 'Medix Digital Hospital',
    description: 'Your Health, Digitally Transformed',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}