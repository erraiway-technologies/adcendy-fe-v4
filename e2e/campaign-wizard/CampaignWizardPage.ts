import fs from 'node:fs';
import path from 'node:path';
import { expect, type Locator, type Page, type Response } from '@playwright/test';
import type { CampaignExecutionReport, CampaignFixture } from './campaign-types';
import { formatMoney } from '../../shared/types/money';
import { createWizardE2eOptionLabels, type WizardE2eOptionLabels } from './wizard-options';

// Where inside the one country the client sells: the wizard writes these
// itself (they are not in the options response), naming the served country.
const marketScopeLabel = (scope: string, countryName: string) =>
  scope === 'national'
    ? `National — across ${countryName}`
    : 'Regional — specific cities or states';

const WIZARD_OPTIONS_PATH = '/api/v2/wizard/options';

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function responsePath(response: Response) {
  return new URL(response.url()).pathname;
}

function isMutation(response: Response, method: string, pathname: string) {
  return (
    response.request().method() === method &&
    responsePath(response) === pathname
  );
}

export class CampaignWizardPage {
  private optionsResponse: Response | null = null;
  private optionLabels: WizardE2eOptionLabels | null = null;
  /** The campaign's market: its market lists are the ones the wizard offers. */
  private market: string;

  constructor(
    private readonly page: Page,
    private readonly fixture: CampaignFixture,
    readonly report: CampaignExecutionReport,
  ) {
    this.market = fixture.wizard.step1.targetMarkets[0] ?? '';
    // V3-76: option labels come from the options response the wizard itself
    // loads, so a label changed in the backend seed is followed. Listening
    // from the start catches it however early the page asks.
    page.on('response', (response) => {
      if (
        response.request().method() === 'GET' &&
        responsePath(response) === WIZARD_OPTIONS_PATH &&
        response.ok()
      ) {
        this.optionsResponse = response;
        this.optionLabels = null;
      }
    });
  }

  /** The served option labels, read from the wizard's own options response. */
  private async labels(): Promise<WizardE2eOptionLabels> {
    if (this.optionLabels) {
      return this.optionLabels;
    }
    const response =
      this.optionsResponse ??
      (await this.page.waitForResponse(
        (candidate) =>
          candidate.request().method() === 'GET' &&
          responsePath(candidate) === WIZARD_OPTIONS_PATH &&
          candidate.ok(),
      ));
    this.optionLabels = createWizardE2eOptionLabels(await response.json());
    return this.optionLabels;
  }

  /** The label the wizard offers `value` under at `fieldPath`; throws when it offers none. */
  private async optionLabel(fieldPath: string, value: string) {
    const label = (await this.labels()).optionLabel(fieldPath, value, this.market);
    if (!label) {
      throw new Error(
        `Unsupported select value "${value}" for ${fieldPath}: GET ${WIZARD_OPTIONS_PATH} serves no option for it`,
      );
    }
    return label;
  }

  private async countryName(code: string) {
    return (await this.labels()).country(code);
  }

  private field(fieldPath: string) {
    return this.page.getByTestId(`campaign-wizard-${fieldPath}`);
  }

  private async requireOk(response: Response, operation: string) {
    if (response.ok()) {
      return;
    }
    const body = await response.text();
    const message = `${operation} failed with HTTP ${response.status()}: ${body}`;
    this.report.validationFailures.push({ path: operation, message });
    throw new Error(message);
  }

  private async fill(fieldPath: string, value: string | undefined) {
    if (value === undefined) {
      return;
    }
    const field = this.field(fieldPath);
    await expect(field, `Wizard field ${fieldPath} should be visible`).toBeVisible();
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }

  private async addTags(fieldPath: string, values: string[] | undefined) {
    for (const value of values ?? []) {
      const input = this.field(fieldPath);
      await expect(input).toBeVisible();
      await input.fill(value);
      await input.press('Enter');
      await expect(this.page.getByRole('button', { name: `Remove ${value}` })).toBeVisible();
    }
  }

  private async chooseCard(fieldPath: string, desiredValue: string) {
    const prefix = `campaign-wizard-${fieldPath}-`;
    const candidates = this.page.getByTestId(new RegExp(`^${prefix}`));
    await expect(candidates.first()).toBeVisible();
    const count = await candidates.count();
    for (let index = 0; index < count; index += 1) {
      const candidate = candidates.nth(index);
      const testId = (await candidate.getAttribute('data-testid')) ?? '';
      if (normalizeToken(testId.slice(prefix.length)) === normalizeToken(desiredValue)) {
        await candidate.click();
        await expect(candidate).toHaveAttribute('aria-pressed', 'true');
        return;
      }
    }
    throw new Error(`Unsupported card value "${desiredValue}" for ${fieldPath}`);
  }

  /**
   * The option named `label` among those shown: the one that reads exactly
   * so, else the one that starts with it (an option with a hint reads its
   * label, then the hint).
   */
  private async findOption(fieldPath: string, value: string, label: string) {
    const options = this.page.getByRole('option');
    await expect(options.first()).toBeVisible();
    const texts = (await options.allTextContents()).map((text) => text.trim());
    let index = texts.indexOf(label);
    if (index < 0) {
      index = texts.findIndex((text) => text.startsWith(label));
    }
    if (index < 0) {
      await this.page.keyboard.press('Escape');
      throw new Error(
        `Unsupported select value "${value}" (${label}) for ${fieldPath}. Available options: ${texts.filter(Boolean).join(', ')}`,
      );
    }
    return options.nth(index);
  }

  /**
   * A searchable picker (country, currency, industry; v3 P4): searches for
   * the value's served label and picks the option named so.
   */
  private async chooseSearchable(fieldPath: string, value: string) {
    const label = await this.optionLabel(fieldPath, value);
    const trigger = this.field(fieldPath);
    await expect(trigger, `Picker ${fieldPath} should be visible`).toBeVisible();
    await trigger.click();
    await this.page.getByTestId(`campaign-wizard-${fieldPath}-search`).fill(label);
    await (await this.findOption(fieldPath, value, label)).click();
    await expect(trigger).toContainText(label);
  }

  /** A select whose options the wizard writes itself, picked by that text. */
  private async chooseSelectByLabel(fieldPath: string, label: string) {
    const trigger = this.field(fieldPath);
    await expect(trigger, `Select ${fieldPath} should be visible`).toBeVisible();
    await trigger.click();
    await (await this.findOption(fieldPath, label, label)).click();
    await expect(trigger).toContainText(label);
  }

  /** A select, picked by the label the options response serves for `desiredValue`. */
  private async chooseSelect(fieldPath: string, desiredValue: string) {
    await this.chooseSelectByLabel(fieldPath, await this.optionLabel(fieldPath, desiredValue));
  }

  private async chooseSensitiveFlag(desiredValue: string) {
    const prefix = 'campaign-wizard-sensitiveCategoryFlags-';
    const cards = this.page.getByTestId(new RegExp(`^${prefix}`));
    if ((await cards.count()) > 0) {
      const count = await cards.count();
      for (let index = 0; index < count; index += 1) {
        const card = cards.nth(index);
        const testId = (await card.getAttribute('data-testid')) ?? '';
        if (normalizeToken(testId.slice(prefix.length)) === normalizeToken(desiredValue)) {
          await card.click();
          await expect(card).toHaveAttribute('aria-pressed', 'true');
          return;
        }
      }
      throw new Error(`Unsupported sensitiveCategoryFlags value "${desiredValue}"`);
    }
    await this.addTags('sensitiveCategoryFlags', [desiredValue]);
  }

  private async assertStep(step: number) {
    await expect(this.page.getByTestId(`campaign-wizard-step-${step}`)).toBeVisible();
    await expect(this.page.getByText(new RegExp(`Step ${step} /`)).first()).toBeVisible();
  }

  private async submitStep<T>(
    step: number,
    nextButton: 'Continue' | 'Review',
    mutationPromise: Promise<T>,
  ) {
    const form = this.page.getByTestId(`campaign-wizard-step-${step}`);
    const validationFailurePromise = form
      .getByRole('alert')
      .first()
      .waitFor({ state: 'visible', timeout: 0 })
      .then(async () => {
        const messages = (await form.getByRole('alert').allTextContents())
          .map((message) => message.trim())
          .filter(Boolean);
        for (const message of messages) {
          this.report.validationFailures.push({
            path: `wizard.step${step}`,
            message,
          });
        }
        throw new Error(
          `Wizard step ${step} validation failed: ${messages.join('; ')}`,
        );
      });

    await this.page.getByRole('button', { name: nextButton, exact: true }).click();
    return Promise.race([mutationPromise, validationFailurePromise]);
  }

  private async saveStep(step: number, nextButton: 'Continue' | 'Review') {
    const responsePromise = this.page.waitForResponse((response) =>
      isMutation(response, 'PATCH', `/api/v2/wizard/steps/${step}`),
    );
    const response = await this.submitStep(step, nextButton, responsePromise);
    await this.requireOk(response, `wizard.step${step}`);
    await this.assertStep(step + 1);
  }

  async openNewCampaign() {
    await this.page.goto('/app/campaigns');
    await expect(
      this.page.getByRole('heading', { name: 'Campaigns', exact: true }),
    ).toBeVisible();
    await this.page
      .getByRole('button', {
        name: /^(New Campaign|Create First Campaign)$/,
      })
      .click();
    await this.assertStep(1);
  }

  async populateStep1() {
    const step = this.fixture.wizard.step1;
    await this.fill('title', step.title);
    await this.chooseCard('marketingTargetType', step.marketingTargetType);
    await this.fill('focusName', step.focusName);
    const countryCode = step.targetMarkets[0] ?? '';
    await this.chooseSearchable('targetMarkets', countryCode);
    await this.chooseSearchable('currency', step.currency);
    // "local" fixtures target the same question as regional.
    const marketScope = step.marketScope === 'local' ? 'regional' : step.marketScope;
    await this.chooseSelectByLabel('marketScope', marketScopeLabel(marketScope, await this.countryName(countryCode)));
    if (marketScope === 'regional') {
      await this.addTags('operationalLocations', step.operationalLocations);
    }
    await this.chooseCard('sourceType', step.sourceType);
    if (step.sourceType === 'manual_only') {
      await expect(this.field('primaryUrl')).toHaveCount(0);
    } else {
      await expect(this.field('primaryUrl')).toBeVisible();
      await this.fill('primaryUrl', step.primaryUrl);
    }

    const campaignResponsePromise = this.page.waitForResponse((response) =>
      isMutation(response, 'POST', '/v1/campaigns'),
    );
    const patchResponsePromise = this.page.waitForResponse((response) =>
      isMutation(response, 'PATCH', '/api/v2/wizard/steps/1'),
    );
    const [campaignResponse] = await this.submitStep(
      1,
      'Continue',
      Promise.all([campaignResponsePromise, patchResponsePromise]),
    );
    await this.requireOk(campaignResponse, 'campaign.create');
    await this.requireOk(await patchResponsePromise, 'wizard.step1');
    const campaignPayload = await campaignResponse.json();
    this.report.campaignId =
      campaignPayload?.data?.id ?? campaignPayload?.id ?? campaignPayload?.data?.campaignId;
    if (!this.report.campaignId) {
      const currentUrl = new URL(this.page.url());
      this.report.campaignId = currentUrl.searchParams.get('draftCampaignId') ?? undefined;
    }
    await this.assertStep(2);
  }

  async populateStep2() {
    const step = this.fixture.wizard.step2;
    // Step 2 prefills the business name once its saved answers load; typing
    // before then is overwritten.
    await this.page.waitForLoadState('networkidle');
    await this.fill('businessName', step.businessName);
    await this.chooseSearchable('industryCategory', step.industryCategory);
    await this.chooseSelect('sellsTo', step.sellsTo);
    await this.chooseSelect('sellsVia', step.sellsVia);
    await this.chooseSelect('audienceModel', step.audienceModel);
    await this.chooseSelect('lifecycleStage', step.lifecycleStage);
    await this.fill('businessDescription', step.businessDescription);
    await this.fill('productCategory', step.productCategory);
    // The wizard offers the step-1 focus as the first product; a fixture that
    // lists its products without it would otherwise go one over the limit.
    const focus = this.fixture.wizard.step1.focusName;
    const prefilled = this.page.getByRole('button', { name: `Remove ${focus}` });
    if (focus && !step.productsServices.includes(focus) && (await prefilled.isVisible())) {
      await prefilled.click();
    }
    await this.addTags('productsServices', step.productsServices);
    await this.fill('priceRangeLow', String(step.priceRangeLow));
    await this.fill('priceRangeHigh', String(step.priceRangeHigh));
    await this.fill('offerSummary', step.offerSummary);
    await this.addTags('differentiators', step.differentiators);
    for (const flag of step.sensitiveCategoryFlags) {
      await this.chooseSensitiveFlag(flag);
    }
    await this.addTags('complianceSensitiveClaims', step.complianceSensitiveClaims);
    if (step.pricePosition) {
      await this.chooseSelect('pricePosition', step.pricePosition);
    }
    await this.saveStep(2, 'Continue');
  }

  async populateStep3() {
    const step = this.fixture.wizard.step3;
    await this.fill('primaryTargetSegment', step.primaryTargetSegment);
    await this.fill('targetPersona', step.targetPersona);
    await this.fill('targetAudience', step.targetAudience);
    // The wizard no longer asks about languages; research runs in English.
    await this.addTags('audienceSegments', step.audienceSegments);
    await this.fill('desiredOutcome', step.desiredOutcome);
    await this.fill('decisionProcess', step.decisionProcess);
    await this.addTags('painPoints', step.painPoints);
    // Not asked of a business that sells only to consumers.
    if (this.fixture.wizard.step2.sellsTo !== 'consumers') {
      await this.addTags('buyerRoles', step.buyerRoles);
    }
    // v3 P6: age and who buys more are asked of consumer businesses.
    if (this.fixture.wizard.step2.sellsTo !== 'businesses') {
      for (const ageRange of step.ageRanges ?? []) {
        await this.chooseCard('ageRanges', ageRange);
      }
      if (step.genderSkew) {
        await this.chooseSelect('genderSkew', step.genderSkew);
      }
    }
    await this.addTags('buyingTriggers', step.buyingTriggers);
    await this.saveStep(3, 'Continue');
  }

  private async populateSalesChannels() {
    const channels = this.fixture.wizard.step4.salesChannels;
    for (let index = 0; index < channels.length; index += 1) {
      await this.page.getByTestId('campaign-wizard-add-salesChannel').click();
      const channel = channels[index];
      await this.chooseSelect(`salesChannels.${index}.channel`, channel.channel);
      await this.field(`salesChannels.${index}.rank`).fill(String(channel.rank));
      await expect(this.field(`salesChannels.${index}.rank`)).toHaveValue(String(channel.rank));
      if (channel.channel === 'other') {
        await this.fill(`salesChannels.${index}.customName`, channel.customName);
      }
      if (channel.salesShare) {
        await this.chooseSelect(`salesChannels.${index}.salesShare`, channel.salesShare);
      }
    }
  }

  async populateStep4() {
    const step = this.fixture.wizard.step4;
    await this.populateSalesChannels();
    await this.chooseSelect('primaryConversionPath', step.primaryConversionPath);

    for (let index = 0; index < (step.socialHandles ?? []).length; index += 1) {
      const handle = step.socialHandles![index];
      await this.page.getByTestId('campaign-wizard-add-socialHandle').click();
      await this.chooseSelect(`socialHandles.${index}.platform`, handle.platform);
      await this.fill(`socialHandles.${index}.handle`, handle.handle);
    }

    for (let index = 0; index < (step.digitalPresenceLinks ?? []).length; index += 1) {
      const link = step.digitalPresenceLinks![index];
      await this.page.getByTestId('campaign-wizard-add-digitalPresenceLink').click();
      await this.chooseSelect(`digitalPresenceLinks.${index}.type`, link.type);
      await this.fill(`digitalPresenceLinks.${index}.url`, link.url);
      await this.fill(`digitalPresenceLinks.${index}.label`, link.label);
    }

    await this.addTags('trustSignals', step.trustSignals);
    if (step.monthlyWebsiteTraffic) {
      await this.chooseSelect('monthlyWebsiteTraffic', step.monthlyWebsiteTraffic);
    }
    if (step.emailListSize) {
      await this.chooseSelect('emailListSize', step.emailListSize);
    }
    if (step.googleAnalyticsConnected !== undefined && step.googleAnalyticsConnected !== '') {
      await this.chooseSelect('googleAnalyticsConnected', String(step.googleAnalyticsConnected));
    }
    // v3 P6: the WhatsApp list is asked in India only.
    if (step.whatsappListSize && this.fixture.wizard.step1.targetMarkets[0] === 'IN') {
      await this.chooseSelect('whatsappListSize', step.whatsappListSize);
    }
    for (const asset of step.existingAssets ?? []) {
      await this.chooseCard('existingAssets', asset);
    }
    await this.saveStep(4, 'Continue');
  }

  async populateStep5() {
    const step = this.fixture.wizard.step5;
    await this.fill('monthlyMarketingBudget', String(step.monthlyMarketingBudget));
    await this.chooseSelect('primaryGoal', step.primaryGoal);
    await this.chooseSelect('marketingHandler', step.marketingHandler);
    await this.chooseSelect('paidAdsShare', step.paidAdsShare);
    await this.chooseSelect('contentCapacity', step.contentCapacity);
    await this.chooseSelect('marketingHoursPerWeek', step.marketingHoursPerWeek);
    await this.chooseSelect('deliveryDeadline', step.deliveryDeadline);
    // Each card toggles. The fixture schema keeps "none" on its own, so every
    // card starts unselected and ends selected.
    for (const capability of step.creativeCapabilities) {
      await this.chooseCard('creativeCapabilities', capability);
    }
    // v3 P6: peak seasons from the market's list, and offers running now.
    for (const season of step.peakSeasons ?? []) {
      await this.chooseCard('peakSeasons', season);
    }
    await this.addTags('currentOffers', step.currentOffers);
    if (this.isLeadGenerationPath()) {
      await this.fill('salesCapacity', step.salesCapacity);
    }
    await this.chooseSelect('knownCompetitorStatus', step.knownCompetitorStatus);
    await this.addTags('constraints', step.constraints);

    for (let index = 0; index < (step.currentMarketingActivity ?? []).length; index += 1) {
      const activity = step.currentMarketingActivity![index];
      await this.page.getByTestId('campaign-wizard-add-currentMarketingActivity').click();
      await this.fill(`currentMarketingActivity.${index}.channel`, activity.channel);
      await this.chooseSelect(`currentMarketingActivity.${index}.status`, activity.status);
      if (activity.workingAssessment) {
        await this.chooseSelect(
          `currentMarketingActivity.${index}.workingAssessment`,
          activity.workingAssessment,
        );
      }
      await this.fill(`currentMarketingActivity.${index}.evidence`, activity.evidence);
      if (activity.monthlySpendAmount !== undefined) {
        await this.fill(
          `currentMarketingActivity.${index}.monthlySpendAmount`,
          String(activity.monthlySpendAmount),
        );
      }
      if (activity.shareOfSpend) {
        await this.chooseSelect(`currentMarketingActivity.${index}.shareOfSpend`, activity.shareOfSpend);
      }
      await this.fill(`currentMarketingActivity.${index}.timeRunning`, activity.timeRunning);
      await this.fill(`currentMarketingActivity.${index}.reasonStopped`, activity.reasonStopped);
    }

    await this.fill('whatsWorking', step.whatsWorking);
    await this.fill('biggestFrustration', step.biggestFrustration);
    await this.fill('pastMarketing', step.pastMarketing);
    await this.addTags('knownCompetitors', step.knownCompetitors);
    await this.addTags('channelsToAvoid', step.channelsToAvoid);
    await this.addTags('channelsStronglyPreferred', step.channelsStronglyPreferred);
    // Execution constraints are now asked in the one Constraints field.
    await this.addTags('constraints', step.executionConstraints);
    await this.fill('additionalContext', step.additionalContext);
    await this.saveStep(5, 'Continue');
  }

  async populateStep6() {
    const step = this.fixture.wizard.step6;
    for (const fieldPath of ['averageOrderValueAmount', 'typicalDealValue', 'monthlyRevenueAmount'] as const) {
      if (step[fieldPath] !== undefined) {
        await this.fill(fieldPath, String(step[fieldPath]));
      }
    }
    for (const fieldPath of [
      'grossMarginPercentage',
      'productCost',
      'monthlyOrdersPerSubscriber',
      'monthlyChurnRate',
    ] as const) {
      await this.fill(fieldPath, step[fieldPath]);
    }
    // Asked by path: the sales cycle on the paths that end in a conversation,
    // the order volume on the rest.
    if (this.isLeadGenerationPath()) {
      await this.fill('salesCycleLength', step.salesCycleLength);
    } else {
      await this.fill('monthlyOrderVolume', step.monthlyOrderVolume);
    }
    // Gross margin has no opt-out, so the wizard cannot be saved without it.
    // It comes from the fixture rather than a default here: a single default
    // would mean every campaign exercised the same economics.
    if (!step.grossMarginBand) {
      throw new Error('Fixture is missing grossMarginBand; step 6 cannot be saved without it.');
    }
    await this.chooseSelect('grossMarginBand', step.grossMarginBand);
    if (step.closeRateBand && this.isLeadGenerationPath()) {
      await this.chooseSelect('closeRateBand', step.closeRateBand);
    }
    // Optional on the backend, required by the wizard form before step 6 saves.
    if (!step.paybackWindow) {
      throw new Error('Fixture is missing paybackWindow; step 6 cannot be saved without it.');
    }
    await this.chooseSelect('paybackWindow', step.paybackWindow);
    if (step.avgCustomerRetention) {
      await this.chooseSelect('avgCustomerRetention', step.avgCustomerRetention);
    }
    if (step.repeatPurchaseFrequency) {
      await this.chooseSelect('repeatPurchaseFrequency', step.repeatPurchaseFrequency);
    }
    // v3 P6.
    if (step.customerAcquisitionCost !== undefined) {
      await this.fill('customerAcquisitionCost', String(step.customerAcquisitionCost));
    }
    if (step.subscriptionOffered !== undefined) {
      await this.chooseSelect('subscriptionOffered', step.subscriptionOffered ? 'yes' : 'no');
      if (step.subscriptionOffered && step.subscriberMonths !== undefined) {
        await this.fill('subscriberMonths', String(step.subscriberMonths));
      }
    }
    await this.saveStep(6, 'Review');
  }

  private reviewSection(name: string) {
    return this.page.getByTestId(
      `campaign-wizard-review-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    );
  }

  private async assertReviewContains(section: Locator, values: Array<string | undefined>) {
    for (const value of values) {
      if (value) {
        await expect(section.getByText(value, { exact: false }).first()).toBeVisible();
      }
    }
  }

  /** One answer on the review, read under its label. */
  private async assertReviewField(section: Locator, label: string, expected: string) {
    const value = section.locator(`xpath=.//p[normalize-space()="${label}"]/following-sibling::p[1]`);
    await expect(value, `Review "${label}"`).toContainText(expected);
  }

  /** Whether the fixture's conversion path ends in a conversation (v3 P2). */
  private isLeadGenerationPath() {
    return ['lead_form', 'book_call', 'book_demo', 'whatsapp'].includes(
      this.fixture.wizard.step4.primaryConversionPath,
    );
  }

  async validateReview() {
    const { step1, step2, step3, step5, step6 } = this.fixture.wizard;
    const labels = await this.labels();
    // Amounts read as the review shows them: "£2,500", "₹15,00,000".
    const money = (amount: number | undefined) =>
      amount === undefined ? undefined : (formatMoney({ amount, currency: step1.currency }) ?? undefined);
    await this.assertReviewContains(this.reviewSection('Focus'), [
      step1.title,
      step1.focusName,
      ...step1.targetMarkets.map((code) => labels.country(code)),
    ]);
    await this.assertReviewContains(this.reviewSection('Business'), [
      step2.businessName,
      step2.productCategory,
      ...step2.productsServices,
      money(step2.priceRangeLow),
    ]);
    await this.assertReviewContains(this.reviewSection('Audience'), [
      step3.primaryTargetSegment,
      step3.targetPersona,
      ...step3.painPoints,
      step3.desiredOutcome,
    ]);
    // The review shows option answers by their served labels, not their values.
    const optionLabel = (field: string, value: string) => labels.reviewLabel(field, value, this.market);
    await this.assertReviewContains(this.reviewSection('Goals & Context'), [
      money(step5.monthlyMarketingBudget),
      optionLabel('paidAdsShare', step5.paidAdsShare),
      optionLabel('marketingHoursPerWeek', step5.marketingHoursPerWeek),
      ...step5.creativeCapabilities.map((value) => optionLabel('creativeCapabilities', value)),
      optionLabel('deliveryDeadline', step5.deliveryDeadline),
      step5.salesCapacity,
      ...(step5.knownCompetitors ?? []),
    ]);
    // A "Don't know" answer is listed as a gap, with a way back to it (v3 P2).
    if (step5.contentCapacity === 'unknown') {
      const gaps = this.page.getByTestId('wizard-review-gaps');
      await expect(gaps).toBeVisible();
      await expect(gaps).toContainText('Content capacity');
    }
    await this.assertReviewContains(this.reviewSection('Economics'), [
      money(step6.averageOrderValueAmount),
      money(step6.typicalDealValue),
      money(step6.monthlyRevenueAmount),
      optionLabel('paybackWindow', step6.paybackWindow),
    ]);
    await this.validateNewAnswersOnReview(money, optionLabel);
  }

  /** v3 P6: each newer answer the fixture gives is on the review, under its label. */
  private async validateNewAnswersOnReview(
    money: (amount: number | undefined) => string | undefined,
    optionLabel: (field: string, value: string) => string,
  ) {
    const { step1, step2, step3, step4, step5, step6 } = this.fixture.wizard;
    const business = this.reviewSection('Business');
    const audience = this.reviewSection('Audience');
    const goals = this.reviewSection('Goals & Context');
    const economics = this.reviewSection('Economics');

    if (step2.pricePosition) {
      await this.assertReviewField(business, 'Price position', optionLabel('pricePosition', step2.pricePosition));
    }
    for (const channel of step4.salesChannels) {
      if (channel.salesShare) {
        await this.assertReviewField(business, 'Sales channels', `(${optionLabel('salesShare', channel.salesShare)} of sales)`);
      }
    }
    if (step2.sellsTo !== 'businesses') {
      for (const ageRange of step3.ageRanges ?? []) {
        await this.assertReviewField(audience, 'Age groups', optionLabel('ageRanges', ageRange));
      }
      if (step3.genderSkew) {
        await this.assertReviewField(audience, 'Who buys more', optionLabel('genderSkew', step3.genderSkew));
      }
    }
    for (const trigger of step3.buyingTriggers ?? []) {
      await this.assertReviewField(audience, 'Buying triggers', trigger);
    }
    for (const season of step5.peakSeasons ?? []) {
      await this.assertReviewField(goals, 'Peak seasons', optionLabel('peakSeasons', season));
    }
    for (const offer of step5.currentOffers ?? []) {
      await this.assertReviewField(goals, 'Offers running now', offer);
    }
    for (const activity of step5.currentMarketingActivity ?? []) {
      if (activity.shareOfSpend) {
        await this.assertReviewField(
          goals,
          'Current marketing activity',
          `${activity.channel} (${activity.status})`,
        );
        await this.assertReviewField(
          goals,
          'Current marketing activity',
          `${optionLabel('shareOfSpend', activity.shareOfSpend)} of spend`,
        );
      }
    }
    // The WhatsApp list is asked, and shown, in India only.
    if (step1.targetMarkets[0] === 'IN') {
      if (step4.whatsappListSize) {
        await this.assertReviewField(
          economics,
          'WhatsApp list size',
          optionLabel('whatsappListSize', step4.whatsappListSize),
        );
      }
    } else {
      await expect(economics.getByText('WhatsApp list size', { exact: true })).toHaveCount(0);
    }
    for (const asset of step4.existingAssets ?? []) {
      await this.assertReviewField(economics, 'Already running', optionLabel('existingAssets', asset));
    }
    const acquisitionCost = money(step6.customerAcquisitionCost);
    if (acquisitionCost) {
      await this.assertReviewField(economics, 'Cost to win a customer', acquisitionCost);
    }
    if (step6.subscriptionOffered !== undefined) {
      await this.assertReviewField(
        economics,
        'Customers subscribe',
        step6.subscriptionOffered
          ? step6.subscriberMonths !== undefined
            ? `Yes, for about ${step6.subscriberMonths} months`
            : 'Yes'
          : 'No',
      );
    }
  }

  /**
   * V3-32: back on step 1 of a saved campaign, picks another country and
   * currency. The country notice names both countries and goes when the
   * saved one is picked again; the currency notice says typed amounts keep
   * their numbers. Saves step 1 with the new answers.
   */
  async changeCountryAndCurrency(countryCode: string, currency: string) {
    const savedCode = this.fixture.wizard.step1.targetMarkets[0] ?? '';
    const savedCountry = await this.countryName(savedCode);
    const nextCountry = await this.countryName(countryCode);
    await this.page.getByRole('button', { name: 'Back', exact: true }).click();
    await this.assertStep(1);
    const countryNotice = this.page.getByTestId('wizard-country-change-notice');
    await expect(countryNotice).toHaveCount(0);

    await this.chooseSearchable('targetMarkets', countryCode);
    await expect(countryNotice).toContainText(`You changed the country from ${savedCountry} to ${nextCountry}.`);
    // Back to the saved country, no notice; then the new one again.
    await this.chooseSearchable('targetMarkets', savedCode);
    await expect(countryNotice).toHaveCount(0);
    await this.chooseSearchable('targetMarkets', countryCode);
    await expect(countryNotice).toBeVisible();
    this.market = countryCode;

    await this.chooseSearchable('currency', currency);
    await expect(this.page.getByTestId('wizard-currency-change-notice')).toHaveText(
      `Amounts you have already entered keep their numbers and are read in ${currency} when you save.`,
    );
    // A national scope names the country, so it is picked again for the new one.
    if (this.fixture.wizard.step1.marketScope === 'national') {
      await this.chooseSelectByLabel('marketScope', marketScopeLabel('national', nextCountry));
    }
    await this.saveStep(1, 'Continue');
    return { savedCountry, nextCountry };
  }

  /** On steps 4 and 5, the reminder that their answers were given for the old country. */
  async expectCountryChangeReminder(savedCountry: string, nextCountry: string) {
    const reminder = this.page.getByTestId('wizard-country-change-reminder');
    await expect(reminder).toContainText(`These answers were given for ${savedCountry}.`);
    await expect(reminder).toContainText(nextCountry);
  }

  private async setReviewCheckbox(testId: string, desired: boolean) {
    const checkbox = this.page.getByTestId(testId);
    await expect(checkbox).toBeVisible();
    const checked = await checkbox.isChecked();
    if (checked !== desired) {
      await checkbox.click();
    }
    if (desired) {
      await expect(checkbox).toBeChecked();
    } else {
      await expect(checkbox).not.toBeChecked();
    }
  }

  async confirmReview() {
    const step = this.fixture.wizard.step7;
    await this.setReviewCheckbox('wizard-confirm-focus', step.confirmFocus);
    await this.setReviewCheckbox('wizard-confirm-business', step.confirmBusiness);
    await this.setReviewCheckbox('wizard-confirm-audience', step.confirmAudience);
    await this.setReviewCheckbox('wizard-confirm-goals', step.confirmGoals);
    await this.setReviewCheckbox('wizard-confirm-economics', step.confirmEconomics);
    await this.setReviewCheckbox('wizard-ready-to-generate', step.readyToGenerate);

    // V3-63: consents are given at sign-up and changed on the account page;
    // the last step states how AI is used and asks for none. A consent row
    // is ticked only if one is shown.
    await expect(this.page.getByTestId('ai-processing-notice')).toBeVisible();
    for (const [testId, desired] of [
      ['wizard-consent-privacy-processing', step.privacyProcessingConsent],
      ['wizard-consent-ai-processing', step.aiProcessingConsent],
      ['wizard-consent-benchmark-data', step.dataConsentOptIn],
    ] as const) {
      const checkbox = this.page.getByTestId(testId);
      if (!(await checkbox.isVisible())) {
        continue;
      }
      const current = await checkbox.isChecked();
      if (current !== desired) {
        const [consentResponse] = await Promise.all([
          this.page.waitForResponse((response) => {
            const pathname = responsePath(response);
            return (
              response.request().method() === 'POST' &&
              ['/api/v2/legal/consents/give', '/api/v2/legal/consents/withdraw'].includes(pathname)
            );
          }),
          checkbox.click(),
        ]);
        await this.requireOk(consentResponse, `legal-consent.${testId}`);
      }
      await this.setReviewCheckbox(testId, desired);
    }
  }

  async captureReviewOnly() {
    const screenshotPath = path.resolve(
      process.cwd(),
      'e2e',
      'results',
      'campaigns',
      `${this.fixture.slug}-final-review.png`,
    );
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.report.status = 'review-only';
    this.report.finalUrl = this.page.url();
    this.report.screenshot = screenshotPath;
  }

  async submit() {
    const commitResponsePromise = this.page.waitForResponse((response) =>
      isMutation(response, 'POST', '/api/v2/wizard/commit'),
    );
    await this.page.getByRole('button', { name: 'Generate Strategy', exact: true }).click();
    await expect(
      this.page.getByRole('heading', { name: 'Generate Strategy?', exact: true }),
    ).toBeVisible();
    await this.page.getByRole('button', { name: 'Confirm', exact: true }).click();
    const commitResponse = await commitResponsePromise;
    await this.requireOk(commitResponse, 'wizard.commit');
    const payload = await commitResponse.json();
    const data = payload?.data ?? payload;
    if (data?.commitAccepted !== true) {
      throw new Error('Wizard commit response did not report commitAccepted=true');
    }
    this.report.pipelineRunId = data?.pipelineRunId ?? data?.run?.runId;
    this.report.strategyId =
      data?.strategyId ?? data?.strategy?.id ?? data?.strategyRunId ?? undefined;
    await this.page.waitForURL((url) => {
      const campaignId = this.report.campaignId;
      return Boolean(campaignId && url.pathname.includes(`/app/campaigns/${campaignId}/`));
    });
    this.report.finalUrl = this.page.url();
    const screenshotPath = path.resolve(
      process.cwd(),
      'e2e',
      'results',
      'campaigns',
      `${this.fixture.slug}-submitted.png`,
    );
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.report.screenshot = screenshotPath;
    this.report.status = 'submitted';
  }
}
