// Layout provides Header/Footer
import { useState, useEffect } from 'react';
import { disableAnalytics } from '../lib/analytics';
import useToast from '../hooks/useToast';
import SEOHead from '../components/SEOHead';

const AS_OF = 'October 23, 2025';

export default function PrivacyPolicyPage() {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const cookies = document.cookie.split(';').map(c => c.trim());
      const existing = cookies.find(c => c.startsWith('dgnov3CookieConsent='));
      setConsentGiven(!!existing);
    } catch {
      setConsentGiven(null);
    }
  }, []);

  const toast = useToast();

  const handleRevoke = () => {
    try {
      // remove react-cookie-consent cookie
      document.cookie = `dgnov3CookieConsent=; Max-Age=0; path=/; domain=${location.hostname}`;
      disableAnalytics();
      setConsentGiven(false);
      toast.push({ type: 'info', title: 'Consent revoked', description: 'Analytics disabled' });
    } catch (err) {
      console.warn('revoke consent failed', err);
    }
  };

  return (
    <div className="bg-white">
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
              Effective Date: {AS_OF} | Last Updated: {AS_OF}
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
                By using our website, creating an account, or subscribing to our services, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-ink mb-3">Personal Information You Provide</h3>
              <ul className="text-inkMuted mb-6 list-disc list-inside space-y-2">
                <li><strong>Account Information:</strong> Email address, display name, and password when you create an account</li>
                <li><strong>Profile Information:</strong> Bio, profile picture, website, and social media links you choose to add</li>
                <li><strong>Communication:</strong> Messages you send us through contact forms or email</li>
                <li><strong>Payment Information:</strong> Billing details for donations (processed securely through Stripe)</li>
                <li><strong>Newsletter Subscriptions:</strong> Email address when you subscribe to our newsletter</li>
              </ul>

              <h3 className="text-xl font-medium text-ink mb-3">Information We Collect Automatically</h3>
              <ul className="text-inkMuted mb-6 list-disc list-inside space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, time spent on site, referral sources</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
                <li><strong>Log Data:</strong> IP addresses, access times, and error logs</li>
                <li><strong>Cookies:</strong> Session data and preferences (see Cookie Policy below)</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">How We Use Your Information</h2>
              <ul className="text-inkMuted list-disc list-inside space-y-2">
                <li>Provide and maintain our news service and website functionality</li>
                <li>Process user registrations and manage user accounts</li>
                <li>Send newsletters and important service communications</li>
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
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="text-inkMuted list-disc list-inside space-y-2 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure payment processing through Stripe</li>
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
                <li><strong>Unsubscribe:</strong> Opt out of marketing communications at any time</li>
                <li><strong>Account Control:</strong> Update your profile and privacy settings</li>
              </ul>
              <p className="text-inkMuted mt-4">
                To exercise these rights, contact us at privacy@dgno.com.
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
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-inkMuted mt-4">
                You can control cookies through your browser settings, though disabling certain cookies may affect website functionality.
              </p>
              
              <div className="mt-6 p-4 border rounded bg-gray-50">
                <h3 className="text-lg font-medium text-ink mb-2">Manage cookie consent</h3>
                <p className="text-inkMuted mb-3">Current consent: {consentGiven === null ? 'Unknown' : consentGiven ? 'Accepted' : 'Not accepted'}</p>
                <div className="flex gap-3">
                  <button
                    className="bg-sand text-ink px-4 py-2 rounded"
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
                <li><strong>Stripe:</strong> Secure payment processing for donations</li>
                <li><strong>Email Services:</strong> Newsletter delivery and transactional emails</li>
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
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. For significant changes, we may also send you an email notification.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-ink mb-4">Contact Us</h2>
              <p className="text-inkMuted mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-inkMuted mb-2"><strong>Email:</strong> privacy@dgno.com</p>
                <p className="text-inkMuted mb-2"><strong>General Inquiries:</strong> contact@dgno.com</p>
                <p className="text-inkMuted"><strong>Response Time:</strong> We aim to respond to privacy inquiries within 48 hours</p>
              </div>
            </section>

          </div>
        </div>
      </div>
  );
}