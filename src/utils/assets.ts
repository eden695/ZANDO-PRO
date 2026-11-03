import defaultLogoUrl from '../assets/images/zando_app_logo_1793623512765.jpg';
import sneakersImgUrl from '../assets/images/product_sneakers_urban_1793623513405.jpg';
import smartwatchImgUrl from '../assets/images/product_smartwatch_elite_1793623514396.jpg';
import leatherBagImgUrl from '../assets/images/product_leather_bag_1793623514277.jpg';

export {
  defaultLogoUrl,
  sneakersImgUrl,
  smartwatchImgUrl,
  leatherBagImgUrl,
};

/**
 * Sanitizes image URLs to prevent broken image errors in production and GitHub Pages.
 * Automatically resolves bundled Vite asset hashes and replaces legacy '/src/assets/' paths.
 */
export function getValidImageUrl(url: string | undefined | null, fallback = defaultLogoUrl): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  // Already a base64 data image or remote URL
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Legacy hardcoded dev paths from older localStorage sessions
  if (url.includes('zando_app_logo')) {
    return defaultLogoUrl;
  }
  if (url.includes('sneakers_urban')) {
    return sneakersImgUrl;
  }
  if (url.includes('smartwatch_elite')) {
    return smartwatchImgUrl;
  }
  if (url.includes('leather_bag')) {
    return leatherBagImgUrl;
  }

  // Generic fallback if starting with non-bundled /src/
  if (url.startsWith('/src/')) {
    return fallback;
  }

  return url;
}
