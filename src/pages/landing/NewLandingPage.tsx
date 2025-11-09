import { useEffect } from 'react';
import { trackLandingVersion } from '@/services/analytics';
import { HeroSection } from '@/components/landing-new/HeroSection';
import { ProblemSection } from '@/components/landing-new/ProblemSection';
import { SolutionSection } from '@/components/landing-new/SolutionSection';
import { SocialProof } from '@/components/landing-new/SocialProof';
import { CTASection } from '@/components/landing-new/CTASection';
import { Footer } from '@/components/landing-new/Footer';

export function NewLandingPage() {
  useEffect(() => {
    trackLandingVersion('new');
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <SocialProof />
      <CTASection />
      <Footer />
    </div>
  );
}
