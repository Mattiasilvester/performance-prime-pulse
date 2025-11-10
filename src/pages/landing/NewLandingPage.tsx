import { Suspense, lazy, useEffect } from 'react';
import { trackLandingVersion } from '@/services/analytics';
import { HeroSection } from '@/components/landing-new/HeroSection';
import { ProblemSection } from '@/components/landing-new/ProblemSection';
import { SolutionSection } from '@/components/landing-new/SolutionSection';

const SocialProof = lazy(() =>
  import('@/components/landing-new/SocialProof').then((mod) => ({ default: mod.SocialProof }))
);
const CTASection = lazy(() =>
  import('@/components/landing-new/CTASection').then((mod) => ({ default: mod.CTASection }))
);
const Footer = lazy(() =>
  import('@/components/landing-new/Footer').then((mod) => ({ default: mod.Footer }))
);

export function NewLandingPage() {
  useEffect(() => {
    trackLandingVersion('new');
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <SocialProof />
      </Suspense>
      <Suspense fallback={<div className="min-h-[24rem] bg-black" />}>
        <CTASection />
      </Suspense>
      <Suspense fallback={<div className="min-h-64 bg-[#212121]" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
