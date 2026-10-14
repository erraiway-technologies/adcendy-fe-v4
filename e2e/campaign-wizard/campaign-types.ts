export interface CampaignFixture {
  fixtureVersion: '1.0';
  fixtureStatus: 'placeholder' | 'ready';
  slug: string;
  displayName: string;
  wizard: {
    step1: Record<string, unknown> & {
      title?: string;
      marketingTargetType: string;
      focusName: string;
      sourceType: string;
      primaryUrl?: string;
      targetMarkets: string[];
      currency: string;
      primaryMarket?: string;
      marketScope: string;
      operationalLocations?: string[];
      regionalLanguageExpansionEnabled?: boolean;
      regionalLanguages?: string[];
    };
    step2: Record<string, unknown> & {
      businessName?: string;
      industryCategory: string;
      sellsTo: string;
      sellsVia: string;
      audienceModel: string;
      lifecycleStage: string;
      businessDescription: string;
      productCategory: string;
      productsServices: string[];
      offerSummary?: string;
      priceRangeLow: number;
      priceRangeHigh: number;
      differentiators?: string[];
      sensitiveCategoryFlags: string[];
      complianceSensitiveClaims?: string[];
      pricePosition?: string;
    };
    step3: Record<string, unknown> & {
      primaryTargetSegment: string;
      targetPersona: string;
      targetAudience?: string;
      audienceSegments?: string[];
      language: string;
      reportLanguage?: string;
      painPoints: string[];
      desiredOutcome: string;
      decisionProcess: string;
      buyerRoles?: string[];
      ageRanges?: string[];
      genderSkew?: string;
      buyingTriggers?: string[];
    };
    step4: Record<string, unknown> & {
      salesChannels: Array<{ channel: string; rank: number; customName?: string; salesShare?: string }>;
      primaryConversionPath: string;
      trustSignals?: string[];
      socialHandles?: Array<{ platform: string; handle: string }>;
      digitalPresenceLinks?: Array<{ type: string; url: string; label?: string }>;
      googleAnalyticsConnected?: boolean | 'unknown' | '';
      monthlyWebsiteTraffic?: string;
      emailListSize?: string;
      whatsappListSize?: string;
      existingAssets?: string[];
    };
    step5: Record<string, unknown> & {
      primaryGoal: string;
      monthlyMarketingBudget: number;
      paidAdsShare: string;
      marketingHandler: string;
      contentCapacity: string;
      marketingHoursPerWeek: string;
      creativeCapabilities: string[];
      /** Retired (V3-153): older fixtures still carry it; never entered. */
      deliveryDeadline?: string;
      salesCapacity?: string;
      currentMarketingActivity?: Array<{
        channel: string;
        status: string;
        workingAssessment?: string;
        evidence?: string;
        monthlySpendAmount?: number;
        shareOfSpend?: string;
        timeRunning?: string;
        reasonStopped?: string;
      }>;
      pastMarketing?: string;
      whatsWorking?: string;
      biggestFrustration?: string;
      knownCompetitorStatus: string;
      knownCompetitors?: string[];
      constraints?: string[];
      channelsToAvoid?: string[];
      channelsStronglyPreferred?: string[];
      executionConstraints?: string[];
      additionalContext?: string;
      peakSeasons?: string[];
      currentOffers?: string[];
    };
    step6: Record<string, unknown> & {
      averageOrderValueAmount?: number;
      typicalDealValue?: number;
      monthlyRevenueAmount?: number;
      grossMarginPercentage?: string;
      grossMarginBand?: string;
      closeRateBand?: string;
      paybackWindow: string;
      monthlyOrderVolume?: string;
      productCost?: string;
      monthlyOrdersPerSubscriber?: string;
      monthlyChurnRate?: string;
      avgCustomerRetention?: string;
      repeatPurchaseFrequency?: string;
      salesCycleLength?: string;
      customerAcquisitionCost?: number;
      subscriptionOffered?: boolean;
      subscriberMonths?: number;
    };
    step7: {
      confirmFocus: true;
      confirmBusiness: true;
      confirmAudience: true;
      confirmGoals: true;
      confirmEconomics: true;
      readyToGenerate: true;
      dataConsentOptIn: boolean;
      privacyProcessingConsent: true;
      aiProcessingConsent: true;
    };
  };
}

export interface CampaignExecutionReport {
  fixture: string;
  displayName: string;
  environment: 'local' | 'uat';
  baseURL: string;
  submitEnabled: boolean;
  status: 'running' | 'review-only' | 'submitted' | 'failed';
  startedAt: string;
  completedAt?: string;
  campaignId?: string;
  strategyId?: string;
  pipelineRunId?: string;
  finalUrl?: string;
  screenshot?: string;
  validationFailures: Array<{ path: string; message: string }>;
  unsupportedFields: Array<{ path: string; message: string }>;
  error?: string;
}
