import AssistantSection from '@/components/landing/AssistantSection'
import CTASection from '@/components/landing/CTASection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import Footer from '@/components/landing/Footer'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Navbar from '@/components/landing/Navbar'
import ProblemSection from '@/components/landing/ProblemSection'
import SolutionSection from '@/components/landing/SolutionSection'

export default function Landing() {
  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <AssistantSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
