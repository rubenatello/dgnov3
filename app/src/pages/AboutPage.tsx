// Layout provides Header/Footer
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import DonationModal from '../components/modals/DonationModal'
import SubscribeModal from '../components/modals/SubscribeModal'
import SEOHead from '../components/SEOHead'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import type { User } from '../types/models'



interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'Who owns DGNO?',
    answer: 'DGNO is a privately owned and operated independent news outlet growing and trying to gain the public\'s trust back by providing pro-democracy, anti-corruption information for the American people and the world. Our personal views will never supersede our mission to call out corruption.'
  },
  {
    question: 'How we use AI for our reporting',
    answer: 'We use a handful of AI models with strict parameters, citing a handful of trusted sources to enhance our reporting accuracy and efficiency.'
  },
  {
    question: 'How can I support DGNO?',
    answer: 'Times are hard, and news subscriptions are pricey. We accept one-time donations or a small monthly subscription of $3/month to help keep our journalism independent and accessible.'
  },
  {
    question: 'What does my money go towards?',
    answer: 'Funds donated will go to deployment, hosting and operating costs for our developers, website sustainability, journalists and maintenance of website. As of now, we have a small team of contributors who work full time and assist DGNO as a passion project. Our goal is to make these believers full-time employees if growth allows.'
  },
  {
    question: 'Why should I trust DGNO?',
    answer: 'We will admit our biases, we will explain why, but we will also use our Constitution and advice from experts as a measuring stick. We are also willing and believe calling out all figures—political, elite, etc.—are not above reproach.'
  }
]

export default function AboutPage() {
  const [isDonationOpen, setDonationOpen] = useState(false)
  const [isSubscribeOpen, setSubscribeOpen] = useState(false)
  const [staffMembers, setStaffMembers] = useState<User[]>([])
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('isStaff', '==', true))
        const snapshot = await getDocs(q)
        const staff = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as User))
          .sort((a, b) => a.displayName.localeCompare(b.displayName))
        setStaffMembers(staff)
      } catch (error) {
        console.error('Error fetching staff:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStaff()
  }, [])

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  // Inject FAQPage JSON-LD schema
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map((faq) => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer,
        },
      })),
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-schema', 'faq')
    script.textContent = JSON.stringify(faqSchema)
    document.head.appendChild(script)
    return () => {
      const el = document.querySelector('script[data-schema="faq"]')
      if (el) el.remove()
    }
  }, [])

  return (
    <div className="bg-white">
      <SEOHead
        title="About DGNO - Independent, Pro-Democracy News"
        description="Learn about DGNO's mission to deliver independent journalism and news with integrity. Our commitment to democracy, anti-corruption reporting, and delivering information that calls out the corruption on all sides."
        url="https://dgno.us/about"
      />
      <main>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-ink mb-6">About DGNO</h1>
            <p className="text-2xl text-inkMuted leading-relaxed max-w-4xl mx-auto font-light">
              Independent, data-driven, Constitution-backed journalism dedicated to truth, transparency, and accountability.
            </p>
          </div>

          {/* Our Story Section */}
          <section className="mb-20">
            <div className="border-l-4 border-accent pl-8 py-4">
              <h2 className="text-4xl font-bold text-ink mb-8">Our Story</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-inkMuted leading-relaxed mb-6 font-light">
                  DGNO is an independent, data-driven, Constitution-backed and pro-democracy news and data outlet 
                  dedicated to providing truth in all reporting where we noticed mass media isn't. A few examples 
                  include the omission of American media attempting to hold Israel accountable for committing genocide 
                  against Palestinians, and the Trump administration brokering media deals for him to look more favorable.
                </p>
                <p className="text-lg text-inkMuted leading-relaxed mb-6 font-light">
                  In other words, we want to provide information, we will give you our take, but ultimately, you decide 
                  what you believe and we tie in how the Constitution fits in. Since August 2025, we have committed our 
                  time and resources to building a news platform that serves the people, not special interests.
                </p>
                <p className="text-lg text-inkMuted leading-relaxed font-light">
                  We believe in the power of informed citizens to create positive change, and we're committed to 
                  providing the information you need to make a difference in your community and country.
                </p>
              </div>
            </div>
          </section>

          {/* Core Values Grid */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-ink mb-12 text-center">Our Core Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center p-7 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl font-bold">I</span>
                </div>
                <h3 className="text-large font-regular text-ink mb-3 uppercase">Integrity</h3>
                <p className="text-inkMuted font-light">We report the truth, even when it's inconvenient.</p>
              </div>
              
              <div className="text-center p-7 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl font-bold">I</span>
                </div>
                <h3 className="text-large font-regular text-ink mb-3 uppercase">Independence</h3>
                <p className="text-inkMuted font-light">Free from political and corporate influence.</p>
              </div>
              
              <div className="text-center p-7 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl font-bold">C</span>
                </div>
                <h3 className="text-large font-regular text-ink mb-3 uppercase">Community</h3>
                <p className="text-inkMuted font-light">Serving the people who matter most. YOU.</p>
              </div>
              
              <div className="text-center p-7 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl font-bold">I</span>
                </div>
                <h3 className="text-large font-regular text-ink mb-3 uppercase">Innovation</h3>
                <p className="text-inkMuted font-light">Using technology to deliver news better.</p>
              </div>
            </div>
          </section>

          {/* Staff Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-ink mb-4 text-center">Our Team</h2>
            <p className="text-center text-lg text-inkMuted mb-12 max-w-2xl mx-auto">
              Meet the journalists, editors, and contributors who make DGNO possible.
            </p>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-inkMuted">Loading team members...</p>
              </div>
            ) : staffMembers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {staffMembers.map((member) => (
                  <div key={member.id} className="text-center group">
                    <div className="mb-4 overflow-hidden rounded-full w-32 h-32 mx-auto border-4 border-stone/20 group-hover:border-accent/50 transition-colors">
                      {member.profileImageUrl || member.avatarUrl ? (
                        <img 
                          src={member.profileImageUrl || member.avatarUrl} 
                          alt={member.displayName}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-accent/20 flex items-center justify-center">
                          <span className="text-4xl font-bold text-accent">
                            {member.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-ink mb-1">{member.displayName}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-stone/10 rounded-lg">
                <p className="text-inkMuted">Our team information will be available soon.</p>
              </div>
            )}
          </section>
          {/* Dividing Line */}
          <hr className="my-12 border-stone/70" />
          {/* FAQ Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-ink mb-4 text-center">Frequently Asked Questions</h2>
            <p className="text-center text-lg text-inkMuted mb-12 max-w-2xl mx-auto">
              Everything you need to know about DGNO and how we operate.
            </p>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="border border-stone/30 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-stone/5 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-ink pr-4">{faq.question}</h3>
                    <FontAwesomeIcon 
                      icon={expandedFAQ === index ? faChevronUp : faChevronDown} 
                      className="text-accent flex-shrink-0"
                    />
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-6 pb-5 pt-2">
                      <p className="text-inkMuted leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          {/* Dividing Line */}
          <hr className="my-12 border-stone/70" />
          {/* What We Cover */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-ink mb-12 text-center">What We Cover</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-accent/5 text-center p-6 rounded-lg border border-stone/20 hover:border-accent/40 hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📰</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Breaking News</h3>
                <p className="text-inkMuted">
                  Real-time coverage of developing stories that impact your world.
                </p>
              </div>
              
              <div className="bg-accent/5 text-center p-6 rounded-lg border border-stone/20 hover:border-accent/40 hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🏛️</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Politics</h3>
                <p className="text-inkMuted">
                  In-depth analysis of policy, elections, and government decisions.
                </p>
              </div>
              
              <div className="bg-accent/5 text-center p-6 rounded-lg border border-stone/20 hover:border-accent/40 hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">💼</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Business</h3>
                <p className="text-inkMuted">
                  Market trends, economic insights, and corporate accountability.
                </p>
              </div>
              
              <div className="bg-accent/5 text-center p-6 rounded-lg border border-stone/20 hover:border-accent/40 hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">💻</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Technology</h3>
                <p className="text-inkMuted">
                  Innovation, digital privacy, and the tech that shapes our future.
                </p>
              </div>
              
              <div className="bg-accent/5 text-center p-6 rounded-lg border border-stone/20 hover:border-accent/40 hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🌍</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Environment</h3>
                <p className="text-inkMuted">
                  Climate change, sustainability, and environmental justice.
                </p>
              </div>
              
              <div className="bg-accent/5 text-center p-6 rounded-lg border border-stone/20 hover:border-accent/40 hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⚖️</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-3">Justice</h3>
                <p className="text-inkMuted">
                  Legal affairs, civil rights, and accountability reporting.
                </p>
              </div>
            </div>
          </section>

          {/* Support Section */}
          <section className="mb-16 bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-12 text-center border border-accent/20">
            <h2 className="text-4xl font-bold text-ink mb-6">Support Independent Journalism</h2>
            <p className="text-xl text-inkMuted mb-10 max-w-3xl mx-auto leading-relaxed">
              Quality journalism requires resources. Your support helps us maintain our independence 
              and continue delivering the news that matters most to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => setDonationOpen(true)}
                className="bg-accent text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-accent/90 hover:shadow-lg transition-all transform hover:scale-105"
              >
                Make a Donation
              </button>
              <button
                onClick={() => setSubscribeOpen(true)}
                className="border-2 border-accent text-accent px-8 py-4 rounded-full text-lg font-semibold hover:bg-accent hover:text-white hover:shadow-lg transition-all transform hover:scale-105"
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
      </main>
    </div>
  );
}