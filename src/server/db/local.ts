const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Whether a Postgres connection string points at this machine (the compose.yaml database). */
export function isLocalDatabase(url: string) {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}
