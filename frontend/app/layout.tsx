import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/auth/AuthProvider";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import ThemeSync from "@/app/ThemeSync";
import "./globals.css";
import Header from "@/app/header";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "KiwiCart",
    description: "Compare grocery prices across stores and get the best shopping route.",
    icons: {
        icon: "/favicon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0&display=swap"
                />
            </head>
            <Analytics />
            <SpeedInsights />
            <body className="flex flex-col appShell shellWide">
                <ThemeSync />
                <AuthProvider>
                    <div className="appShellHeader">
                        <Header />
                    </div>
                    <div className="appShellScroll">
                        {children}
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
