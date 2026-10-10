# Brand images

The logo files the app renders, imported rather than served from `public/`:
an imported image is published under `/_next/static/media/` with a hash of its
contents in the file name, so a changed logo reaches every visitor at once.
A file in `public/` keeps its URL, and the CDN tells browsers to keep it for
hours - a fixed logo stayed cut off for anyone who had seen the old one.

- `adcendy-mark.svg` - the mark alone (first-load splash, loading states).
- `adcendy-logo.svg` - mark and name (site header and footer, app shell).

Both are cropped to the artwork's measured bounds in the 1024 × 1024 originals
(`public/Adcendy logo no Name.svg`, `public/Adcendy logo.svg`), with even
padding. The tab icon is `app/icon.svg`, which Next.js links with a hash too.
