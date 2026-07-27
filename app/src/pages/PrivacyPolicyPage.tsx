// Layout provides Header/Footer
import { useState, useEffect } from 'react';
import { disableAnalytics } from '../lib/analytics';
import useToast from '../hooks/useToast';
import SEOHead from '../components/SEOHead';
import { Link } from 'react-router-dom';

const AS_OF = 'July 24, 2026';

export default function PrivacyPolicyPage() {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const cookies = document.cookie.split(';').map(c => c.trim());
      const existing = cookies.find(c => c.startsWith('dgnov3CookieConsent='));
      setConsentGiven(existing?.split('=')[1] === 'true');
    } catch {
      setConsentGiven(null);
    }
  }, []);

  const toast = useToast();

  const handleRevoke = () => {
    try {
      // remove react-cookie-consent cookie
      document.cookie = 'dgnov3CookieConsent=; Max-Age=0; path=/';
      document.cookie = `dgnov3CookieConsent=; Max-Age=0; path=/; domain=${location.hostname}`;
      disableAnalytics();
      setConsentGiven(false);
      toast.push({ type: 'info', title: 'Consent revoked', description: 'Analytics disabled' });
    } catch (err) {
      console.warn('revoke consent failed', err);
    }
  };

  return (
    <div className="bg-bg">
      <SEOHead
        title="Privacy Policy - DGNO"
        description="DGNO's privacy policy explains how we collect, use, and protect your personal information. Learn about cookies, data sharing, and your privacy rights."
        url="https://dgno.us/privacy"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-ink mb-4">Privacy Policy</h1>
            <p className="text-lg text-inkMuted">
              Last revised: {AS_OF}. This revision takes effect when published on DGNO.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            
            {/* Introduction */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Introduction</h2>
              <p className="text-inkMuted mb-4">
                At DGNO ("we," "our," or "us"), we are committed to protecting your privacy and being transparent about how we collect, use, and share your information. This Privacy Policy explains our practices regarding the personal information we collect from users of our website and services.
              </p>
              <p className="text-inkMuted">
                This policy describes the site as currently implemented. Optional analytics remain disabled unless you explicitly accept them.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-ink mb-3">Personal Information You Provide</h3>
              <ul className="text-inkMuted mb-6 list-disc list-inside space-y-2">
                <li><strong>Account Information:</strong> Email address and display name. Firebase Authentication handles password credentials; DGNO's application does not receive your plaintext password.</li>
                <li><strong>Profile Information:</strong> Bio, profile picture, website, and social media links you choose to add</li>
                <li><strong>Communication:</strong> Messages you send us through contact forms or email</li>
                <li><strong>Donation Information:</strong> Stripe processes donations on its hosted payment pages; DGNO receives the transaction information Stripe makes available to the recipient account</li>
              </ul>

              <h3 className="text-xl font-medium text-ink mb-3">Information We Collect Automatically</h3>
              <ul className="text-inkMuted mb-6 list-disc list-inside space-y-2">
                <li><strong>Optional Analytics:</strong> With explicit consent, page and article views, referral information, and basic interaction events</li>
                <li><strong>Device Information:</strong> Browser, operating-system, and device details recorded by hosting or optional analytics services</li>
                <li><strong>Log Data:</strong> Network address, request time, and error information recorded by hosting and infrastructure providers</li>
                <li><strong>Anti-abuse Data:</strong> A hashed request identifier and submission count used to rate-limit newsroom messages</li>
                <li><strong>Cookies:</strong> Session data and preferences (see Cookie Policy below)</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">How We Use Your Information</h2>
              <ul className="text-inkMuted list-disc list-inside space-y-2">
                <li>Provide and maintain our news service and website functionality</li>
                <li>Process user registrations and manage user accounts</li>
                <li>Send important account, security, and service communications</li>
                <li>Process donations and maintain donation records</li>
                <li>Improve our website performance and user experience</li>
                <li>Respond to customer service requests and inquiries</li>
                <li>Detect and prevent fraud, spam, and abuse</li>
                <li>Comply with legal obligations and enforce our terms of service</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">How We Share Information</h2>
              <p className="text-inkMuted mb-4">
                We do not sell, rent, or trade your personal information to third parties. We may share information in the following limited circumstances:
              </p>
              <ul className="text-inkMuted list-disc list-inside space-y-2">
                <li><strong>Service Providers:</strong> Third-party services that help us operate our website (hosting, email delivery, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Data Security</h2>
              <p className="text-inkMuted mb-4">
                DGNO uses access controls and the security features provided by its service providers to reduce unauthorized access, alteration, disclosure, or destruction. Current measures include:
              </p>
              <ul className="text-inkMuted list-disc list-inside space-y-2 mb-4">
                <li>HTTPS for information transmitted between your browser and the site</li>
                <li>Authentication and role-based access controls for staff tools</li>
                <li>Payment details handled by the payment processor rather than stored as card data in DGNO's application, when donations are enabled</li>
              </ul>
              <p className="text-inkMuted">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Your Rights and Choices</h2>
              <p className="text-inkMuted mb-4">You have the following rights regarding your personal information:</p>
              <ul className="text-inkMuted list-disc list-inside space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate personal information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
                <li><strong>Account Control:</strong> Update your profile and privacy settings</li>
              </ul>
              <p className="text-inkMuted mt-4">
                To exercise these rights, use the <Link to="/contact" className="text-accent-dark underline underline-offset-4">DGNO contact page</Link>. Form submissions are routed to a monitored inbox without publishing its destination address on the page.
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Cookies and Tracking</h2>
              <p className="text-inkMuted mb-4">
                We use cookies and similar tracking technologies to enhance your browsing experience:
              </p>
              <ul className="text-inkMuted list-disc list-inside space-y-2">
                <li><strong>Essential Cookies:</strong> Required for basic website functionality and user authentication</li>
                <li><strong>Optional Analytics:</strong> After an explicit “accept” choice, DGNO may record first-party page/article-view events in Firebase and load Google Analytics to understand site use</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-inkMuted mt-4">
                Declining optional analytics does not prevent access to DGNO's public reporting or trackers. You can also control cookies through your browser settings, though disabling essential authentication storage can affect account features.
              </p>
              
              <div className="mt-6 p-4 border rounded bg-surface-muted">
                <h3 className="text-lg font-medium text-ink mb-2">Manage cookie consent</h3>
                <p className="text-inkMuted mb-3">Current consent: {consentGiven === null ? 'Unknown' : consentGiven ? 'Accepted' : 'Not accepted'}</p>
                <div className="flex gap-3">
                  <button
                    className="rounded bg-accent-strong px-4 py-2 font-semibold text-white hover:bg-accent-dark"
                    onClick={handleRevoke}
                  >
                    Revoke Consent (disable analytics)
                  </button>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Third-Party Services</h2>
              <p className="text-inkMuted mb-4">Our website integrates with third-party services:</p>
              <ul className="text-inkMuted list-disc list-inside space-y-2">
                <li><strong>Firebase (Google):</strong> Authentication, database, and hosting services</li>
                <li><strong>Stripe:</strong> Hosted donation payment processing</li>
                <li><strong>Firebase Authentication and SendGrid:</strong> Staff account verification, password-reset, newsroom-form, and transactional email delivery</li>
              </ul>
              <p className="text-inkMuted mt-4">
                These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Children's Privacy</h2>
              <p className="text-inkMuted">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete such information.
              </p>
            </section>

            {/* International Users */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">International Users</h2>
              <p className="text-inkMuted">
                Our services are operated from the United States. If you are accessing our website from outside the US, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located and our central database is operated.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Changes to This Privacy Policy</h2>
              <p className="text-inkMuted">
                We may update this Privacy Policy from time to time. We will notify you of changes by posting the revised policy on this page and updating the revision date. Where legally required and practical, we may also provide a direct notice.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Contact Us</h2>
              <p className="text-inkMuted mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-inkMuted">
                  Use the <Link to="/contact" className="text-accent-dark underline underline-offset-4">contact page</Link> and select “Privacy request” as the topic.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
  );
}
