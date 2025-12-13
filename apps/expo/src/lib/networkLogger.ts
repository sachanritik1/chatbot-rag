/**
 * Network Logger for React Native
 * Logs all fetch requests and responses for debugging
 */

const originalFetch = globalThis.fetch;

export function enableNetworkLogging() {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = init?.method ?? "GET";

    console.log(`🌐 [${method}] ${url}`);
    console.log("📋 Request Headers:", init?.headers);
    if (init?.body) {
      console.log(
        "📦 Request Body:",
        typeof init.body === "string"
          ? init.body.slice(0, 200) + (init.body.length > 200 ? "..." : "")
          : init.body,
      );
    }

    const startTime = Date.now();

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;

      console.log(`✅ [${response.status}] ${url} (${duration}ms)`);
      console.log("📋 Response Headers:", {
        "content-type": response.headers.get("content-type"),
        "content-length": response.headers.get("content-length"),
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [FAILED] ${url} (${duration}ms)`, error);
      throw error;
    }
  };

  console.log("🔍 Network logging enabled");
}

export function disableNetworkLogging() {
  globalThis.fetch = originalFetch;
  console.log("🔍 Network logging disabled");
}
