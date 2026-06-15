'use client';

import { useDoc } from '@/firebase';
import { useMemo } from 'react';

export interface BrandSettings {
  logoUrl?: string;
  siteName?: string;
  discordUrl?: string;
  instagramUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
}

/**
 * Hook to retrieve global branding and community settings from Firestore.
 * Standardized to the 'settings/branding' document.
 */
export function useBrandSettings() {
  const { data, loading } = useDoc<BrandSettings>('settings/branding');

  const branding = useMemo(() => {
    return {
      logoUrl: data?.logoUrl || 'https://picsum.photos/seed/pflogo-blue-silver/400/400',
      siteName: data?.siteName || 'PrimeFunded',
      discordUrl: data?.discordUrl || '',
      instagramUrl: data?.instagramUrl || '',
      telegramUrl: data?.telegramUrl || '',
      whatsappUrl: data?.whatsappUrl || '',
      loading
    };
  }, [data, loading]);

  return branding;
}
