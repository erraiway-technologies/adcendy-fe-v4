# Self-hosted fonts

Outfit (weights 100–900) and Geist Mono (400–500), the site's two families, and
Inter, Space Grotesk and DM Sans (400–700), which only the older landing designs
(v1, v2) still name, as variable-weight WOFF2 files in the Latin and Latin
Extended subsets Google Fonts serves. They are declared in
`app/fonts.css` with each subset's `unicode-range`, so a browser fetches only
the files a page's characters need.

They live here so the build never depends on `fonts.googleapis.com`: Next.js
fetched them at build time, and a response it could not parse failed the
container build in CI (2026-09-27).

All five are licensed under the SIL Open Font License 1.1, which permits
bundling and self-hosting:

- Inter — https://github.com/rsms/inter
- Space Grotesk — https://github.com/floriankarsten/space-grotesk
- DM Sans — https://github.com/googlefonts/dm-fonts
- Outfit — https://github.com/Outfitio/Outfit-Fonts
- Geist Mono — https://github.com/vercel/geist-font

To refresh them, request `https://fonts.googleapis.com/css2?family=<Family>:wght@400..700&display=swap`
(the weight range each family is declared with in `app/fonts.css`)
with a current browser's User-Agent and replace the `latin` and `latin-ext` files.
