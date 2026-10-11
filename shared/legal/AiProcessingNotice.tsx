import Link from 'next/link';

/**
 * How AdCendy uses AI, stated rather than consented to (V3-63): the Terms
 * and the Privacy Policy say the same, and this puts it where the client
 * acts - at sign-up and before a strategy is generated. The policy link
 * comes from the published documents, never a hard-coded path.
 */
export function AiProcessingNotice({
  privacyPolicyUrl,
  className,
}: {
  privacyPolicyUrl: string | null;
  className?: string;
}) {
  return (
    <p className={className ?? 'text-xs leading-5 text-muted-foreground'} data-testid="ai-processing-notice">
      AdCendy uses AI models (from OpenAI, Anthropic and Google) to write your strategy from your answers and public
      market data, and a person reviews every strategy before it is delivered. Your data is not used to train AI models.{' '}
      {privacyPolicyUrl ? (
        <>
          See the{' '}
          <Link className="text-primary hover:underline" href={privacyPolicyUrl}>
            Privacy Policy
          </Link>{' '}
          for how your data is handled.
        </>
      ) : null}
    </p>
  );
}
