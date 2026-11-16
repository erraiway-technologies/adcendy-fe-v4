import assert from 'node:assert/strict';
import test from 'node:test';
import { draftWizardAddressStepV2 } from '../../shared/components/campaigns/draftWizardAddress.ts';
import { optionSelectChange } from '../../shared/components/campaigns/optionSelectChange.ts';

// V3-369 (2026-11-15). Two wizard faults: a closed draft wizard stayed on
// screen (the old address reopened it, and nothing closed it once the address
// changed), and a saved dropdown answer was cleared when it arrived before the
// dropdown's options (the hidden native select sent an empty change).

const rng = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

test('property: a dropdown passes on every real choice and never clears itself', () => {
  const r = rng(7);
  const values = ['', 'about_same', 'cheaper', 'premium', ' ', 'x'];
  for (let i = 0; i < 500; i += 1) {
    const next = values[Math.floor(r() * values.length)];
    const seen: string[] = [];
    optionSelectChange(next, (value) => seen.push(value));
    assert.deepEqual(seen, next.length > 0 ? [next] : [], JSON.stringify(next));
  }
});

// The page as a small model: the address, the open wizard, and the two refs.
// Each step is something that happens; after every step the page looks at
// the address the way the effect does.
type Page = {
  address: string | null;
  open: string | null | undefined; // undefined: no wizard; null: a new campaign's wizard
  closing: string | null;
  previous: string | null;
};

function look(page: Page): Page {
  const step = draftWizardAddressStepV2({
    draftCampaignId: page.address,
    closingDraftId: page.closing,
    openDraftId: page.open ?? null,
    previousDraftCampaignId: page.previous,
  });
  const next = { ...page, previous: page.address };
  if (step === 'ignore') return next;
  if (step === 'close' || step === 'none') {
    return { ...next, closing: null, open: step === 'close' ? undefined : page.open };
  }
  return { ...next, open: page.address };
}

test('property: a closed draft wizard never reopens from its old address, and the wizard follows the address', () => {
  const r = rng(11);
  const drafts = ['d1', 'd2', 'd3'];
  for (let run = 0; run < 2000; run += 1) {
    let page: Page = { address: null, open: undefined, closing: null, previous: null };
    for (let step = 0; step < 12; step += 1) {
      const roll = r();
      const draft = drafts[Math.floor(r() * drafts.length)];
      if (roll < 0.3) {
        // Open a draft: the wizard first, then the address catches up.
        page = look({ ...page, open: draft });
        page = look({ ...page, address: draft });
        assert.equal(page.open, draft, `run ${run}: an opened draft stays open`);
      } else if (roll < 0.6 && page.open !== undefined) {
        // Close: the wizard clears, the page looks while the old address
        // still names the draft, then the address changes.
        const closed = page.address;
        page = look({ ...page, closing: page.address, open: undefined });
        assert.equal(page.open, undefined, `run ${run}: closing never reopens ${closed}`);
        page = look({ ...page, address: null });
        assert.equal(page.open, undefined, `run ${run}: closed stays closed`);
      } else if (roll < 0.8) {
        // The address changes on its own (back button, a link).
        const to = r() < 0.5 ? null : draft;
        const before = page.open;
        page = look({ ...page, address: to });
        if (to === null && before !== null && before !== undefined) {
          assert.equal(page.open, undefined, `run ${run}: the wizard closes when the address stops naming its draft`);
        }
        if (to !== null) {
          assert.equal(page.open, to, `run ${run}: the wizard follows the address`);
        }
      } else {
        // A new campaign's wizard, with no draft yet, is never closed by the address.
        page = look({ ...page, open: null, address: null });
        page = look(page);
        assert.equal(page.open, null, `run ${run}: a new campaign's wizard stays open`);
      }
    }
  }
});
