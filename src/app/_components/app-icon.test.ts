import { expect, test } from "vitest";
import { tabIconSvg } from "./app-icon";

// app/icon.svg is a static file (so Next emits sizes="any", which code-generated icons can't), but
// it's generated from the logo paths. After changing the mark, run `pnpm test -u` to regenerate it,
// then re-rasterise app/favicon.ico (16/32/48px) from it.
test("app/icon.svg matches the logo", async () => {
  await expect(tabIconSvg()).toMatchFileSnapshot("../icon.svg");
});
