import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://miyage.dev",
  trailingSlash: "never",
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Geist",
      cssVariable: "--font-sans",
      weights: ["300 500"],
      styles: ["normal"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Noto Sans JP",
      cssVariable: "--font-jp",
      weights: ["400"],
      fallbacks: ["sans-serif"],
      options: { experimental: { glyphs: ["土", "産"] } },
    },
  ],
});
