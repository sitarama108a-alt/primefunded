
'use client';

import { useDoc } from '@/firebase';
import { useMemo } from 'react';

export interface BrandSettings {
  logoUrl?: string;
  siteName?: string;
}

/**
 * Hook to retrieve global branding settings from Firestore.
 * Defaults to institutional PrimeFunded branding if no custom settings exist.
 */
export function useBrandSettings() {
  const { data, loading } = useDoc<BrandSettings>('settings/brand');

  const branding = useMemo(() => {
    return {
      logoUrl: data?.logoUrl || 'https://picsum.photos/seed/pflogo-blue-silver/400/400',
      siteName: data?.siteName || 'PrimeFunded',
      loading
    };
  }, [data, loading]);

  return branding;
}
