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
