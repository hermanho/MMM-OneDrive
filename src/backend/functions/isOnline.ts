export const isOnline = async (timeout = 25000): Promise<boolean> => {
  const testUrls = [
    "http://connectivity-check.ubuntu.com/",
    "https://captive.apple.com/",
    "http://connectivitycheck.android.com/generate_204",
    "http://detectportal.firefox.com",
  ];

  // Return true as soon as any of the test URLs responds successfully (first win).
  // If all checks fail (or timeout aborts), return false.
  const controller = new AbortController();
  const signal = controller.signal;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    // Each attempt will resolve (fulfill) on success, and reject on failure.
    const attempts = testUrls.map((url) =>
      fetch(url, { method: "GET", signal }).then(
        (response) => {
          if (response.ok) {
            return true;
          }
          return Promise.reject(new Error(`status ${response.status}`));
        },
        () => Promise.reject(new Error("offline"))
      )
    );

    // Promise.any fulfills as soon as any attempt fulfills (first win).
    // If all attempts reject, Promise.any rejects with AggregateError.
    await Promise.any(attempts);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};
