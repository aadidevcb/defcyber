import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "System Monitor Dashboard",
  description: "Secure dashboard to manage server features and system control.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col ">
          <header className="p-4 border-b text-teal-50 font-semibold bg-gray-950">System Monitor</header>
          <main className="flex-grow p-6">{children}</main>
          <footer className="p-4 text-center text-sm text-white bg-gray-950">© {new Date().getFullYear()} HackSky</footer>
        </div>
      </body>
    </html>
  );
}
