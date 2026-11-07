import { ClosingCta } from "./_components/closing-cta";
import { Features } from "./_components/features";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { OpenSource } from "./_components/open-source";

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
