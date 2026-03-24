import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Proximity Admin',
  description: 'Admin dashboard for the Proximity dating app',
};

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/reports', label: 'Reports' },
  { href: '/events', label: 'Events' },
  { href: '/moderation', label: 'Moderation' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0">
            <h1 className="text-xl font-bold text-primary mb-8">Proximity Admin</h1>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
