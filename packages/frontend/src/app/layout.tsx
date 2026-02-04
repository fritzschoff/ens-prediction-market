import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ClientProviders } from "./client-providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 antialiased">
        <ClientProviders>
          <div className="relative flex min-h-screen flex-col">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
            <Navbar />
            <main className="flex-1 relative z-10">{children}</main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}

