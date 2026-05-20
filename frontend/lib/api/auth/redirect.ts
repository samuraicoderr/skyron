import FrontendRoutes from "../FrontendRoutes";

export const AUTH_PRESENCE_COOKIE = "layon_auth_present";
export const AUTH_REDIRECT_MESSAGE_KEY = "layon_auth_redirect_message";

export function isSafeRelativePath(path: string | null | undefined): path is string {
  if (!path) {
    return false;
  }

  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback: string = "/"
): string {
  if (!isSafeRelativePath(path)) {
    return fallback;
  }

  return path;
}

export function getSafeNextPath(
  next: string | null | undefined,
  fallback: string = "/"
): string {
  return sanitizeRedirectPath(next, fallback);
}

export function buildLoginRedirectPath(
  currentPathWithQuery: string,
  loginPath: string = FrontendRoutes.auth.login
): string {
  const safeCurrentPath = sanitizeRedirectPath(currentPathWithQuery, "/");
  return `${loginPath}?next=${encodeURIComponent(safeCurrentPath)}`;
}

export function storeAuthRedirectMessage(message: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.setItem(AUTH_REDIRECT_MESSAGE_KEY, message);
}

export function consumeAuthRedirectMessage(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const message = sessionStorage.getItem(AUTH_REDIRECT_MESSAGE_KEY);
  sessionStorage.removeItem(AUTH_REDIRECT_MESSAGE_KEY);
  return message;
}
