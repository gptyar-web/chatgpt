/* Public endpoint; the packager sets it once for the connected Supabase project. */
globalThis.GPTYAR_RELEASE_ENDPOINT = "";
globalThis.GPTYARUpdateRequest = (originalURL, options) => {
  const endpoint = globalThis.GPTYAR_RELEASE_ENDPOINT;
  if (!endpoint) return fetch(originalURL, options);
  const url = new URL(endpoint);
  if (
    url.protocol !== "https:" ||
    !url.pathname.endsWith("/public/check-for-update")
  )
    throw new Error("Invalid update endpoint");
  // Public release checks never need a customer token, administrator token or device identity.
  return fetch(url.href, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version: chrome.runtime.getManifest().version }),
    redirect: "error",
    signal: AbortSignal.timeout(12000),
  });
};
