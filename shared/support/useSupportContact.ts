'use client';

import { useRuntimeConfigReady } from '@/shared/runtime-config/features';
import { getSupportContact, type SupportContact } from './support-contact';

/**
 * The support contact for pages the server renders. The server has no runtime
 * configuration, so the first render - on the server and during hydration -
 * shows none; the link appears once the browser's configuration is ready.
 * Reading it directly during render would make the two disagree.
 */
export function useSupportContact(): SupportContact | null {
  return useRuntimeConfigReady() ? getSupportContact() : null;
}
