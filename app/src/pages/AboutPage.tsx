// Layout provides Header/Footer
import { useState, useEffect } from 'react'
import DonationModal from '../components/modals/DonationModal'
import SEOHead from '../components/SEOHead'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import useArticles from '../hooks/useArticles'
import { getPublicAuthor } from '../services/publicAuthorService'
import type { PublicAuthorProfile } from '../services/publicAuthorService'



interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'Who owns DGNO?',
    answer: 'DGNO is independently operated. A verified public disclosure naming the legal operator has not yet been added, so readers should treat ownership transparency as incomplete until that disclosure is published.'
  },
  {
    question: 'How we use AI for our reporting',
    answer: 'AI tools may assist with research organization, source comparison, scraping, tracker normalization, or drafting. A human with publishing authority reviews work before publication, and model output is never treated as a source.'
  },
  {
    question: 'How can I support DGNO?',
    answer: 'Read and share sourced reporting, use DGNO trackers, follow the RSS feed, send evidence-backed corrections, or make a donation when you can.'
  },
  {
    question: 'What does my money go towards?',
    answer: 'Donations are intended to support documented operating costs such as hosting, software, reporting, data maintenance, and contributor work. DGNO has not yet published an audited allocation report; the funding page will be updated as material arrangements change.'
  },
  {
    question: 'Why should I trust DGNO?',
    answer: 'Trust should be earned through accurate sourcing, visible uncertainty, corrections, and scrutiny without partisan exemptions. DGNO distinguishes constitutional text and controlling law from its own analysis and invites evidence-backed correction requests.'
  }
]

export default function AboutPage() {
  const [isDonationOpen, setDonationOpen] = useState(false)
  const [publicAuthors, setPublicAuthors] = useState<PublicAuthorProfile[]>([])
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { articles, loading: articlesLoading } = useArticles()

  useEffect(() => {
    if (articlesLoading) return
    let active = true
    const authorIds = Array.from(new Set(articles.map((article) => article.authorId).filter((id): id is string => Boolean(id)))).slice(0, 12)
    Promise.all(authorIds.map((authorId) => getPublicAuthor(authorId).catch(() => null)))
      .then((profiles) => {
        if (!active) return
        setPublicAuthors(profiles.filter((profile): profile is PublicAuthorProfile => Boolean(profile)).sort((a, b) => a.displayName.localeCompare(b.displayName)))
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [articles, articlesLoading])

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
    <div className="bg-bg">
      <SEOHead
        title="About DGNO - Independent, Pro-Democracy News"
        description="Learn about DGNO's mission to deliver independent journalism and news with integrity. Our commitment to democracy, anti-corruption reporting, and delivering information that calls out the corruption on all sides."
        url="https://dgno.us/about"
      />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-ink mb-6">About DGNO</h1>
            <p className="text-2xl text-inkMuted leading-relaxed max-w-4xl mx-auto font-light">
              Independent, data-driven journalism with constitutional analysis, source transparency, and accountability.
            </p>
          </div>

          {/* Our Story Section */}
          <section className="mb-20">
            <div className="border-l-4 border-accent pl-8 py-4">
              <h2 className="text-4xl font-bold text-ink mb-8">Our Story</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-inkMuted leading-relaxed mb-6 font-light">
                  DGNO is an independent, data-driven, pro-democracy news and public-data outlet focused on rights, corruption, and the exercise of public power. We aim to add evidence and context where coverage is incomplete while staying honest about what our own reporting has not established.
                </p>
                <p className="text-lg text-inkMuted leading-relaxed mb-6 font-light">
                  We separate what happened, what is confirmed, and what remains speculative. When constitutional issues are involved, we distinguish legal text, controlling decisions, competing arguments, and DGNO's analysis. Our public archive and trackers let readers inspect that work directly.
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
                <p className="text-inkMuted font-light">We correct the record when evidence shows we are wrong.</p>
              </div>
              
              <div className="text-center p-7 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl font-bold">I</span>
                </div>
                <h3 className="text-large font-regular text-ink mb-3 uppercase">Independence</h3>
                <p className="text-inkMuted font-light">Editorial conclusions are not offered in exchange for political or financial support.</p>
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
            <h2 className="text-3xl font-bold text-ink mb-4 text-center">Recent Public Bylines</h2>
            <p className="text-center text-lg text-inkMuted mb-12 max-w-2xl mx-auto">
              Public author profiles attached to recent published DGNO stories. This is not represented as a complete staff or ownership directory.
            </p>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-inkMuted">Loading public bylines...</p>
              </div>
            ) : publicAuthors.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {publicAuthors.map((member) => (
                  <Link to={`/author/${encodeURIComponent(member.id)}`} key={member.id} className="text-center group">
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
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-stone/10 rounded-lg">
                <p className="text-inkMuted">No public author profiles are available in the recent article window.</p>
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
                  className="border border-stone/30 rounded-lg overflow-hidden bg-surface hover:shadow-md transition-shadow"
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
            <h2 className="text-4xl font-bold text-ink mb-6">Keep Independent Journalism Useful</h2>
            <p className="text-xl text-inkMuted mb-10 max-w-3xl mx-auto leading-relaxed">
              Read the reporting, inspect the data, share work you find useful, and challenge us with evidence. Financial support helps DGNO maintain its independence when it is possible for you.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
              <button
                onClick={() => setDonationOpen(true)}
                className="min-h-11 bg-accent text-white px-7 py-3 rounded-full text-base font-semibold hover:bg-accent/90 hover:shadow-lg transition-all"
              >
                Make a Donation
              </button>
              <Link
                to="/trackers"
                className="inline-flex min-h-11 items-center justify-center border-2 border-accent text-accent px-7 py-3 rounded-full text-base font-semibold hover:bg-accent hover:text-white transition-all"
              >
                Explore Public Data
              </Link>
              <a href="/rss.xml" className="inline-flex min-h-11 items-center justify-center px-7 py-3 rounded-full text-base font-semibold text-ink underline underline-offset-4 hover:text-accent">
                Follow by RSS
              </a>
            </div>
          </section>

          {/* Contact Section */}

          {/* Modals */}
          <DonationModal isOpen={isDonationOpen} onClose={() => setDonationOpen(false)} />
          
        </div>
    </div>
  );
}
