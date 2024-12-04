/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { PublicClientApplication, InteractionRequiredAuthError, ServerError } = require("@azure/msal-node");

class AuthProvider {
  msalConfig;
  clientApplication;
  /** @type {import("@azure/msal-node").AccountInfo} */
  account;
  cache;

  constructor(msalConfig) {
    /**
     * Initialize a public client application. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md
     */
    this.msalConfig = msalConfig;
    this.clientApplication = new PublicClientApplication(this.msalConfig);

    this.cache = this.clientApplication.getTokenCache();
    this.account = null;
  }

  logDebug(...args) {
    console.debug("[ONEDRIVE:AuthProvider]", ...args);
  }

  log(...args) {
    console.log("[ONEDRIVE:AuthProvider]", ...args);
  }

  logError(...args) {
    console.error("[ONEDRIVE:AuthProvider]", ...args);
  }

  async logout() {
    if (!this.account) return;

    try {
      /**
       * If you would like to end the session with AAD, use the logout endpoint. You'll need to enable
       * the optional token claim 'login_hint' for this to work as expected. For more information, visit:
       * https://learn.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
       */
      if (this.account.idTokenClaims.hasOwnProperty("login_hint")) {
        const { shell } = require("electron");
        await shell.openExternal(`${this.msalConfig.auth.authority}/oauth2/v2.0/logout?logout_hint=${encodeURIComponent(this.account.idTokenClaims.login_hint)}`);
      }

      await this.cache.removeAccount(this.account);
      this.account = null;
    } catch (error) {
      this.logError(error);
    }
  }

  async getToken(tokenRequest) {
    let authResponse;
    const account = this.account || (await this.getAccount());

    if (account) {
      tokenRequest.account = account;
      authResponse = await this.getTokenSilent(tokenRequest);
    }
    if (!authResponse) {
      authResponse = await this.getTokenInteractive(tokenRequest);
    }

    if (authResponse) {
      this.account = authResponse.account;
    }
    this.log('getToken done');

    return authResponse || null;
  }

  async getTokenSilent(tokenRequest) {
    try {
      return await this.clientApplication.acquireTokenSilent(tokenRequest);
    } catch (error) {
      this.logError(error);
      if (error instanceof InteractionRequiredAuthError) {
        this.logError("Silent token acquisition failed, acquiring token interactive");
      }
      if (error instanceof ServerError && error.errorCode === "invalid_grant") {
        this.logError("Silent token acquisition failed, acquiring token interactive");
      }
      return undefined;
    }
    finally {
      this.log('getTokenSilent done');
    }
  }

  async getTokenInteractive(tokenRequest) {
    const openBrowser = async (url) => {
      try {
        const { shell } = require("electron");
        await shell.openExternal(url);
      } catch (e) {
        this.logError("Unable to open external browser. Please run the module with a screen UI environment ", e);
        throw e;
      }
    };

    const authResponse = await this.clientApplication.acquireTokenInteractive({
      ...tokenRequest,
      openBrowser,
      successTemplate: "<h1>Successfully signed in!</h1> <p>You can close this window now.</p>",
      errorTemplate: "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>",
    });
    if (authResponse) {
      this.account = authResponse.account;
    }
    this.log('getTokenInteractive done');

    return authResponse;
  }


  /**
   * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
   * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
   */
  async getAccount() {
    const currentAccounts = await this.cache.getAllAccounts();

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
  }
}

module.exports = AuthProvider;
