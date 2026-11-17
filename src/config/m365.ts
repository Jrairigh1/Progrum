/**
 * Public Microsoft Entra settings for CBC. A single-page app cannot keep a
 * client secret, and these values are not secrets.
 *
 * Leave the placeholders until the Microsoft 365 admin sends the real ones.
 * While they are placeholders, Progrum keeps every board in this browser and
 * does not contact Microsoft.
 *
 * graphScopes: Sites.Selected lets this app touch only the SharePoint site an
 * admin grants. Switch the second scope to Sites.ReadWrite.All only if that
 * extra grant cannot be done. See the README.
 */
export const m365Config = {
  clientId: "00000000-0000-0000-0000-000000000000",
  tenantId: "00000000-0000-0000-0000-000000000000",
  sharePointSiteUrl: "https://contoso.sharepoint.com/sites/Progrum",
  graphScopes: ["User.Read", "Sites.Selected"],
};

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLACEHOLDER_GUID = "00000000-0000-0000-0000-000000000000";

export function isM365Configured(config: typeof m365Config = m365Config): boolean {
  if (!GUID.test(config.clientId) || !GUID.test(config.tenantId)) return false;
  if (config.clientId === PLACEHOLDER_GUID || config.tenantId === PLACEHOLDER_GUID) return false;
  if (!config.graphScopes.includes("User.Read")) return false;
  if (!config.graphScopes.some((scope) => scope === "Sites.Selected" || scope === "Sites.ReadWrite.All")) return false;
  try {
    const url = new URL(config.sharePointSiteUrl);
    if (url.protocol !== "https:") return false;
    if (url.hostname === "contoso.sharepoint.com") return false;
    if (!url.hostname.includes(".")) return false;
    return url.pathname.length > 1;
  } catch {
    return false;
  }
}

export function redirectUri(): string {
  const url = new URL(window.location.href);
  let path = url.pathname;
  if (path.endsWith("/index.html")) path = path.slice(0, -"index.html".length);
  if (!path.endsWith("/")) path += "/";
  return `${url.origin}${path}`;
}
