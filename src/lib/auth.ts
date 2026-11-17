import {
  PublicClientApplication,
  type AccountInfo,
  type IPublicClientApplication,
  LogLevel,
} from "@azure/msal-browser";
import { isM365Configured, m365Config, redirectUri } from "../config/m365";

export interface SignedInUser {
  name: string;
  username: string;
}

let appPromise: Promise<IPublicClientApplication> | null = null;

async function app(): Promise<IPublicClientApplication> {
  if (!isM365Configured()) throw new Error("Microsoft 365 is not configured.");
  if (!appPromise) {
    const created = new PublicClientApplication({
      auth: {
        clientId: m365Config.clientId,
        authority: `https://login.microsoftonline.com/${m365Config.tenantId}`,
        redirectUri: redirectUri(),
        navigateToLoginRequestUrl: true,
      },
      cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
      },
      system: {
        loggerOptions: {
          logLevel: LogLevel.Error,
          piiLoggingEnabled: false,
        },
      },
    });
    appPromise = created.initialize().then(() => created);
  }
  return appPromise;
}

function toUser(account: AccountInfo): SignedInUser {
  return {
    name: account.name?.trim() || account.username,
    username: account.username,
  };
}

export async function initAuth(): Promise<SignedInUser | null> {
  if (!isM365Configured()) return null;
  const pca = await app();
  const result = await pca.handleRedirectPromise();
  const account = result?.account ?? pca.getAllAccounts()[0] ?? null;
  if (!account) return null;
  pca.setActiveAccount(account);
  return toUser(account);
}

export async function login(): Promise<void> {
  const pca = await app();
  await pca.loginRedirect({ scopes: [...m365Config.graphScopes] });
}

export async function logout(): Promise<void> {
  const pca = await app();
  const account = pca.getActiveAccount() ?? pca.getAllAccounts()[0];
  await pca.logoutRedirect({
    account: account ?? undefined,
    postLogoutRedirectUri: redirectUri(),
  });
}

export async function graphToken(): Promise<string> {
  const pca = await app();
  const account = pca.getActiveAccount() ?? pca.getAllAccounts()[0];
  if (!account) throw new Error("Sign in again.");
  const scopes = [...m365Config.graphScopes];
  try {
    const result = await pca.acquireTokenSilent({ account, scopes });
    return result.accessToken;
  } catch {
    await pca.acquireTokenRedirect({ account, scopes });
    throw new Error("Redirecting to sign in.");
  }
}
