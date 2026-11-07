import type { Metadata } from "next";

/** Everything under /dashboard is private to its signed-in owner: keep it out of search results. */
export const metadata: Metadata = {
  robots: { index: false },
};

export default function DashboardRootLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return children;
}
