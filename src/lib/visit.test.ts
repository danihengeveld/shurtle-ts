import { userAgentFromString } from "next/server";
import { describe, expect, it } from "vitest";
import {
  browserName,
  deviceTypeOf,
  isBotUserAgent,
  osName,
  referrerHost,
  toVisit,
} from "./visit";

const UA = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  ipad: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  cubot:
    "Mozilla/5.0 (Linux; Android 11; CUBOT X50) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
};

describe("referrerHost", () => {
  it("keeps only the host, lowercased and without www", () => {
    expect(referrerHost("https://WWW.Example.com/some/path?q=secret#x")).toBe(
      "example.com",
    );
    expect(referrerHost("http://blog.example.org/")).toBe("blog.example.org");
  });

  it("is null for direct visits and anything that isn't a web or app origin", () => {
    expect(referrerHost(null)).toBeNull();
    expect(referrerHost(undefined)).toBeNull();
    expect(referrerHost("")).toBeNull();
    expect(referrerHost("not a url")).toBeNull();
    expect(referrerHost("file:///Users/me/notes.html")).toBeNull();
    expect(referrerHost("chrome-extension://abcdef/popup.html")).toBeNull();
  });

  it("folds link wrappers and mobile hosts into their site", () => {
    expect(referrerHost("https://t.co/AbC123")).toBe("x.com");
    expect(referrerHost("https://twitter.com/")).toBe("x.com");
    expect(referrerHost("https://l.facebook.com/l.php?u=…")).toBe(
      "facebook.com",
    );
    expect(referrerHost("https://lm.facebook.com/")).toBe("facebook.com");
    expect(referrerHost("https://lnkd.in/xyz")).toBe("linkedin.com");
    expect(referrerHost("https://out.reddit.com/t3_x")).toBe("reddit.com");
  });

  it("counts every country's search engine as one", () => {
    expect(referrerHost("https://www.google.nl/")).toBe("google.com");
    expect(referrerHost("https://www.google.co.uk/")).toBe("google.com");
    expect(referrerHost("https://google.com.au/")).toBe("google.com");
    expect(referrerHost("https://www.bing.com/")).toBe("bing.com");
    // Not a search engine, just a similar name.
    expect(referrerHost("https://googleblog.com/")).toBe("googleblog.com");
  });

  it("names Android apps, falling back to the package name", () => {
    expect(referrerHost("android-app://com.slack/")).toBe("slack.com");
    expect(referrerHost("android-app://com.google.android.gm/")).toBe(
      "mail.google.com",
    );
    expect(referrerHost("android-app://com.example.reader/")).toBe(
      "com.example.reader",
    );
  });

  it("caps very long hosts at the column length", () => {
    const host = `${"a".repeat(60)}.${"b".repeat(60)}.${"c".repeat(60)}.${"d".repeat(60)}.${"e".repeat(20)}.com`;
    expect(referrerHost(`https://${host}/`)).toHaveLength(255);
  });
});

describe("isBotUserAgent", () => {
  it("trusts Next's flag", () => {
    expect(isBotUserAgent(UA.macChrome, true)).toBe(true);
  });

  it("catches link previews, crawlers and HTTP clients Next misses", () => {
    for (const ua of [
      "TelegramBot (like TwitterBot)",
      "Slack-ImgProxy (+https://api.slack.com/robots)",
      "Mozilla/5.0 (compatible; Embedly/0.2; +http://support.embed.ly/)",
      "Iframely/1.3.1 (+https://iframely.com/docs/about)",
      "http.rb/5.1.1 (Mastodon/4.3.0; +https://mastodon.social/)",
      "Mozilla/5.0 (compatible; Bluesky Cardyb/1.1; +mailto:support@bsky.app)",
      "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
      "curl/8.7.1",
      "Wget/1.21.4",
      "python-requests/2.32.3",
      "Go-http-client/2.0",
      "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
      "",
      "   ",
    ]) {
      expect(isBotUserAgent(ua), ua).toBe(true);
    }
  });

  it("leaves people's browsers alone, including phones with 'bot' in their name", () => {
    for (const ua of Object.values(UA)) {
      expect(isBotUserAgent(ua, userAgentFromString(ua).isBot), ua).toBe(false);
    }
  });
});

describe("deviceTypeOf", () => {
  it("reads an empty type as desktop", () => {
    expect(deviceTypeOf(undefined)).toBe("desktop");
    expect(deviceTypeOf("")).toBe("desktop");
  });

  it("keeps mobile and tablet, and groups the rest", () => {
    expect(deviceTypeOf("mobile")).toBe("mobile");
    expect(deviceTypeOf("tablet")).toBe("tablet");
    expect(deviceTypeOf("smarttv")).toBe("other");
    expect(deviceTypeOf("console")).toBe("other");
    expect(deviceTypeOf("wearable")).toBe("other");
  });
});

describe("browser and OS names", () => {
  it("merges mobile variants into their browser", () => {
    expect(browserName("Mobile Safari")).toBe("Safari");
    expect(browserName("Mobile Chrome")).toBe("Chrome");
    expect(browserName("Firefox")).toBe("Firefox");
    expect(browserName(undefined)).toBeNull();
    expect(browserName("  ")).toBeNull();
  });

  it("uses today's OS names", () => {
    expect(osName("Mac OS")).toBe("macOS");
    expect(osName("Chromium OS")).toBe("ChromeOS");
    expect(osName("Ubuntu")).toBe("Linux");
    expect(osName("iOS")).toBe("iOS");
  });
});

describe("toVisit", () => {
  const visit = (ua: string, referer: string | null = null) =>
    toVisit(userAgentFromString(ua), referer);

  it("describes real browsers", () => {
    expect(visit(UA.iphone, "https://t.co/abc")).toEqual({
      referrer: "x.com",
      device: "mobile",
      browser: "Safari",
      os: "iOS",
      isBot: false,
    });
    expect(visit(UA.ipad)).toMatchObject({ device: "tablet", os: "iOS" });
    expect(visit(UA.macChrome)).toMatchObject({
      referrer: null,
      device: "desktop",
      browser: "Chrome",
      os: "macOS",
    });
    expect(visit(UA.windowsEdge)).toMatchObject({
      browser: "Edge",
      os: "Windows",
    });
    expect(visit(UA.androidChrome)).toMatchObject({
      device: "mobile",
      browser: "Chrome",
      os: "Android",
    });
  });

  it("flags link previews", () => {
    expect(
      visit("Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"),
    ).toMatchObject({ isBot: true });
    expect(visit("WhatsApp/2.23.20.0")).toMatchObject({ isBot: true });
    expect(
      visit(
        "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
      ),
    ).toMatchObject({ isBot: true });
    expect(
      visit(
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      ),
    ).toMatchObject({ isBot: true });
  });
});
