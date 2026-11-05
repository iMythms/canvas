# Social sharing

Canonical URL: https://canvas.myth.am/. Sharing metadata is in `index.html` so crawlers can read it before JavaScript runs. `public/robots.txt` advertises the root-only `public/sitemap.xml`.

The preview asset is `public/og-image.png` (1200 × 630, PNG). Keep the dimensions and MIME type in the Open Graph metadata consistent if replacing it. The image is public branding; it contains no user document content. In-app theme color remains managed by the existing appearance code.

Generated with the built-in imagegen tool, then exported at 1200 × 630. Prompt used:

```text
Use case: ads-marketing.
Asset type: final production Open Graph social sharing banner for Canvas, a browser-local workspace for notes, code, whiteboard drawing, text/code comparison and JSON formatting. Landscape aspect ratio exactly 1200:630 (1.9048:1), full-bleed flat graphic.
Primary request: a beautifully restrained developer-tool brand card with confident, very legible Swiss/Geist-style typography. No fake interface screenshot.
Scene/backdrop: very dark matte Ayu navy #0b0e14, quiet subtle fine grid on the right half only. No photographic texture. Airy premium composition with generous 80px safe margins.
Composition: top left a small app logo beside large ivory wordmark "Canvas". Below, a large two-line headline: first line "Notes. Code." second line "Draw. Compare." Lower left a smaller muted supporting line "Your workspace. In your browser." and near bottom left tiny readable "canvas.myth.am". Strong hierarchy, optically aligned left, ample negative space.
Logo: simple flat rounded-square charcoal note icon. Inside: upper left orange dot next to a short gray horizontal rounded line at the top; blue code symbol </> centered; lower left green dot next to matching short gray horizontal rounded line at the bottom. No pen or pencil. Mark is simple, crisp, same visual proportions as a 64px square rounded to 17px radius.
Right half: elegant sparse abstract accent using a few thin rounded outline shapes, a small blue code bracket motif and one mustard yellow rounded shape, subtly echoing note cards and a whiteboard sketch. Keep these subordinate and away from text. Restrained #72b0ff blue and #e6b450 mustard yellow, ivory #e6e1cf. Flat 2D editorial graphic. No 3D, no gradients, no glows, no floating app windows, no fake data, no extra icons, no people.
Text must be EXACT, with no additional words: "Canvas", "Notes. Code.", "Draw. Compare.", "Your workspace. In your browser.", "canvas.myth.am".
Professional final raster banner. All text entirely visible, crisp, carefully kerned, no border around entire image, no watermark.
```

After publishing, verify the canonical page, image, robots, and sitemap return successfully at the production domain. Messaging apps may cache earlier previews; local checks do not verify their production rendering.

