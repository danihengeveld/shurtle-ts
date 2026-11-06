import { NotFoundContent } from "@/components/marketing/not-found-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

export default function NotFound() {
  return <NotFoundContent />;
}
