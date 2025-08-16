import { PublicClientApplication, InteractionRequiredAuthError, ServerError, ClientAuthError, AuthenticationResult, AccountInfo, SilentFlowRequest, InteractiveRequest, DeviceCodeRequest } from "@azure/msal-node";
import { DeviceCodeResponse } from "@azure/msal-common";
import sleep from "../functions/sleep";

interface TokenRequestCommon {
  account: AccountInfo;
  scopes: string[];
}

class AuthProvider {
  clientApplication: PublicClientApplication;
  account: AccountInfo;

  constructor(msalConfig) {
    /**
     * Initialize a public client application. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md
     */
    this.clientApplication = new PublicClientApplication(msalConfig);

    this.account = null;
  }

  logDebug(...args) {
    console.debug("[MMM-OneDrive] [AuthProvider]", ...args);
  }

  logInfo(...args) {
    console.info("[MMM-OneDrive] [AuthProvider]", ...args);
  }

  logError(...args) {
    console.error("[MMM-OneDrive] [AuthProvider]", ...args);
  }

  logWarn(...args) {
    console.warn("[MMM-OneDrive] [AuthProvider]", ...args);
  }


  async logout() {
    if (!this.account) return;

    const cache = this.clientApplication.getTokenCache();
    try {
      await cache.removeAccount(this.account);
      this.account = null;
    } catch (error) {
      this.logError(error);
    }
  }

  async getToken(request: Omit<TokenRequestCommon, "account">, forceAuthInteractive: boolean, deviceCodeCallback: (response: DeviceCodeResponse) => void = null, waitInteractiveCallback: (message: string) => void = null) {
    let authResponse: AuthenticationResult | undefined;
    const account = this.account || (await this.getAccount());

    const tokenRequest: TokenRequestCommon = {
      ...request,
      account: null,
    };

    if (account) {
      tokenRequest.account = account;
      authResponse = await this.getTokenSilent(tokenRequest);
    }
    if (!authResponse) {
      this.logWarn("Failed to call getTokenSilent");
      if (forceAuthInteractive) {
        waitInteractiveCallback("Please switch to browser window and continue the authorization process.");
        authResponse = await this.getTokenInteractive(tokenRequest);
      } else {
        try {
          authResponse = await this.getTokenDeviceCode(tokenRequest, deviceCodeCallback);
        } catch {
          waitInteractiveCallback("Please switch to browser window and continue the authorization process.");
          authResponse = await this.getTokenInteractive(tokenRequest);
        }
      }
    }

    if (authResponse && authResponse.account) {
      this.account = authResponse.account;
      this.logInfo("getToken done");
    } else {
      this.logError("Failed to acquire token, no authResponse returned.");
    }

    return authResponse;
  }

  async getTokenSilent(tokenRequest: SilentFlowRequest & TokenRequestCommon, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await this.clientApplication.acquireTokenSilent(tokenRequest);
      } catch (error) {
        this.logError(error);
        if (error instanceof InteractionRequiredAuthError) {
          this.logError("Silent token acquisition failed");
        }
        if (error instanceof ServerError && error.errorCode === "invalid_grant") {
          this.logError("Silent token acquisition failed");
        }
        if (error instanceof ClientAuthError && error.errorCode === "network_error") {
          this.logWarn("Network error occurred, waiting 60 seconds before retrying...");
          await sleep(60000);
        }
        attempt++;
        this.logWarn(`getTokenSilent failed, attempt ${attempt}/${maxRetries}.`);
        await sleep(2000);
      }
    }
    return undefined;
  }

  async getTokenInteractive(tokenRequest: Omit<InteractiveRequest, "openBrowser" | "successTemplate" | "errorTemplate"> & TokenRequestCommon) {
    const openBrowser = async (url: string) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { shell } = require("electron");
        await shell.openExternal(url);
      } catch (e) {
        this.logError("Unable to open external browser. Please run the module with a screen UI environment ", e);
        throw e;
      }
    };

    this.logInfo("Requesting a token interactively via the browser");
    const authResponse = await this.clientApplication.acquireTokenInteractive({
      ...tokenRequest,
      openBrowser,
      successTemplate: "<h1>Successfully signed in!</h1> <p>You can close this window now.</p>",
      errorTemplate: "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>",
    });
    if (authResponse) {
      this.account = authResponse.account;
    }
    this.logInfo("getTokenInteractive done");

    return authResponse;
  }

  async getTokenDeviceCode(tokenRequest: Omit<DeviceCodeRequest, "deviceCodeCallback"> & TokenRequestCommon, callback: (response: DeviceCodeResponse) => void = null) {
    const deviceCodeRequest: DeviceCodeRequest = {
      ...tokenRequest,
      deviceCodeCallback: (response) => {
        this.logInfo(response.message);
        if (callback) {
          callback(response);
        }
      },
    };
    this.logInfo("Requesting a token using OAuth2.0 device code flow");
    const authResponse = await this.clientApplication
      .acquireTokenByDeviceCode(deviceCodeRequest);
    if (authResponse) {
      this.account = authResponse.account;
    }
    this.logInfo("getTokenDeviceCode done");
    return authResponse;
  }

  /**
   * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
   * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
   */
  async getAccount() {
    try {
      const cache = this.clientApplication.getTokenCache();
      const currentAccounts = await cache.getAllAccounts();

      if (!currentAccounts) {
        this.logError("No accounts detected");
        return null;
      }

      if (currentAccounts.length > 1) {
        // Add choose account code here
        console.log("Multiple accounts detected, need to add choose account code.");
        return currentAccounts[0];
      } else if (currentAccounts.length === 1) {
        return currentAccounts[0];
      } else {
        return null;
      }
    } catch (error) {
      this.logError("Error getting account:", error);
      return null;
    }
  }
}

export default AuthProvider;
