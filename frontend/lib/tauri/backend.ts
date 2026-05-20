export const isTauri = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForBackend = async (baseUrl: string): Promise<void> => {
  const healthUrl = baseUrl.replace(/\/api\/v1\/?$/, "") + "/health/";
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(healthUrl, { cache: "no-store" });
      if (response.ok) {
        return;
      }
    } catch (error) {
      // ignore until retry limit reached
    }
    await wait(400);
  }
  throw new Error("Backend did not become ready in time");
};

export const resolveBackendUrl = async (): Promise<string> => {
  if (!isTauri()) {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";
  }

  const { invoke } = await import("@tauri-apps/api/core");
  const url = await invoke<string>("get_backend_url");
  return url;
};

export const stopBackend = async (): Promise<void> => {
  if (!isTauri()) {
    return;
  }
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("stop_backend");
};
