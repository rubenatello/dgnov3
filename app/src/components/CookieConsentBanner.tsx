
import CookieConsent from 'react-cookie-consent';
import React, { useEffect } from 'react';
import { enableAnalytics, disableAnalytics, updateConsent, isAnalyticsEnabled } from '../lib/analytics';

const COOKIE_NAME = 'dgnov3CookieConsent';

const CookieConsentBanner: React.FC = () => {
	// If the user previously accepted, enable analytics on mount
	useEffect(() => {
		try {
			const cookies = document.cookie.split(';').map(c => c.trim());
			const existing = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
			if (existing) {
				// the react-cookie-consent cookie stores the value (usually 'true') — if present, treat as accepted
				// we only enable if analytics is not already enabled
				if (!isAnalyticsEnabled()) {
					enableAnalytics().then(() => updateConsent({ analyticsGranted: true, adGranted: false }));
				}
			}
		} catch (err) {
			// non-fatal
			console.warn('cookie consent mount check failed', err);
		}
	}, []);

	return (
		<CookieConsent
			location="bottom"
			buttonText="Accept"
			declineButtonText="Decline"
			enableDeclineButton
			cookieName={COOKIE_NAME}
			overlay
			expires={365}
			containerClasses="fixed bottom-0 left-0 w-full z-[9999]"
			contentClasses="flex flex-col md:flex-row items-start md:items-center justify-between w-full px-4 py-3 bg-bgDark text-paper text-base md:text-lg font-sans shadow-lg"
			buttonClasses="bg-accent text-paper font-heading px-5 py-2 rounded-md hover:bg-ink transition-colors duration-200 mt-3 md:mt-0 md:ml-4"
			declineButtonClasses="bg-sand text-ink font-heading px-5 py-2 rounded-md hover:bg-inkMuted transition-colors duration-200 mt-3 md:mt-0 md:ml-2"
			onAccept={() => {
				// enable analytics after consent
				enableAnalytics().then(() => updateConsent({ analyticsGranted: true, adGranted: false })).catch((err) => {
					// don't let analytics failures block UI; log for debugging
					console.warn('enableAnalytics failed', err);
				});
			}}
			onDecline={() => {
				// mark denied and disable analytics
				try {
					updateConsent({ analyticsGranted: false, adGranted: false });
				} catch (err) {
					console.warn('updateConsent onDecline failed', err);
				}
				disableAnalytics();
			}}
		>
			<span>
				This website uses cookies to enhance the user experience and to comply with privacy regulations. By clicking "Accept", you consent to the use of cookies. You can review our{' '}
				<a
					href="/privacy"
					className="underline text-accent hover:text-paper"
					target="_blank"
					rel="noopener noreferrer"
				>
					Privacy Policy
				</a>
				.
			</span>
		</CookieConsent>
	);
};

export default CookieConsentBanner;
