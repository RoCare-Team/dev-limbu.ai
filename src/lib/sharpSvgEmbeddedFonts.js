/**
 * Sharp renders SVG with librsvg on Linux/serverless images where Arial is missing,
 * which produces "tofu" boxes for text. Embed Noto Sans from @fontsource/noto-sans
 * as data URLs inside <defs><style> so rasterization matches localhost.
 *
 * @see https://github.com/lovell/sharp/issues (SVG text / fonts on Linux)
 */

import path from "path";
import fs from "fs/promises";

/** Use this in SVG font-family where you previously used Arial. */
export const SHARP_SVG_FONT_FAMILY = "NotoSansSharp";

let defsPromise = null;

const FACES = [
  {
    weight: 400,
    file: "noto-sans-latin-400-normal.woff",
    unicodeRange:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
  {
    weight: 400,
    file: "noto-sans-latin-ext-400-normal.woff",
    unicodeRange:
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
  {
    weight: 700,
    file: "noto-sans-latin-700-normal.woff",
    unicodeRange:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
  {
    weight: 700,
    file: "noto-sans-latin-ext-700-normal.woff",
    unicodeRange:
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
  {
    weight: 900,
    file: "noto-sans-latin-900-normal.woff",
    unicodeRange:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
  {
    weight: 900,
    file: "noto-sans-latin-ext-900-normal.woff",
    unicodeRange:
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
];

/**
 * @returns {Promise<string>} Fragment to place inside <defs>…</defs> (includes <style CDATA>).
 */
export async function getEmbeddedNotoSansFontDefs() {
  if (!defsPromise) {
    defsPromise = (async () => {
      const dir = path.join(process.cwd(), "node_modules", "@fontsource", "noto-sans", "files");
      const rules = [];
      for (const { weight, file, unicodeRange } of FACES) {
        const full = path.join(dir, file);
        const buf = await fs.readFile(full);
        const b64 = buf.toString("base64");
        rules.push(
          `@font-face{font-family:'${SHARP_SVG_FONT_FAMILY}';font-weight:${weight};font-style:normal;src:url(data:font/woff;base64,${b64}) format('woff');unicode-range:${unicodeRange};}`
        );
      }
      return `<style type="text/css"><![CDATA[\n${rules.join("\n")}\n]]></style>`;
    })();
  }
  return defsPromise;
}
