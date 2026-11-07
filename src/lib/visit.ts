/**
 * What a visit to a short link records beyond time and place: where it came from (the referring
 * site's host, never the full URL), the kind of device, browser and OS (names only, never the raw
 * user agent) and whether a bot made it. Pure and client-safe: the proxy parses the request with
 * Next's `userAgent()` and hands the result here.
 */

export const DEVICE_TYPES = ["mobile", "tablet", "desktop", "other"] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export type Visit = {
  /** Host of the referring site, e.g. `x.com`; null for a direct visit. */
  referrer: string | null;
  device: DeviceType;
  browser: string | null;
  os: string | null;
  isBot: boolean;
};

/** The parts of Next's `UserAgent` (from `next/server`) a visit needs. */
export type ParsedUserAgent = {
  ua: string;
  isBot: boolean;
  browser: { name?: string };
  device: { type?: string };
  os: { name?: string };
};

const MAX_HOST_LENGTH = 255;
const MAX_NAME_LENGTH = 64;

/** Hosts that stand for the same site: link wrappers, mobile and regional variants. */
const HOST_ALIASES: Record<string, string> = {
  "t.co": "x.com",
  "twitter.com": "x.com",
  "mobile.twitter.com": "x.com",
  "mobile.x.com": "x.com",
  "l.facebook.com": "facebook.com",
  "lm.facebook.com": "facebook.com",
  "m.facebook.com": "facebook.com",
  "l.messenger.com": "messenger.com",
  "l.instagram.com": "instagram.com",
  "l.threads.net": "threads.net",
  "lnkd.in": "linkedin.com",
  "out.reddit.com": "reddit.com",
  "old.reddit.com": "reddit.com",
  "new.reddit.com": "reddit.com",
  "m.youtube.com": "youtube.com",
  "youtu.be": "youtube.com",
  "away.vk.com": "vk.com",
  "slack-redir.net": "slack.com",
  "app.slack.com": "slack.com",
  "statics.teams.cdn.office.net": "teams.microsoft.com",
  "outlook.live.com": "outlook.com",
  "outlook.office.com": "outlook.com",
  "outlook.office365.com": "outlook.com",
};

/** Android apps send `android-app://<package>/` as their referrer. */
const ANDROID_APPS: Record<string, string> = {
  "com.google.android.gm": "mail.google.com",
  "com.google.android.googlequicksearchbox": "google.com",
  "com.google.android.apps.messaging": "messages.google.com",
  "com.slack": "slack.com",
  "com.linkedin.android": "linkedin.com",
  "com.reddit.frontpage": "reddit.com",
  "com.twitter.android": "x.com",
  "com.facebook.katana": "facebook.com",
  "com.instagram.android": "instagram.com",
  "org.telegram.messenger": "telegram.org",
  "com.discord": "discord.com",
  "com.microsoft.teams": "teams.microsoft.com",
};

/** google.nl, google.co.uk… → google.com (likewise Bing, Yahoo, Yandex). */
const SEARCH_ENGINE = /^(google|bing|yahoo|yandex)\.(?:com?\.)?[a-z]{2,3}$/;

/**
 * The referring site's host from a `Referer` header, normalized so one site counts as one source:
 * lowercased, without `www.`, with link wrappers like `t.co` folded into their site. Null for a
 * direct visit or anything that isn't a web or Android app origin.
 */
export function referrerHost(referer: string | null | undefined) {
  if (!referer) return null;

  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return null;
  }

  if (url.protocol === "android-app:") {
    const app = url.hostname.toLowerCase();
    return app ? (ANDROID_APPS[app] ?? app).slice(0, MAX_HOST_LENGTH) : null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!host) return null;
  const engine = SEARCH_ENGINE.exec(host);
  const normalized = engine ? `${engine[1]}.com` : (HOST_ALIASES[host] ?? host);
  return normalized.slice(0, MAX_HOST_LENGTH);
}

/**
 * Crawlers and link-preview fetchers that Next's `isBot` misses, plus HTTP libraries and headless
 * browsers: a request from `curl` is not someone clicking a link.
 */
const EXTRA_BOTS =
  /\bbot\b|[a-z]bot\/|telegrambot|crawler|spider|preview|slack-imgproxy|embedly|iframely|mastodon|bluesky|cardyb|metainspector|headlesschrome|phantomjs|lighthouse|curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|go-http-client|okhttp|axios|node-fetch|undici|java\/|libwww-perl|ruby|postmanruntime|insomnia/i;

/** True for bots, link previews (Slack, WhatsApp, Discord, X…) and requests without a user agent. */
export function isBotUserAgent(ua: string, flaggedByNext = false) {
  return flaggedByNext || ua.trim() === "" || EXTRA_BOTS.test(ua);
}

export function deviceTypeOf(type: string | undefined): DeviceType {
  // ua-parser leaves `type` empty for desktop browsers.
  if (!type) return "desktop";
  return type === "mobile" || type === "tablet" ? type : "other";
}

const BROWSER_NAMES: Record<string, string> = {
  "Mobile Safari": "Safari",
  "Mobile Chrome": "Chrome",
  "Mobile Firefox": "Firefox",
  "Chrome WebView": "Chrome",
  "Chrome Headless": "Chrome",
  "Samsung Browser": "Samsung Internet",
  "Opera Mobi": "Opera",
  "Opera Touch": "Opera",
  "Opera GX": "Opera",
  "Edge Mobile": "Edge",
  "Android Browser": "Android Browser",
  GSA: "Google",
};

const OS_NAMES: Record<string, string> = {
  "Mac OS": "macOS",
  "Chromium OS": "ChromeOS",
  Ubuntu: "Linux",
  Debian: "Linux",
  Fedora: "Linux",
  "Arch Linux": "Linux",
};

function cleanName(name: string | undefined, names: Record<string, string>) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return (names[trimmed] ?? trimmed).slice(0, MAX_NAME_LENGTH);
}

export function browserName(name: string | undefined) {
  return cleanName(name, BROWSER_NAMES);
}

export function osName(name: string | undefined) {
  return cleanName(name, OS_NAMES);
}

/** The details recorded for one visit. */
export function toVisit(
  userAgent: ParsedUserAgent,
  referer: string | null | undefined,
): Visit {
  return {
    referrer: referrerHost(referer),
    device: deviceTypeOf(userAgent.device.type),
    browser: browserName(userAgent.browser.name),
    os: osName(userAgent.os.name),
    isBot: isBotUserAgent(userAgent.ua, userAgent.isBot),
  };
}
