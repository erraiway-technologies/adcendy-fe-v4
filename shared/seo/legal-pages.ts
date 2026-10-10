/**
 * The policies the Backend publishes, by public path (its legal documents
 * manifest), with the title each is listed under. Only these paths reach the
 * legal page - every other one is a 404 - and the page still asks the Backend
 * for the text that is live. A new policy in the manifest is added here too.
 */
export const LEGAL_PAGES: Record<string, string> = {
  '/terms': 'Terms of Service',
  '/privacy-policy': 'Privacy Policy',
  '/refund-policy': 'Refund & Cancellation Policy',
  '/disclaimer': 'Disclaimer',
  '/delivery-policy': 'Digital Delivery Policy',
};

/**
 * The pages that explain each consent, by public path (the manifest's
 * documents with a `consentType`). They are linked from the consent wherever
 * it is asked for, not listed with the policies.
 */
export const CONSENT_PAGES: Record<string, string> = {
  '/consents/privacy-processing': 'Privacy Processing consent',
  '/consents/ai-processing': 'AI Processing consent',
  '/consents/benchmark-data': 'Benchmark Data consent',
  '/consents/marketing-emails': 'Marketing Emails consent',
  '/consents/ads-integration': 'Ads Integration consent',
};
