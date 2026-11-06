import { ClosingCta } from "@/components/marketing/closing-cta";
import { Features } from "@/components/marketing/features";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { OpenSource } from "@/components/marketing/open-source";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <OpenSource />
      <ClosingCta />
    </>
  );
}
