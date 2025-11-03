// Layout provides Header/Footer
import { useState } from 'react'
import DonationModal from '../components/modals/DonationModal'
import SubscribeModal from '../components/modals/SubscribeModal'

export default function AboutPage() {
  const [isDonationOpen, setDonationOpen] = useState(false)
  const [isSubscribeOpen, setSubscribeOpen] = useState(false)
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-ink mb-4">About DGNO</h1>
            <p className="text-xl text-inkMuted leading-relaxed max-w-3xl mx-auto">
              Independent journalism and data for a connected world. We deliver the news that matters, 
              with integrity, accuracy, and a commitment to serving our community.
            </p>
          </div>

          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-ink mb-8 text-center">Our Mission</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-lg text-inkMuted mb-6">
                  DGNO was founded on the principle that quality journalism should be accessible to everyone. 
                  In an era of information overload, we cut through the noise to bring you the stories that 
                  truly impact your life and community.
                </p>
                <p className="text-lg text-inkMuted mb-6">
                  Our dedicated team of reporters, editors, and contributors work tirelessly to ensure that 
                  every story we publish meets the highest standards of accuracy, fairness, and relevance.
                </p>
                <p className="text-lg text-inkMuted">
                  We believe in the power of informed citizens to create positive change, and we're committed 
                  to providing the information you need to make a difference.
                </p>
              </div>
              <div className="bg-gray-100 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-ink mb-4">Our Core Values</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-accent font-bold">•</span>
                    <span className="text-inkMuted"><strong>Integrity:</strong> We report the truth, even when it's inconvenient</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent font-bold">•</span>
                    <span className="text-inkMuted"><strong>Independence:</strong> Free from political and corporate influence</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent font-bold">•</span>
                    <span className="text-inkMuted"><strong>Community:</strong> Serving the people who matter most - you</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent font-bold">•</span>
                    <span className="text-inkMuted"><strong>Innovation:</strong> Using technology to deliver news better</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* What We Cover */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-ink mb-8 text-center">What We Cover</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-accent/10 text-center p-6 rounded-lg border border-stone/20">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">📰</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Breaking News</h3>
                <p className="text-inkMuted">
                  Real-time coverage of developing stories that impact your world.
                </p>
              </div>
              
              <div className="bg-accent/10 text-center p-6 rounded-lg border border-stone/20">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">🏛️</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Politics</h3>
                <p className="text-inkMuted">
                  In-depth analysis of policy, elections, and government decisions.
                </p>
              </div>
              
              <div className="bg-accent/10 text-center p-6 rounded-lg border border-stone/20">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">💼</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Business</h3>
                <p className="text-inkMuted">
                  Market trends, economic insights, and corporate accountability.
                </p>
              </div>
              
              <div className="bg-accent/10 text-center p-6 rounded-lg border border-stone/20">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">💻</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Technology</h3>
                <p className="text-inkMuted">
                  Innovation, digital privacy, and the tech that shapes our future.
                </p>
              </div>
              
              <div className="bg-accent/10 text-center p-6 rounded-lg border border-stone/20">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">🌍</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Environment</h3>
                <p className="text-inkMuted">
                  Climate change, sustainability, and environmental justice.
                </p>
              </div>
              
              <div className="bg-accent/10 text-center p-6 rounded-lg border border-stone/20">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">⚖️</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Justice</h3>
                <p className="text-inkMuted">
                  Legal affairs, civil rights, and accountability reporting.
                </p>
              </div>
            </div>
          </section>

          {/* Support Section */}
          <section className="mb-16 bg-accent/5 rounded-lg p-8 text-center">
            <h2 className="text-3xl font-semibold text-ink mb-6">Support Independent Journalism</h2>
            <p className="text-lg text-inkMuted mb-8 max-w-2xl mx-auto">
              Quality journalism requires resources. Your support helps us maintain our independence 
              and continue delivering the news that matters most to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Donation / Subscribe triggers */}
              <button
                onClick={() => setDonationOpen(true)}
                className="bg-accent text-white px-6 py-3 rounded-full hover:bg-accent/90 transition-colors"
              >
                Make a Donation
              </button>

              <button
                onClick={() => setSubscribeOpen(true)}
                className="border border-accent text-accent px-6 py-3 rounded-full hover:bg-accent hover:text-white transition-colors"
              >
                Subscribe to Newsletter
              </button>
            </div>
          </section>

          {/* Contact Section */}

          {/* Modals */}
          <DonationModal isOpen={isDonationOpen} onClose={() => setDonationOpen(false)} />
          <SubscribeModal open={isSubscribeOpen} onClose={() => setSubscribeOpen(false)} />
          
        </div>
      </div>
  );
}