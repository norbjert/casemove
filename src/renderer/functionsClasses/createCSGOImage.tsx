let imageLookup: Record<string, string> | null = null;

fetch('https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/images.json')
  .then((r) => r.json())
  .then((data) => {
    imageLookup = data;
  })
  .catch((err) => {
    console.error('Could not load CS2 image lookup:', err.message);
  });

export function createCSGOImage(urlEndpath: string): string {
  if (!urlEndpath) return '';
  if (imageLookup) {
    const direct = imageLookup[urlEndpath];
    if (direct) return direct;
    // Code generates _light_large but lookup uses _light — strip _large
    const stripped = imageLookup[urlEndpath.replace(/_large$/, '')];
    if (stripped) return stripped;
  }
  return '';
}
