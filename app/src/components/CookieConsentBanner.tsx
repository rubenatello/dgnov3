
import CookieConsent from "react-cookie-consent";
import React from "react";

const CookieConsentBanner: React.FC = () => (
	<CookieConsent
		location="bottom"
		buttonText="Accept"
		declineButtonText="Decline"
		enableDeclineButton
		cookieName="dgnov3CookieConsent"
		overlay
		expires={365}
		containerClasses="fixed bottom-0 left-0 w-full z-[9999]"
		contentClasses="flex flex-col md:flex-row items-start md:items-center justify-between w-full px-4 py-3 bg-bgDark text-paper text-base md:text-lg font-sans shadow-lg"
		buttonClasses="bg-accent text-paper font-heading px-5 py-2 rounded-md hover:bg-ink transition-colors duration-200 mt-3 md:mt-0 md:ml-4"
		declineButtonClasses="bg-sand text-ink font-heading px-5 py-2 rounded-md hover:bg-inkMuted transition-colors duration-200 mt-3 md:mt-0 md:ml-2"
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

export default CookieConsentBanner;
