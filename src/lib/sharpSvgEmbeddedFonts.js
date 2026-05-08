/**
 * Sharp uses librsvg on Linux/serverless images. Subset WOFF + unicode-range
 * often fails (missing glyphs → colored "tofu" boxes per <tspan>).
 *
 * Embed the full Noto Sans variable TTF (latin, latin-ext, and more) as a
 * single data URL with format('truetype') for reliable text rasterization.
 *
 * Font file: public/fonts/NotoSans-wdth-wght.ttf (OFL — see NotoSans-OFL.txt)
 */

import path from "path";
import fs from "fs/promises";

/** Use this in SVG font-family where you previously used Arial. */
export const SHARP_SVG_FONT_FAMILY = "NotoSansSharp";

const FONT_FILENAME = "NotoSans-wdth-wght.ttf";

let defsPromise = null;

function fontPath() {
  return path.join(process.cwd(), "public", "fonts", FONT_FILENAME);
}

/**
 * @returns {Promise<string>} Fragment to place inside <defs>…</defs> (includes <style CDATA>).
 */
export async function getEmbeddedNotoSansFontDefs() {
  if (!defsPromise) {
    defsPromise = (async () => {
      const full = fontPath();
      let buf;
      try {
        buf = await fs.readFile(full);
      } catch (e) {
        throw new Error(
          `Magic QR / insights SVG fonts: missing ${FONT_FILENAME}. Expected at ${full} (commit public/fonts/ from repo). ${e?.message || e}`
        );
      }
      const b64 = buf.toString("base64");
      const rule = `@font-face{font-family:'${SHARP_SVG_FONT_FAMILY}';font-style:normal;font-weight:100 900;src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
      return `<style type="text/css"><![CDATA[\n${rule}\n]]></style>`;
    })();
  }
  return defsPromise;
}
