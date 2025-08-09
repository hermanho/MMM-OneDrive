/*! *****************************************************************************
  mmm-onedrive
  Version 1.5.4

  MagicMirror² module to display your photos from OneDrive.
  Please submit bugs at https://github.com/hermanho/MMM-OneDrive/issues

  (c) hermanho
  Licence: MIT

  This file is auto-generated. Do not edit.
***************************************************************************** */

"use strict";

var events = require("events"), crypto$1 = require("crypto"), http = require("http"), https = require("https"), require$$0 = require("buffer"), require$$3 = require("stream"), require$$5 = require("util"), fs = require("fs");

require("path");

var RequestMethod, Log = require("logger");

function __awaiter(thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      var value;
      result.done ? resolve(result.value) : (value = result.value, value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      })).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

"function" == typeof SuppressedError && SuppressedError, function(RequestMethod) {
  RequestMethod.GET = "GET", RequestMethod.PATCH = "PATCH", RequestMethod.POST = "POST", 
  RequestMethod.PUT = "PUT", RequestMethod.DELETE = "DELETE";
}(RequestMethod || (RequestMethod = {}));

const GRAPH_URLS = new Set([ "graph.microsoft.com", "graph.microsoft.us", "dod-graph.microsoft.us", "graph.microsoft.de", "microsoftgraph.chinacloudapi.cn", "canary.graph.microsoft.com" ]);

class GraphClientError extends Error {
  static setGraphClientError(error) {
    let graphClientError;
    return error instanceof Error ? graphClientError = error : (graphClientError = new GraphClientError, 
    graphClientError.customError = error), graphClientError;
  }
  constructor(message) {
    super(message), Object.setPrototypeOf(this, GraphClientError.prototype);
  }
}

const oDataQueryNames = [ "$select", "$expand", "$orderby", "$filter", "$top", "$skip", "$skipToken", "$count" ], serializeContent = content => {
  const className = content && content.constructor && content.constructor.name;
  if ("Buffer" === className || "Blob" === className || "File" === className || "FormData" === className || "string" == typeof content) {
    return content;
  }
  if ("ArrayBuffer" === className) {
    content = Buffer.from(content);
  } else if ("Int8Array" === className || "Int16Array" === className || "Int32Array" === className || "Uint8Array" === className || "Uint16Array" === className || "Uint32Array" === className || "Uint8ClampedArray" === className || "Float32Array" === className || "Float64Array" === className || "DataView" === className) {
    content = Buffer.from(content.buffer);
  } else {
    try {
      content = JSON.stringify(content);
    } catch (error) {
      throw new Error("Unable to stringify the content");
    }
  }
  return content;
}, isGraphURL = url => isValidEndpoint(url), isCustomHost = (url, customHosts) => (customHosts.forEach(host => isCustomHostValid(host)), 
isValidEndpoint(url, customHosts)), isValidEndpoint = (url, allowedHosts = GRAPH_URLS) => {
  if (-1 !== (url = url.toLowerCase()).indexOf("https://")) {
    const startofPortNoPos = (url = url.replace("https://", "")).indexOf(":"), endOfHostStrPos = url.indexOf("/");
    let hostName = "";
    if (-1 !== endOfHostStrPos) {
      return -1 !== startofPortNoPos && startofPortNoPos < endOfHostStrPos ? (hostName = url.substring(0, startofPortNoPos), 
      allowedHosts.has(hostName)) : (hostName = url.substring(0, endOfHostStrPos), allowedHosts.has(hostName));
    }
  }
  return !1;
}, isCustomHostValid = host => {
  if (-1 !== host.indexOf("/")) {
    throw new GraphClientError("Please add only hosts or hostnames to the CustomHosts config. If the url is `http://example.com:3000/`, host is `example:3000`");
  }
};

class MiddlewareControl {
  constructor(middlewareOptions = []) {
    this.middlewareOptions = new Map;
    for (const option of middlewareOptions) {
      const fn = option.constructor;
      this.middlewareOptions.set(fn, option);
    }
  }
  getMiddlewareOptions(fn) {
    return this.middlewareOptions.get(fn);
  }
  setMiddlewareOptions(fn, option) {
    this.middlewareOptions.set(fn, option);
  }
}

const getRequestHeader = (request, options, key) => {
  let value = null;
  if ("undefined" != typeof Request && request instanceof Request) {
    value = request.headers.get(key);
  } else if (void 0 !== options && void 0 !== options.headers) {
    if ("undefined" != typeof Headers && options.headers instanceof Headers) {
      value = options.headers.get(key);
    } else if (options.headers instanceof Array) {
      const headers = options.headers;
      for (let i = 0, l = headers.length; i < l; i++) {
        if (headers[i][0] === key) {
          value = headers[i][1];
          break;
        }
      }
    } else {
      void 0 !== options.headers[key] && (value = options.headers[key]);
    }
  }
  return value;
}, setRequestHeader = (request, options, key, value) => {
  if ("undefined" != typeof Request && request instanceof Request) {
    request.headers.set(key, value);
  } else if (void 0 !== options) {
    if (void 0 === options.headers) {
      options.headers = new Headers({
        [key]: value
      });
    } else if ("undefined" != typeof Headers && options.headers instanceof Headers) {
      options.headers.set(key, value);
    } else if (options.headers instanceof Array) {
      let i = 0;
      const l = options.headers.length;
      for (;i < l; i++) {
        const header = options.headers[i];
        if (header[0] === key) {
          header[1] = value;
          break;
        }
      }
      i === l && options.headers.push([ key, value ]);
    } else {
      Object.assign(options.headers, {
        [key]: value
      });
    }
  }
}, appendRequestHeader = (request, options, key, value) => {
  "undefined" != typeof Request && request instanceof Request ? request.headers.append(key, value) : void 0 !== options && (void 0 === options.headers ? options.headers = new Headers({
    [key]: value
  }) : "undefined" != typeof Headers && options.headers instanceof Headers ? options.headers.append(key, value) : options.headers instanceof Array ? options.headers.push([ key, value ]) : void 0 === options.headers ? options.headers = {
    [key]: value
  } : void 0 === options.headers[key] ? options.headers[key] = value : options.headers[key] += `, ${value}`);
};

class AuthenticationHandlerOptions {
  constructor(authenticationProvider, authenticationProviderOptions) {
    this.authenticationProvider = authenticationProvider, this.authenticationProviderOptions = authenticationProviderOptions;
  }
}

var FeatureUsageFlag;

!function(FeatureUsageFlag) {
  FeatureUsageFlag[FeatureUsageFlag.NONE = 0] = "NONE", FeatureUsageFlag[FeatureUsageFlag.REDIRECT_HANDLER_ENABLED = 1] = "REDIRECT_HANDLER_ENABLED", 
  FeatureUsageFlag[FeatureUsageFlag.RETRY_HANDLER_ENABLED = 2] = "RETRY_HANDLER_ENABLED", 
  FeatureUsageFlag[FeatureUsageFlag.AUTHENTICATION_HANDLER_ENABLED = 4] = "AUTHENTICATION_HANDLER_ENABLED";
}(FeatureUsageFlag || (FeatureUsageFlag = {}));

class TelemetryHandlerOptions {
  constructor() {
    this.featureUsage = FeatureUsageFlag.NONE;
  }
  static updateFeatureUsageFlag(context, flag) {
    let options;
    context.middlewareControl instanceof MiddlewareControl ? options = context.middlewareControl.getMiddlewareOptions(TelemetryHandlerOptions) : context.middlewareControl = new MiddlewareControl, 
    void 0 === options && (options = new TelemetryHandlerOptions, context.middlewareControl.setMiddlewareOptions(TelemetryHandlerOptions, options)), 
    options.setFeatureUsage(flag);
  }
  setFeatureUsage(flag) {
    this.featureUsage = this.featureUsage | flag;
  }
  getFeatureUsage() {
    return this.featureUsage.toString(16);
  }
}

class AuthenticationHandler {
  constructor(authenticationProvider) {
    this.authenticationProvider = authenticationProvider;
  }
  execute(context) {
    return __awaiter(this, void 0, void 0, function*() {
      const url = "string" == typeof context.request ? context.request : context.request.url;
      if (isGraphURL(url) || context.customHosts && isCustomHost(url, context.customHosts)) {
        let options, authenticationProvider, authenticationProviderOptions;
        context.middlewareControl instanceof MiddlewareControl && (options = context.middlewareControl.getMiddlewareOptions(AuthenticationHandlerOptions)), 
        options && (authenticationProvider = options.authenticationProvider, authenticationProviderOptions = options.authenticationProviderOptions), 
        authenticationProvider || (authenticationProvider = this.authenticationProvider);
        const bearerKey = `Bearer ${yield authenticationProvider.getAccessToken(authenticationProviderOptions)}`;
        appendRequestHeader(context.request, context.options, AuthenticationHandler.AUTHORIZATION_HEADER, bearerKey), 
        TelemetryHandlerOptions.updateFeatureUsageFlag(context, FeatureUsageFlag.AUTHENTICATION_HANDLER_ENABLED);
      } else {
        context.options.headers && delete context.options.headers[AuthenticationHandler.AUTHORIZATION_HEADER];
      }
      return yield this.nextMiddleware.execute(context);
    });
  }
  setNext(next) {
    this.nextMiddleware = next;
  }
}

AuthenticationHandler.AUTHORIZATION_HEADER = "Authorization";

class HTTPMessageHandler {
  execute(context) {
    return __awaiter(this, void 0, void 0, function*() {
      context.response = yield fetch(context.request, context.options);
    });
  }
}

class RetryHandlerOptions {
  constructor(delay = RetryHandlerOptions.DEFAULT_DELAY, maxRetries = RetryHandlerOptions.DEFAULT_MAX_RETRIES, shouldRetry = RetryHandlerOptions.defaultShouldRetry) {
    if (delay > RetryHandlerOptions.MAX_DELAY && maxRetries > RetryHandlerOptions.MAX_MAX_RETRIES) {
      const error = new Error(`Delay and MaxRetries should not be more than ${RetryHandlerOptions.MAX_DELAY} and ${RetryHandlerOptions.MAX_MAX_RETRIES}`);
      throw error.name = "MaxLimitExceeded", error;
    }
    if (delay > RetryHandlerOptions.MAX_DELAY) {
      const error = new Error(`Delay should not be more than ${RetryHandlerOptions.MAX_DELAY}`);
      throw error.name = "MaxLimitExceeded", error;
    }
    if (maxRetries > RetryHandlerOptions.MAX_MAX_RETRIES) {
      const error = new Error(`MaxRetries should not be more than ${RetryHandlerOptions.MAX_MAX_RETRIES}`);
      throw error.name = "MaxLimitExceeded", error;
    }
    if (delay < 0 && maxRetries < 0) {
      const error = new Error("Delay and MaxRetries should not be negative");
      throw error.name = "MinExpectationNotMet", error;
    }
    if (delay < 0) {
      const error = new Error("Delay should not be negative");
      throw error.name = "MinExpectationNotMet", error;
    }
    if (maxRetries < 0) {
      const error = new Error("MaxRetries should not be negative");
      throw error.name = "MinExpectationNotMet", error;
    }
    this.delay = Math.min(delay, RetryHandlerOptions.MAX_DELAY), this.maxRetries = Math.min(maxRetries, RetryHandlerOptions.MAX_MAX_RETRIES), 
    this.shouldRetry = shouldRetry;
  }
  getMaxDelay() {
    return RetryHandlerOptions.MAX_DELAY;
  }
}

RetryHandlerOptions.DEFAULT_DELAY = 3, RetryHandlerOptions.DEFAULT_MAX_RETRIES = 3, 
RetryHandlerOptions.MAX_DELAY = 180, RetryHandlerOptions.MAX_MAX_RETRIES = 10, RetryHandlerOptions.defaultShouldRetry = () => !0;

class RetryHandler {
  constructor(options = new RetryHandlerOptions) {
    this.options = options;
  }
  isRetry(response) {
    return -1 !== RetryHandler.RETRY_STATUS_CODES.indexOf(response.status);
  }
  isBuffered(request, options) {
    const method = "string" == typeof request ? options.method : request.method;
    if (method === RequestMethod.PUT || method === RequestMethod.PATCH || method === RequestMethod.POST) {
      if ("application/octet-stream" === getRequestHeader(request, options, "Content-Type")) {
        return !1;
      }
    }
    return !0;
  }
  getDelay(response, retryAttempts, delay) {
    const getRandomness = () => Number(Math.random().toFixed(3)), retryAfter = void 0 !== response.headers ? response.headers.get(RetryHandler.RETRY_AFTER_HEADER) : null;
    let newDelay;
    return newDelay = null !== retryAfter ? Number.isNaN(Number(retryAfter)) ? Math.round((new Date(retryAfter).getTime() - Date.now()) / 1e3) : Number(retryAfter) : retryAttempts >= 2 ? this.getExponentialBackOffTime(retryAttempts) + delay + getRandomness() : delay + getRandomness(), 
    Math.min(newDelay, this.options.getMaxDelay() + getRandomness());
  }
  getExponentialBackOffTime(attempts) {
    return Math.round(.5 * (Math.pow(2, attempts) - 1));
  }
  sleep(delaySeconds) {
    return __awaiter(this, void 0, void 0, function*() {
      const delayMilliseconds = 1e3 * delaySeconds;
      return new Promise(resolve => setTimeout(resolve, delayMilliseconds));
    });
  }
  getOptions(context) {
    let options;
    return context.middlewareControl instanceof MiddlewareControl && (options = context.middlewareControl.getMiddlewareOptions(this.options.constructor)), 
    void 0 === options && (options = Object.assign(new RetryHandlerOptions, this.options)), 
    options;
  }
  executeWithRetry(context, retryAttempts, options) {
    return __awaiter(this, void 0, void 0, function*() {
      if (yield this.nextMiddleware.execute(context), retryAttempts < options.maxRetries && this.isRetry(context.response) && this.isBuffered(context.request, context.options) && options.shouldRetry(options.delay, retryAttempts, context.request, context.options, context.response)) {
        ++retryAttempts, setRequestHeader(context.request, context.options, RetryHandler.RETRY_ATTEMPT_HEADER, retryAttempts.toString());
        const delay = this.getDelay(context.response, retryAttempts, options.delay);
        return yield this.sleep(delay), yield this.executeWithRetry(context, retryAttempts, options);
      }
    });
  }
  execute(context) {
    return __awaiter(this, void 0, void 0, function*() {
      const options = this.getOptions(context);
      return TelemetryHandlerOptions.updateFeatureUsageFlag(context, FeatureUsageFlag.RETRY_HANDLER_ENABLED), 
      yield this.executeWithRetry(context, 0, options);
    });
  }
  setNext(next) {
    this.nextMiddleware = next;
  }
}

RetryHandler.RETRY_STATUS_CODES = [ 429, 503, 504 ], RetryHandler.RETRY_ATTEMPT_HEADER = "Retry-Attempt", 
RetryHandler.RETRY_AFTER_HEADER = "Retry-After";

class RedirectHandlerOptions {
  constructor(maxRedirects = RedirectHandlerOptions.DEFAULT_MAX_REDIRECTS, shouldRedirect = RedirectHandlerOptions.defaultShouldRedirect) {
    if (maxRedirects > RedirectHandlerOptions.MAX_MAX_REDIRECTS) {
      const error = new Error(`MaxRedirects should not be more than ${RedirectHandlerOptions.MAX_MAX_REDIRECTS}`);
      throw error.name = "MaxLimitExceeded", error;
    }
    if (maxRedirects < 0) {
      const error = new Error("MaxRedirects should not be negative");
      throw error.name = "MinExpectationNotMet", error;
    }
    this.maxRedirects = maxRedirects, this.shouldRedirect = shouldRedirect;
  }
}

RedirectHandlerOptions.DEFAULT_MAX_REDIRECTS = 5, RedirectHandlerOptions.MAX_MAX_REDIRECTS = 20, 
RedirectHandlerOptions.defaultShouldRedirect = () => !0;

class RedirectHandler {
  constructor(options = new RedirectHandlerOptions) {
    this.options = options;
  }
  isRedirect(response) {
    return -1 !== RedirectHandler.REDIRECT_STATUS_CODES.indexOf(response.status);
  }
  hasLocationHeader(response) {
    return response.headers.has(RedirectHandler.LOCATION_HEADER);
  }
  getLocationHeader(response) {
    return response.headers.get(RedirectHandler.LOCATION_HEADER);
  }
  isRelativeURL(url) {
    return -1 === url.indexOf("://");
  }
  shouldDropAuthorizationHeader(requestUrl, redirectUrl) {
    const schemeHostRegex = /^[A-Za-z].+?:\/\/.+?(?=\/|$)/, requestMatches = schemeHostRegex.exec(requestUrl);
    let requestAuthority, redirectAuthority;
    null !== requestMatches && (requestAuthority = requestMatches[0]);
    const redirectMatches = schemeHostRegex.exec(redirectUrl);
    return null !== redirectMatches && (redirectAuthority = redirectMatches[0]), void 0 !== requestAuthority && void 0 !== redirectAuthority && requestAuthority !== redirectAuthority;
  }
  updateRequestUrl(redirectUrl, context) {
    return __awaiter(this, void 0, void 0, function*() {
      var newUrl, request;
      context.request = "string" == typeof context.request ? redirectUrl : yield (newUrl = redirectUrl, 
      request = context.request, __awaiter(void 0, void 0, void 0, function*() {
        const body = request.headers.get("Content-Type") ? yield request.blob() : yield Promise.resolve(void 0), {method: method, headers: headers, referrer: referrer, referrerPolicy: referrerPolicy, mode: mode, credentials: credentials, cache: cache, redirect: redirect, integrity: integrity, keepalive: keepalive, signal: signal} = request;
        return new Request(newUrl, {
          method: method,
          headers: headers,
          body: body,
          referrer: referrer,
          referrerPolicy: referrerPolicy,
          mode: mode,
          credentials: credentials,
          cache: cache,
          redirect: redirect,
          integrity: integrity,
          keepalive: keepalive,
          signal: signal
        });
      }));
    });
  }
  getOptions(context) {
    let options;
    return context.middlewareControl instanceof MiddlewareControl && (options = context.middlewareControl.getMiddlewareOptions(RedirectHandlerOptions)), 
    void 0 === options && (options = Object.assign(new RedirectHandlerOptions, this.options)), 
    options;
  }
  executeWithRedirect(context, redirectCount, options) {
    return __awaiter(this, void 0, void 0, function*() {
      yield this.nextMiddleware.execute(context);
      const response = context.response;
      if (redirectCount < options.maxRedirects && this.isRedirect(response) && this.hasLocationHeader(response) && options.shouldRedirect(response)) {
        if (++redirectCount, response.status === RedirectHandler.STATUS_CODE_SEE_OTHER) {
          context.options.method = RequestMethod.GET, delete context.options.body;
        } else {
          const redirectUrl = this.getLocationHeader(response);
          !this.isRelativeURL(redirectUrl) && this.shouldDropAuthorizationHeader(response.url, redirectUrl) && delete context.options.headers[RedirectHandler.AUTHORIZATION_HEADER], 
          yield this.updateRequestUrl(redirectUrl, context);
        }
        yield this.executeWithRedirect(context, redirectCount, options);
      }
    });
  }
  execute(context) {
    return __awaiter(this, void 0, void 0, function*() {
      const options = this.getOptions(context);
      return context.options.redirect = RedirectHandler.MANUAL_REDIRECT, TelemetryHandlerOptions.updateFeatureUsageFlag(context, FeatureUsageFlag.REDIRECT_HANDLER_ENABLED), 
      yield this.executeWithRedirect(context, 0, options);
    });
  }
  setNext(next) {
    this.nextMiddleware = next;
  }
}

RedirectHandler.REDIRECT_STATUS_CODES = [ 301, 302, 303, 307, 308 ], RedirectHandler.STATUS_CODE_SEE_OTHER = 303, 
RedirectHandler.LOCATION_HEADER = "Location", RedirectHandler.AUTHORIZATION_HEADER = "Authorization", 
RedirectHandler.MANUAL_REDIRECT = "manual";

class TelemetryHandler {
  execute(context) {
    return __awaiter(this, void 0, void 0, function*() {
      const url = "string" == typeof context.request ? context.request : context.request.url;
      if (isGraphURL(url) || context.customHosts && isCustomHost(url, context.customHosts)) {
        let clientRequestId = getRequestHeader(context.request, context.options, TelemetryHandler.CLIENT_REQUEST_ID_HEADER);
        clientRequestId || (clientRequestId = (() => {
          let uuid = "";
          for (let j = 0; j < 32; j++) {
            8 !== j && 12 !== j && 16 !== j && 20 !== j || (uuid += "-"), uuid += Math.floor(16 * Math.random()).toString(16);
          }
          return uuid;
        })(), setRequestHeader(context.request, context.options, TelemetryHandler.CLIENT_REQUEST_ID_HEADER, clientRequestId));
        let options, sdkVersionValue = `${TelemetryHandler.PRODUCT_NAME}/3.0.7`;
        if (context.middlewareControl instanceof MiddlewareControl && (options = context.middlewareControl.getMiddlewareOptions(TelemetryHandlerOptions)), 
        options) {
          const featureUsage = options.getFeatureUsage();
          sdkVersionValue += ` (${TelemetryHandler.FEATURE_USAGE_STRING}=${featureUsage})`;
        }
        appendRequestHeader(context.request, context.options, TelemetryHandler.SDK_VERSION_HEADER, sdkVersionValue);
      } else {
        delete context.options.headers[TelemetryHandler.CLIENT_REQUEST_ID_HEADER], delete context.options.headers[TelemetryHandler.SDK_VERSION_HEADER];
      }
      return yield this.nextMiddleware.execute(context);
    });
  }
  setNext(next) {
    this.nextMiddleware = next;
  }
}

var ChaosStrategy, ResponseType, DocumentType, ContentType, ContentTypeRegexStr;

TelemetryHandler.CLIENT_REQUEST_ID_HEADER = "client-request-id", TelemetryHandler.SDK_VERSION_HEADER = "SdkVersion", 
TelemetryHandler.PRODUCT_NAME = "graph-js", TelemetryHandler.FEATURE_USAGE_STRING = "featureUsage", 
function(ChaosStrategy) {
  ChaosStrategy[ChaosStrategy.MANUAL = 0] = "MANUAL", ChaosStrategy[ChaosStrategy.RANDOM = 1] = "RANDOM";
}(ChaosStrategy || (ChaosStrategy = {})), function(ResponseType) {
  ResponseType.ARRAYBUFFER = "arraybuffer", ResponseType.BLOB = "blob", ResponseType.DOCUMENT = "document", 
  ResponseType.JSON = "json", ResponseType.RAW = "raw", ResponseType.STREAM = "stream", 
  ResponseType.TEXT = "text";
}(ResponseType || (ResponseType = {})), function(DocumentType) {
  DocumentType.TEXT_HTML = "text/html", DocumentType.TEXT_XML = "text/xml", DocumentType.APPLICATION_XML = "application/xml", 
  DocumentType.APPLICATION_XHTML = "application/xhtml+xml";
}(DocumentType || (DocumentType = {})), function(ContentType) {
  ContentType.TEXT_PLAIN = "text/plain", ContentType.APPLICATION_JSON = "application/json";
}(ContentType || (ContentType = {})), function(ContentTypeRegexStr) {
  ContentTypeRegexStr.DOCUMENT = "^(text\\/(html|xml))|(application\\/(xml|xhtml\\+xml))$", 
  ContentTypeRegexStr.IMAGE = "^image\\/.+";
}(ContentTypeRegexStr || (ContentTypeRegexStr = {}));

class GraphResponseHandler {
  static parseDocumentResponse(rawResponse, type) {
    return "undefined" != typeof DOMParser ? new Promise((resolve, reject) => {
      rawResponse.text().then(xmlString => {
        try {
          const xmlDoc = (new DOMParser).parseFromString(xmlString, type);
          resolve(xmlDoc);
        } catch (error) {
          reject(error);
        }
      });
    }) : Promise.resolve(rawResponse.body);
  }
  static convertResponse(rawResponse, responseType) {
    return __awaiter(this, void 0, void 0, function*() {
      if (204 === rawResponse.status) {
        return Promise.resolve();
      }
      let responseValue;
      const contentType = rawResponse.headers.get("Content-type");
      switch (responseType) {
       case ResponseType.ARRAYBUFFER:
        responseValue = yield rawResponse.arrayBuffer();
        break;

       case ResponseType.BLOB:
        responseValue = yield rawResponse.blob();
        break;

       case ResponseType.DOCUMENT:
        responseValue = yield GraphResponseHandler.parseDocumentResponse(rawResponse, DocumentType.TEXT_XML);
        break;

       case ResponseType.JSON:
        responseValue = yield rawResponse.json();
        break;

       case ResponseType.STREAM:
        responseValue = yield Promise.resolve(rawResponse.body);
        break;

       case ResponseType.TEXT:
        responseValue = yield rawResponse.text();
        break;

       default:
        if (null !== contentType) {
          const mimeType = contentType.split(";")[0];
          responseValue = new RegExp(ContentTypeRegexStr.DOCUMENT).test(mimeType) ? yield GraphResponseHandler.parseDocumentResponse(rawResponse, mimeType) : new RegExp(ContentTypeRegexStr.IMAGE).test(mimeType) ? rawResponse.blob() : mimeType === ContentType.TEXT_PLAIN ? yield rawResponse.text() : mimeType === ContentType.APPLICATION_JSON ? yield rawResponse.json() : Promise.resolve(rawResponse.body);
        } else {
          responseValue = Promise.resolve(rawResponse.body);
        }
      }
      return responseValue;
    });
  }
  static getResponse(rawResponse, responseType, callback) {
    return __awaiter(this, void 0, void 0, function*() {
      if (responseType === ResponseType.RAW) {
        return Promise.resolve(rawResponse);
      }
      {
        const response = yield GraphResponseHandler.convertResponse(rawResponse, responseType);
        if (!rawResponse.ok) {
          throw response;
        }
        if ("function" != typeof callback) {
          return response;
        }
        callback(null, response);
      }
    });
  }
}

class CustomAuthenticationProvider {
  constructor(provider) {
    this.provider = provider;
  }
  getAccessToken() {
    return __awaiter(this, void 0, void 0, function*() {
      return new Promise((resolve, reject) => {
        this.provider((error, accessToken) => __awaiter(this, void 0, void 0, function*() {
          if (accessToken) {
            resolve(accessToken);
          } else {
            if (!error) {
              error = new GraphClientError("Access token is undefined or empty.\t\t\t\t\t\tPlease provide a valid token.\t\t\t\t\t\tFor more help - https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/CustomAuthenticationProvider.md");
            }
            const err = yield GraphClientError.setGraphClientError(error);
            reject(err);
          }
        }));
      });
    });
  }
}

class GraphError extends Error {
  constructor(statusCode = -1, message, baseError) {
    super(message || baseError && baseError.message), Object.setPrototypeOf(this, GraphError.prototype), 
    this.statusCode = statusCode, this.code = null, this.requestId = null, this.date = new Date, 
    this.body = null, this.stack = baseError ? baseError.stack : this.stack;
  }
}

class GraphErrorHandler {
  static constructError(error, statusCode, rawResponse) {
    const gError = new GraphError(statusCode, "", error);
    return void 0 !== error.name && (gError.code = error.name), gError.body = error.toString(), 
    gError.date = new Date, gError.headers = null == rawResponse ? void 0 : rawResponse.headers, 
    gError;
  }
  static constructErrorFromResponse(graphError, statusCode, rawResponse) {
    const error = graphError.error, gError = new GraphError(statusCode, error.message);
    return gError.code = error.code, void 0 !== error.innerError && (gError.requestId = error.innerError["request-id"], 
    gError.date = new Date(error.innerError.date)), gError.body = JSON.stringify(error), 
    gError.headers = null == rawResponse ? void 0 : rawResponse.headers, gError;
  }
  static getError(error = null, statusCode = -1, callback, rawResponse) {
    return __awaiter(this, void 0, void 0, function*() {
      let gError;
      if (error && error.error ? gError = GraphErrorHandler.constructErrorFromResponse(error, statusCode, rawResponse) : error instanceof Error ? gError = GraphErrorHandler.constructError(error, statusCode, rawResponse) : (gError = new GraphError(statusCode), 
      gError.body = error), "function" != typeof callback) {
        return gError;
      }
      callback(gError, null);
    });
  }
}

class GraphRequest {
  constructor(httpClient, config, path) {
    this.parsePath = path => {
      if (-1 !== path.indexOf("https://")) {
        const endOfHostStrPos = (path = path.replace("https://", "")).indexOf("/");
        -1 !== endOfHostStrPos && (this.urlComponents.host = "https://" + path.substring(0, endOfHostStrPos), 
        path = path.substring(endOfHostStrPos + 1, path.length));
        const endOfVersionStrPos = path.indexOf("/");
        -1 !== endOfVersionStrPos && (this.urlComponents.version = path.substring(0, endOfVersionStrPos), 
        path = path.substring(endOfVersionStrPos + 1, path.length));
      }
      "/" === path.charAt(0) && (path = path.substr(1));
      const queryStrPos = path.indexOf("?");
      if (-1 === queryStrPos) {
        this.urlComponents.path = path;
      } else {
        this.urlComponents.path = path.substr(0, queryStrPos);
        const queryParams = path.substring(queryStrPos + 1, path.length).split("&");
        for (const queryParam of queryParams) {
          this.parseQueryParameter(queryParam);
        }
      }
    }, this.httpClient = httpClient, this.config = config, this.urlComponents = {
      host: this.config.baseUrl,
      version: this.config.defaultVersion,
      oDataQueryParams: {},
      otherURLQueryParams: {},
      otherURLQueryOptions: []
    }, this._headers = {}, this._options = {}, this._middlewareOptions = [], this.parsePath(path);
  }
  addCsvQueryParameter(propertyName, propertyValue, additionalProperties) {
    this.urlComponents.oDataQueryParams[propertyName] = this.urlComponents.oDataQueryParams[propertyName] ? this.urlComponents.oDataQueryParams[propertyName] + "," : "";
    let allValues = [];
    additionalProperties.length > 1 && "string" == typeof propertyValue ? allValues = Array.prototype.slice.call(additionalProperties) : "string" == typeof propertyValue ? allValues.push(propertyValue) : allValues = allValues.concat(propertyValue), 
    this.urlComponents.oDataQueryParams[propertyName] += allValues.join(",");
  }
  buildFullUrl() {
    const url = (urlSegments => {
      const removePreSlash = s => s.replace(/^\/+/, "");
      return Array.prototype.slice.call(urlSegments).reduce((pre, cur) => {
        return [ (s = pre, s.replace(/\/+$/, "")), removePreSlash(cur) ].join("/");
        var s;
      });
    })([ this.urlComponents.host, this.urlComponents.version, this.urlComponents.path ]) + this.createQueryString();
    return this.config.debugLogging && console.log(url), url;
  }
  createQueryString() {
    const urlComponents = this.urlComponents, query = [];
    if (0 !== Object.keys(urlComponents.oDataQueryParams).length) {
      for (const property in urlComponents.oDataQueryParams) {
        Object.prototype.hasOwnProperty.call(urlComponents.oDataQueryParams, property) && query.push(property + "=" + urlComponents.oDataQueryParams[property]);
      }
    }
    if (0 !== Object.keys(urlComponents.otherURLQueryParams).length) {
      for (const property in urlComponents.otherURLQueryParams) {
        Object.prototype.hasOwnProperty.call(urlComponents.otherURLQueryParams, property) && query.push(property + "=" + urlComponents.otherURLQueryParams[property]);
      }
    }
    if (0 !== urlComponents.otherURLQueryOptions.length) {
      for (const str of urlComponents.otherURLQueryOptions) {
        query.push(str);
      }
    }
    return query.length > 0 ? "?" + query.join("&") : "";
  }
  parseQueryParameter(queryDictionaryOrString) {
    if ("string" == typeof queryDictionaryOrString) {
      if ("?" === queryDictionaryOrString.charAt(0) && (queryDictionaryOrString = queryDictionaryOrString.substring(1)), 
      -1 !== queryDictionaryOrString.indexOf("&")) {
        const queryParams = queryDictionaryOrString.split("&");
        for (const str of queryParams) {
          this.parseQueryParamenterString(str);
        }
      } else {
        this.parseQueryParamenterString(queryDictionaryOrString);
      }
    } else if (queryDictionaryOrString.constructor === Object) {
      for (const key in queryDictionaryOrString) {
        Object.prototype.hasOwnProperty.call(queryDictionaryOrString, key) && this.setURLComponentsQueryParamater(key, queryDictionaryOrString[key]);
      }
    }
    return this;
  }
  parseQueryParamenterString(queryParameter) {
    if (this.isValidQueryKeyValuePair(queryParameter)) {
      const indexOfFirstEquals = queryParameter.indexOf("="), paramKey = queryParameter.substring(0, indexOfFirstEquals), paramValue = queryParameter.substring(indexOfFirstEquals + 1);
      this.setURLComponentsQueryParamater(paramKey, paramValue);
    } else {
      this.urlComponents.otherURLQueryOptions.push(queryParameter);
    }
  }
  setURLComponentsQueryParamater(paramKey, paramValue) {
    if (-1 !== oDataQueryNames.indexOf(paramKey)) {
      const currentValue = this.urlComponents.oDataQueryParams[paramKey], isValueAppendable = currentValue && ("$expand" === paramKey || "$select" === paramKey || "$orderby" === paramKey);
      this.urlComponents.oDataQueryParams[paramKey] = isValueAppendable ? currentValue + "," + paramValue : paramValue;
    } else {
      this.urlComponents.otherURLQueryParams[paramKey] = paramValue;
    }
  }
  isValidQueryKeyValuePair(queryString) {
    const indexofFirstEquals = queryString.indexOf("=");
    if (-1 === indexofFirstEquals) {
      return !1;
    }
    return !(-1 !== queryString.indexOf("(") && queryString.indexOf("(") < indexofFirstEquals);
  }
  updateRequestOptions(options) {
    const optionsHeaders = Object.assign({}, options.headers);
    if (void 0 !== this.config.fetchOptions) {
      const fetchOptions = Object.assign({}, this.config.fetchOptions);
      Object.assign(options, fetchOptions), void 0 !== typeof this.config.fetchOptions.headers && (options.headers = Object.assign({}, this.config.fetchOptions.headers));
    }
    Object.assign(options, this._options), void 0 !== options.headers && Object.assign(optionsHeaders, options.headers), 
    Object.assign(optionsHeaders, this._headers), options.headers = optionsHeaders;
  }
  send(request, options, callback) {
    var _a;
    return __awaiter(this, void 0, void 0, function*() {
      let rawResponse;
      const middlewareControl = new MiddlewareControl(this._middlewareOptions);
      this.updateRequestOptions(options);
      const customHosts = null === (_a = this.config) || void 0 === _a ? void 0 : _a.customHosts;
      try {
        rawResponse = (yield this.httpClient.sendRequest({
          request: request,
          options: options,
          middlewareControl: middlewareControl,
          customHosts: customHosts
        })).response;
        return yield GraphResponseHandler.getResponse(rawResponse, this._responseType, callback);
      } catch (error) {
        if (error instanceof GraphClientError) {
          throw error;
        }
        let statusCode;
        rawResponse && (statusCode = rawResponse.status);
        throw yield GraphErrorHandler.getError(error, statusCode, callback, rawResponse);
      }
    });
  }
  setHeaderContentType() {
    if (!this._headers) {
      return void this.header("Content-Type", "application/json");
    }
    const headerKeys = Object.keys(this._headers);
    for (const headerKey of headerKeys) {
      if ("content-type" === headerKey.toLowerCase()) {
        return;
      }
    }
    this.header("Content-Type", "application/json");
  }
  header(headerKey, headerValue) {
    return this._headers[headerKey] = headerValue, this;
  }
  headers(headers) {
    for (const key in headers) {
      Object.prototype.hasOwnProperty.call(headers, key) && (this._headers[key] = headers[key]);
    }
    return this;
  }
  option(key, value) {
    return this._options[key] = value, this;
  }
  options(options) {
    for (const key in options) {
      Object.prototype.hasOwnProperty.call(options, key) && (this._options[key] = options[key]);
    }
    return this;
  }
  middlewareOptions(options) {
    return this._middlewareOptions = options, this;
  }
  version(version) {
    return this.urlComponents.version = version, this;
  }
  responseType(responseType) {
    return this._responseType = responseType, this;
  }
  select(properties) {
    return this.addCsvQueryParameter("$select", properties, arguments), this;
  }
  expand(properties) {
    return this.addCsvQueryParameter("$expand", properties, arguments), this;
  }
  orderby(properties) {
    return this.addCsvQueryParameter("$orderby", properties, arguments), this;
  }
  filter(filterStr) {
    return this.urlComponents.oDataQueryParams.$filter = filterStr, this;
  }
  search(searchStr) {
    return this.urlComponents.oDataQueryParams.$search = searchStr, this;
  }
  top(n) {
    return this.urlComponents.oDataQueryParams.$top = n, this;
  }
  skip(n) {
    return this.urlComponents.oDataQueryParams.$skip = n, this;
  }
  skipToken(token) {
    return this.urlComponents.oDataQueryParams.$skipToken = token, this;
  }
  count(isCount = !0) {
    return this.urlComponents.oDataQueryParams.$count = isCount.toString(), this;
  }
  query(queryDictionaryOrString) {
    return this.parseQueryParameter(queryDictionaryOrString);
  }
  get(callback) {
    return __awaiter(this, void 0, void 0, function*() {
      const url = this.buildFullUrl(), options = {
        method: RequestMethod.GET
      };
      return yield this.send(url, options, callback);
    });
  }
  post(content, callback) {
    return __awaiter(this, void 0, void 0, function*() {
      const url = this.buildFullUrl(), options = {
        method: RequestMethod.POST,
        body: serializeContent(content)
      };
      return "FormData" === (content && content.constructor && content.constructor.name) ? options.headers = {} : (this.setHeaderContentType(), 
      options.headers = this._headers), yield this.send(url, options, callback);
    });
  }
  create(content, callback) {
    return __awaiter(this, void 0, void 0, function*() {
      return yield this.post(content, callback);
    });
  }
  put(content, callback) {
    return __awaiter(this, void 0, void 0, function*() {
      const url = this.buildFullUrl();
      this.setHeaderContentType();
      const options = {
        method: RequestMethod.PUT,
        body: serializeContent(content)
      };
      return yield this.send(url, options, callback);
    });
  }
  patch(content, callback) {
    return __awaiter(this, void 0, void 0, function*() {
      const url = this.buildFullUrl();
      this.setHeaderContentType();
      const options = {
        method: RequestMethod.PATCH,
        body: serializeContent(content)
      };
      return yield this.send(url, options, callback);
    });
  }
  update(content, callback) {
    return __awaiter(this, void 0, void 0, function*() {
      return yield this.patch(content, callback);
    });
  }
  delete(callback) {
    return __awaiter(this, void 0, void 0, function*() {
      const url = this.buildFullUrl(), options = {
        method: RequestMethod.DELETE
      };
      return yield this.send(url, options, callback);
    });
  }
  del(callback) {
    return __awaiter(this, void 0, void 0, function*() {
      return yield this.delete(callback);
    });
  }
  getStream(callback) {
    return __awaiter(this, void 0, void 0, function*() {
      const url = this.buildFullUrl(), options = {
        method: RequestMethod.GET
      };
      return this.responseType(ResponseType.STREAM), yield this.send(url, options, callback);
    });
  }
  putStream(stream, callback) {
    return __awaiter(this, void 0, void 0, function*() {
      const url = this.buildFullUrl(), options = {
        method: RequestMethod.PUT,
        headers: {
          "Content-Type": "application/octet-stream"
        },
        body: stream
      };
      return yield this.send(url, options, callback);
    });
  }
}

class HTTPClient {
  constructor(...middleware) {
    if (!middleware || !middleware.length) {
      const error = new Error;
      throw error.name = "InvalidMiddlewareChain", error.message = "Please provide a default middleware chain or custom middleware chain", 
      error;
    }
    this.setMiddleware(...middleware);
  }
  setMiddleware(...middleware) {
    middleware.length > 1 ? this.parseMiddleWareArray(middleware) : this.middleware = middleware[0];
  }
  parseMiddleWareArray(middlewareArray) {
    middlewareArray.forEach((element, index) => {
      index < middlewareArray.length - 1 && element.setNext(middlewareArray[index + 1]);
    }), this.middleware = middlewareArray[0];
  }
  sendRequest(context) {
    return __awaiter(this, void 0, void 0, function*() {
      if ("string" == typeof context.request && void 0 === context.options) {
        const error = new Error;
        throw error.name = "InvalidRequestOptions", error.message = "Unable to execute the middleware, Please provide valid options for a request", 
        error;
      }
      return yield this.middleware.execute(context), context;
    });
  }
}

class HTTPClientFactory {
  static createWithAuthenticationProvider(authProvider) {
    const authenticationHandler = new AuthenticationHandler(authProvider), retryHandler = new RetryHandler(new RetryHandlerOptions), telemetryHandler = new TelemetryHandler, httpMessageHandler = new HTTPMessageHandler;
    if (authenticationHandler.setNext(retryHandler), "object" == typeof process && "function" == typeof require) {
      const redirectHandler = new RedirectHandler(new RedirectHandlerOptions);
      retryHandler.setNext(redirectHandler), redirectHandler.setNext(telemetryHandler);
    } else {
      retryHandler.setNext(telemetryHandler);
    }
    return telemetryHandler.setNext(httpMessageHandler), HTTPClientFactory.createWithMiddleware(authenticationHandler);
  }
  static createWithMiddleware(...middleware) {
    return new HTTPClient(...middleware);
  }
}

class Client {
  static init(options) {
    const clientOptions = {};
    for (const i in options) {
      Object.prototype.hasOwnProperty.call(options, i) && (clientOptions[i] = "authProvider" === i ? new CustomAuthenticationProvider(options[i]) : options[i]);
    }
    return Client.initWithMiddleware(clientOptions);
  }
  static initWithMiddleware(clientOptions) {
    return new Client(clientOptions);
  }
  constructor(clientOptions) {
    this.config = {
      baseUrl: "https://graph.microsoft.com/",
      debugLogging: !1,
      defaultVersion: "v1.0"
    }, (() => {
      if ("undefined" == typeof Promise && "undefined" == typeof fetch) {
        const error = new Error("Library cannot function without Promise and fetch. So, please provide polyfill for them.");
        throw error.name = "PolyFillNotAvailable", error;
      }
      if ("undefined" == typeof Promise) {
        const error = new Error("Library cannot function without Promise. So, please provide polyfill for it.");
        throw error.name = "PolyFillNotAvailable", error;
      }
      if ("undefined" == typeof fetch) {
        const error = new Error("Library cannot function without fetch. So, please provide polyfill for it.");
        throw error.name = "PolyFillNotAvailable", error;
      }
    })();
    for (const key in clientOptions) {
      Object.prototype.hasOwnProperty.call(clientOptions, key) && (this.config[key] = clientOptions[key]);
    }
    let httpClient;
    if (void 0 !== clientOptions.authProvider && void 0 !== clientOptions.middleware) {
      const error = new Error;
      throw error.name = "AmbiguityInInitialization", error.message = "Unable to Create Client, Please provide either authentication provider for default middleware chain or custom middleware chain not both", 
      error;
    }
    if (void 0 !== clientOptions.authProvider) {
      httpClient = HTTPClientFactory.createWithAuthenticationProvider(clientOptions.authProvider);
    } else {
      if (void 0 === clientOptions.middleware) {
        const error = new Error;
        throw error.name = "InvalidMiddlewareChain", error.message = "Unable to Create Client, Please provide either authentication provider for default middleware chain or custom middleware chain", 
        error;
      }
      httpClient = new HTTPClient(...[].concat(clientOptions.middleware));
    }
    this.httpClient = httpClient;
  }
  api(path) {
    return new GraphRequest(this.httpClient, this.config, path);
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class Serializer {
  static serializeJSONBlob(data) {
    return JSON.stringify(data);
  }
  static serializeAccounts(accCache) {
    const accounts = {};
    return Object.keys(accCache).map(function(key) {
      const accountEntity = accCache[key];
      accounts[key] = {
        home_account_id: accountEntity.homeAccountId,
        environment: accountEntity.environment,
        realm: accountEntity.realm,
        local_account_id: accountEntity.localAccountId,
        username: accountEntity.username,
        authority_type: accountEntity.authorityType,
        name: accountEntity.name,
        client_info: accountEntity.clientInfo,
        last_modification_time: accountEntity.lastModificationTime,
        last_modification_app: accountEntity.lastModificationApp,
        tenantProfiles: accountEntity.tenantProfiles?.map(tenantProfile => JSON.stringify(tenantProfile))
      };
    }), accounts;
  }
  static serializeIdTokens(idTCache) {
    const idTokens = {};
    return Object.keys(idTCache).map(function(key) {
      const idTEntity = idTCache[key];
      idTokens[key] = {
        home_account_id: idTEntity.homeAccountId,
        environment: idTEntity.environment,
        credential_type: idTEntity.credentialType,
        client_id: idTEntity.clientId,
        secret: idTEntity.secret,
        realm: idTEntity.realm
      };
    }), idTokens;
  }
  static serializeAccessTokens(atCache) {
    const accessTokens = {};
    return Object.keys(atCache).map(function(key) {
      const atEntity = atCache[key];
      accessTokens[key] = {
        home_account_id: atEntity.homeAccountId,
        environment: atEntity.environment,
        credential_type: atEntity.credentialType,
        client_id: atEntity.clientId,
        secret: atEntity.secret,
        realm: atEntity.realm,
        target: atEntity.target,
        cached_at: atEntity.cachedAt,
        expires_on: atEntity.expiresOn,
        extended_expires_on: atEntity.extendedExpiresOn,
        refresh_on: atEntity.refreshOn,
        key_id: atEntity.keyId,
        token_type: atEntity.tokenType,
        requestedClaims: atEntity.requestedClaims,
        requestedClaimsHash: atEntity.requestedClaimsHash,
        userAssertionHash: atEntity.userAssertionHash
      };
    }), accessTokens;
  }
  static serializeRefreshTokens(rtCache) {
    const refreshTokens = {};
    return Object.keys(rtCache).map(function(key) {
      const rtEntity = rtCache[key];
      refreshTokens[key] = {
        home_account_id: rtEntity.homeAccountId,
        environment: rtEntity.environment,
        credential_type: rtEntity.credentialType,
        client_id: rtEntity.clientId,
        secret: rtEntity.secret,
        family_id: rtEntity.familyId,
        target: rtEntity.target,
        realm: rtEntity.realm
      };
    }), refreshTokens;
  }
  static serializeAppMetadata(amdtCache) {
    const appMetadata = {};
    return Object.keys(amdtCache).map(function(key) {
      const amdtEntity = amdtCache[key];
      appMetadata[key] = {
        client_id: amdtEntity.clientId,
        environment: amdtEntity.environment,
        family_id: amdtEntity.familyId
      };
    }), appMetadata;
  }
  static serializeAllCache(inMemCache) {
    return {
      Account: this.serializeAccounts(inMemCache.accounts),
      IdToken: this.serializeIdTokens(inMemCache.idTokens),
      AccessToken: this.serializeAccessTokens(inMemCache.accessTokens),
      RefreshToken: this.serializeRefreshTokens(inMemCache.refreshTokens),
      AppMetadata: this.serializeAppMetadata(inMemCache.appMetadata)
    };
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const Constants$2 = {
  LIBRARY_NAME: "MSAL.JS",
  SKU: "msal.js.common",
  CACHE_PREFIX: "msal",
  DEFAULT_AUTHORITY: "https://login.microsoftonline.com/common/",
  DEFAULT_AUTHORITY_HOST: "login.microsoftonline.com",
  DEFAULT_COMMON_TENANT: "common",
  ADFS: "adfs",
  DSTS: "dstsv2",
  AAD_INSTANCE_DISCOVERY_ENDPT: "https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=",
  CIAM_AUTH_URL: ".ciamlogin.com",
  AAD_TENANT_DOMAIN_SUFFIX: ".onmicrosoft.com",
  RESOURCE_DELIM: "|",
  NO_ACCOUNT: "NO_ACCOUNT",
  CLAIMS: "claims",
  CONSUMER_UTID: "9188040d-6c67-4c5b-b112-36a304b66dad",
  OPENID_SCOPE: "openid",
  PROFILE_SCOPE: "profile",
  OFFLINE_ACCESS_SCOPE: "offline_access",
  EMAIL_SCOPE: "email",
  CODE_RESPONSE_TYPE: "code",
  CODE_GRANT_TYPE: "authorization_code",
  RT_GRANT_TYPE: "refresh_token",
  FRAGMENT_RESPONSE_MODE: "fragment",
  S256_CODE_CHALLENGE_METHOD: "S256",
  URL_FORM_CONTENT_TYPE: "application/x-www-form-urlencoded;charset=utf-8",
  AUTHORIZATION_PENDING: "authorization_pending",
  NOT_DEFINED: "not_defined",
  EMPTY_STRING: "",
  NOT_APPLICABLE: "N/A",
  NOT_AVAILABLE: "Not Available",
  FORWARD_SLASH: "/",
  IMDS_ENDPOINT: "http://169.254.169.254/metadata/instance/compute/location",
  IMDS_VERSION: "2020-06-01",
  IMDS_TIMEOUT: 2e3,
  AZURE_REGION_AUTO_DISCOVER_FLAG: "TryAutoDetect",
  REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX: "login.microsoft.com",
  KNOWN_PUBLIC_CLOUDS: [ "login.microsoftonline.com", "login.windows.net", "login.microsoft.com", "sts.windows.net" ],
  TOKEN_RESPONSE_TYPE: "token",
  ID_TOKEN_RESPONSE_TYPE: "id_token",
  SHR_NONCE_VALIDITY: 240,
  INVALID_INSTANCE: "invalid_instance"
}, HttpStatus_SUCCESS_RANGE_START = 200, HttpStatus_SUCCESS_RANGE_END = 299, HttpStatus_REDIRECT = 302, HttpStatus_CLIENT_ERROR_RANGE_START = 400, HttpStatus_CLIENT_ERROR_RANGE_END = 499, HttpStatus_SERVER_ERROR = 500, HttpStatus_SERVER_ERROR_RANGE_START = 500, HttpStatus_SERVER_ERROR_RANGE_END = 599, OIDC_DEFAULT_SCOPES = [ Constants$2.OPENID_SCOPE, Constants$2.PROFILE_SCOPE, Constants$2.OFFLINE_ACCESS_SCOPE ], OIDC_SCOPES = [ ...OIDC_DEFAULT_SCOPES, Constants$2.EMAIL_SCOPE ], HeaderNames_CONTENT_TYPE = "Content-Type", HeaderNames_CONTENT_LENGTH = "Content-Length", HeaderNames_RETRY_AFTER = "Retry-After", HeaderNames_CCS_HEADER = "X-AnchorMailbox", HeaderNames_X_MS_REQUEST_ID = "x-ms-request-id", HeaderNames_X_MS_HTTP_VERSION = "x-ms-httpver", AADAuthorityConstants_COMMON = "common", AADAuthorityConstants_ORGANIZATIONS = "organizations", AADAuthorityConstants_CONSUMERS = "consumers", ClaimsRequestKeys_ACCESS_TOKEN = "access_token", ClaimsRequestKeys_XMS_CC = "xms_cc", PromptValue = {
  LOGIN: "login",
  SELECT_ACCOUNT: "select_account",
  CONSENT: "consent",
  NONE: "none",
  CREATE: "create",
  NO_SESSION: "no_session"
}, CodeChallengeMethodValues = {
  PLAIN: "plain",
  S256: "S256"
}, ResponseMode = {
  QUERY: "query",
  FRAGMENT: "fragment",
  FORM_POST: "form_post"
}, GrantType_AUTHORIZATION_CODE_GRANT = "authorization_code", GrantType_RESOURCE_OWNER_PASSWORD_GRANT = "password", GrantType_REFRESH_TOKEN_GRANT = "refresh_token", GrantType_DEVICE_CODE_GRANT = "device_code", CacheAccountType_MSSTS_ACCOUNT_TYPE = "MSSTS", CacheAccountType_ADFS_ACCOUNT_TYPE = "ADFS", CacheAccountType_GENERIC_ACCOUNT_TYPE = "Generic", Separators_CACHE_KEY_SEPARATOR = "-", Separators_CLIENT_INFO_SEPARATOR = ".", CredentialType = {
  ID_TOKEN: "IdToken",
  ACCESS_TOKEN: "AccessToken",
  ACCESS_TOKEN_WITH_AUTH_SCHEME: "AccessToken_With_AuthScheme",
  REFRESH_TOKEN: "RefreshToken"
}, AUTHORITY_METADATA_CONSTANTS_CACHE_KEY = "authority-metadata", AUTHORITY_METADATA_CONSTANTS_REFRESH_TIME_SECONDS = 86400, AuthorityMetadataSource_CONFIG = "config", AuthorityMetadataSource_CACHE = "cache", AuthorityMetadataSource_NETWORK = "network", AuthorityMetadataSource_HARDCODED_VALUES = "hardcoded_values", SERVER_TELEM_CONSTANTS = {
  SCHEMA_VERSION: 5,
  MAX_LAST_HEADER_BYTES: 330,
  MAX_CACHED_ERRORS: 50,
  CACHE_KEY: "server-telemetry",
  CATEGORY_SEPARATOR: "|",
  VALUE_SEPARATOR: ",",
  OVERFLOW_TRUE: "1",
  OVERFLOW_FALSE: "0",
  UNKNOWN_ERROR: "unknown_error"
}, AuthenticationScheme = {
  BEARER: "Bearer",
  POP: "pop",
  SSH: "ssh-cert"
}, ThrottlingConstants_DEFAULT_THROTTLE_TIME_SECONDS = 60, ThrottlingConstants_DEFAULT_MAX_THROTTLE_TIME_SECONDS = 3600, ThrottlingConstants_THROTTLING_PREFIX = "throttling", ThrottlingConstants_X_MS_LIB_CAPABILITY_VALUE = "retry-after, h429", Errors_INVALID_GRANT_ERROR = "invalid_grant", Errors_CLIENT_MISMATCH_ERROR = "client_mismatch", PasswordGrantConstants_username = "username", PasswordGrantConstants_password = "password", ResponseCodes_httpSuccess = 200, ResponseCodes_httpBadRequest = 400, RegionDiscoverySources_FAILED_AUTO_DETECTION = "1", RegionDiscoverySources_ENVIRONMENT_VARIABLE = "3", RegionDiscoverySources_IMDS = "4", RegionDiscoveryOutcomes_CONFIGURED_NO_AUTO_DETECTION = "2", RegionDiscoveryOutcomes_AUTO_DETECTION_REQUESTED_SUCCESSFUL = "4", RegionDiscoveryOutcomes_AUTO_DETECTION_REQUESTED_FAILED = "5", CacheOutcome_NOT_APPLICABLE = "0", CacheOutcome_FORCE_REFRESH_OR_CLAIMS = "1", CacheOutcome_NO_CACHED_ACCESS_TOKEN = "2", CacheOutcome_CACHED_ACCESS_TOKEN_EXPIRED = "3", CacheOutcome_PROACTIVELY_REFRESHED = "4", unexpectedError = "unexpected_error", postRequestFailed = "post_request_failed", AuthErrorMessages = {
  [unexpectedError]: "Unexpected error in authentication.",
  [postRequestFailed]: "Post request failed from the network, could be a 4xx/5xx or a network unavailability. Please check the exact error code for details."
};

class AuthError extends Error {
  constructor(errorCode, errorMessage, suberror) {
    super(errorMessage ? `${errorCode}: ${errorMessage}` : errorCode), Object.setPrototypeOf(this, AuthError.prototype), 
    this.errorCode = errorCode || Constants$2.EMPTY_STRING, this.errorMessage = errorMessage || Constants$2.EMPTY_STRING, 
    this.subError = suberror || Constants$2.EMPTY_STRING, this.name = "AuthError";
  }
  setCorrelationId(correlationId) {
    this.correlationId = correlationId;
  }
}

function createAuthError(code, additionalMessage) {
  return new AuthError(code, additionalMessage ? `${AuthErrorMessages[code]} ${additionalMessage}` : AuthErrorMessages[code]);
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const clientInfoDecodingError = "client_info_decoding_error", clientInfoEmptyError = "client_info_empty_error", tokenParsingError = "token_parsing_error", nullOrEmptyToken = "null_or_empty_token", endpointResolutionError = "endpoints_resolution_error", networkError = "network_error", openIdConfigError = "openid_config_error", hashNotDeserialized = "hash_not_deserialized", invalidState = "invalid_state", stateMismatch = "state_mismatch", stateNotFound = "state_not_found", nonceMismatch = "nonce_mismatch", authTimeNotFound = "auth_time_not_found", maxAgeTranspired = "max_age_transpired", multipleMatchingTokens = "multiple_matching_tokens", multipleMatchingAccounts = "multiple_matching_accounts", multipleMatchingAppMetadata = "multiple_matching_appMetadata", requestCannotBeMade = "request_cannot_be_made", cannotRemoveEmptyScope = "cannot_remove_empty_scope", cannotAppendScopeSet = "cannot_append_scopeset", emptyInputScopeSet = "empty_input_scopeset", deviceCodePollingCancelled = "device_code_polling_cancelled", deviceCodeExpired = "device_code_expired", deviceCodeUnknownError = "device_code_unknown_error", noAccountInSilentRequest = "no_account_in_silent_request", invalidCacheRecord = "invalid_cache_record", invalidCacheEnvironment = "invalid_cache_environment", noAccountFound = "no_account_found", noCryptoObject = "no_crypto_object", unexpectedCredentialType = "unexpected_credential_type", invalidAssertion = "invalid_assertion", invalidClientCredential = "invalid_client_credential", tokenRefreshRequired = "token_refresh_required", userTimeoutReached = "user_timeout_reached", tokenClaimsCnfRequiredForSignedJwt = "token_claims_cnf_required_for_signedjwt", authorizationCodeMissingFromServerResponse = "authorization_code_missing_from_server_response", bindingKeyNotRemoved = "binding_key_not_removed", endSessionEndpointNotSupported = "end_session_endpoint_not_supported", keyIdMissing = "key_id_missing", noNetworkConnectivity = "no_network_connectivity", userCanceled = "user_canceled", missingTenantIdError = "missing_tenant_id_error", methodNotImplemented = "method_not_implemented", nestedAppAuthBridgeDisabled = "nested_app_auth_bridge_disabled", ClientAuthErrorMessages = {
  [clientInfoDecodingError]: "The client info could not be parsed/decoded correctly",
  [clientInfoEmptyError]: "The client info was empty",
  [tokenParsingError]: "Token cannot be parsed",
  [nullOrEmptyToken]: "The token is null or empty",
  [endpointResolutionError]: "Endpoints cannot be resolved",
  [networkError]: "Network request failed",
  [openIdConfigError]: "Could not retrieve endpoints. Check your authority and verify the .well-known/openid-configuration endpoint returns the required endpoints.",
  [hashNotDeserialized]: "The hash parameters could not be deserialized",
  [invalidState]: "State was not the expected format",
  [stateMismatch]: "State mismatch error",
  [stateNotFound]: "State not found",
  [nonceMismatch]: "Nonce mismatch error",
  [authTimeNotFound]: "Max Age was requested and the ID token is missing the auth_time variable. auth_time is an optional claim and is not enabled by default - it must be enabled. See https://aka.ms/msaljs/optional-claims for more information.",
  [maxAgeTranspired]: "Max Age is set to 0, or too much time has elapsed since the last end-user authentication.",
  [multipleMatchingTokens]: "The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more requirements such as authority or account.",
  [multipleMatchingAccounts]: "The cache contains multiple accounts satisfying the given parameters. Please pass more info to obtain the correct account",
  [multipleMatchingAppMetadata]: "The cache contains multiple appMetadata satisfying the given parameters. Please pass more info to obtain the correct appMetadata",
  [requestCannotBeMade]: "Token request cannot be made without authorization code or refresh token.",
  [cannotRemoveEmptyScope]: "Cannot remove null or empty scope from ScopeSet",
  [cannotAppendScopeSet]: "Cannot append ScopeSet",
  [emptyInputScopeSet]: "Empty input ScopeSet cannot be processed",
  [deviceCodePollingCancelled]: "Caller has cancelled token endpoint polling during device code flow by setting DeviceCodeRequest.cancel = true.",
  [deviceCodeExpired]: "Device code is expired.",
  [deviceCodeUnknownError]: "Device code stopped polling for unknown reasons.",
  [noAccountInSilentRequest]: "Please pass an account object, silent flow is not supported without account information",
  [invalidCacheRecord]: "Cache record object was null or undefined.",
  [invalidCacheEnvironment]: "Invalid environment when attempting to create cache entry",
  [noAccountFound]: "No account found in cache for given key.",
  [noCryptoObject]: "No crypto object detected.",
  [unexpectedCredentialType]: "Unexpected credential type.",
  [invalidAssertion]: "Client assertion must meet requirements described in https://tools.ietf.org/html/rfc7515",
  [invalidClientCredential]: "Client credential (secret, certificate, or assertion) must not be empty when creating a confidential client. An application should at most have one credential",
  [tokenRefreshRequired]: "Cannot return token from cache because it must be refreshed. This may be due to one of the following reasons: forceRefresh parameter is set to true, claims have been requested, there is no cached access token or it is expired.",
  [userTimeoutReached]: "User defined timeout for device code polling reached",
  [tokenClaimsCnfRequiredForSignedJwt]: "Cannot generate a POP jwt if the token_claims are not populated",
  [authorizationCodeMissingFromServerResponse]: "Server response does not contain an authorization code to proceed",
  [bindingKeyNotRemoved]: "Could not remove the credential's binding key from storage.",
  [endSessionEndpointNotSupported]: "The provided authority does not support logout",
  [keyIdMissing]: "A keyId value is missing from the requested bound token's cache record and is required to match the token to it's stored binding key.",
  [noNetworkConnectivity]: "No network connectivity. Check your internet connection.",
  [userCanceled]: "User cancelled the flow.",
  [missingTenantIdError]: "A tenant id - not common, organizations, or consumers - must be specified when using the client_credentials flow.",
  [methodNotImplemented]: "This method has not been implemented",
  [nestedAppAuthBridgeDisabled]: "The nested app auth bridge is disabled"
};

class ClientAuthError extends AuthError {
  constructor(errorCode, additionalMessage) {
    super(errorCode, additionalMessage ? `${ClientAuthErrorMessages[errorCode]}: ${additionalMessage}` : ClientAuthErrorMessages[errorCode]), 
    this.name = "ClientAuthError", Object.setPrototypeOf(this, ClientAuthError.prototype);
  }
}

function createClientAuthError(errorCode, additionalMessage) {
  return new ClientAuthError(errorCode, additionalMessage);
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const DEFAULT_CRYPTO_IMPLEMENTATION = {
  createNewGuid: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  base64Decode: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  base64Encode: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  base64UrlEncode: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  encodeKid: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  async getPublicKeyThumbprint() {
    throw createClientAuthError(methodNotImplemented);
  },
  async removeTokenBindingKey() {
    throw createClientAuthError(methodNotImplemented);
  },
  async clearKeystore() {
    throw createClientAuthError(methodNotImplemented);
  },
  async signJwt() {
    throw createClientAuthError(methodNotImplemented);
  },
  async hashString() {
    throw createClientAuthError(methodNotImplemented);
  }
};

/*! @azure/msal-common v14.16.0 2024-11-05 */ var LogLevel;

!function(LogLevel) {
  LogLevel[LogLevel.Error = 0] = "Error", LogLevel[LogLevel.Warning = 1] = "Warning", 
  LogLevel[LogLevel.Info = 2] = "Info", LogLevel[LogLevel.Verbose = 3] = "Verbose", 
  LogLevel[LogLevel.Trace = 4] = "Trace";
}(LogLevel || (LogLevel = {}));

class Logger {
  constructor(loggerOptions, packageName, packageVersion) {
    this.level = LogLevel.Info;
    const setLoggerOptions = loggerOptions || Logger.createDefaultLoggerOptions();
    this.localCallback = setLoggerOptions.loggerCallback || (() => {}), this.piiLoggingEnabled = setLoggerOptions.piiLoggingEnabled || !1, 
    this.level = "number" == typeof setLoggerOptions.logLevel ? setLoggerOptions.logLevel : LogLevel.Info, 
    this.correlationId = setLoggerOptions.correlationId || Constants$2.EMPTY_STRING, 
    this.packageName = packageName || Constants$2.EMPTY_STRING, this.packageVersion = packageVersion || Constants$2.EMPTY_STRING;
  }
  static createDefaultLoggerOptions() {
    return {
      loggerCallback: () => {},
      piiLoggingEnabled: !1,
      logLevel: LogLevel.Info
    };
  }
  clone(packageName, packageVersion, correlationId) {
    return new Logger({
      loggerCallback: this.localCallback,
      piiLoggingEnabled: this.piiLoggingEnabled,
      logLevel: this.level,
      correlationId: correlationId || this.correlationId
    }, packageName, packageVersion);
  }
  logMessage(logMessage, options) {
    if (options.logLevel > this.level || !this.piiLoggingEnabled && options.containsPii) {
      return;
    }
    const log = `${`[${(new Date).toUTCString()}] : [${options.correlationId || this.correlationId || ""}]`} : ${this.packageName}@${this.packageVersion} : ${LogLevel[options.logLevel]} - ${logMessage}`;
    this.executeCallback(options.logLevel, log, options.containsPii || !1);
  }
  executeCallback(level, message, containsPii) {
    this.localCallback && this.localCallback(level, message, containsPii);
  }
  error(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Error,
      containsPii: !1,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  errorPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Error,
      containsPii: !0,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  warning(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Warning,
      containsPii: !1,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  warningPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Warning,
      containsPii: !0,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  info(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Info,
      containsPii: !1,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  infoPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Info,
      containsPii: !0,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  verbose(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Verbose,
      containsPii: !1,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  verbosePii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Verbose,
      containsPii: !0,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  trace(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Trace,
      containsPii: !1,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  tracePii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Trace,
      containsPii: !0,
      correlationId: correlationId || Constants$2.EMPTY_STRING
    });
  }
  isPiiLoggingEnabled() {
    return this.piiLoggingEnabled || !1;
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const AzureCloudInstance_None = "none";

/*! @azure/msal-common v14.16.0 2024-11-05 */
function extractTokenClaims(encodedToken, base64Decode) {
  const jswPayload = function(authToken) {
    if (!authToken) {
      throw createClientAuthError("null_or_empty_token");
    }
    const matches = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/.exec(authToken);
    if (!matches || matches.length < 4) {
      throw createClientAuthError("token_parsing_error");
    }
    return matches[2];
  }(encodedToken);
  try {
    const base64Decoded = base64Decode(jswPayload);
    return JSON.parse(base64Decoded);
  } catch (err) {
    throw createClientAuthError("token_parsing_error");
  }
}

function checkMaxAge(authTime, maxAge) {
  if (0 === maxAge || Date.now() - 3e5 > authTime + maxAge) {
    throw createClientAuthError("max_age_transpired");
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ function nowSeconds() {
  return Math.round((new Date).getTime() / 1e3);
}

function isTokenExpired(expiresOn, offset) {
  const expirationSec = Number(expiresOn) || 0;
  return nowSeconds() + offset > expirationSec;
}

function delay(t, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), t));
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ function generateCredentialKey(credentialEntity) {
  return [ generateAccountId(credentialEntity), generateCredentialId(credentialEntity), generateTarget(credentialEntity), generateClaimsHash(credentialEntity), generateScheme(credentialEntity) ].join(Separators_CACHE_KEY_SEPARATOR).toLowerCase();
}

function isCredentialEntity(entity) {
  return entity.hasOwnProperty("homeAccountId") && entity.hasOwnProperty("environment") && entity.hasOwnProperty("credentialType") && entity.hasOwnProperty("clientId") && entity.hasOwnProperty("secret");
}

function isAccessTokenEntity(entity) {
  return !!entity && (isCredentialEntity(entity) && entity.hasOwnProperty("realm") && entity.hasOwnProperty("target") && (entity.credentialType === CredentialType.ACCESS_TOKEN || entity.credentialType === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME));
}

function isIdTokenEntity(entity) {
  return !!entity && (isCredentialEntity(entity) && entity.hasOwnProperty("realm") && entity.credentialType === CredentialType.ID_TOKEN);
}

function isRefreshTokenEntity(entity) {
  return !!entity && (isCredentialEntity(entity) && entity.credentialType === CredentialType.REFRESH_TOKEN);
}

function generateAccountId(credentialEntity) {
  return [ credentialEntity.homeAccountId, credentialEntity.environment ].join(Separators_CACHE_KEY_SEPARATOR).toLowerCase();
}

function generateCredentialId(credentialEntity) {
  const clientOrFamilyId = credentialEntity.credentialType === CredentialType.REFRESH_TOKEN && credentialEntity.familyId || credentialEntity.clientId;
  return [ credentialEntity.credentialType, clientOrFamilyId, credentialEntity.realm || "" ].join(Separators_CACHE_KEY_SEPARATOR).toLowerCase();
}

function generateTarget(credentialEntity) {
  return (credentialEntity.target || "").toLowerCase();
}

function generateClaimsHash(credentialEntity) {
  return (credentialEntity.requestedClaimsHash || "").toLowerCase();
}

function generateScheme(credentialEntity) {
  return credentialEntity.tokenType && credentialEntity.tokenType.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase() ? credentialEntity.tokenType.toLowerCase() : "";
}

function isAppMetadataEntity(key, entity) {
  return !!entity && (0 === key.indexOf("appmetadata") && entity.hasOwnProperty("clientId") && entity.hasOwnProperty("environment"));
}

function generateAuthorityMetadataExpiresAt() {
  return nowSeconds() + AUTHORITY_METADATA_CONSTANTS_REFRESH_TIME_SECONDS;
}

function updateAuthorityEndpointMetadata(authorityMetadata, updatedValues, fromNetwork) {
  authorityMetadata.authorization_endpoint = updatedValues.authorization_endpoint, 
  authorityMetadata.token_endpoint = updatedValues.token_endpoint, authorityMetadata.end_session_endpoint = updatedValues.end_session_endpoint, 
  authorityMetadata.issuer = updatedValues.issuer, authorityMetadata.endpointsFromNetwork = fromNetwork, 
  authorityMetadata.jwks_uri = updatedValues.jwks_uri;
}

function updateCloudDiscoveryMetadata(authorityMetadata, updatedValues, fromNetwork) {
  authorityMetadata.aliases = updatedValues.aliases, authorityMetadata.preferred_cache = updatedValues.preferred_cache, 
  authorityMetadata.preferred_network = updatedValues.preferred_network, authorityMetadata.aliasesFromNetwork = fromNetwork;
}

function isAuthorityMetadataExpired(metadata) {
  return metadata.expiresAt <= nowSeconds();
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const redirectUriEmpty = "redirect_uri_empty", claimsRequestParsingError = "claims_request_parsing_error", authorityUriInsecure = "authority_uri_insecure", urlParseError = "url_parse_error", urlEmptyError = "empty_url_error", emptyInputScopesError = "empty_input_scopes_error", invalidPromptValue = "invalid_prompt_value", invalidClaims = "invalid_claims", tokenRequestEmpty = "token_request_empty", logoutRequestEmpty = "logout_request_empty", invalidCodeChallengeMethod = "invalid_code_challenge_method", pkceParamsMissing = "pkce_params_missing", invalidCloudDiscoveryMetadata = "invalid_cloud_discovery_metadata", invalidAuthorityMetadata = "invalid_authority_metadata", untrustedAuthority = "untrusted_authority", missingSshJwk = "missing_ssh_jwk", missingSshKid = "missing_ssh_kid", missingNonceAuthenticationHeader = "missing_nonce_authentication_header", invalidAuthenticationHeader = "invalid_authentication_header", cannotSetOIDCOptions = "cannot_set_OIDCOptions", cannotAllowNativeBroker = "cannot_allow_native_broker", authorityMismatch = "authority_mismatch", ClientConfigurationErrorMessages = {
  [redirectUriEmpty]: "A redirect URI is required for all calls, and none has been set.",
  [claimsRequestParsingError]: "Could not parse the given claims request object.",
  [authorityUriInsecure]: "Authority URIs must use https.  Please see here for valid authority configuration options: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications#configuration-options",
  [urlParseError]: "URL could not be parsed into appropriate segments.",
  [urlEmptyError]: "URL was empty or null.",
  [emptyInputScopesError]: "Scopes cannot be passed as null, undefined or empty array because they are required to obtain an access token.",
  [invalidPromptValue]: "Please see here for valid configuration options: https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#commonauthorizationurlrequest",
  [invalidClaims]: "Given claims parameter must be a stringified JSON object.",
  [tokenRequestEmpty]: "Token request was empty and not found in cache.",
  [logoutRequestEmpty]: "The logout request was null or undefined.",
  [invalidCodeChallengeMethod]: 'code_challenge_method passed is invalid. Valid values are "plain" and "S256".',
  [pkceParamsMissing]: "Both params: code_challenge and code_challenge_method are to be passed if to be sent in the request",
  [invalidCloudDiscoveryMetadata]: "Invalid cloudDiscoveryMetadata provided. Must be a stringified JSON object containing tenant_discovery_endpoint and metadata fields",
  [invalidAuthorityMetadata]: "Invalid authorityMetadata provided. Must by a stringified JSON object containing authorization_endpoint, token_endpoint, issuer fields.",
  [untrustedAuthority]: "The provided authority is not a trusted authority. Please include this authority in the knownAuthorities config parameter.",
  [missingSshJwk]: "Missing sshJwk in SSH certificate request. A stringified JSON Web Key is required when using the SSH authentication scheme.",
  [missingSshKid]: "Missing sshKid in SSH certificate request. A string that uniquely identifies the public SSH key is required when using the SSH authentication scheme.",
  [missingNonceAuthenticationHeader]: "Unable to find an authentication header containing server nonce. Either the Authentication-Info or WWW-Authenticate headers must be present in order to obtain a server nonce.",
  [invalidAuthenticationHeader]: "Invalid authentication header provided",
  [cannotSetOIDCOptions]: "Cannot set OIDCOptions parameter. Please change the protocol mode to OIDC or use a non-Microsoft authority.",
  [cannotAllowNativeBroker]: "Cannot set allowNativeBroker parameter to true when not in AAD protocol mode.",
  [authorityMismatch]: "Authority mismatch error. Authority provided in login request or PublicClientApplication config does not match the environment of the provided account. Please use a matching account or make an interactive request to login to this authority."
};

class ClientConfigurationError extends AuthError {
  constructor(errorCode) {
    super(errorCode, ClientConfigurationErrorMessages[errorCode]), this.name = "ClientConfigurationError", 
    Object.setPrototypeOf(this, ClientConfigurationError.prototype);
  }
}

function createClientConfigurationError(errorCode) {
  return new ClientConfigurationError(errorCode);
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class StringUtils {
  static isEmptyObj(strObj) {
    if (strObj) {
      try {
        const obj = JSON.parse(strObj);
        return 0 === Object.keys(obj).length;
      } catch (e) {}
    }
    return !0;
  }
  static startsWith(str, search) {
    return 0 === str.indexOf(search);
  }
  static endsWith(str, search) {
    return str.length >= search.length && str.lastIndexOf(search) === str.length - search.length;
  }
  static queryStringToObject(query) {
    const obj = {}, params = query.split("&"), decode = s => decodeURIComponent(s.replace(/\+/g, " "));
    return params.forEach(pair => {
      if (pair.trim()) {
        const [key, value] = pair.split(/=(.+)/g, 2);
        key && value && (obj[decode(key)] = decode(value));
      }
    }), obj;
  }
  static trimArrayEntries(arr) {
    return arr.map(entry => entry.trim());
  }
  static removeEmptyStringsFromArray(arr) {
    return arr.filter(entry => !!entry);
  }
  static jsonParseHelper(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }
  static matchPattern(pattern, input) {
    return new RegExp(pattern.replace(/\\/g, "\\\\").replace(/\*/g, "[^ ]*").replace(/\?/g, "\\?")).test(input);
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class ScopeSet {
  constructor(inputScopes) {
    const scopeArr = inputScopes ? StringUtils.trimArrayEntries([ ...inputScopes ]) : [], filteredInput = scopeArr ? StringUtils.removeEmptyStringsFromArray(scopeArr) : [];
    this.validateInputScopes(filteredInput), this.scopes = new Set, filteredInput.forEach(scope => this.scopes.add(scope));
  }
  static fromString(inputScopeString) {
    const inputScopes = (inputScopeString || Constants$2.EMPTY_STRING).split(" ");
    return new ScopeSet(inputScopes);
  }
  static createSearchScopes(inputScopeString) {
    const scopeSet = new ScopeSet(inputScopeString);
    return scopeSet.containsOnlyOIDCScopes() ? scopeSet.removeScope(Constants$2.OFFLINE_ACCESS_SCOPE) : scopeSet.removeOIDCScopes(), 
    scopeSet;
  }
  validateInputScopes(inputScopes) {
    if (!inputScopes || inputScopes.length < 1) {
      throw createClientConfigurationError("empty_input_scopes_error");
    }
  }
  containsScope(scope) {
    const lowerCaseScopes = this.printScopesLowerCase().split(" "), lowerCaseScopesSet = new ScopeSet(lowerCaseScopes);
    return !!scope && lowerCaseScopesSet.scopes.has(scope.toLowerCase());
  }
  containsScopeSet(scopeSet) {
    return !(!scopeSet || scopeSet.scopes.size <= 0) && (this.scopes.size >= scopeSet.scopes.size && scopeSet.asArray().every(scope => this.containsScope(scope)));
  }
  containsOnlyOIDCScopes() {
    let defaultScopeCount = 0;
    return OIDC_SCOPES.forEach(defaultScope => {
      this.containsScope(defaultScope) && (defaultScopeCount += 1);
    }), this.scopes.size === defaultScopeCount;
  }
  appendScope(newScope) {
    newScope && this.scopes.add(newScope.trim());
  }
  appendScopes(newScopes) {
    try {
      newScopes.forEach(newScope => this.appendScope(newScope));
    } catch (e) {
      throw createClientAuthError("cannot_append_scopeset");
    }
  }
  removeScope(scope) {
    if (!scope) {
      throw createClientAuthError("cannot_remove_empty_scope");
    }
    this.scopes.delete(scope.trim());
  }
  removeOIDCScopes() {
    OIDC_SCOPES.forEach(defaultScope => {
      this.scopes.delete(defaultScope);
    });
  }
  unionScopeSets(otherScopes) {
    if (!otherScopes) {
      throw createClientAuthError("empty_input_scopeset");
    }
    const unionScopes = new Set;
    return otherScopes.scopes.forEach(scope => unionScopes.add(scope.toLowerCase())), 
    this.scopes.forEach(scope => unionScopes.add(scope.toLowerCase())), unionScopes;
  }
  intersectingScopeSets(otherScopes) {
    if (!otherScopes) {
      throw createClientAuthError("empty_input_scopeset");
    }
    otherScopes.containsOnlyOIDCScopes() || otherScopes.removeOIDCScopes();
    const unionScopes = this.unionScopeSets(otherScopes), sizeOtherScopes = otherScopes.getScopeCount(), sizeThisScopes = this.getScopeCount();
    return unionScopes.size < sizeThisScopes + sizeOtherScopes;
  }
  getScopeCount() {
    return this.scopes.size;
  }
  asArray() {
    const array = [];
    return this.scopes.forEach(val => array.push(val)), array;
  }
  printScopes() {
    if (this.scopes) {
      return this.asArray().join(" ");
    }
    return Constants$2.EMPTY_STRING;
  }
  printScopesLowerCase() {
    return this.printScopes().toLowerCase();
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ function buildClientInfo(rawClientInfo, base64Decode) {
  if (!rawClientInfo) {
    throw createClientAuthError("client_info_empty_error");
  }
  try {
    const decodedClientInfo = base64Decode(rawClientInfo);
    return JSON.parse(decodedClientInfo);
  } catch (e) {
    throw createClientAuthError("client_info_decoding_error");
  }
}

function buildClientInfoFromHomeAccountId(homeAccountId) {
  if (!homeAccountId) {
    throw createClientAuthError("client_info_decoding_error");
  }
  const clientInfoParts = homeAccountId.split(Separators_CLIENT_INFO_SEPARATOR, 2);
  return {
    uid: clientInfoParts[0],
    utid: clientInfoParts.length < 2 ? Constants$2.EMPTY_STRING : clientInfoParts[1]
  };
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ function tenantIdMatchesHomeTenant(tenantId, homeAccountId) {
  return !!tenantId && !!homeAccountId && tenantId === homeAccountId.split(".")[1];
}

function buildTenantProfile(homeAccountId, localAccountId, tenantId, idTokenClaims) {
  if (idTokenClaims) {
    const {oid: oid, sub: sub, tid: tid, name: name, tfp: tfp, acr: acr} = idTokenClaims, tenantId = tid || tfp || acr || "";
    return {
      tenantId: tenantId,
      localAccountId: oid || sub || "",
      name: name,
      isHomeTenant: tenantIdMatchesHomeTenant(tenantId, homeAccountId)
    };
  }
  return {
    tenantId: tenantId,
    localAccountId: localAccountId,
    isHomeTenant: tenantIdMatchesHomeTenant(tenantId, homeAccountId)
  };
}

function updateAccountTenantProfileData(baseAccountInfo, tenantProfile, idTokenClaims, idTokenSecret) {
  let updatedAccountInfo = baseAccountInfo;
  if (tenantProfile) {
    const {isHomeTenant: isHomeTenant, ...tenantProfileOverride} = tenantProfile;
    updatedAccountInfo = {
      ...baseAccountInfo,
      ...tenantProfileOverride
    };
  }
  if (idTokenClaims) {
    const {isHomeTenant: isHomeTenant, ...claimsSourcedTenantProfile} = buildTenantProfile(baseAccountInfo.homeAccountId, baseAccountInfo.localAccountId, baseAccountInfo.tenantId, idTokenClaims);
    return updatedAccountInfo = {
      ...updatedAccountInfo,
      ...claimsSourcedTenantProfile,
      idTokenClaims: idTokenClaims,
      idToken: idTokenSecret
    }, updatedAccountInfo;
  }
  return updatedAccountInfo;
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const AuthorityType_Default = 0, AuthorityType_Adfs = 1, AuthorityType_Dsts = 2, AuthorityType_Ciam = 3;

/*! @azure/msal-common v14.16.0 2024-11-05 */ function getTenantIdFromIdTokenClaims(idTokenClaims) {
  if (idTokenClaims) {
    return idTokenClaims.tid || idTokenClaims.tfp || idTokenClaims.acr || null;
  }
  return null;
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const ProtocolMode_AAD = "AAD", ProtocolMode_OIDC = "OIDC";

/*! @azure/msal-common v14.16.0 2024-11-05 */ class AccountEntity {
  generateAccountId() {
    return [ this.homeAccountId, this.environment ].join(Separators_CACHE_KEY_SEPARATOR).toLowerCase();
  }
  generateAccountKey() {
    return AccountEntity.generateAccountCacheKey({
      homeAccountId: this.homeAccountId,
      environment: this.environment,
      tenantId: this.realm,
      username: this.username,
      localAccountId: this.localAccountId
    });
  }
  getAccountInfo() {
    return {
      homeAccountId: this.homeAccountId,
      environment: this.environment,
      tenantId: this.realm,
      username: this.username,
      localAccountId: this.localAccountId,
      name: this.name,
      nativeAccountId: this.nativeAccountId,
      authorityType: this.authorityType,
      tenantProfiles: new Map((this.tenantProfiles || []).map(tenantProfile => [ tenantProfile.tenantId, tenantProfile ]))
    };
  }
  isSingleTenant() {
    return !this.tenantProfiles;
  }
  static generateAccountCacheKey(accountInterface) {
    const homeTenantId = accountInterface.homeAccountId.split(".")[1];
    return [ accountInterface.homeAccountId, accountInterface.environment || "", homeTenantId || accountInterface.tenantId || "" ].join(Separators_CACHE_KEY_SEPARATOR).toLowerCase();
  }
  static createAccount(accountDetails, authority, base64Decode) {
    const account = new AccountEntity;
    let clientInfo;
    authority.authorityType === AuthorityType_Adfs ? account.authorityType = CacheAccountType_ADFS_ACCOUNT_TYPE : authority.protocolMode === ProtocolMode_AAD ? account.authorityType = CacheAccountType_MSSTS_ACCOUNT_TYPE : account.authorityType = CacheAccountType_GENERIC_ACCOUNT_TYPE, 
    accountDetails.clientInfo && base64Decode && (clientInfo = buildClientInfo(accountDetails.clientInfo, base64Decode)), 
    account.clientInfo = accountDetails.clientInfo, account.homeAccountId = accountDetails.homeAccountId, 
    account.nativeAccountId = accountDetails.nativeAccountId;
    const env = accountDetails.environment || authority && authority.getPreferredCache();
    if (!env) {
      throw createClientAuthError("invalid_cache_environment");
    }
    account.environment = env, account.realm = clientInfo?.utid || getTenantIdFromIdTokenClaims(accountDetails.idTokenClaims) || "", 
    account.localAccountId = clientInfo?.uid || accountDetails.idTokenClaims?.oid || accountDetails.idTokenClaims?.sub || "";
    const preferredUsername = accountDetails.idTokenClaims?.preferred_username || accountDetails.idTokenClaims?.upn, email = accountDetails.idTokenClaims?.emails ? accountDetails.idTokenClaims.emails[0] : null;
    if (account.username = preferredUsername || email || "", account.name = accountDetails.idTokenClaims?.name || "", 
    account.cloudGraphHostName = accountDetails.cloudGraphHostName, account.msGraphHost = accountDetails.msGraphHost, 
    accountDetails.tenantProfiles) {
      account.tenantProfiles = accountDetails.tenantProfiles;
    } else {
      const tenantProfile = buildTenantProfile(accountDetails.homeAccountId, account.localAccountId, account.realm, accountDetails.idTokenClaims);
      account.tenantProfiles = [ tenantProfile ];
    }
    return account;
  }
  static createFromAccountInfo(accountInfo, cloudGraphHostName, msGraphHost) {
    const account = new AccountEntity;
    return account.authorityType = accountInfo.authorityType || CacheAccountType_GENERIC_ACCOUNT_TYPE, 
    account.homeAccountId = accountInfo.homeAccountId, account.localAccountId = accountInfo.localAccountId, 
    account.nativeAccountId = accountInfo.nativeAccountId, account.realm = accountInfo.tenantId, 
    account.environment = accountInfo.environment, account.username = accountInfo.username, 
    account.name = accountInfo.name, account.cloudGraphHostName = cloudGraphHostName, 
    account.msGraphHost = msGraphHost, account.tenantProfiles = Array.from(accountInfo.tenantProfiles?.values() || []), 
    account;
  }
  static generateHomeAccountId(serverClientInfo, authType, logger, cryptoObj, idTokenClaims) {
    if (authType !== AuthorityType_Adfs && authType !== AuthorityType_Dsts) {
      if (serverClientInfo) {
        try {
          const clientInfo = buildClientInfo(serverClientInfo, cryptoObj.base64Decode);
          if (clientInfo.uid && clientInfo.utid) {
            return `${clientInfo.uid}.${clientInfo.utid}`;
          }
        } catch (e) {}
      }
      logger.warning("No client info in response");
    }
    return idTokenClaims?.sub || "";
  }
  static isAccountEntity(entity) {
    return !!entity && (entity.hasOwnProperty("homeAccountId") && entity.hasOwnProperty("environment") && entity.hasOwnProperty("realm") && entity.hasOwnProperty("localAccountId") && entity.hasOwnProperty("username") && entity.hasOwnProperty("authorityType"));
  }
  static accountInfoIsEqual(accountA, accountB, compareClaims) {
    if (!accountA || !accountB) {
      return !1;
    }
    let claimsMatch = !0;
    if (compareClaims) {
      const accountAClaims = accountA.idTokenClaims || {}, accountBClaims = accountB.idTokenClaims || {};
      claimsMatch = accountAClaims.iat === accountBClaims.iat && accountAClaims.nonce === accountBClaims.nonce;
    }
    return accountA.homeAccountId === accountB.homeAccountId && accountA.localAccountId === accountB.localAccountId && accountA.username === accountB.username && accountA.tenantId === accountB.tenantId && accountA.environment === accountB.environment && accountA.nativeAccountId === accountB.nativeAccountId && claimsMatch;
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ function getDeserializedResponse(responseString) {
  if (!responseString || responseString.indexOf("=") < 0) {
    return null;
  }
  try {
    const normalizedResponse = function(responseString) {
      return responseString.startsWith("#/") ? responseString.substring(2) : responseString.startsWith("#") || responseString.startsWith("?") ? responseString.substring(1) : responseString;
    }(responseString), deserializedHash = Object.fromEntries(new URLSearchParams(normalizedResponse));
    if (deserializedHash.code || deserializedHash.error || deserializedHash.error_description || deserializedHash.state) {
      return deserializedHash;
    }
  } catch (e) {
    throw createClientAuthError("hash_not_deserialized");
  }
  return null;
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class UrlString {
  get urlString() {
    return this._urlString;
  }
  constructor(url) {
    if (this._urlString = url, !this._urlString) {
      throw createClientConfigurationError("empty_url_error");
    }
    url.includes("#") || (this._urlString = UrlString.canonicalizeUri(url));
  }
  static canonicalizeUri(url) {
    if (url) {
      let lowerCaseUrl = url.toLowerCase();
      return StringUtils.endsWith(lowerCaseUrl, "?") ? lowerCaseUrl = lowerCaseUrl.slice(0, -1) : StringUtils.endsWith(lowerCaseUrl, "?/") && (lowerCaseUrl = lowerCaseUrl.slice(0, -2)), 
      StringUtils.endsWith(lowerCaseUrl, "/") || (lowerCaseUrl += "/"), lowerCaseUrl;
    }
    return url;
  }
  validateAsUri() {
    let components;
    try {
      components = this.getUrlComponents();
    } catch (e) {
      throw createClientConfigurationError("url_parse_error");
    }
    if (!components.HostNameAndPort || !components.PathSegments) {
      throw createClientConfigurationError("url_parse_error");
    }
    if (!components.Protocol || "https:" !== components.Protocol.toLowerCase()) {
      throw createClientConfigurationError("authority_uri_insecure");
    }
  }
  static appendQueryString(url, queryString) {
    return queryString ? url.indexOf("?") < 0 ? `${url}?${queryString}` : `${url}&${queryString}` : url;
  }
  static removeHashFromUrl(url) {
    return UrlString.canonicalizeUri(url.split("#")[0]);
  }
  replaceTenantPath(tenantId) {
    const urlObject = this.getUrlComponents(), pathArray = urlObject.PathSegments;
    return !tenantId || 0 === pathArray.length || pathArray[0] !== AADAuthorityConstants_COMMON && pathArray[0] !== AADAuthorityConstants_ORGANIZATIONS || (pathArray[0] = tenantId), 
    UrlString.constructAuthorityUriFromObject(urlObject);
  }
  getUrlComponents() {
    const regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?"), match = this.urlString.match(regEx);
    if (!match) {
      throw createClientConfigurationError("url_parse_error");
    }
    const urlComponents = {
      Protocol: match[1],
      HostNameAndPort: match[4],
      AbsolutePath: match[5],
      QueryString: match[7]
    };
    let pathSegments = urlComponents.AbsolutePath.split("/");
    return pathSegments = pathSegments.filter(val => val && val.length > 0), urlComponents.PathSegments = pathSegments, 
    urlComponents.QueryString && urlComponents.QueryString.endsWith("/") && (urlComponents.QueryString = urlComponents.QueryString.substring(0, urlComponents.QueryString.length - 1)), 
    urlComponents;
  }
  static getDomainFromUrl(url) {
    const regEx = RegExp("^([^:/?#]+://)?([^/?#]*)"), match = url.match(regEx);
    if (!match) {
      throw createClientConfigurationError("url_parse_error");
    }
    return match[2];
  }
  static getAbsoluteUrl(relativeUrl, baseUrl) {
    if (relativeUrl[0] === Constants$2.FORWARD_SLASH) {
      const baseComponents = new UrlString(baseUrl).getUrlComponents();
      return baseComponents.Protocol + "//" + baseComponents.HostNameAndPort + relativeUrl;
    }
    return relativeUrl;
  }
  static constructAuthorityUriFromObject(urlObject) {
    return new UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + urlObject.PathSegments.join("/"));
  }
  static hashContainsKnownProperties(response) {
    return !!getDeserializedResponse(response);
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const EndpointMetadata = {
  "login.microsoftonline.com": {
    token_endpoint: "https://login.microsoftonline.com/{tenantid}/oauth2/v2.0/token",
    jwks_uri: "https://login.microsoftonline.com/{tenantid}/discovery/v2.0/keys",
    issuer: "https://login.microsoftonline.com/{tenantid}/v2.0",
    authorization_endpoint: "https://login.microsoftonline.com/{tenantid}/oauth2/v2.0/authorize",
    end_session_endpoint: "https://login.microsoftonline.com/{tenantid}/oauth2/v2.0/logout"
  },
  "login.chinacloudapi.cn": {
    token_endpoint: "https://login.chinacloudapi.cn/{tenantid}/oauth2/v2.0/token",
    jwks_uri: "https://login.chinacloudapi.cn/{tenantid}/discovery/v2.0/keys",
    issuer: "https://login.partner.microsoftonline.cn/{tenantid}/v2.0",
    authorization_endpoint: "https://login.chinacloudapi.cn/{tenantid}/oauth2/v2.0/authorize",
    end_session_endpoint: "https://login.chinacloudapi.cn/{tenantid}/oauth2/v2.0/logout"
  },
  "login.microsoftonline.us": {
    token_endpoint: "https://login.microsoftonline.us/{tenantid}/oauth2/v2.0/token",
    jwks_uri: "https://login.microsoftonline.us/{tenantid}/discovery/v2.0/keys",
    issuer: "https://login.microsoftonline.us/{tenantid}/v2.0",
    authorization_endpoint: "https://login.microsoftonline.us/{tenantid}/oauth2/v2.0/authorize",
    end_session_endpoint: "https://login.microsoftonline.us/{tenantid}/oauth2/v2.0/logout"
  }
}, InstanceDiscoveryMetadata = {
  metadata: [ {
    preferred_network: "login.microsoftonline.com",
    preferred_cache: "login.windows.net",
    aliases: [ "login.microsoftonline.com", "login.windows.net", "login.microsoft.com", "sts.windows.net" ]
  }, {
    preferred_network: "login.partner.microsoftonline.cn",
    preferred_cache: "login.partner.microsoftonline.cn",
    aliases: [ "login.partner.microsoftonline.cn", "login.chinacloudapi.cn" ]
  }, {
    preferred_network: "login.microsoftonline.de",
    preferred_cache: "login.microsoftonline.de",
    aliases: [ "login.microsoftonline.de" ]
  }, {
    preferred_network: "login.microsoftonline.us",
    preferred_cache: "login.microsoftonline.us",
    aliases: [ "login.microsoftonline.us", "login.usgovcloudapi.net" ]
  }, {
    preferred_network: "login-us.microsoftonline.com",
    preferred_cache: "login-us.microsoftonline.com",
    aliases: [ "login-us.microsoftonline.com" ]
  } ]
}, InstanceDiscoveryMetadataAliases = new Set;

function getAliasesFromMetadata(authorityHost, cloudDiscoveryMetadata, source, logger) {
  if (logger?.trace(`getAliasesFromMetadata called with source: ${source}`), authorityHost && cloudDiscoveryMetadata) {
    const metadata = getCloudDiscoveryMetadataFromNetworkResponse(cloudDiscoveryMetadata, authorityHost);
    if (metadata) {
      return logger?.trace(`getAliasesFromMetadata: found cloud discovery metadata in ${source}, returning aliases`), 
      metadata.aliases;
    }
    logger?.trace(`getAliasesFromMetadata: did not find cloud discovery metadata in ${source}`);
  }
  return null;
}

function getCloudDiscoveryMetadataFromNetworkResponse(response, authorityHost) {
  for (let i = 0; i < response.length; i++) {
    const metadata = response[i];
    if (metadata.aliases.includes(authorityHost)) {
      return metadata;
    }
  }
  return null;
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ InstanceDiscoveryMetadata.metadata.forEach(metadataEntry => {
  metadataEntry.aliases.forEach(alias => {
    InstanceDiscoveryMetadataAliases.add(alias);
  });
});

const cacheQuotaExceededErrorCode = "cache_quota_exceeded", cacheUnknownErrorCode = "cache_error_unknown", CacheErrorMessages = {
  [cacheQuotaExceededErrorCode]: "Exceeded cache storage capacity.",
  [cacheUnknownErrorCode]: "Unexpected error occurred when using cache storage."
};

class CacheError extends Error {
  constructor(errorCode, errorMessage) {
    const message = errorMessage || (CacheErrorMessages[errorCode] ? CacheErrorMessages[errorCode] : CacheErrorMessages.cache_error_unknown);
    super(`${errorCode}: ${message}`), Object.setPrototypeOf(this, CacheError.prototype), 
    this.name = "CacheError", this.errorCode = errorCode, this.errorMessage = message;
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class CacheManager {
  constructor(clientId, cryptoImpl, logger, staticAuthorityOptions) {
    this.clientId = clientId, this.cryptoImpl = cryptoImpl, this.commonLogger = logger.clone("@azure/msal-common", "14.16.0"), 
    this.staticAuthorityOptions = staticAuthorityOptions;
  }
  getAllAccounts(accountFilter) {
    return this.buildTenantProfiles(this.getAccountsFilteredBy(accountFilter || {}), accountFilter);
  }
  getAccountInfoFilteredBy(accountFilter) {
    const allAccounts = this.getAllAccounts(accountFilter);
    if (allAccounts.length > 1) {
      return allAccounts.sort(account => account.idTokenClaims ? -1 : 1)[0];
    }
    return 1 === allAccounts.length ? allAccounts[0] : null;
  }
  getBaseAccountInfo(accountFilter) {
    const accountEntities = this.getAccountsFilteredBy(accountFilter);
    return accountEntities.length > 0 ? accountEntities[0].getAccountInfo() : null;
  }
  buildTenantProfiles(cachedAccounts, accountFilter) {
    return cachedAccounts.flatMap(accountEntity => this.getTenantProfilesFromAccountEntity(accountEntity, accountFilter?.tenantId, accountFilter));
  }
  getTenantedAccountInfoByFilter(accountInfo, tokenKeys, tenantProfile, tenantProfileFilter) {
    let idTokenClaims, tenantedAccountInfo = null;
    if (tenantProfileFilter && !this.tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter)) {
      return null;
    }
    const idToken = this.getIdToken(accountInfo, tokenKeys, tenantProfile.tenantId);
    return idToken && (idTokenClaims = extractTokenClaims(idToken.secret, this.cryptoImpl.base64Decode), 
    !this.idTokenClaimsMatchTenantProfileFilter(idTokenClaims, tenantProfileFilter)) ? null : (tenantedAccountInfo = updateAccountTenantProfileData(accountInfo, tenantProfile, idTokenClaims, idToken?.secret), 
    tenantedAccountInfo);
  }
  getTenantProfilesFromAccountEntity(accountEntity, targetTenantId, tenantProfileFilter) {
    const accountInfo = accountEntity.getAccountInfo();
    let searchTenantProfiles = accountInfo.tenantProfiles || new Map;
    const tokenKeys = this.getTokenKeys();
    if (targetTenantId) {
      const tenantProfile = searchTenantProfiles.get(targetTenantId);
      if (!tenantProfile) {
        return [];
      }
      searchTenantProfiles = new Map([ [ targetTenantId, tenantProfile ] ]);
    }
    const matchingTenantProfiles = [];
    return searchTenantProfiles.forEach(tenantProfile => {
      const tenantedAccountInfo = this.getTenantedAccountInfoByFilter(accountInfo, tokenKeys, tenantProfile, tenantProfileFilter);
      tenantedAccountInfo && matchingTenantProfiles.push(tenantedAccountInfo);
    }), matchingTenantProfiles;
  }
  tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter) {
    return !(tenantProfileFilter.localAccountId && !this.matchLocalAccountIdFromTenantProfile(tenantProfile, tenantProfileFilter.localAccountId)) && ((!tenantProfileFilter.name || tenantProfile.name === tenantProfileFilter.name) && (void 0 === tenantProfileFilter.isHomeTenant || tenantProfile.isHomeTenant === tenantProfileFilter.isHomeTenant));
  }
  idTokenClaimsMatchTenantProfileFilter(idTokenClaims, tenantProfileFilter) {
    if (tenantProfileFilter) {
      if (tenantProfileFilter.localAccountId && !this.matchLocalAccountIdFromTokenClaims(idTokenClaims, tenantProfileFilter.localAccountId)) {
        return !1;
      }
      if (tenantProfileFilter.loginHint && !this.matchLoginHintFromTokenClaims(idTokenClaims, tenantProfileFilter.loginHint)) {
        return !1;
      }
      if (tenantProfileFilter.username && !this.matchUsername(idTokenClaims.preferred_username, tenantProfileFilter.username)) {
        return !1;
      }
      if (tenantProfileFilter.name && !this.matchName(idTokenClaims, tenantProfileFilter.name)) {
        return !1;
      }
      if (tenantProfileFilter.sid && !this.matchSid(idTokenClaims, tenantProfileFilter.sid)) {
        return !1;
      }
    }
    return !0;
  }
  async saveCacheRecord(cacheRecord, storeInCache, correlationId) {
    if (!cacheRecord) {
      throw createClientAuthError("invalid_cache_record");
    }
    try {
      cacheRecord.account && this.setAccount(cacheRecord.account), cacheRecord.idToken && !1 !== storeInCache?.idToken && this.setIdTokenCredential(cacheRecord.idToken), 
      cacheRecord.accessToken && !1 !== storeInCache?.accessToken && await this.saveAccessToken(cacheRecord.accessToken), 
      cacheRecord.refreshToken && !1 !== storeInCache?.refreshToken && this.setRefreshTokenCredential(cacheRecord.refreshToken), 
      cacheRecord.appMetadata && this.setAppMetadata(cacheRecord.appMetadata);
    } catch (e) {
      throw this.commonLogger?.error("CacheManager.saveCacheRecord: failed"), e instanceof Error ? (this.commonLogger?.errorPii(`CacheManager.saveCacheRecord: ${e.message}`, correlationId), 
      "QuotaExceededError" === e.name || "NS_ERROR_DOM_QUOTA_REACHED" === e.name || e.message.includes("exceeded the quota") ? (this.commonLogger?.error("CacheManager.saveCacheRecord: exceeded storage quota", correlationId), 
      new CacheError("cache_quota_exceeded")) : new CacheError(e.name, e.message)) : (this.commonLogger?.errorPii(`CacheManager.saveCacheRecord: ${e}`, correlationId), 
      new CacheError("cache_error_unknown"));
    }
  }
  async saveAccessToken(credential) {
    const accessTokenFilter = {
      clientId: credential.clientId,
      credentialType: credential.credentialType,
      environment: credential.environment,
      homeAccountId: credential.homeAccountId,
      realm: credential.realm,
      tokenType: credential.tokenType,
      requestedClaimsHash: credential.requestedClaimsHash
    }, tokenKeys = this.getTokenKeys(), currentScopes = ScopeSet.fromString(credential.target), removedAccessTokens = [];
    tokenKeys.accessToken.forEach(key => {
      if (!this.accessTokenKeyMatchesFilter(key, accessTokenFilter, !1)) {
        return;
      }
      const tokenEntity = this.getAccessTokenCredential(key);
      if (tokenEntity && this.credentialMatchesFilter(tokenEntity, accessTokenFilter)) {
        ScopeSet.fromString(tokenEntity.target).intersectingScopeSets(currentScopes) && removedAccessTokens.push(this.removeAccessToken(key));
      }
    }), await Promise.all(removedAccessTokens), this.setAccessTokenCredential(credential);
  }
  getAccountsFilteredBy(accountFilter) {
    const allAccountKeys = this.getAccountKeys(), matchingAccounts = [];
    return allAccountKeys.forEach(cacheKey => {
      if (!this.isAccountKey(cacheKey, accountFilter.homeAccountId)) {
        return;
      }
      const entity = this.getAccount(cacheKey, this.commonLogger);
      if (!entity) {
        return;
      }
      if (accountFilter.homeAccountId && !this.matchHomeAccountId(entity, accountFilter.homeAccountId)) {
        return;
      }
      if (accountFilter.username && !this.matchUsername(entity.username, accountFilter.username)) {
        return;
      }
      if (accountFilter.environment && !this.matchEnvironment(entity, accountFilter.environment)) {
        return;
      }
      if (accountFilter.realm && !this.matchRealm(entity, accountFilter.realm)) {
        return;
      }
      if (accountFilter.nativeAccountId && !this.matchNativeAccountId(entity, accountFilter.nativeAccountId)) {
        return;
      }
      if (accountFilter.authorityType && !this.matchAuthorityType(entity, accountFilter.authorityType)) {
        return;
      }
      const tenantProfileFilter = {
        localAccountId: accountFilter?.localAccountId,
        name: accountFilter?.name
      }, matchingTenantProfiles = entity.tenantProfiles?.filter(tenantProfile => this.tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter));
      matchingTenantProfiles && 0 === matchingTenantProfiles.length || matchingAccounts.push(entity);
    }), matchingAccounts;
  }
  isAccountKey(key, homeAccountId, tenantId) {
    return !(key.split(Separators_CACHE_KEY_SEPARATOR).length < 3) && (!(homeAccountId && !key.toLowerCase().includes(homeAccountId.toLowerCase())) && !(tenantId && !key.toLowerCase().includes(tenantId.toLowerCase())));
  }
  isCredentialKey(key) {
    if (key.split(Separators_CACHE_KEY_SEPARATOR).length < 6) {
      return !1;
    }
    const lowerCaseKey = key.toLowerCase();
    if (-1 === lowerCaseKey.indexOf(CredentialType.ID_TOKEN.toLowerCase()) && -1 === lowerCaseKey.indexOf(CredentialType.ACCESS_TOKEN.toLowerCase()) && -1 === lowerCaseKey.indexOf(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase()) && -1 === lowerCaseKey.indexOf(CredentialType.REFRESH_TOKEN.toLowerCase())) {
      return !1;
    }
    if (lowerCaseKey.indexOf(CredentialType.REFRESH_TOKEN.toLowerCase()) > -1) {
      const clientIdValidation = `${CredentialType.REFRESH_TOKEN}${Separators_CACHE_KEY_SEPARATOR}${this.clientId}${Separators_CACHE_KEY_SEPARATOR}`, familyIdValidation = `${CredentialType.REFRESH_TOKEN}${Separators_CACHE_KEY_SEPARATOR}1${Separators_CACHE_KEY_SEPARATOR}`;
      if (-1 === lowerCaseKey.indexOf(clientIdValidation.toLowerCase()) && -1 === lowerCaseKey.indexOf(familyIdValidation.toLowerCase())) {
        return !1;
      }
    } else if (-1 === lowerCaseKey.indexOf(this.clientId.toLowerCase())) {
      return !1;
    }
    return !0;
  }
  credentialMatchesFilter(entity, filter) {
    if (filter.clientId && !this.matchClientId(entity, filter.clientId)) {
      return !1;
    }
    if (filter.userAssertionHash && !this.matchUserAssertionHash(entity, filter.userAssertionHash)) {
      return !1;
    }
    if ("string" == typeof filter.homeAccountId && !this.matchHomeAccountId(entity, filter.homeAccountId)) {
      return !1;
    }
    if (filter.environment && !this.matchEnvironment(entity, filter.environment)) {
      return !1;
    }
    if (filter.realm && !this.matchRealm(entity, filter.realm)) {
      return !1;
    }
    if (filter.credentialType && !this.matchCredentialType(entity, filter.credentialType)) {
      return !1;
    }
    if (filter.familyId && !this.matchFamilyId(entity, filter.familyId)) {
      return !1;
    }
    if (filter.target && !this.matchTarget(entity, filter.target)) {
      return !1;
    }
    if ((filter.requestedClaimsHash || entity.requestedClaimsHash) && entity.requestedClaimsHash !== filter.requestedClaimsHash) {
      return !1;
    }
    if (entity.credentialType === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME) {
      if (filter.tokenType && !this.matchTokenType(entity, filter.tokenType)) {
        return !1;
      }
      if (filter.tokenType === AuthenticationScheme.SSH && filter.keyId && !this.matchKeyId(entity, filter.keyId)) {
        return !1;
      }
    }
    return !0;
  }
  getAppMetadataFilteredBy(filter) {
    const allCacheKeys = this.getKeys(), matchingAppMetadata = {};
    return allCacheKeys.forEach(cacheKey => {
      if (!this.isAppMetadata(cacheKey)) {
        return;
      }
      const entity = this.getAppMetadata(cacheKey);
      entity && (filter.environment && !this.matchEnvironment(entity, filter.environment) || filter.clientId && !this.matchClientId(entity, filter.clientId) || (matchingAppMetadata[cacheKey] = entity));
    }), matchingAppMetadata;
  }
  getAuthorityMetadataByAlias(host) {
    const allCacheKeys = this.getAuthorityMetadataKeys();
    let matchedEntity = null;
    return allCacheKeys.forEach(cacheKey => {
      if (!this.isAuthorityMetadata(cacheKey) || -1 === cacheKey.indexOf(this.clientId)) {
        return;
      }
      const entity = this.getAuthorityMetadata(cacheKey);
      entity && -1 !== entity.aliases.indexOf(host) && (matchedEntity = entity);
    }), matchedEntity;
  }
  async removeAllAccounts() {
    const allAccountKeys = this.getAccountKeys(), removedAccounts = [];
    allAccountKeys.forEach(cacheKey => {
      removedAccounts.push(this.removeAccount(cacheKey));
    }), await Promise.all(removedAccounts);
  }
  async removeAccount(accountKey) {
    const account = this.getAccount(accountKey, this.commonLogger);
    account && (await this.removeAccountContext(account), this.removeItem(accountKey));
  }
  async removeAccountContext(account) {
    const allTokenKeys = this.getTokenKeys(), accountId = account.generateAccountId(), removedCredentials = [];
    allTokenKeys.idToken.forEach(key => {
      0 === key.indexOf(accountId) && this.removeIdToken(key);
    }), allTokenKeys.accessToken.forEach(key => {
      0 === key.indexOf(accountId) && removedCredentials.push(this.removeAccessToken(key));
    }), allTokenKeys.refreshToken.forEach(key => {
      0 === key.indexOf(accountId) && this.removeRefreshToken(key);
    }), await Promise.all(removedCredentials);
  }
  updateOutdatedCachedAccount(accountKey, accountEntity, logger) {
    if (accountEntity && accountEntity.isSingleTenant()) {
      this.commonLogger?.verbose("updateOutdatedCachedAccount: Found a single-tenant (outdated) account entity in the cache, migrating to multi-tenant account entity");
      const matchingAccountKeys = this.getAccountKeys().filter(key => key.startsWith(accountEntity.homeAccountId)), accountsToMerge = [];
      matchingAccountKeys.forEach(key => {
        const account = this.getCachedAccountEntity(key);
        account && accountsToMerge.push(account);
      });
      const baseAccount = accountsToMerge.find(account => tenantIdMatchesHomeTenant(account.realm, account.homeAccountId)) || accountsToMerge[0];
      baseAccount.tenantProfiles = accountsToMerge.map(account => ({
        tenantId: account.realm,
        localAccountId: account.localAccountId,
        name: account.name,
        isHomeTenant: tenantIdMatchesHomeTenant(account.realm, account.homeAccountId)
      }));
      const updatedAccount = CacheManager.toObject(new AccountEntity, {
        ...baseAccount
      }), newAccountKey = updatedAccount.generateAccountKey();
      return matchingAccountKeys.forEach(key => {
        key !== newAccountKey && this.removeOutdatedAccount(accountKey);
      }), this.setAccount(updatedAccount), logger?.verbose("Updated an outdated account entity in the cache"), 
      updatedAccount;
    }
    return accountEntity;
  }
  async removeAccessToken(key) {
    const credential = this.getAccessTokenCredential(key);
    if (credential) {
      if (credential.credentialType.toLowerCase() === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase() && credential.tokenType === AuthenticationScheme.POP) {
        const kid = credential.keyId;
        if (kid) {
          try {
            await this.cryptoImpl.removeTokenBindingKey(kid);
          } catch (error) {
            throw createClientAuthError("binding_key_not_removed");
          }
        }
      }
      return this.removeItem(key);
    }
  }
  removeAppMetadata() {
    return this.getKeys().forEach(cacheKey => {
      this.isAppMetadata(cacheKey) && this.removeItem(cacheKey);
    }), !0;
  }
  readAccountFromCache(account) {
    const accountKey = AccountEntity.generateAccountCacheKey(account);
    return this.getAccount(accountKey, this.commonLogger);
  }
  getIdToken(account, tokenKeys, targetRealm, performanceClient, correlationId) {
    this.commonLogger.trace("CacheManager - getIdToken called");
    const idTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: CredentialType.ID_TOKEN,
      clientId: this.clientId,
      realm: targetRealm
    }, idTokenMap = this.getIdTokensByFilter(idTokenFilter, tokenKeys), numIdTokens = idTokenMap.size;
    if (numIdTokens < 1) {
      return this.commonLogger.info("CacheManager:getIdToken - No token found"), null;
    }
    if (numIdTokens > 1) {
      let tokensToBeRemoved = idTokenMap;
      if (!targetRealm) {
        const homeIdTokenMap = new Map;
        idTokenMap.forEach((idToken, key) => {
          idToken.realm === account.tenantId && homeIdTokenMap.set(key, idToken);
        });
        const numHomeIdTokens = homeIdTokenMap.size;
        if (numHomeIdTokens < 1) {
          return this.commonLogger.info("CacheManager:getIdToken - Multiple ID tokens found for account but none match account entity tenant id, returning first result"), 
          idTokenMap.values().next().value;
        }
        if (1 === numHomeIdTokens) {
          return this.commonLogger.info("CacheManager:getIdToken - Multiple ID tokens found for account, defaulting to home tenant profile"), 
          homeIdTokenMap.values().next().value;
        }
        tokensToBeRemoved = homeIdTokenMap;
      }
      return this.commonLogger.info("CacheManager:getIdToken - Multiple matching ID tokens found, clearing them"), 
      tokensToBeRemoved.forEach((idToken, key) => {
        this.removeIdToken(key);
      }), performanceClient && correlationId && performanceClient.addFields({
        multiMatchedID: idTokenMap.size
      }, correlationId), null;
    }
    return this.commonLogger.info("CacheManager:getIdToken - Returning ID token"), idTokenMap.values().next().value;
  }
  getIdTokensByFilter(filter, tokenKeys) {
    const idTokenKeys = tokenKeys && tokenKeys.idToken || this.getTokenKeys().idToken, idTokens = new Map;
    return idTokenKeys.forEach(key => {
      if (!this.idTokenKeyMatchesFilter(key, {
        clientId: this.clientId,
        ...filter
      })) {
        return;
      }
      const idToken = this.getIdTokenCredential(key);
      idToken && this.credentialMatchesFilter(idToken, filter) && idTokens.set(key, idToken);
    }), idTokens;
  }
  idTokenKeyMatchesFilter(inputKey, filter) {
    const key = inputKey.toLowerCase();
    return (!filter.clientId || -1 !== key.indexOf(filter.clientId.toLowerCase())) && (!filter.homeAccountId || -1 !== key.indexOf(filter.homeAccountId.toLowerCase()));
  }
  removeIdToken(key) {
    this.removeItem(key);
  }
  removeRefreshToken(key) {
    this.removeItem(key);
  }
  getAccessToken(account, request, tokenKeys, targetRealm, performanceClient, correlationId) {
    this.commonLogger.trace("CacheManager - getAccessToken called");
    const scopes = ScopeSet.createSearchScopes(request.scopes), authScheme = request.authenticationScheme || AuthenticationScheme.BEARER, credentialType = authScheme.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase() ? CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME : CredentialType.ACCESS_TOKEN, accessTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: credentialType,
      clientId: this.clientId,
      realm: targetRealm || account.tenantId,
      target: scopes,
      tokenType: authScheme,
      keyId: request.sshKid,
      requestedClaimsHash: request.requestedClaimsHash
    }, accessTokenKeys = tokenKeys && tokenKeys.accessToken || this.getTokenKeys().accessToken, accessTokens = [];
    accessTokenKeys.forEach(key => {
      if (this.accessTokenKeyMatchesFilter(key, accessTokenFilter, !0)) {
        const accessToken = this.getAccessTokenCredential(key);
        accessToken && this.credentialMatchesFilter(accessToken, accessTokenFilter) && accessTokens.push(accessToken);
      }
    });
    const numAccessTokens = accessTokens.length;
    return numAccessTokens < 1 ? (this.commonLogger.info("CacheManager:getAccessToken - No token found"), 
    null) : numAccessTokens > 1 ? (this.commonLogger.info("CacheManager:getAccessToken - Multiple access tokens found, clearing them"), 
    accessTokens.forEach(accessToken => {
      this.removeAccessToken(generateCredentialKey(accessToken));
    }), performanceClient && correlationId && performanceClient.addFields({
      multiMatchedAT: accessTokens.length
    }, correlationId), null) : (this.commonLogger.info("CacheManager:getAccessToken - Returning access token"), 
    accessTokens[0]);
  }
  accessTokenKeyMatchesFilter(inputKey, filter, keyMustContainAllScopes) {
    const key = inputKey.toLowerCase();
    if (filter.clientId && -1 === key.indexOf(filter.clientId.toLowerCase())) {
      return !1;
    }
    if (filter.homeAccountId && -1 === key.indexOf(filter.homeAccountId.toLowerCase())) {
      return !1;
    }
    if (filter.realm && -1 === key.indexOf(filter.realm.toLowerCase())) {
      return !1;
    }
    if (filter.requestedClaimsHash && -1 === key.indexOf(filter.requestedClaimsHash.toLowerCase())) {
      return !1;
    }
    if (filter.target) {
      const scopes = filter.target.asArray();
      for (let i = 0; i < scopes.length; i++) {
        if (keyMustContainAllScopes && !key.includes(scopes[i].toLowerCase())) {
          return !1;
        }
        if (!keyMustContainAllScopes && key.includes(scopes[i].toLowerCase())) {
          return !0;
        }
      }
    }
    return !0;
  }
  getAccessTokensByFilter(filter) {
    const tokenKeys = this.getTokenKeys(), accessTokens = [];
    return tokenKeys.accessToken.forEach(key => {
      if (!this.accessTokenKeyMatchesFilter(key, filter, !0)) {
        return;
      }
      const accessToken = this.getAccessTokenCredential(key);
      accessToken && this.credentialMatchesFilter(accessToken, filter) && accessTokens.push(accessToken);
    }), accessTokens;
  }
  getRefreshToken(account, familyRT, tokenKeys, performanceClient, correlationId) {
    this.commonLogger.trace("CacheManager - getRefreshToken called");
    const id = familyRT ? "1" : void 0, refreshTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: CredentialType.REFRESH_TOKEN,
      clientId: this.clientId,
      familyId: id
    }, refreshTokenKeys = tokenKeys && tokenKeys.refreshToken || this.getTokenKeys().refreshToken, refreshTokens = [];
    refreshTokenKeys.forEach(key => {
      if (this.refreshTokenKeyMatchesFilter(key, refreshTokenFilter)) {
        const refreshToken = this.getRefreshTokenCredential(key);
        refreshToken && this.credentialMatchesFilter(refreshToken, refreshTokenFilter) && refreshTokens.push(refreshToken);
      }
    });
    const numRefreshTokens = refreshTokens.length;
    return numRefreshTokens < 1 ? (this.commonLogger.info("CacheManager:getRefreshToken - No refresh token found."), 
    null) : (numRefreshTokens > 1 && performanceClient && correlationId && performanceClient.addFields({
      multiMatchedRT: numRefreshTokens
    }, correlationId), this.commonLogger.info("CacheManager:getRefreshToken - returning refresh token"), 
    refreshTokens[0]);
  }
  refreshTokenKeyMatchesFilter(inputKey, filter) {
    const key = inputKey.toLowerCase();
    return (!filter.familyId || -1 !== key.indexOf(filter.familyId.toLowerCase())) && (!(!filter.familyId && filter.clientId && -1 === key.indexOf(filter.clientId.toLowerCase())) && (!filter.homeAccountId || -1 !== key.indexOf(filter.homeAccountId.toLowerCase())));
  }
  readAppMetadataFromCache(environment) {
    const appMetadataFilter = {
      environment: environment,
      clientId: this.clientId
    }, appMetadata = this.getAppMetadataFilteredBy(appMetadataFilter), appMetadataEntries = Object.keys(appMetadata).map(key => appMetadata[key]), numAppMetadata = appMetadataEntries.length;
    if (numAppMetadata < 1) {
      return null;
    }
    if (numAppMetadata > 1) {
      throw createClientAuthError("multiple_matching_appMetadata");
    }
    return appMetadataEntries[0];
  }
  isAppMetadataFOCI(environment) {
    const appMetadata = this.readAppMetadataFromCache(environment);
    return !(!appMetadata || "1" !== appMetadata.familyId);
  }
  matchHomeAccountId(entity, homeAccountId) {
    return !("string" != typeof entity.homeAccountId || homeAccountId !== entity.homeAccountId);
  }
  matchLocalAccountIdFromTokenClaims(tokenClaims, localAccountId) {
    return localAccountId === (tokenClaims.oid || tokenClaims.sub);
  }
  matchLocalAccountIdFromTenantProfile(tenantProfile, localAccountId) {
    return tenantProfile.localAccountId === localAccountId;
  }
  matchName(claims, name) {
    return !(name.toLowerCase() !== claims.name?.toLowerCase());
  }
  matchUsername(cachedUsername, filterUsername) {
    return !(!cachedUsername || "string" != typeof cachedUsername || filterUsername?.toLowerCase() !== cachedUsername.toLowerCase());
  }
  matchUserAssertionHash(entity, userAssertionHash) {
    return !(!entity.userAssertionHash || userAssertionHash !== entity.userAssertionHash);
  }
  matchEnvironment(entity, environment) {
    if (this.staticAuthorityOptions) {
      const staticAliases = function(staticAuthorityOptions, logger) {
        let staticAliases;
        const canonicalAuthority = staticAuthorityOptions.canonicalAuthority;
        if (canonicalAuthority) {
          const authorityHost = new UrlString(canonicalAuthority).getUrlComponents().HostNameAndPort;
          staticAliases = getAliasesFromMetadata(authorityHost, staticAuthorityOptions.cloudDiscoveryMetadata?.metadata, AuthorityMetadataSource_CONFIG, logger) || getAliasesFromMetadata(authorityHost, InstanceDiscoveryMetadata.metadata, AuthorityMetadataSource_HARDCODED_VALUES, logger) || staticAuthorityOptions.knownAuthorities;
        }
        return staticAliases || [];
      }(this.staticAuthorityOptions, this.commonLogger);
      if (staticAliases.includes(environment) && staticAliases.includes(entity.environment)) {
        return !0;
      }
    }
    const cloudMetadata = this.getAuthorityMetadataByAlias(environment);
    return !!(cloudMetadata && cloudMetadata.aliases.indexOf(entity.environment) > -1);
  }
  matchCredentialType(entity, credentialType) {
    return entity.credentialType && credentialType.toLowerCase() === entity.credentialType.toLowerCase();
  }
  matchClientId(entity, clientId) {
    return !(!entity.clientId || clientId !== entity.clientId);
  }
  matchFamilyId(entity, familyId) {
    return !(!entity.familyId || familyId !== entity.familyId);
  }
  matchRealm(entity, realm) {
    return !(entity.realm?.toLowerCase() !== realm.toLowerCase());
  }
  matchNativeAccountId(entity, nativeAccountId) {
    return !(!entity.nativeAccountId || nativeAccountId !== entity.nativeAccountId);
  }
  matchLoginHintFromTokenClaims(tokenClaims, loginHint) {
    return tokenClaims.login_hint === loginHint || (tokenClaims.preferred_username === loginHint || tokenClaims.upn === loginHint);
  }
  matchSid(idTokenClaims, sid) {
    return idTokenClaims.sid === sid;
  }
  matchAuthorityType(entity, authorityType) {
    return !(!entity.authorityType || authorityType.toLowerCase() !== entity.authorityType.toLowerCase());
  }
  matchTarget(entity, target) {
    if (entity.credentialType !== CredentialType.ACCESS_TOKEN && entity.credentialType !== CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME || !entity.target) {
      return !1;
    }
    return ScopeSet.fromString(entity.target).containsScopeSet(target);
  }
  matchTokenType(entity, tokenType) {
    return !(!entity.tokenType || entity.tokenType !== tokenType);
  }
  matchKeyId(entity, keyId) {
    return !(!entity.keyId || entity.keyId !== keyId);
  }
  isAppMetadata(key) {
    return -1 !== key.indexOf("appmetadata");
  }
  isAuthorityMetadata(key) {
    return -1 !== key.indexOf(AUTHORITY_METADATA_CONSTANTS_CACHE_KEY);
  }
  generateAuthorityMetadataCacheKey(authority) {
    return `${AUTHORITY_METADATA_CONSTANTS_CACHE_KEY}-${this.clientId}-${authority}`;
  }
  static toObject(obj, json) {
    for (const propertyName in json) {
      obj[propertyName] = json[propertyName];
    }
    return obj;
  }
}

class DefaultStorageClass extends CacheManager {
  setAccount() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAccount() {
    throw createClientAuthError(methodNotImplemented);
  }
  getCachedAccountEntity() {
    throw createClientAuthError(methodNotImplemented);
  }
  setIdTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  getIdTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  setAccessTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAccessTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  setRefreshTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  getRefreshTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  setAppMetadata() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAppMetadata() {
    throw createClientAuthError(methodNotImplemented);
  }
  setServerTelemetry() {
    throw createClientAuthError(methodNotImplemented);
  }
  getServerTelemetry() {
    throw createClientAuthError(methodNotImplemented);
  }
  setAuthorityMetadata() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAuthorityMetadata() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAuthorityMetadataKeys() {
    throw createClientAuthError(methodNotImplemented);
  }
  setThrottlingCache() {
    throw createClientAuthError(methodNotImplemented);
  }
  getThrottlingCache() {
    throw createClientAuthError(methodNotImplemented);
  }
  removeItem() {
    throw createClientAuthError(methodNotImplemented);
  }
  getKeys() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAccountKeys() {
    throw createClientAuthError(methodNotImplemented);
  }
  getTokenKeys() {
    throw createClientAuthError(methodNotImplemented);
  }
  updateCredentialCacheKey() {
    throw createClientAuthError(methodNotImplemented);
  }
  removeOutdatedAccount() {
    throw createClientAuthError(methodNotImplemented);
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const DEFAULT_SYSTEM_OPTIONS$1 = {
  tokenRenewalOffsetSeconds: 300,
  preventCorsPreflight: !1
}, DEFAULT_LOGGER_IMPLEMENTATION = {
  loggerCallback: () => {},
  piiLoggingEnabled: !1,
  logLevel: LogLevel.Info,
  correlationId: Constants$2.EMPTY_STRING
}, DEFAULT_CACHE_OPTIONS$1 = {
  claimsBasedCachingEnabled: !1
}, DEFAULT_NETWORK_IMPLEMENTATION = {
  async sendGetRequestAsync() {
    throw createClientAuthError(methodNotImplemented);
  },
  async sendPostRequestAsync() {
    throw createClientAuthError(methodNotImplemented);
  }
}, DEFAULT_LIBRARY_INFO = {
  sku: Constants$2.SKU,
  version: "14.16.0",
  cpu: Constants$2.EMPTY_STRING,
  os: Constants$2.EMPTY_STRING
}, DEFAULT_CLIENT_CREDENTIALS = {
  clientSecret: Constants$2.EMPTY_STRING,
  clientAssertion: void 0
}, DEFAULT_AZURE_CLOUD_OPTIONS = {
  azureCloudInstance: AzureCloudInstance_None,
  tenant: `${Constants$2.DEFAULT_COMMON_TENANT}`
}, DEFAULT_TELEMETRY_OPTIONS$1 = {
  application: {
    appName: "",
    appVersion: ""
  }
};

function isOidcProtocolMode(config) {
  return config.authOptions.authority.options.protocolMode === ProtocolMode_OIDC;
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const CcsCredentialType_HOME_ACCOUNT_ID = "home_account_id", CcsCredentialType_UPN = "UPN", RETURN_SPA_CODE = "return_spa_code", X_CLIENT_EXTRA_SKU = "x-client-xtra-sku";

/*! @azure/msal-common v14.16.0 2024-11-05 */
/*! @azure/msal-common v14.16.0 2024-11-05 */
class RequestValidator {
  static validateRedirectUri(redirectUri) {
    if (!redirectUri) {
      throw createClientConfigurationError("redirect_uri_empty");
    }
  }
  static validatePrompt(prompt) {
    const promptValues = [];
    for (const value in PromptValue) {
      promptValues.push(PromptValue[value]);
    }
    if (promptValues.indexOf(prompt) < 0) {
      throw createClientConfigurationError("invalid_prompt_value");
    }
  }
  static validateClaims(claims) {
    try {
      JSON.parse(claims);
    } catch (e) {
      throw createClientConfigurationError("invalid_claims");
    }
  }
  static validateCodeChallengeParams(codeChallenge, codeChallengeMethod) {
    if (!codeChallenge || !codeChallengeMethod) {
      throw createClientConfigurationError("pkce_params_missing");
    }
    this.validateCodeChallengeMethod(codeChallengeMethod);
  }
  static validateCodeChallengeMethod(codeChallengeMethod) {
    if ([ CodeChallengeMethodValues.PLAIN, CodeChallengeMethodValues.S256 ].indexOf(codeChallengeMethod) < 0) {
      throw createClientConfigurationError("invalid_code_challenge_method");
    }
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class RequestParameterBuilder {
  constructor(correlationId, performanceClient) {
    this.parameters = new Map, this.performanceClient = performanceClient, this.correlationId = correlationId;
  }
  addResponseTypeCode() {
    this.parameters.set("response_type", encodeURIComponent(Constants$2.CODE_RESPONSE_TYPE));
  }
  addResponseTypeForTokenAndIdToken() {
    this.parameters.set("response_type", encodeURIComponent(`${Constants$2.TOKEN_RESPONSE_TYPE} ${Constants$2.ID_TOKEN_RESPONSE_TYPE}`));
  }
  addResponseMode(responseMode) {
    this.parameters.set("response_mode", encodeURIComponent(responseMode || ResponseMode.QUERY));
  }
  addNativeBroker() {
    this.parameters.set("nativebroker", encodeURIComponent("1"));
  }
  addScopes(scopes, addOidcScopes = !0, defaultScopes = OIDC_DEFAULT_SCOPES) {
    !addOidcScopes || defaultScopes.includes("openid") || scopes.includes("openid") || defaultScopes.push("openid");
    const requestScopes = addOidcScopes ? [ ...scopes || [], ...defaultScopes ] : scopes || [], scopeSet = new ScopeSet(requestScopes);
    this.parameters.set("scope", encodeURIComponent(scopeSet.printScopes()));
  }
  addClientId(clientId) {
    this.parameters.set("client_id", encodeURIComponent(clientId));
  }
  addRedirectUri(redirectUri) {
    RequestValidator.validateRedirectUri(redirectUri), this.parameters.set("redirect_uri", encodeURIComponent(redirectUri));
  }
  addPostLogoutRedirectUri(redirectUri) {
    RequestValidator.validateRedirectUri(redirectUri), this.parameters.set("post_logout_redirect_uri", encodeURIComponent(redirectUri));
  }
  addIdTokenHint(idTokenHint) {
    this.parameters.set("id_token_hint", encodeURIComponent(idTokenHint));
  }
  addDomainHint(domainHint) {
    this.parameters.set("domain_hint", encodeURIComponent(domainHint));
  }
  addLoginHint(loginHint) {
    this.parameters.set("login_hint", encodeURIComponent(loginHint));
  }
  addCcsUpn(loginHint) {
    this.parameters.set(HeaderNames_CCS_HEADER, encodeURIComponent(`UPN:${loginHint}`));
  }
  addCcsOid(clientInfo) {
    this.parameters.set(HeaderNames_CCS_HEADER, encodeURIComponent(`Oid:${clientInfo.uid}@${clientInfo.utid}`));
  }
  addSid(sid) {
    this.parameters.set("sid", encodeURIComponent(sid));
  }
  addClaims(claims, clientCapabilities) {
    const mergedClaims = this.addClientCapabilitiesToClaims(claims, clientCapabilities);
    RequestValidator.validateClaims(mergedClaims), this.parameters.set("claims", encodeURIComponent(mergedClaims));
  }
  addCorrelationId(correlationId) {
    this.parameters.set("client-request-id", encodeURIComponent(correlationId));
  }
  addLibraryInfo(libraryInfo) {
    this.parameters.set("x-client-SKU", libraryInfo.sku), this.parameters.set("x-client-VER", libraryInfo.version), 
    libraryInfo.os && this.parameters.set("x-client-OS", libraryInfo.os), libraryInfo.cpu && this.parameters.set("x-client-CPU", libraryInfo.cpu);
  }
  addApplicationTelemetry(appTelemetry) {
    appTelemetry?.appName && this.parameters.set("x-app-name", appTelemetry.appName), 
    appTelemetry?.appVersion && this.parameters.set("x-app-ver", appTelemetry.appVersion);
  }
  addPrompt(prompt) {
    RequestValidator.validatePrompt(prompt), this.parameters.set("prompt", encodeURIComponent(prompt));
  }
  addState(state) {
    state && this.parameters.set("state", encodeURIComponent(state));
  }
  addNonce(nonce) {
    this.parameters.set("nonce", encodeURIComponent(nonce));
  }
  addCodeChallengeParams(codeChallenge, codeChallengeMethod) {
    if (RequestValidator.validateCodeChallengeParams(codeChallenge, codeChallengeMethod), 
    !codeChallenge || !codeChallengeMethod) {
      throw createClientConfigurationError("pkce_params_missing");
    }
    this.parameters.set("code_challenge", encodeURIComponent(codeChallenge)), this.parameters.set("code_challenge_method", encodeURIComponent(codeChallengeMethod));
  }
  addAuthorizationCode(code) {
    this.parameters.set("code", encodeURIComponent(code));
  }
  addDeviceCode(code) {
    this.parameters.set("device_code", encodeURIComponent(code));
  }
  addRefreshToken(refreshToken) {
    this.parameters.set("refresh_token", encodeURIComponent(refreshToken));
  }
  addCodeVerifier(codeVerifier) {
    this.parameters.set("code_verifier", encodeURIComponent(codeVerifier));
  }
  addClientSecret(clientSecret) {
    this.parameters.set("client_secret", encodeURIComponent(clientSecret));
  }
  addClientAssertion(clientAssertion) {
    clientAssertion && this.parameters.set("client_assertion", encodeURIComponent(clientAssertion));
  }
  addClientAssertionType(clientAssertionType) {
    clientAssertionType && this.parameters.set("client_assertion_type", encodeURIComponent(clientAssertionType));
  }
  addOboAssertion(oboAssertion) {
    this.parameters.set("assertion", encodeURIComponent(oboAssertion));
  }
  addRequestTokenUse(tokenUse) {
    this.parameters.set("requested_token_use", encodeURIComponent(tokenUse));
  }
  addGrantType(grantType) {
    this.parameters.set("grant_type", encodeURIComponent(grantType));
  }
  addClientInfo() {
    this.parameters.set("client_info", "1");
  }
  addExtraQueryParameters(eQParams) {
    Object.entries(eQParams).forEach(([key, value]) => {
      !this.parameters.has(key) && value && this.parameters.set(key, value);
    });
  }
  addClientCapabilitiesToClaims(claims, clientCapabilities) {
    let mergedClaims;
    if (claims) {
      try {
        mergedClaims = JSON.parse(claims);
      } catch (e) {
        throw createClientConfigurationError("invalid_claims");
      }
    } else {
      mergedClaims = {};
    }
    return clientCapabilities && clientCapabilities.length > 0 && (mergedClaims.hasOwnProperty(ClaimsRequestKeys_ACCESS_TOKEN) || (mergedClaims[ClaimsRequestKeys_ACCESS_TOKEN] = {}), 
    mergedClaims[ClaimsRequestKeys_ACCESS_TOKEN][ClaimsRequestKeys_XMS_CC] = {
      values: clientCapabilities
    }), JSON.stringify(mergedClaims);
  }
  addUsername(username) {
    this.parameters.set(PasswordGrantConstants_username, encodeURIComponent(username));
  }
  addPassword(password) {
    this.parameters.set(PasswordGrantConstants_password, encodeURIComponent(password));
  }
  addPopToken(cnfString) {
    cnfString && (this.parameters.set("token_type", AuthenticationScheme.POP), this.parameters.set("req_cnf", encodeURIComponent(cnfString)));
  }
  addSshJwk(sshJwkString) {
    sshJwkString && (this.parameters.set("token_type", AuthenticationScheme.SSH), this.parameters.set("req_cnf", encodeURIComponent(sshJwkString)));
  }
  addServerTelemetry(serverTelemetryManager) {
    this.parameters.set("x-client-current-telemetry", serverTelemetryManager.generateCurrentRequestHeaderValue()), 
    this.parameters.set("x-client-last-telemetry", serverTelemetryManager.generateLastRequestHeaderValue());
  }
  addThrottling() {
    this.parameters.set("x-ms-lib-capability", ThrottlingConstants_X_MS_LIB_CAPABILITY_VALUE);
  }
  addLogoutHint(logoutHint) {
    this.parameters.set("logout_hint", encodeURIComponent(logoutHint));
  }
  addBrokerParameters(params) {
    const brokerParams = {};
    brokerParams.brk_client_id = params.brokerClientId, brokerParams.brk_redirect_uri = params.brokerRedirectUri, 
    this.addExtraQueryParameters(brokerParams);
  }
  createQueryString() {
    const queryParameterArray = new Array;
    return this.parameters.forEach((value, key) => {
      queryParameterArray.push(`${key}=${value}`);
    }), function(parameters, correlationId, performanceClient) {
      if (!correlationId) {
        return;
      }
      const clientId = parameters.get("client_id");
      clientId && parameters.has("brk_client_id") && performanceClient?.addFields({
        embeddedClientId: clientId,
        embeddedRedirectUri: parameters.get("redirect_uri")
      }, correlationId);
    }(this.parameters, this.correlationId, this.performanceClient), queryParameterArray.join("&");
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */
/*! @azure/msal-common v14.16.0 2024-11-05 */
const PerformanceEvents_NetworkClientSendPostRequestAsync = "networkClientSendPostRequestAsync", PerformanceEvents_RefreshTokenClientExecutePostToTokenEndpoint = "refreshTokenClientExecutePostToTokenEndpoint", PerformanceEvents_AuthorizationCodeClientExecutePostToTokenEndpoint = "authorizationCodeClientExecutePostToTokenEndpoint", PerformanceEvents_RefreshTokenClientExecuteTokenRequest = "refreshTokenClientExecuteTokenRequest", PerformanceEvents_RefreshTokenClientAcquireToken = "refreshTokenClientAcquireToken", PerformanceEvents_RefreshTokenClientAcquireTokenWithCachedRefreshToken = "refreshTokenClientAcquireTokenWithCachedRefreshToken", PerformanceEvents_RefreshTokenClientAcquireTokenByRefreshToken = "refreshTokenClientAcquireTokenByRefreshToken", PerformanceEvents_RefreshTokenClientCreateTokenRequestBody = "refreshTokenClientCreateTokenRequestBody", PerformanceEvents_SilentFlowClientAcquireCachedToken = "silentFlowClientAcquireCachedToken", PerformanceEvents_SilentFlowClientGenerateResultFromCacheRecord = "silentFlowClientGenerateResultFromCacheRecord", PerformanceEvents_GetAuthCodeUrl = "getAuthCodeUrl", PerformanceEvents_UpdateTokenEndpointAuthority = "updateTokenEndpointAuthority", PerformanceEvents_AuthClientAcquireToken = "authClientAcquireToken", PerformanceEvents_AuthClientExecuteTokenRequest = "authClientExecuteTokenRequest", PerformanceEvents_AuthClientCreateTokenRequestBody = "authClientCreateTokenRequestBody", PerformanceEvents_AuthClientCreateQueryString = "authClientCreateQueryString", PerformanceEvents_PopTokenGenerateCnf = "popTokenGenerateCnf", PerformanceEvents_PopTokenGenerateKid = "popTokenGenerateKid", PerformanceEvents_HandleServerTokenResponse = "handleServerTokenResponse", PerformanceEvents_AuthorityFactoryCreateDiscoveredInstance = "authorityFactoryCreateDiscoveredInstance", PerformanceEvents_AuthorityResolveEndpointsAsync = "authorityResolveEndpointsAsync", PerformanceEvents_AuthorityGetCloudDiscoveryMetadataFromNetwork = "authorityGetCloudDiscoveryMetadataFromNetwork", PerformanceEvents_AuthorityUpdateCloudDiscoveryMetadata = "authorityUpdateCloudDiscoveryMetadata", PerformanceEvents_AuthorityGetEndpointMetadataFromNetwork = "authorityGetEndpointMetadataFromNetwork", PerformanceEvents_AuthorityUpdateEndpointMetadata = "authorityUpdateEndpointMetadata", PerformanceEvents_AuthorityUpdateMetadataWithRegionalInformation = "authorityUpdateMetadataWithRegionalInformation", PerformanceEvents_RegionDiscoveryDetectRegion = "regionDiscoveryDetectRegion", PerformanceEvents_RegionDiscoveryGetRegionFromIMDS = "regionDiscoveryGetRegionFromIMDS", PerformanceEvents_RegionDiscoveryGetCurrentVersion = "regionDiscoveryGetCurrentVersion", PerformanceEvents_CacheManagerGetRefreshToken = "cacheManagerGetRefreshToken", invokeAsync = (callback, eventName, logger, telemetryClient, correlationId) => (...args) => {
  logger.trace(`Executing function ${eventName}`);
  const inProgressEvent = telemetryClient?.startMeasurement(eventName, correlationId);
  if (correlationId) {
    const eventCount = eventName + "CallCount";
    telemetryClient?.incrementFields({
      [eventCount]: 1
    }, correlationId);
  }
  return telemetryClient?.setPreQueueTime(eventName, correlationId), callback(...args).then(response => (logger.trace(`Returning result from ${eventName}`), 
  inProgressEvent?.end({
    success: !0
  }), response)).catch(e => {
    logger.trace(`Error occurred in ${eventName}`);
    try {
      logger.trace(JSON.stringify(e));
    } catch (e) {
      logger.trace("Unable to print error message.");
    }
    throw inProgressEvent?.end({
      success: !1
    }, e), e;
  });
};

/*! @azure/msal-common v14.16.0 2024-11-05 */
/*! @azure/msal-common v14.16.0 2024-11-05 */
class RegionDiscovery {
  constructor(networkInterface, logger, performanceClient, correlationId) {
    this.networkInterface = networkInterface, this.logger = logger, this.performanceClient = performanceClient, 
    this.correlationId = correlationId;
  }
  async detectRegion(environmentRegion, regionDiscoveryMetadata) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_RegionDiscoveryDetectRegion, this.correlationId);
    let autodetectedRegionName = environmentRegion;
    if (autodetectedRegionName) {
      regionDiscoveryMetadata.region_source = RegionDiscoverySources_ENVIRONMENT_VARIABLE;
    } else {
      const options = RegionDiscovery.IMDS_OPTIONS;
      try {
        const localIMDSVersionResponse = await invokeAsync(this.getRegionFromIMDS.bind(this), PerformanceEvents_RegionDiscoveryGetRegionFromIMDS, this.logger, this.performanceClient, this.correlationId)(Constants$2.IMDS_VERSION, options);
        if (localIMDSVersionResponse.status === ResponseCodes_httpSuccess && (autodetectedRegionName = localIMDSVersionResponse.body, 
        regionDiscoveryMetadata.region_source = RegionDiscoverySources_IMDS), localIMDSVersionResponse.status === ResponseCodes_httpBadRequest) {
          const currentIMDSVersion = await invokeAsync(this.getCurrentVersion.bind(this), PerformanceEvents_RegionDiscoveryGetCurrentVersion, this.logger, this.performanceClient, this.correlationId)(options);
          if (!currentIMDSVersion) {
            return regionDiscoveryMetadata.region_source = RegionDiscoverySources_FAILED_AUTO_DETECTION, 
            null;
          }
          const currentIMDSVersionResponse = await invokeAsync(this.getRegionFromIMDS.bind(this), PerformanceEvents_RegionDiscoveryGetRegionFromIMDS, this.logger, this.performanceClient, this.correlationId)(currentIMDSVersion, options);
          currentIMDSVersionResponse.status === ResponseCodes_httpSuccess && (autodetectedRegionName = currentIMDSVersionResponse.body, 
          regionDiscoveryMetadata.region_source = RegionDiscoverySources_IMDS);
        }
      } catch (e) {
        return regionDiscoveryMetadata.region_source = RegionDiscoverySources_FAILED_AUTO_DETECTION, 
        null;
      }
    }
    return autodetectedRegionName || (regionDiscoveryMetadata.region_source = RegionDiscoverySources_FAILED_AUTO_DETECTION), 
    autodetectedRegionName || null;
  }
  async getRegionFromIMDS(version, options) {
    return this.performanceClient?.addQueueMeasurement(PerformanceEvents_RegionDiscoveryGetRegionFromIMDS, this.correlationId), 
    this.networkInterface.sendGetRequestAsync(`${Constants$2.IMDS_ENDPOINT}?api-version=${version}&format=text`, options, Constants$2.IMDS_TIMEOUT);
  }
  async getCurrentVersion(options) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_RegionDiscoveryGetCurrentVersion, this.correlationId);
    try {
      const response = await this.networkInterface.sendGetRequestAsync(`${Constants$2.IMDS_ENDPOINT}?format=json`, options);
      return response.status === ResponseCodes_httpBadRequest && response.body && response.body["newest-versions"] && response.body["newest-versions"].length > 0 ? response.body["newest-versions"][0] : null;
    } catch (e) {
      return null;
    }
  }
}

RegionDiscovery.IMDS_OPTIONS = {
  headers: {
    Metadata: "true"
  }
};

/*! @azure/msal-common v14.16.0 2024-11-05 */
class Authority {
  constructor(authority, networkInterface, cacheManager, authorityOptions, logger, correlationId, performanceClient, managedIdentity) {
    this.canonicalAuthority = authority, this._canonicalAuthority.validateAsUri(), this.networkInterface = networkInterface, 
    this.cacheManager = cacheManager, this.authorityOptions = authorityOptions, this.regionDiscoveryMetadata = {
      region_used: void 0,
      region_source: void 0,
      region_outcome: void 0
    }, this.logger = logger, this.performanceClient = performanceClient, this.correlationId = correlationId, 
    this.managedIdentity = managedIdentity || !1, this.regionDiscovery = new RegionDiscovery(networkInterface, this.logger, this.performanceClient, this.correlationId);
  }
  getAuthorityType(authorityUri) {
    if (authorityUri.HostNameAndPort.endsWith(Constants$2.CIAM_AUTH_URL)) {
      return AuthorityType_Ciam;
    }
    const pathSegments = authorityUri.PathSegments;
    if (pathSegments.length) {
      switch (pathSegments[0].toLowerCase()) {
       case Constants$2.ADFS:
        return AuthorityType_Adfs;

       case Constants$2.DSTS:
        return AuthorityType_Dsts;
      }
    }
    return AuthorityType_Default;
  }
  get authorityType() {
    return this.getAuthorityType(this.canonicalAuthorityUrlComponents);
  }
  get protocolMode() {
    return this.authorityOptions.protocolMode;
  }
  get options() {
    return this.authorityOptions;
  }
  get canonicalAuthority() {
    return this._canonicalAuthority.urlString;
  }
  set canonicalAuthority(url) {
    this._canonicalAuthority = new UrlString(url), this._canonicalAuthority.validateAsUri(), 
    this._canonicalAuthorityUrlComponents = null;
  }
  get canonicalAuthorityUrlComponents() {
    return this._canonicalAuthorityUrlComponents || (this._canonicalAuthorityUrlComponents = this._canonicalAuthority.getUrlComponents()), 
    this._canonicalAuthorityUrlComponents;
  }
  get hostnameAndPort() {
    return this.canonicalAuthorityUrlComponents.HostNameAndPort.toLowerCase();
  }
  get tenant() {
    return this.canonicalAuthorityUrlComponents.PathSegments[0];
  }
  get authorizationEndpoint() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.authorization_endpoint);
    }
    throw createClientAuthError("endpoints_resolution_error");
  }
  get tokenEndpoint() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.token_endpoint);
    }
    throw createClientAuthError("endpoints_resolution_error");
  }
  get deviceCodeEndpoint() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.token_endpoint.replace("/token", "/devicecode"));
    }
    throw createClientAuthError("endpoints_resolution_error");
  }
  get endSessionEndpoint() {
    if (this.discoveryComplete()) {
      if (!this.metadata.end_session_endpoint) {
        throw createClientAuthError("end_session_endpoint_not_supported");
      }
      return this.replacePath(this.metadata.end_session_endpoint);
    }
    throw createClientAuthError("endpoints_resolution_error");
  }
  get selfSignedJwtAudience() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.issuer);
    }
    throw createClientAuthError("endpoints_resolution_error");
  }
  get jwksUri() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.jwks_uri);
    }
    throw createClientAuthError("endpoints_resolution_error");
  }
  canReplaceTenant(authorityUri) {
    return 1 === authorityUri.PathSegments.length && !Authority.reservedTenantDomains.has(authorityUri.PathSegments[0]) && this.getAuthorityType(authorityUri) === AuthorityType_Default && this.protocolMode === ProtocolMode_AAD;
  }
  replaceTenant(urlString) {
    return urlString.replace(/{tenant}|{tenantid}/g, this.tenant);
  }
  replacePath(urlString) {
    let endpoint = urlString;
    const cachedAuthorityUrlComponents = new UrlString(this.metadata.canonical_authority).getUrlComponents(), cachedAuthorityParts = cachedAuthorityUrlComponents.PathSegments;
    return this.canonicalAuthorityUrlComponents.PathSegments.forEach((currentPart, index) => {
      let cachedPart = cachedAuthorityParts[index];
      if (0 === index && this.canReplaceTenant(cachedAuthorityUrlComponents)) {
        const tenantId = new UrlString(this.metadata.authorization_endpoint).getUrlComponents().PathSegments[0];
        cachedPart !== tenantId && (this.logger.verbose(`Replacing tenant domain name ${cachedPart} with id ${tenantId}`), 
        cachedPart = tenantId);
      }
      currentPart !== cachedPart && (endpoint = endpoint.replace(`/${cachedPart}/`, `/${currentPart}/`));
    }), this.replaceTenant(endpoint);
  }
  get defaultOpenIdConfigurationEndpoint() {
    const canonicalAuthorityHost = this.hostnameAndPort;
    return this.canonicalAuthority.endsWith("v2.0/") || this.authorityType === AuthorityType_Adfs || this.protocolMode !== ProtocolMode_AAD && !this.isAliasOfKnownMicrosoftAuthority(canonicalAuthorityHost) ? `${this.canonicalAuthority}.well-known/openid-configuration` : `${this.canonicalAuthority}v2.0/.well-known/openid-configuration`;
  }
  discoveryComplete() {
    return !!this.metadata;
  }
  async resolveEndpointsAsync() {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthorityResolveEndpointsAsync, this.correlationId);
    const metadataEntity = this.getCurrentMetadataEntity(), cloudDiscoverySource = await invokeAsync(this.updateCloudDiscoveryMetadata.bind(this), PerformanceEvents_AuthorityUpdateCloudDiscoveryMetadata, this.logger, this.performanceClient, this.correlationId)(metadataEntity);
    this.canonicalAuthority = this.canonicalAuthority.replace(this.hostnameAndPort, metadataEntity.preferred_network);
    const endpointSource = await invokeAsync(this.updateEndpointMetadata.bind(this), PerformanceEvents_AuthorityUpdateEndpointMetadata, this.logger, this.performanceClient, this.correlationId)(metadataEntity);
    this.updateCachedMetadata(metadataEntity, cloudDiscoverySource, {
      source: endpointSource
    }), this.performanceClient?.addFields({
      cloudDiscoverySource: cloudDiscoverySource,
      authorityEndpointSource: endpointSource
    }, this.correlationId);
  }
  getCurrentMetadataEntity() {
    let metadataEntity = this.cacheManager.getAuthorityMetadataByAlias(this.hostnameAndPort);
    return metadataEntity || (metadataEntity = {
      aliases: [],
      preferred_cache: this.hostnameAndPort,
      preferred_network: this.hostnameAndPort,
      canonical_authority: this.canonicalAuthority,
      authorization_endpoint: "",
      token_endpoint: "",
      end_session_endpoint: "",
      issuer: "",
      aliasesFromNetwork: !1,
      endpointsFromNetwork: !1,
      expiresAt: generateAuthorityMetadataExpiresAt(),
      jwks_uri: ""
    }), metadataEntity;
  }
  updateCachedMetadata(metadataEntity, cloudDiscoverySource, endpointMetadataResult) {
    cloudDiscoverySource !== AuthorityMetadataSource_CACHE && endpointMetadataResult?.source !== AuthorityMetadataSource_CACHE && (metadataEntity.expiresAt = generateAuthorityMetadataExpiresAt(), 
    metadataEntity.canonical_authority = this.canonicalAuthority);
    const cacheKey = this.cacheManager.generateAuthorityMetadataCacheKey(metadataEntity.preferred_cache);
    this.cacheManager.setAuthorityMetadata(cacheKey, metadataEntity), this.metadata = metadataEntity;
  }
  async updateEndpointMetadata(metadataEntity) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthorityUpdateEndpointMetadata, this.correlationId);
    const localMetadata = this.updateEndpointMetadataFromLocalSources(metadataEntity);
    if (localMetadata) {
      if (localMetadata.source === AuthorityMetadataSource_HARDCODED_VALUES && this.authorityOptions.azureRegionConfiguration?.azureRegion && localMetadata.metadata) {
        updateAuthorityEndpointMetadata(metadataEntity, await invokeAsync(this.updateMetadataWithRegionalInformation.bind(this), PerformanceEvents_AuthorityUpdateMetadataWithRegionalInformation, this.logger, this.performanceClient, this.correlationId)(localMetadata.metadata), !1), 
        metadataEntity.canonical_authority = this.canonicalAuthority;
      }
      return localMetadata.source;
    }
    let metadata = await invokeAsync(this.getEndpointMetadataFromNetwork.bind(this), PerformanceEvents_AuthorityGetEndpointMetadataFromNetwork, this.logger, this.performanceClient, this.correlationId)();
    if (metadata) {
      return this.authorityOptions.azureRegionConfiguration?.azureRegion && (metadata = await invokeAsync(this.updateMetadataWithRegionalInformation.bind(this), PerformanceEvents_AuthorityUpdateMetadataWithRegionalInformation, this.logger, this.performanceClient, this.correlationId)(metadata)), 
      updateAuthorityEndpointMetadata(metadataEntity, metadata, !0), AuthorityMetadataSource_NETWORK;
    }
    throw createClientAuthError("openid_config_error", this.defaultOpenIdConfigurationEndpoint);
  }
  updateEndpointMetadataFromLocalSources(metadataEntity) {
    this.logger.verbose("Attempting to get endpoint metadata from authority configuration");
    const configMetadata = this.getEndpointMetadataFromConfig();
    if (configMetadata) {
      return this.logger.verbose("Found endpoint metadata in authority configuration"), 
      updateAuthorityEndpointMetadata(metadataEntity, configMetadata, !1), {
        source: AuthorityMetadataSource_CONFIG
      };
    }
    if (this.logger.verbose("Did not find endpoint metadata in the config... Attempting to get endpoint metadata from the hardcoded values."), 
    this.authorityOptions.skipAuthorityMetadataCache) {
      this.logger.verbose("Skipping hardcoded metadata cache since skipAuthorityMetadataCache is set to true. Attempting to get endpoint metadata from the network metadata cache.");
    } else {
      const hardcodedMetadata = this.getEndpointMetadataFromHardcodedValues();
      if (hardcodedMetadata) {
        return updateAuthorityEndpointMetadata(metadataEntity, hardcodedMetadata, !1), {
          source: AuthorityMetadataSource_HARDCODED_VALUES,
          metadata: hardcodedMetadata
        };
      }
      this.logger.verbose("Did not find endpoint metadata in hardcoded values... Attempting to get endpoint metadata from the network metadata cache.");
    }
    const metadataEntityExpired = isAuthorityMetadataExpired(metadataEntity);
    return this.isAuthoritySameType(metadataEntity) && metadataEntity.endpointsFromNetwork && !metadataEntityExpired ? (this.logger.verbose("Found endpoint metadata in the cache."), 
    {
      source: AuthorityMetadataSource_CACHE
    }) : (metadataEntityExpired && this.logger.verbose("The metadata entity is expired."), 
    null);
  }
  isAuthoritySameType(metadataEntity) {
    return new UrlString(metadataEntity.canonical_authority).getUrlComponents().PathSegments.length === this.canonicalAuthorityUrlComponents.PathSegments.length;
  }
  getEndpointMetadataFromConfig() {
    if (this.authorityOptions.authorityMetadata) {
      try {
        return JSON.parse(this.authorityOptions.authorityMetadata);
      } catch (e) {
        throw createClientConfigurationError("invalid_authority_metadata");
      }
    }
    return null;
  }
  async getEndpointMetadataFromNetwork() {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthorityGetEndpointMetadataFromNetwork, this.correlationId);
    const options = {}, openIdConfigurationEndpoint = this.defaultOpenIdConfigurationEndpoint;
    this.logger.verbose(`Authority.getEndpointMetadataFromNetwork: attempting to retrieve OAuth endpoints from ${openIdConfigurationEndpoint}`);
    try {
      const response = await this.networkInterface.sendGetRequestAsync(openIdConfigurationEndpoint, options), isValidResponse = function(response) {
        return response.hasOwnProperty("authorization_endpoint") && response.hasOwnProperty("token_endpoint") && response.hasOwnProperty("issuer") && response.hasOwnProperty("jwks_uri");
      }
      /*! @azure/msal-common v14.16.0 2024-11-05 */ (response.body);
      return isValidResponse ? response.body : (this.logger.verbose("Authority.getEndpointMetadataFromNetwork: could not parse response as OpenID configuration"), 
      null);
    } catch (e) {
      return this.logger.verbose(`Authority.getEndpointMetadataFromNetwork: ${e}`), null;
    }
  }
  getEndpointMetadataFromHardcodedValues() {
    return this.hostnameAndPort in EndpointMetadata ? EndpointMetadata[this.hostnameAndPort] : null;
  }
  async updateMetadataWithRegionalInformation(metadata) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthorityUpdateMetadataWithRegionalInformation, this.correlationId);
    const userConfiguredAzureRegion = this.authorityOptions.azureRegionConfiguration?.azureRegion;
    if (userConfiguredAzureRegion) {
      if (userConfiguredAzureRegion !== Constants$2.AZURE_REGION_AUTO_DISCOVER_FLAG) {
        return this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes_CONFIGURED_NO_AUTO_DETECTION, 
        this.regionDiscoveryMetadata.region_used = userConfiguredAzureRegion, Authority.replaceWithRegionalInformation(metadata, userConfiguredAzureRegion);
      }
      const autodetectedRegionName = await invokeAsync(this.regionDiscovery.detectRegion.bind(this.regionDiscovery), PerformanceEvents_RegionDiscoveryDetectRegion, this.logger, this.performanceClient, this.correlationId)(this.authorityOptions.azureRegionConfiguration?.environmentRegion, this.regionDiscoveryMetadata);
      if (autodetectedRegionName) {
        return this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes_AUTO_DETECTION_REQUESTED_SUCCESSFUL, 
        this.regionDiscoveryMetadata.region_used = autodetectedRegionName, Authority.replaceWithRegionalInformation(metadata, autodetectedRegionName);
      }
      this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes_AUTO_DETECTION_REQUESTED_FAILED;
    }
    return metadata;
  }
  async updateCloudDiscoveryMetadata(metadataEntity) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthorityUpdateCloudDiscoveryMetadata, this.correlationId);
    const localMetadataSource = this.updateCloudDiscoveryMetadataFromLocalSources(metadataEntity);
    if (localMetadataSource) {
      return localMetadataSource;
    }
    const metadata = await invokeAsync(this.getCloudDiscoveryMetadataFromNetwork.bind(this), PerformanceEvents_AuthorityGetCloudDiscoveryMetadataFromNetwork, this.logger, this.performanceClient, this.correlationId)();
    if (metadata) {
      return updateCloudDiscoveryMetadata(metadataEntity, metadata, !0), AuthorityMetadataSource_NETWORK;
    }
    throw createClientConfigurationError("untrusted_authority");
  }
  updateCloudDiscoveryMetadataFromLocalSources(metadataEntity) {
    this.logger.verbose("Attempting to get cloud discovery metadata  from authority configuration"), 
    this.logger.verbosePii(`Known Authorities: ${this.authorityOptions.knownAuthorities || Constants$2.NOT_APPLICABLE}`), 
    this.logger.verbosePii(`Authority Metadata: ${this.authorityOptions.authorityMetadata || Constants$2.NOT_APPLICABLE}`), 
    this.logger.verbosePii(`Canonical Authority: ${metadataEntity.canonical_authority || Constants$2.NOT_APPLICABLE}`);
    const metadata = this.getCloudDiscoveryMetadataFromConfig();
    if (metadata) {
      return this.logger.verbose("Found cloud discovery metadata in authority configuration"), 
      updateCloudDiscoveryMetadata(metadataEntity, metadata, !1), AuthorityMetadataSource_CONFIG;
    }
    if (this.logger.verbose("Did not find cloud discovery metadata in the config... Attempting to get cloud discovery metadata from the hardcoded values."), 
    this.options.skipAuthorityMetadataCache) {
      this.logger.verbose("Skipping hardcoded cloud discovery metadata cache since skipAuthorityMetadataCache is set to true. Attempting to get cloud discovery metadata from the network metadata cache.");
    } else {
      const hardcodedMetadata = (authorityHost = this.hostnameAndPort, getCloudDiscoveryMetadataFromNetworkResponse(InstanceDiscoveryMetadata.metadata, authorityHost));
      if (hardcodedMetadata) {
        return this.logger.verbose("Found cloud discovery metadata from hardcoded values."), 
        updateCloudDiscoveryMetadata(metadataEntity, hardcodedMetadata, !1), AuthorityMetadataSource_HARDCODED_VALUES;
      }
      this.logger.verbose("Did not find cloud discovery metadata in hardcoded values... Attempting to get cloud discovery metadata from the network metadata cache.");
    }
    var authorityHost;
    const metadataEntityExpired = isAuthorityMetadataExpired(metadataEntity);
    return this.isAuthoritySameType(metadataEntity) && metadataEntity.aliasesFromNetwork && !metadataEntityExpired ? (this.logger.verbose("Found cloud discovery metadata in the cache."), 
    AuthorityMetadataSource_CACHE) : (metadataEntityExpired && this.logger.verbose("The metadata entity is expired."), 
    null);
  }
  getCloudDiscoveryMetadataFromConfig() {
    if (this.authorityType === AuthorityType_Ciam) {
      return this.logger.verbose("CIAM authorities do not support cloud discovery metadata, generate the aliases from authority host."), 
      Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
    }
    if (this.authorityOptions.cloudDiscoveryMetadata) {
      this.logger.verbose("The cloud discovery metadata has been provided as a network response, in the config.");
      try {
        this.logger.verbose("Attempting to parse the cloud discovery metadata.");
        const metadata = getCloudDiscoveryMetadataFromNetworkResponse(JSON.parse(this.authorityOptions.cloudDiscoveryMetadata).metadata, this.hostnameAndPort);
        if (this.logger.verbose("Parsed the cloud discovery metadata."), metadata) {
          return this.logger.verbose("There is returnable metadata attached to the parsed cloud discovery metadata."), 
          metadata;
        }
        this.logger.verbose("There is no metadata attached to the parsed cloud discovery metadata.");
      } catch (e) {
        throw this.logger.verbose("Unable to parse the cloud discovery metadata. Throwing Invalid Cloud Discovery Metadata Error."), 
        createClientConfigurationError("invalid_cloud_discovery_metadata");
      }
    }
    return this.isInKnownAuthorities() ? (this.logger.verbose("The host is included in knownAuthorities. Creating new cloud discovery metadata from the host."), 
    Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort)) : null;
  }
  async getCloudDiscoveryMetadataFromNetwork() {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthorityGetCloudDiscoveryMetadataFromNetwork, this.correlationId);
    const instanceDiscoveryEndpoint = `${Constants$2.AAD_INSTANCE_DISCOVERY_ENDPT}${this.canonicalAuthority}oauth2/v2.0/authorize`, options = {};
    let match = null;
    try {
      const response = await this.networkInterface.sendGetRequestAsync(instanceDiscoveryEndpoint, options);
      let typedResponseBody, metadata;
      if (function(response) {
        return response.hasOwnProperty("tenant_discovery_endpoint") && response.hasOwnProperty("metadata");
      }
      /*! @azure/msal-common v14.16.0 2024-11-05 */ (response.body)) {
        typedResponseBody = response.body, metadata = typedResponseBody.metadata, this.logger.verbosePii(`tenant_discovery_endpoint is: ${typedResponseBody.tenant_discovery_endpoint}`);
      } else {
        if (!function(response) {
          return response.hasOwnProperty("error") && response.hasOwnProperty("error_description");
        }(response.body)) {
          return this.logger.error("AAD did not return a CloudInstanceDiscoveryResponse or CloudInstanceDiscoveryErrorResponse"), 
          null;
        }
        if (this.logger.warning(`A CloudInstanceDiscoveryErrorResponse was returned. The cloud instance discovery network request's status code is: ${response.status}`), 
        typedResponseBody = response.body, typedResponseBody.error === Constants$2.INVALID_INSTANCE) {
          return this.logger.error("The CloudInstanceDiscoveryErrorResponse error is invalid_instance."), 
          null;
        }
        this.logger.warning(`The CloudInstanceDiscoveryErrorResponse error is ${typedResponseBody.error}`), 
        this.logger.warning(`The CloudInstanceDiscoveryErrorResponse error description is ${typedResponseBody.error_description}`), 
        this.logger.warning("Setting the value of the CloudInstanceDiscoveryMetadata (returned from the network) to []"), 
        metadata = [];
      }
      this.logger.verbose("Attempting to find a match between the developer's authority and the CloudInstanceDiscoveryMetadata returned from the network request."), 
      match = getCloudDiscoveryMetadataFromNetworkResponse(metadata, this.hostnameAndPort);
    } catch (error) {
      if (error instanceof AuthError) {
        this.logger.error(`There was a network error while attempting to get the cloud discovery instance metadata.\nError: ${error.errorCode}\nError Description: ${error.errorMessage}`);
      } else {
        const typedError = error;
        this.logger.error(`A non-MSALJS error was thrown while attempting to get the cloud instance discovery metadata.\nError: ${typedError.name}\nError Description: ${typedError.message}`);
      }
      return null;
    }
    return match || (this.logger.warning("The developer's authority was not found within the CloudInstanceDiscoveryMetadata returned from the network request."), 
    this.logger.verbose("Creating custom Authority for custom domain scenario."), match = Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort)), 
    match;
  }
  isInKnownAuthorities() {
    return this.authorityOptions.knownAuthorities.filter(authority => authority && UrlString.getDomainFromUrl(authority).toLowerCase() === this.hostnameAndPort).length > 0;
  }
  static generateAuthority(authorityString, azureCloudOptions) {
    let authorityAzureCloudInstance;
    if (azureCloudOptions && azureCloudOptions.azureCloudInstance !== AzureCloudInstance_None) {
      const tenant = azureCloudOptions.tenant ? azureCloudOptions.tenant : Constants$2.DEFAULT_COMMON_TENANT;
      authorityAzureCloudInstance = `${azureCloudOptions.azureCloudInstance}/${tenant}/`;
    }
    return authorityAzureCloudInstance || authorityString;
  }
  static createCloudDiscoveryMetadataFromHost(host) {
    return {
      preferred_network: host,
      preferred_cache: host,
      aliases: [ host ]
    };
  }
  getPreferredCache() {
    if (this.managedIdentity) {
      return Constants$2.DEFAULT_AUTHORITY_HOST;
    }
    if (this.discoveryComplete()) {
      return this.metadata.preferred_cache;
    }
    throw createClientAuthError("endpoints_resolution_error");
  }
  isAlias(host) {
    return this.metadata.aliases.indexOf(host) > -1;
  }
  isAliasOfKnownMicrosoftAuthority(host) {
    return InstanceDiscoveryMetadataAliases.has(host);
  }
  static isPublicCloudAuthority(host) {
    return Constants$2.KNOWN_PUBLIC_CLOUDS.indexOf(host) >= 0;
  }
  static buildRegionalAuthorityString(host, region, queryString) {
    const authorityUrlInstance = new UrlString(host);
    authorityUrlInstance.validateAsUri();
    const authorityUrlParts = authorityUrlInstance.getUrlComponents();
    let hostNameAndPort = `${region}.${authorityUrlParts.HostNameAndPort}`;
    this.isPublicCloudAuthority(authorityUrlParts.HostNameAndPort) && (hostNameAndPort = `${region}.${Constants$2.REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX}`);
    const url = UrlString.constructAuthorityUriFromObject({
      ...authorityUrlInstance.getUrlComponents(),
      HostNameAndPort: hostNameAndPort
    }).urlString;
    return queryString ? `${url}?${queryString}` : url;
  }
  static replaceWithRegionalInformation(metadata, azureRegion) {
    const regionalMetadata = {
      ...metadata
    };
    return regionalMetadata.authorization_endpoint = Authority.buildRegionalAuthorityString(regionalMetadata.authorization_endpoint, azureRegion), 
    regionalMetadata.token_endpoint = Authority.buildRegionalAuthorityString(regionalMetadata.token_endpoint, azureRegion), 
    regionalMetadata.end_session_endpoint && (regionalMetadata.end_session_endpoint = Authority.buildRegionalAuthorityString(regionalMetadata.end_session_endpoint, azureRegion)), 
    regionalMetadata;
  }
  static transformCIAMAuthority(authority) {
    let ciamAuthority = authority;
    const authorityUrlComponents = new UrlString(authority).getUrlComponents();
    if (0 === authorityUrlComponents.PathSegments.length && authorityUrlComponents.HostNameAndPort.endsWith(Constants$2.CIAM_AUTH_URL)) {
      ciamAuthority = `${ciamAuthority}${authorityUrlComponents.HostNameAndPort.split(".")[0]}${Constants$2.AAD_TENANT_DOMAIN_SUFFIX}`;
    }
    return ciamAuthority;
  }
}

function formatAuthorityUri(authorityUri) {
  return authorityUri.endsWith(Constants$2.FORWARD_SLASH) ? authorityUri : `${authorityUri}${Constants$2.FORWARD_SLASH}`;
}

/*! @azure/msal-common v14.16.0 2024-11-05 */
async function createDiscoveredInstance(authorityUri, networkClient, cacheManager, authorityOptions, logger, correlationId, performanceClient) {
  performanceClient?.addQueueMeasurement(PerformanceEvents_AuthorityFactoryCreateDiscoveredInstance, correlationId);
  const authorityUriFinal = Authority.transformCIAMAuthority(formatAuthorityUri(authorityUri)), acquireTokenAuthority = new Authority(authorityUriFinal, networkClient, cacheManager, authorityOptions, logger, correlationId, performanceClient);
  try {
    return await invokeAsync(acquireTokenAuthority.resolveEndpointsAsync.bind(acquireTokenAuthority), PerformanceEvents_AuthorityResolveEndpointsAsync, logger, performanceClient, correlationId)(), 
    acquireTokenAuthority;
  } catch (e) {
    throw createClientAuthError("endpoints_resolution_error");
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ Authority.reservedTenantDomains = new Set([ "{tenant}", "{tenantid}", AADAuthorityConstants_COMMON, AADAuthorityConstants_CONSUMERS, AADAuthorityConstants_ORGANIZATIONS ]);

class ServerError extends AuthError {
  constructor(errorCode, errorMessage, subError, errorNo, status) {
    super(errorCode, errorMessage, subError), this.name = "ServerError", this.errorNo = errorNo, 
    this.status = status, Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class ThrottlingUtils {
  static generateThrottlingStorageKey(thumbprint) {
    return `${ThrottlingConstants_THROTTLING_PREFIX}.${JSON.stringify(thumbprint)}`;
  }
  static preProcess(cacheManager, thumbprint) {
    const key = ThrottlingUtils.generateThrottlingStorageKey(thumbprint), value = cacheManager.getThrottlingCache(key);
    if (value) {
      if (value.throttleTime < Date.now()) {
        return void cacheManager.removeItem(key);
      }
      throw new ServerError(value.errorCodes?.join(" ") || Constants$2.EMPTY_STRING, value.errorMessage, value.subError);
    }
  }
  static postProcess(cacheManager, thumbprint, response) {
    if (ThrottlingUtils.checkResponseStatus(response) || ThrottlingUtils.checkResponseForRetryAfter(response)) {
      const thumbprintValue = {
        throttleTime: ThrottlingUtils.calculateThrottleTime(parseInt(response.headers[HeaderNames_RETRY_AFTER])),
        error: response.body.error,
        errorCodes: response.body.error_codes,
        errorMessage: response.body.error_description,
        subError: response.body.suberror
      };
      cacheManager.setThrottlingCache(ThrottlingUtils.generateThrottlingStorageKey(thumbprint), thumbprintValue);
    }
  }
  static checkResponseStatus(response) {
    return 429 === response.status || response.status >= 500 && response.status < 600;
  }
  static checkResponseForRetryAfter(response) {
    return !!response.headers && (response.headers.hasOwnProperty(HeaderNames_RETRY_AFTER) && (response.status < 200 || response.status >= 300));
  }
  static calculateThrottleTime(throttleTime) {
    const time = throttleTime <= 0 ? 0 : throttleTime, currentSeconds = Date.now() / 1e3;
    return Math.floor(1e3 * Math.min(currentSeconds + (time || ThrottlingConstants_DEFAULT_THROTTLE_TIME_SECONDS), currentSeconds + ThrottlingConstants_DEFAULT_MAX_THROTTLE_TIME_SECONDS));
  }
  static removeThrottle(cacheManager, clientId, request, homeAccountIdentifier) {
    const thumbprint = {
      clientId: clientId,
      authority: request.authority,
      scopes: request.scopes,
      homeAccountIdentifier: homeAccountIdentifier,
      claims: request.claims,
      authenticationScheme: request.authenticationScheme,
      resourceRequestMethod: request.resourceRequestMethod,
      resourceRequestUri: request.resourceRequestUri,
      shrClaims: request.shrClaims,
      sshKid: request.sshKid
    }, key = this.generateThrottlingStorageKey(thumbprint);
    cacheManager.removeItem(key);
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class NetworkError extends AuthError {
  constructor(error, httpStatus, responseHeaders) {
    super(error.errorCode, error.errorMessage, error.subError), Object.setPrototypeOf(this, NetworkError.prototype), 
    this.name = "NetworkError", this.error = error, this.httpStatus = httpStatus, this.responseHeaders = responseHeaders;
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class BaseClient {
  constructor(configuration, performanceClient) {
    this.config = function({authOptions: userAuthOptions, systemOptions: userSystemOptions, loggerOptions: userLoggerOption, cacheOptions: userCacheOptions, storageInterface: storageImplementation, networkInterface: networkImplementation, cryptoInterface: cryptoImplementation, clientCredentials: clientCredentials, libraryInfo: libraryInfo, telemetry: telemetry, serverTelemetryManager: serverTelemetryManager, persistencePlugin: persistencePlugin, serializableCache: serializableCache}) {
      const loggerOptions = {
        ...DEFAULT_LOGGER_IMPLEMENTATION,
        ...userLoggerOption
      };
      return {
        authOptions: (authOptions = userAuthOptions, {
          clientCapabilities: [],
          azureCloudOptions: DEFAULT_AZURE_CLOUD_OPTIONS,
          skipAuthorityMetadataCache: !1,
          instanceAware: !1,
          ...authOptions
        }),
        systemOptions: {
          ...DEFAULT_SYSTEM_OPTIONS$1,
          ...userSystemOptions
        },
        loggerOptions: loggerOptions,
        cacheOptions: {
          ...DEFAULT_CACHE_OPTIONS$1,
          ...userCacheOptions
        },
        storageInterface: storageImplementation || new DefaultStorageClass(userAuthOptions.clientId, DEFAULT_CRYPTO_IMPLEMENTATION, new Logger(loggerOptions)),
        networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
        cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION,
        clientCredentials: clientCredentials || DEFAULT_CLIENT_CREDENTIALS,
        libraryInfo: {
          ...DEFAULT_LIBRARY_INFO,
          ...libraryInfo
        },
        telemetry: {
          ...DEFAULT_TELEMETRY_OPTIONS$1,
          ...telemetry
        },
        serverTelemetryManager: serverTelemetryManager || null,
        persistencePlugin: persistencePlugin || null,
        serializableCache: serializableCache || null
      };
      var authOptions;
    }(configuration), this.logger = new Logger(this.config.loggerOptions, "@azure/msal-common", "14.16.0"), 
    this.cryptoUtils = this.config.cryptoInterface, this.cacheManager = this.config.storageInterface, 
    this.networkClient = this.config.networkInterface, this.serverTelemetryManager = this.config.serverTelemetryManager, 
    this.authority = this.config.authOptions.authority, this.performanceClient = performanceClient;
  }
  createTokenRequestHeaders(ccsCred) {
    const headers = {};
    if (headers[HeaderNames_CONTENT_TYPE] = Constants$2.URL_FORM_CONTENT_TYPE, !this.config.systemOptions.preventCorsPreflight && ccsCred) {
      switch (ccsCred.type) {
       case CcsCredentialType_HOME_ACCOUNT_ID:
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
          headers[HeaderNames_CCS_HEADER] = `Oid:${clientInfo.uid}@${clientInfo.utid}`;
        } catch (e) {
          this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
        }
        break;

       case CcsCredentialType_UPN:
        headers[HeaderNames_CCS_HEADER] = `UPN: ${ccsCred.credential}`;
      }
    }
    return headers;
  }
  async executePostToTokenEndpoint(tokenEndpoint, queryString, headers, thumbprint, correlationId, queuedEvent) {
    queuedEvent && this.performanceClient?.addQueueMeasurement(queuedEvent, correlationId);
    const response = await this.sendPostRequest(thumbprint, tokenEndpoint, {
      body: queryString,
      headers: headers
    }, correlationId);
    return this.config.serverTelemetryManager && response.status < 500 && 429 !== response.status && this.config.serverTelemetryManager.clearTelemetryCache(), 
    response;
  }
  async sendPostRequest(thumbprint, tokenEndpoint, options, correlationId) {
    let response;
    ThrottlingUtils.preProcess(this.cacheManager, thumbprint);
    try {
      response = await invokeAsync(this.networkClient.sendPostRequestAsync.bind(this.networkClient), PerformanceEvents_NetworkClientSendPostRequestAsync, this.logger, this.performanceClient, correlationId)(tokenEndpoint, options);
      const responseHeaders = response.headers || {};
      this.performanceClient?.addFields({
        refreshTokenSize: response.body.refresh_token?.length || 0,
        httpVerToken: responseHeaders[HeaderNames_X_MS_HTTP_VERSION] || "",
        requestId: responseHeaders[HeaderNames_X_MS_REQUEST_ID] || ""
      }, correlationId);
    } catch (e) {
      if (e instanceof NetworkError) {
        const responseHeaders = e.responseHeaders;
        throw responseHeaders && this.performanceClient?.addFields({
          httpVerToken: responseHeaders[HeaderNames_X_MS_HTTP_VERSION] || "",
          requestId: responseHeaders[HeaderNames_X_MS_REQUEST_ID] || "",
          contentTypeHeader: responseHeaders[HeaderNames_CONTENT_TYPE] || void 0,
          contentLengthHeader: responseHeaders[HeaderNames_CONTENT_LENGTH] || void 0,
          httpStatus: e.httpStatus
        }, correlationId), e.error;
      }
      throw e instanceof AuthError ? e : createClientAuthError("network_error");
    }
    return ThrottlingUtils.postProcess(this.cacheManager, thumbprint, response), response;
  }
  async updateAuthority(cloudInstanceHostname, correlationId) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_UpdateTokenEndpointAuthority, correlationId);
    const cloudInstanceAuthorityUri = `https://${cloudInstanceHostname}/${this.authority.tenant}/`, cloudInstanceAuthority = await createDiscoveredInstance(cloudInstanceAuthorityUri, this.networkClient, this.cacheManager, this.authority.options, this.logger, correlationId, this.performanceClient);
    this.authority = cloudInstanceAuthority;
  }
  createTokenQueryParameters(request) {
    const parameterBuilder = new RequestParameterBuilder(request.correlationId, this.performanceClient);
    return request.embeddedClientId && parameterBuilder.addBrokerParameters({
      brokerClientId: this.config.authOptions.clientId,
      brokerRedirectUri: this.config.authOptions.redirectUri
    }), request.tokenQueryParameters && parameterBuilder.addExtraQueryParameters(request.tokenQueryParameters), 
    parameterBuilder.addCorrelationId(request.correlationId), parameterBuilder.createQueryString();
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const noTokensFound = "no_tokens_found", nativeAccountUnavailable = "native_account_unavailable", refreshTokenExpired = "refresh_token_expired", badToken = "bad_token", InteractionRequiredServerErrorMessage = [ "interaction_required", "consent_required", "login_required", "bad_token" ], InteractionRequiredAuthSubErrorMessage = [ "message_only", "additional_action", "basic_action", "user_password_expired", "consent_required", "bad_token" ], InteractionRequiredAuthErrorMessages = {
  [noTokensFound]: "No refresh token found in the cache. Please sign-in.",
  [nativeAccountUnavailable]: "The requested account is not available in the native broker. It may have been deleted or logged out. Please sign-in again using an interactive API.",
  [refreshTokenExpired]: "Refresh token has expired.",
  [badToken]: "Identity provider returned bad_token due to an expired or invalid refresh token. Please invoke an interactive API to resolve."
};

class InteractionRequiredAuthError extends AuthError {
  constructor(errorCode, errorMessage, subError, timestamp, traceId, correlationId, claims, errorNo) {
    super(errorCode, errorMessage, subError), Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype), 
    this.timestamp = timestamp || Constants$2.EMPTY_STRING, this.traceId = traceId || Constants$2.EMPTY_STRING, 
    this.correlationId = correlationId || Constants$2.EMPTY_STRING, this.claims = claims || Constants$2.EMPTY_STRING, 
    this.name = "InteractionRequiredAuthError", this.errorNo = errorNo;
  }
}

function isInteractionRequiredError(errorCode, errorString, subError) {
  const isInteractionRequiredErrorCode = !!errorCode && InteractionRequiredServerErrorMessage.indexOf(errorCode) > -1, isInteractionRequiredSubError = !!subError && InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1, isInteractionRequiredErrorDesc = !!errorString && InteractionRequiredServerErrorMessage.some(irErrorCode => errorString.indexOf(irErrorCode) > -1);
  return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc || isInteractionRequiredSubError;
}

function createInteractionRequiredAuthError(errorCode) {
  return new InteractionRequiredAuthError(errorCode, InteractionRequiredAuthErrorMessages[errorCode]);
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class ProtocolUtils {
  static setRequestState(cryptoObj, userState, meta) {
    const libraryState = ProtocolUtils.generateLibraryState(cryptoObj, meta);
    return userState ? `${libraryState}${Constants$2.RESOURCE_DELIM}${userState}` : libraryState;
  }
  static generateLibraryState(cryptoObj, meta) {
    if (!cryptoObj) {
      throw createClientAuthError("no_crypto_object");
    }
    const stateObj = {
      id: cryptoObj.createNewGuid()
    };
    meta && (stateObj.meta = meta);
    const stateString = JSON.stringify(stateObj);
    return cryptoObj.base64Encode(stateString);
  }
  static parseRequestState(cryptoObj, state) {
    if (!cryptoObj) {
      throw createClientAuthError("no_crypto_object");
    }
    if (!state) {
      throw createClientAuthError("invalid_state");
    }
    try {
      const splitState = state.split(Constants$2.RESOURCE_DELIM), libraryState = splitState[0], userState = splitState.length > 1 ? splitState.slice(1).join(Constants$2.RESOURCE_DELIM) : Constants$2.EMPTY_STRING, libraryStateString = cryptoObj.base64Decode(libraryState), libraryStateObj = JSON.parse(libraryStateString);
      return {
        userRequestState: userState || Constants$2.EMPTY_STRING,
        libraryState: libraryStateObj
      };
    } catch (e) {
      throw createClientAuthError("invalid_state");
    }
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ const KeyLocation_SW = "sw";

class PopTokenGenerator {
  constructor(cryptoUtils, performanceClient) {
    this.cryptoUtils = cryptoUtils, this.performanceClient = performanceClient;
  }
  async generateCnf(request, logger) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_PopTokenGenerateCnf, request.correlationId);
    const reqCnf = await invokeAsync(this.generateKid.bind(this), PerformanceEvents_PopTokenGenerateCnf, logger, this.performanceClient, request.correlationId)(request), reqCnfString = this.cryptoUtils.base64UrlEncode(JSON.stringify(reqCnf));
    return {
      kid: reqCnf.kid,
      reqCnfString: reqCnfString
    };
  }
  async generateKid(request) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_PopTokenGenerateKid, request.correlationId);
    return {
      kid: await this.cryptoUtils.getPublicKeyThumbprint(request),
      xms_ksl: KeyLocation_SW
    };
  }
  async signPopToken(accessToken, keyId, request) {
    return this.signPayload(accessToken, keyId, request);
  }
  async signPayload(payload, keyId, request, claims) {
    const {resourceRequestMethod: resourceRequestMethod, resourceRequestUri: resourceRequestUri, shrClaims: shrClaims, shrNonce: shrNonce, shrOptions: shrOptions} = request, resourceUrlString = resourceRequestUri ? new UrlString(resourceRequestUri) : void 0, resourceUrlComponents = resourceUrlString?.getUrlComponents();
    return this.cryptoUtils.signJwt({
      at: payload,
      ts: nowSeconds(),
      m: resourceRequestMethod?.toUpperCase(),
      u: resourceUrlComponents?.HostNameAndPort,
      nonce: shrNonce || this.cryptoUtils.createNewGuid(),
      p: resourceUrlComponents?.AbsolutePath,
      q: resourceUrlComponents?.QueryString ? [ [], resourceUrlComponents.QueryString ] : void 0,
      client_claims: shrClaims || void 0,
      ...claims
    }, keyId, shrOptions, request.correlationId);
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class TokenCacheContext {
  constructor(tokenCache, hasChanged) {
    this.cache = tokenCache, this.hasChanged = hasChanged;
  }
  get cacheHasChanged() {
    return this.hasChanged;
  }
  get tokenCache() {
    return this.cache;
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class ResponseHandler {
  constructor(clientId, cacheStorage, cryptoObj, logger, serializableCache, persistencePlugin, performanceClient) {
    this.clientId = clientId, this.cacheStorage = cacheStorage, this.cryptoObj = cryptoObj, 
    this.logger = logger, this.serializableCache = serializableCache, this.persistencePlugin = persistencePlugin, 
    this.performanceClient = performanceClient;
  }
  validateServerAuthorizationCodeResponse(serverResponse, requestState) {
    if (!serverResponse.state || !requestState) {
      throw serverResponse.state ? createClientAuthError("state_not_found", "Cached State") : createClientAuthError("state_not_found", "Server State");
    }
    let decodedServerResponseState, decodedRequestState;
    try {
      decodedServerResponseState = decodeURIComponent(serverResponse.state);
    } catch (e) {
      throw createClientAuthError("invalid_state", serverResponse.state);
    }
    try {
      decodedRequestState = decodeURIComponent(requestState);
    } catch (e) {
      throw createClientAuthError("invalid_state", serverResponse.state);
    }
    if (decodedServerResponseState !== decodedRequestState) {
      throw createClientAuthError("state_mismatch");
    }
    if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
      const serverErrorNo = function(serverResponse) {
        const errorCodePrefixIndex = serverResponse.error_uri?.lastIndexOf("code=");
        return errorCodePrefixIndex && errorCodePrefixIndex >= 0 ? serverResponse.error_uri?.substring(errorCodePrefixIndex + 5) : void 0;
      }(serverResponse);
      if (isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
        throw new InteractionRequiredAuthError(serverResponse.error || "", serverResponse.error_description, serverResponse.suberror, serverResponse.timestamp || "", serverResponse.trace_id || "", serverResponse.correlation_id || "", serverResponse.claims || "", serverErrorNo);
      }
      throw new ServerError(serverResponse.error || "", serverResponse.error_description, serverResponse.suberror, serverErrorNo);
    }
  }
  validateTokenResponse(serverResponse, refreshAccessToken) {
    if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
      const errString = `Error(s): ${serverResponse.error_codes || Constants$2.NOT_AVAILABLE} - Timestamp: ${serverResponse.timestamp || Constants$2.NOT_AVAILABLE} - Description: ${serverResponse.error_description || Constants$2.NOT_AVAILABLE} - Correlation ID: ${serverResponse.correlation_id || Constants$2.NOT_AVAILABLE} - Trace ID: ${serverResponse.trace_id || Constants$2.NOT_AVAILABLE}`, serverErrorNo = serverResponse.error_codes?.length ? serverResponse.error_codes[0] : void 0, serverError = new ServerError(serverResponse.error, errString, serverResponse.suberror, serverErrorNo, serverResponse.status);
      if (refreshAccessToken && serverResponse.status && serverResponse.status >= HttpStatus_SERVER_ERROR_RANGE_START && serverResponse.status <= HttpStatus_SERVER_ERROR_RANGE_END) {
        return void this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently unavailable and the access token is unable to be refreshed.\n${serverError}`);
      }
      if (refreshAccessToken && serverResponse.status && serverResponse.status >= HttpStatus_CLIENT_ERROR_RANGE_START && serverResponse.status <= HttpStatus_CLIENT_ERROR_RANGE_END) {
        return void this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently available but is unable to refresh the access token.\n${serverError}`);
      }
      if (isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
        throw new InteractionRequiredAuthError(serverResponse.error, serverResponse.error_description, serverResponse.suberror, serverResponse.timestamp || Constants$2.EMPTY_STRING, serverResponse.trace_id || Constants$2.EMPTY_STRING, serverResponse.correlation_id || Constants$2.EMPTY_STRING, serverResponse.claims || Constants$2.EMPTY_STRING, serverErrorNo);
      }
      throw serverError;
    }
  }
  async handleServerTokenResponse(serverTokenResponse, authority, reqTimestamp, request, authCodePayload, userAssertionHash, handlingRefreshTokenResponse, forceCacheRefreshTokenResponse, serverRequestId) {
    let idTokenClaims, requestStateObj;
    if (this.performanceClient?.addQueueMeasurement(PerformanceEvents_HandleServerTokenResponse, serverTokenResponse.correlation_id), 
    serverTokenResponse.id_token) {
      if (idTokenClaims = extractTokenClaims(serverTokenResponse.id_token || Constants$2.EMPTY_STRING, this.cryptoObj.base64Decode), 
      authCodePayload && authCodePayload.nonce && idTokenClaims.nonce !== authCodePayload.nonce) {
        throw createClientAuthError("nonce_mismatch");
      }
      if (request.maxAge || 0 === request.maxAge) {
        const authTime = idTokenClaims.auth_time;
        if (!authTime) {
          throw createClientAuthError("auth_time_not_found");
        }
        checkMaxAge(authTime, request.maxAge);
      }
    }
    this.homeAccountIdentifier = AccountEntity.generateHomeAccountId(serverTokenResponse.client_info || Constants$2.EMPTY_STRING, authority.authorityType, this.logger, this.cryptoObj, idTokenClaims), 
    authCodePayload && authCodePayload.state && (requestStateObj = ProtocolUtils.parseRequestState(this.cryptoObj, authCodePayload.state)), 
    serverTokenResponse.key_id = serverTokenResponse.key_id || request.sshKid || void 0;
    const cacheRecord = this.generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload);
    let cacheContext;
    try {
      if (this.persistencePlugin && this.serializableCache && (this.logger.verbose("Persistence enabled, calling beforeCacheAccess"), 
      cacheContext = new TokenCacheContext(this.serializableCache, !0), await this.persistencePlugin.beforeCacheAccess(cacheContext)), 
      handlingRefreshTokenResponse && !forceCacheRefreshTokenResponse && cacheRecord.account) {
        const key = cacheRecord.account.generateAccountKey();
        if (!this.cacheStorage.getAccount(key, this.logger)) {
          return this.logger.warning("Account used to refresh tokens not in persistence, refreshed tokens will not be stored in the cache"), 
          await ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, !1, request, idTokenClaims, requestStateObj, void 0, serverRequestId);
        }
      }
      await this.cacheStorage.saveCacheRecord(cacheRecord, request.storeInCache, request.correlationId);
    } finally {
      this.persistencePlugin && this.serializableCache && cacheContext && (this.logger.verbose("Persistence enabled, calling afterCacheAccess"), 
      await this.persistencePlugin.afterCacheAccess(cacheContext));
    }
    return ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, !1, request, idTokenClaims, requestStateObj, serverTokenResponse, serverRequestId);
  }
  generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload) {
    const env = authority.getPreferredCache();
    if (!env) {
      throw createClientAuthError("invalid_cache_environment");
    }
    const claimsTenantId = getTenantIdFromIdTokenClaims(idTokenClaims);
    let cachedIdToken, cachedAccount;
    var homeAccountId, environment, idToken, clientId, tenantId;
    serverTokenResponse.id_token && idTokenClaims && (homeAccountId = this.homeAccountIdentifier, 
    environment = env, idToken = serverTokenResponse.id_token, clientId = this.clientId, 
    tenantId = claimsTenantId || "", cachedIdToken = {
      credentialType: CredentialType.ID_TOKEN,
      homeAccountId: homeAccountId,
      environment: environment,
      clientId: clientId,
      secret: idToken,
      realm: tenantId
    }, cachedAccount = function(cacheStorage, authority, homeAccountId, base64Decode, idTokenClaims, clientInfo, environment, claimsTenantId, authCodePayload, nativeAccountId, logger) {
      logger?.verbose("setCachedAccount called");
      const baseAccountKey = cacheStorage.getAccountKeys().find(accountKey => accountKey.startsWith(homeAccountId));
      let cachedAccount = null;
      baseAccountKey && (cachedAccount = cacheStorage.getAccount(baseAccountKey, logger));
      const baseAccount = cachedAccount || AccountEntity.createAccount({
        homeAccountId: homeAccountId,
        idTokenClaims: idTokenClaims,
        clientInfo: clientInfo,
        environment: environment,
        cloudGraphHostName: authCodePayload?.cloud_graph_host_name,
        msGraphHost: authCodePayload?.msgraph_host,
        nativeAccountId: nativeAccountId
      }, authority, base64Decode), tenantProfiles = baseAccount.tenantProfiles || [], tenantId = claimsTenantId || baseAccount.realm;
      if (tenantId && !tenantProfiles.find(tenantProfile => tenantProfile.tenantId === tenantId)) {
        const newTenantProfile = buildTenantProfile(homeAccountId, baseAccount.localAccountId, tenantId, idTokenClaims);
        tenantProfiles.push(newTenantProfile);
      }
      return baseAccount.tenantProfiles = tenantProfiles, baseAccount;
    }
    /*! @azure/msal-common v14.16.0 2024-11-05 */ (this.cacheStorage, authority, this.homeAccountIdentifier, this.cryptoObj.base64Decode, idTokenClaims, serverTokenResponse.client_info, env, claimsTenantId, authCodePayload, void 0, this.logger));
    let cachedAccessToken = null;
    if (serverTokenResponse.access_token) {
      const responseScopes = serverTokenResponse.scope ? ScopeSet.fromString(serverTokenResponse.scope) : new ScopeSet(request.scopes || []), expiresIn = ("string" == typeof serverTokenResponse.expires_in ? parseInt(serverTokenResponse.expires_in, 10) : serverTokenResponse.expires_in) || 0, extExpiresIn = ("string" == typeof serverTokenResponse.ext_expires_in ? parseInt(serverTokenResponse.ext_expires_in, 10) : serverTokenResponse.ext_expires_in) || 0, refreshIn = ("string" == typeof serverTokenResponse.refresh_in ? parseInt(serverTokenResponse.refresh_in, 10) : serverTokenResponse.refresh_in) || void 0, tokenExpirationSeconds = reqTimestamp + expiresIn, extendedTokenExpirationSeconds = tokenExpirationSeconds + extExpiresIn, refreshOnSeconds = refreshIn && refreshIn > 0 ? reqTimestamp + refreshIn : void 0;
      cachedAccessToken = function(homeAccountId, environment, accessToken, clientId, tenantId, scopes, expiresOn, extExpiresOn, base64Decode, refreshOn, tokenType, userAssertionHash, keyId, requestedClaims, requestedClaimsHash) {
        const atEntity = {
          homeAccountId: homeAccountId,
          credentialType: CredentialType.ACCESS_TOKEN,
          secret: accessToken,
          cachedAt: nowSeconds().toString(),
          expiresOn: expiresOn.toString(),
          extendedExpiresOn: extExpiresOn.toString(),
          environment: environment,
          clientId: clientId,
          realm: tenantId,
          target: scopes,
          tokenType: tokenType || AuthenticationScheme.BEARER
        };
        if (userAssertionHash && (atEntity.userAssertionHash = userAssertionHash), refreshOn && (atEntity.refreshOn = refreshOn.toString()), 
        requestedClaims && (atEntity.requestedClaims = requestedClaims, atEntity.requestedClaimsHash = requestedClaimsHash), 
        atEntity.tokenType?.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase()) {
          switch (atEntity.credentialType = CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME, 
          atEntity.tokenType) {
           case AuthenticationScheme.POP:
            const tokenClaims = extractTokenClaims(accessToken, base64Decode);
            if (!tokenClaims?.cnf?.kid) {
              throw createClientAuthError("token_claims_cnf_required_for_signedjwt");
            }
            atEntity.keyId = tokenClaims.cnf.kid;
            break;

           case AuthenticationScheme.SSH:
            atEntity.keyId = keyId;
          }
        }
        return atEntity;
      }(this.homeAccountIdentifier, env, serverTokenResponse.access_token, this.clientId, claimsTenantId || authority.tenant || "", responseScopes.printScopes(), tokenExpirationSeconds, extendedTokenExpirationSeconds, this.cryptoObj.base64Decode, refreshOnSeconds, serverTokenResponse.token_type, userAssertionHash, serverTokenResponse.key_id, request.claims, request.requestedClaimsHash);
    }
    let cachedRefreshToken = null;
    if (serverTokenResponse.refresh_token) {
      let rtExpiresOn;
      if (serverTokenResponse.refresh_token_expires_in) {
        rtExpiresOn = reqTimestamp + ("string" == typeof serverTokenResponse.refresh_token_expires_in ? parseInt(serverTokenResponse.refresh_token_expires_in, 10) : serverTokenResponse.refresh_token_expires_in);
      }
      cachedRefreshToken = function(homeAccountId, environment, refreshToken, clientId, familyId, userAssertionHash, expiresOn) {
        const rtEntity = {
          credentialType: CredentialType.REFRESH_TOKEN,
          homeAccountId: homeAccountId,
          environment: environment,
          clientId: clientId,
          secret: refreshToken
        };
        return userAssertionHash && (rtEntity.userAssertionHash = userAssertionHash), familyId && (rtEntity.familyId = familyId), 
        expiresOn && (rtEntity.expiresOn = expiresOn.toString()), rtEntity;
      }(this.homeAccountIdentifier, env, serverTokenResponse.refresh_token, this.clientId, serverTokenResponse.foci, userAssertionHash, rtExpiresOn);
    }
    let cachedAppMetadata = null;
    return serverTokenResponse.foci && (cachedAppMetadata = {
      clientId: this.clientId,
      environment: env,
      familyId: serverTokenResponse.foci
    }), {
      account: cachedAccount,
      idToken: cachedIdToken,
      accessToken: cachedAccessToken,
      refreshToken: cachedRefreshToken,
      appMetadata: cachedAppMetadata
    };
  }
  static async generateAuthenticationResult(cryptoObj, authority, cacheRecord, fromTokenCache, request, idTokenClaims, requestState, serverTokenResponse, requestId) {
    let extExpiresOn, refreshOn, accessToken = Constants$2.EMPTY_STRING, responseScopes = [], expiresOn = null, familyId = Constants$2.EMPTY_STRING;
    if (cacheRecord.accessToken) {
      if (cacheRecord.accessToken.tokenType !== AuthenticationScheme.POP || request.popKid) {
        accessToken = cacheRecord.accessToken.secret;
      } else {
        const popTokenGenerator = new PopTokenGenerator(cryptoObj), {secret: secret, keyId: keyId} = cacheRecord.accessToken;
        if (!keyId) {
          throw createClientAuthError("key_id_missing");
        }
        accessToken = await popTokenGenerator.signPopToken(secret, keyId, request);
      }
      responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target).asArray(), 
      expiresOn = new Date(1e3 * Number(cacheRecord.accessToken.expiresOn)), extExpiresOn = new Date(1e3 * Number(cacheRecord.accessToken.extendedExpiresOn)), 
      cacheRecord.accessToken.refreshOn && (refreshOn = new Date(1e3 * Number(cacheRecord.accessToken.refreshOn)));
    }
    cacheRecord.appMetadata && (familyId = "1" === cacheRecord.appMetadata.familyId ? "1" : "");
    const uid = idTokenClaims?.oid || idTokenClaims?.sub || "", tid = idTokenClaims?.tid || "";
    serverTokenResponse?.spa_accountid && cacheRecord.account && (cacheRecord.account.nativeAccountId = serverTokenResponse?.spa_accountid);
    const accountInfo = cacheRecord.account ? updateAccountTenantProfileData(cacheRecord.account.getAccountInfo(), void 0, idTokenClaims, cacheRecord.idToken?.secret) : null;
    return {
      authority: authority.canonicalAuthority,
      uniqueId: uid,
      tenantId: tid,
      scopes: responseScopes,
      account: accountInfo,
      idToken: cacheRecord?.idToken?.secret || "",
      idTokenClaims: idTokenClaims || {},
      accessToken: accessToken,
      fromCache: fromTokenCache,
      expiresOn: expiresOn,
      extExpiresOn: extExpiresOn,
      refreshOn: refreshOn,
      correlationId: request.correlationId,
      requestId: requestId || Constants$2.EMPTY_STRING,
      familyId: familyId,
      tokenType: cacheRecord.accessToken?.tokenType || Constants$2.EMPTY_STRING,
      state: requestState ? requestState.userRequestState : Constants$2.EMPTY_STRING,
      cloudGraphHostName: cacheRecord.account?.cloudGraphHostName || Constants$2.EMPTY_STRING,
      msGraphHost: cacheRecord.account?.msGraphHost || Constants$2.EMPTY_STRING,
      code: serverTokenResponse?.spa_code,
      fromNativeBroker: !1
    };
  }
}

async function getClientAssertion(clientAssertion, clientId, tokenEndpoint) {
  if ("string" == typeof clientAssertion) {
    return clientAssertion;
  }
  return clientAssertion({
    clientId: clientId,
    tokenEndpoint: tokenEndpoint
  });
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class AuthorizationCodeClient extends BaseClient {
  constructor(configuration, performanceClient) {
    super(configuration, performanceClient), this.includeRedirectUri = !0, this.oidcDefaultScopes = this.config.authOptions.authority.options.OIDCOptions?.defaultScopes;
  }
  async getAuthCodeUrl(request) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_GetAuthCodeUrl, request.correlationId);
    const queryString = await invokeAsync(this.createAuthCodeUrlQueryString.bind(this), PerformanceEvents_AuthClientCreateQueryString, this.logger, this.performanceClient, request.correlationId)(request);
    return UrlString.appendQueryString(this.authority.authorizationEndpoint, queryString);
  }
  async acquireToken(request, authCodePayload) {
    if (this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthClientAcquireToken, request.correlationId), 
    !request.code) {
      throw createClientAuthError("request_cannot_be_made");
    }
    const reqTimestamp = nowSeconds(), response = await invokeAsync(this.executeTokenRequest.bind(this), PerformanceEvents_AuthClientExecuteTokenRequest, this.logger, this.performanceClient, request.correlationId)(this.authority, request), requestId = response.headers?.[HeaderNames_X_MS_REQUEST_ID], responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin, this.performanceClient);
    return responseHandler.validateTokenResponse(response.body), invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), PerformanceEvents_HandleServerTokenResponse, this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, authCodePayload, void 0, void 0, void 0, requestId);
  }
  handleFragmentResponse(serverParams, cachedState) {
    if (new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, null, null).validateServerAuthorizationCodeResponse(serverParams, cachedState), 
    !serverParams.code) {
      throw createClientAuthError("authorization_code_missing_from_server_response");
    }
    return serverParams;
  }
  getLogoutUri(logoutRequest) {
    if (!logoutRequest) {
      throw createClientConfigurationError("logout_request_empty");
    }
    const queryString = this.createLogoutUrlQueryString(logoutRequest);
    return UrlString.appendQueryString(this.authority.endSessionEndpoint, queryString);
  }
  async executeTokenRequest(authority, request) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthClientExecuteTokenRequest, request.correlationId);
    const queryParametersString = this.createTokenQueryParameters(request), endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString), requestBody = await invokeAsync(this.createTokenRequestBody.bind(this), PerformanceEvents_AuthClientCreateTokenRequestBody, this.logger, this.performanceClient, request.correlationId)(request);
    let ccsCredential;
    if (request.clientInfo) {
      try {
        const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
        ccsCredential = {
          credential: `${clientInfo.uid}${Separators_CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
          type: CcsCredentialType_HOME_ACCOUNT_ID
        };
      } catch (e) {
        this.logger.verbose("Could not parse client info for CCS Header: " + e);
      }
    }
    const headers = this.createTokenRequestHeaders(ccsCredential || request.ccsCredential), thumbprint = {
      clientId: request.tokenBodyParameters?.clientId || this.config.authOptions.clientId,
      authority: authority.canonicalAuthority,
      scopes: request.scopes,
      claims: request.claims,
      authenticationScheme: request.authenticationScheme,
      resourceRequestMethod: request.resourceRequestMethod,
      resourceRequestUri: request.resourceRequestUri,
      shrClaims: request.shrClaims,
      sshKid: request.sshKid
    };
    return invokeAsync(this.executePostToTokenEndpoint.bind(this), PerformanceEvents_AuthorizationCodeClientExecutePostToTokenEndpoint, this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody, headers, thumbprint, request.correlationId, PerformanceEvents_AuthorizationCodeClientExecutePostToTokenEndpoint);
  }
  async createTokenRequestBody(request) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthClientCreateTokenRequestBody, request.correlationId);
    const parameterBuilder = new RequestParameterBuilder(request.correlationId, this.performanceClient);
    if (parameterBuilder.addClientId(request.embeddedClientId || request.tokenBodyParameters?.client_id || this.config.authOptions.clientId), 
    this.includeRedirectUri ? parameterBuilder.addRedirectUri(request.redirectUri) : RequestValidator.validateRedirectUri(request.redirectUri), 
    parameterBuilder.addScopes(request.scopes, !0, this.oidcDefaultScopes), parameterBuilder.addAuthorizationCode(request.code), 
    parameterBuilder.addLibraryInfo(this.config.libraryInfo), parameterBuilder.addApplicationTelemetry(this.config.telemetry.application), 
    parameterBuilder.addThrottling(), this.serverTelemetryManager && !isOidcProtocolMode(this.config) && parameterBuilder.addServerTelemetry(this.serverTelemetryManager), 
    request.codeVerifier && parameterBuilder.addCodeVerifier(request.codeVerifier), 
    this.config.clientCredentials.clientSecret && parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret), 
    this.config.clientCredentials.clientAssertion) {
      const clientAssertion = this.config.clientCredentials.clientAssertion;
      parameterBuilder.addClientAssertion(await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri)), 
      parameterBuilder.addClientAssertionType(clientAssertion.assertionType);
    }
    if (parameterBuilder.addGrantType(GrantType_AUTHORIZATION_CODE_GRANT), parameterBuilder.addClientInfo(), 
    request.authenticationScheme === AuthenticationScheme.POP) {
      const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.performanceClient);
      let reqCnfData;
      if (request.popKid) {
        reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
      } else {
        reqCnfData = (await invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PerformanceEvents_PopTokenGenerateCnf, this.logger, this.performanceClient, request.correlationId)(request, this.logger)).reqCnfString;
      }
      parameterBuilder.addPopToken(reqCnfData);
    } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
      if (!request.sshJwk) {
        throw createClientConfigurationError("missing_ssh_jwk");
      }
      parameterBuilder.addSshJwk(request.sshJwk);
    }
    let ccsCred;
    if ((!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) && parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities), 
    request.clientInfo) {
      try {
        const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
        ccsCred = {
          credential: `${clientInfo.uid}${Separators_CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
          type: CcsCredentialType_HOME_ACCOUNT_ID
        };
      } catch (e) {
        this.logger.verbose("Could not parse client info for CCS Header: " + e);
      }
    } else {
      ccsCred = request.ccsCredential;
    }
    if (this.config.systemOptions.preventCorsPreflight && ccsCred) {
      switch (ccsCred.type) {
       case CcsCredentialType_HOME_ACCOUNT_ID:
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
          parameterBuilder.addCcsOid(clientInfo);
        } catch (e) {
          this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
        }
        break;

       case CcsCredentialType_UPN:
        parameterBuilder.addCcsUpn(ccsCred.credential);
      }
    }
    return request.embeddedClientId && parameterBuilder.addBrokerParameters({
      brokerClientId: this.config.authOptions.clientId,
      brokerRedirectUri: this.config.authOptions.redirectUri
    }), request.tokenBodyParameters && parameterBuilder.addExtraQueryParameters(request.tokenBodyParameters), 
    !request.enableSpaAuthorizationCode || request.tokenBodyParameters && request.tokenBodyParameters.return_spa_code || parameterBuilder.addExtraQueryParameters({
      [RETURN_SPA_CODE]: "1"
    }), parameterBuilder.createQueryString();
  }
  async createAuthCodeUrlQueryString(request) {
    const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_AuthClientCreateQueryString, correlationId);
    const parameterBuilder = new RequestParameterBuilder(correlationId, this.performanceClient);
    parameterBuilder.addClientId(request.embeddedClientId || request.extraQueryParameters?.client_id || this.config.authOptions.clientId);
    const requestScopes = [ ...request.scopes || [], ...request.extraScopesToConsent || [] ];
    if (parameterBuilder.addScopes(requestScopes, !0, this.oidcDefaultScopes), parameterBuilder.addRedirectUri(request.redirectUri), 
    parameterBuilder.addCorrelationId(correlationId), parameterBuilder.addResponseMode(request.responseMode), 
    parameterBuilder.addResponseTypeCode(), parameterBuilder.addLibraryInfo(this.config.libraryInfo), 
    isOidcProtocolMode(this.config) || parameterBuilder.addApplicationTelemetry(this.config.telemetry.application), 
    parameterBuilder.addClientInfo(), request.codeChallenge && request.codeChallengeMethod && parameterBuilder.addCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod), 
    request.prompt && parameterBuilder.addPrompt(request.prompt), request.domainHint && parameterBuilder.addDomainHint(request.domainHint), 
    request.prompt !== PromptValue.SELECT_ACCOUNT) {
      if (request.sid && request.prompt === PromptValue.NONE) {
        this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from request"), 
        parameterBuilder.addSid(request.sid);
      } else if (request.account) {
        const accountSid = this.extractAccountSid(request.account);
        let accountLoginHintClaim = this.extractLoginHint(request.account);
        if (accountLoginHintClaim && request.domainHint && (this.logger.warning('AuthorizationCodeClient.createAuthCodeUrlQueryString: "domainHint" param is set, skipping opaque "login_hint" claim. Please consider not passing domainHint'), 
        accountLoginHintClaim = null), accountLoginHintClaim) {
          this.logger.verbose("createAuthCodeUrlQueryString: login_hint claim present on account"), 
          parameterBuilder.addLoginHint(accountLoginHintClaim);
          try {
            const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
            parameterBuilder.addCcsOid(clientInfo);
          } catch (e) {
            this.logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header");
          }
        } else if (accountSid && request.prompt === PromptValue.NONE) {
          this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from account"), 
          parameterBuilder.addSid(accountSid);
          try {
            const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
            parameterBuilder.addCcsOid(clientInfo);
          } catch (e) {
            this.logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header");
          }
        } else if (request.loginHint) {
          this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from request"), 
          parameterBuilder.addLoginHint(request.loginHint), parameterBuilder.addCcsUpn(request.loginHint);
        } else if (request.account.username) {
          this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from account"), 
          parameterBuilder.addLoginHint(request.account.username);
          try {
            const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
            parameterBuilder.addCcsOid(clientInfo);
          } catch (e) {
            this.logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header");
          }
        }
      } else {
        request.loginHint && (this.logger.verbose("createAuthCodeUrlQueryString: No account, adding login_hint from request"), 
        parameterBuilder.addLoginHint(request.loginHint), parameterBuilder.addCcsUpn(request.loginHint));
      }
    } else {
      this.logger.verbose("createAuthCodeUrlQueryString: Prompt is select_account, ignoring account hints");
    }
    if (request.nonce && parameterBuilder.addNonce(request.nonce), request.state && parameterBuilder.addState(request.state), 
    (request.claims || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) && parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities), 
    request.embeddedClientId && parameterBuilder.addBrokerParameters({
      brokerClientId: this.config.authOptions.clientId,
      brokerRedirectUri: this.config.authOptions.redirectUri
    }), this.addExtraQueryParams(request, parameterBuilder), request.nativeBroker && (parameterBuilder.addNativeBroker(), 
    request.authenticationScheme === AuthenticationScheme.POP)) {
      const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
      let reqCnfData;
      if (request.popKid) {
        reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
      } else {
        reqCnfData = (await invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PerformanceEvents_PopTokenGenerateCnf, this.logger, this.performanceClient, request.correlationId)(request, this.logger)).reqCnfString;
      }
      parameterBuilder.addPopToken(reqCnfData);
    }
    return parameterBuilder.createQueryString();
  }
  createLogoutUrlQueryString(request) {
    const parameterBuilder = new RequestParameterBuilder(request.correlationId, this.performanceClient);
    return request.postLogoutRedirectUri && parameterBuilder.addPostLogoutRedirectUri(request.postLogoutRedirectUri), 
    request.correlationId && parameterBuilder.addCorrelationId(request.correlationId), 
    request.idTokenHint && parameterBuilder.addIdTokenHint(request.idTokenHint), request.state && parameterBuilder.addState(request.state), 
    request.logoutHint && parameterBuilder.addLogoutHint(request.logoutHint), this.addExtraQueryParams(request, parameterBuilder), 
    parameterBuilder.createQueryString();
  }
  addExtraQueryParams(request, parameterBuilder) {
    !(request.extraQueryParameters && request.extraQueryParameters.hasOwnProperty("instance_aware")) && this.config.authOptions.instanceAware && (request.extraQueryParameters = request.extraQueryParameters || {}, 
    request.extraQueryParameters.instance_aware = "true"), request.extraQueryParameters && parameterBuilder.addExtraQueryParameters(request.extraQueryParameters);
  }
  extractAccountSid(account) {
    return account.idTokenClaims?.sid || null;
  }
  extractLoginHint(account) {
    return account.idTokenClaims?.login_hint || null;
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class RefreshTokenClient extends BaseClient {
  constructor(configuration, performanceClient) {
    super(configuration, performanceClient);
  }
  async acquireToken(request) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_RefreshTokenClientAcquireToken, request.correlationId);
    const reqTimestamp = nowSeconds(), response = await invokeAsync(this.executeTokenRequest.bind(this), PerformanceEvents_RefreshTokenClientExecuteTokenRequest, this.logger, this.performanceClient, request.correlationId)(request, this.authority), requestId = response.headers?.[HeaderNames_X_MS_REQUEST_ID], responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin);
    return responseHandler.validateTokenResponse(response.body), invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), PerformanceEvents_HandleServerTokenResponse, this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, void 0, void 0, !0, request.forceCache, requestId);
  }
  async acquireTokenByRefreshToken(request) {
    if (!request) {
      throw createClientConfigurationError("token_request_empty");
    }
    if (this.performanceClient?.addQueueMeasurement(PerformanceEvents_RefreshTokenClientAcquireTokenByRefreshToken, request.correlationId), 
    !request.account) {
      throw createClientAuthError("no_account_in_silent_request");
    }
    if (this.cacheManager.isAppMetadataFOCI(request.account.environment)) {
      try {
        return await invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), PerformanceEvents_RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, !0);
      } catch (e) {
        const noFamilyRTInCache = e instanceof InteractionRequiredAuthError && "no_tokens_found" === e.errorCode, clientMismatchErrorWithFamilyRT = e instanceof ServerError && e.errorCode === Errors_INVALID_GRANT_ERROR && e.subError === Errors_CLIENT_MISMATCH_ERROR;
        if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
          return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), PerformanceEvents_RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, !1);
        }
        throw e;
      }
    }
    return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), PerformanceEvents_RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, !1);
  }
  async acquireTokenWithCachedRefreshToken(request, foci) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_RefreshTokenClientAcquireTokenWithCachedRefreshToken, request.correlationId);
    const refreshToken = (callback = this.cacheManager.getRefreshToken.bind(this.cacheManager), 
    eventName = PerformanceEvents_CacheManagerGetRefreshToken, logger = this.logger, 
    telemetryClient = this.performanceClient, correlationId = request.correlationId, 
    (...args) => {
      logger.trace(`Executing function ${eventName}`);
      const inProgressEvent = telemetryClient?.startMeasurement(eventName, correlationId);
      if (correlationId) {
        const eventCount = eventName + "CallCount";
        telemetryClient?.incrementFields({
          [eventCount]: 1
        }, correlationId);
      }
      try {
        const result = callback(...args);
        return inProgressEvent?.end({
          success: !0
        }), logger.trace(`Returning result from ${eventName}`), result;
      } catch (e) {
        logger.trace(`Error occurred in ${eventName}`);
        try {
          logger.trace(JSON.stringify(e));
        } catch (e) {
          logger.trace("Unable to print error message.");
        }
        throw inProgressEvent?.end({
          success: !1
        }, e), e;
      }
    })(request.account, foci, void 0, this.performanceClient, request.correlationId);
    var callback, eventName, logger, telemetryClient, correlationId;
    if (!refreshToken) {
      throw createInteractionRequiredAuthError("no_tokens_found");
    }
    if (refreshToken.expiresOn && isTokenExpired(refreshToken.expiresOn, request.refreshTokenExpirationOffsetSeconds || 300)) {
      throw createInteractionRequiredAuthError("refresh_token_expired");
    }
    const refreshTokenRequest = {
      ...request,
      refreshToken: refreshToken.secret,
      authenticationScheme: request.authenticationScheme || AuthenticationScheme.BEARER,
      ccsCredential: {
        credential: request.account.homeAccountId,
        type: CcsCredentialType_HOME_ACCOUNT_ID
      }
    };
    try {
      return await invokeAsync(this.acquireToken.bind(this), PerformanceEvents_RefreshTokenClientAcquireToken, this.logger, this.performanceClient, request.correlationId)(refreshTokenRequest);
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError && "bad_token" === e.subError) {
        this.logger.verbose("acquireTokenWithRefreshToken: bad refresh token, removing from cache");
        const badRefreshTokenKey = generateCredentialKey(refreshToken);
        this.cacheManager.removeRefreshToken(badRefreshTokenKey);
      }
      throw e;
    }
  }
  async executeTokenRequest(request, authority) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_RefreshTokenClientExecuteTokenRequest, request.correlationId);
    const queryParametersString = this.createTokenQueryParameters(request), endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString), requestBody = await invokeAsync(this.createTokenRequestBody.bind(this), PerformanceEvents_RefreshTokenClientCreateTokenRequestBody, this.logger, this.performanceClient, request.correlationId)(request), headers = this.createTokenRequestHeaders(request.ccsCredential), thumbprint = {
      clientId: request.tokenBodyParameters?.clientId || this.config.authOptions.clientId,
      authority: authority.canonicalAuthority,
      scopes: request.scopes,
      claims: request.claims,
      authenticationScheme: request.authenticationScheme,
      resourceRequestMethod: request.resourceRequestMethod,
      resourceRequestUri: request.resourceRequestUri,
      shrClaims: request.shrClaims,
      sshKid: request.sshKid
    };
    return invokeAsync(this.executePostToTokenEndpoint.bind(this), PerformanceEvents_RefreshTokenClientExecutePostToTokenEndpoint, this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody, headers, thumbprint, request.correlationId, PerformanceEvents_RefreshTokenClientExecutePostToTokenEndpoint);
  }
  async createTokenRequestBody(request) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_RefreshTokenClientCreateTokenRequestBody, request.correlationId);
    const correlationId = request.correlationId, parameterBuilder = new RequestParameterBuilder(correlationId, this.performanceClient);
    if (parameterBuilder.addClientId(request.embeddedClientId || request.tokenBodyParameters?.client_id || this.config.authOptions.clientId), 
    request.redirectUri && parameterBuilder.addRedirectUri(request.redirectUri), parameterBuilder.addScopes(request.scopes, !0, this.config.authOptions.authority.options.OIDCOptions?.defaultScopes), 
    parameterBuilder.addGrantType(GrantType_REFRESH_TOKEN_GRANT), parameterBuilder.addClientInfo(), 
    parameterBuilder.addLibraryInfo(this.config.libraryInfo), parameterBuilder.addApplicationTelemetry(this.config.telemetry.application), 
    parameterBuilder.addThrottling(), this.serverTelemetryManager && !isOidcProtocolMode(this.config) && parameterBuilder.addServerTelemetry(this.serverTelemetryManager), 
    parameterBuilder.addRefreshToken(request.refreshToken), this.config.clientCredentials.clientSecret && parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret), 
    this.config.clientCredentials.clientAssertion) {
      const clientAssertion = this.config.clientCredentials.clientAssertion;
      parameterBuilder.addClientAssertion(await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri)), 
      parameterBuilder.addClientAssertionType(clientAssertion.assertionType);
    }
    if (request.authenticationScheme === AuthenticationScheme.POP) {
      const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.performanceClient);
      let reqCnfData;
      if (request.popKid) {
        reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
      } else {
        reqCnfData = (await invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PerformanceEvents_PopTokenGenerateCnf, this.logger, this.performanceClient, request.correlationId)(request, this.logger)).reqCnfString;
      }
      parameterBuilder.addPopToken(reqCnfData);
    } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
      if (!request.sshJwk) {
        throw createClientConfigurationError("missing_ssh_jwk");
      }
      parameterBuilder.addSshJwk(request.sshJwk);
    }
    if ((!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) && parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities), 
    this.config.systemOptions.preventCorsPreflight && request.ccsCredential) {
      switch (request.ccsCredential.type) {
       case CcsCredentialType_HOME_ACCOUNT_ID:
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(request.ccsCredential.credential);
          parameterBuilder.addCcsOid(clientInfo);
        } catch (e) {
          this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
        }
        break;

       case CcsCredentialType_UPN:
        parameterBuilder.addCcsUpn(request.ccsCredential.credential);
      }
    }
    return request.embeddedClientId && parameterBuilder.addBrokerParameters({
      brokerClientId: this.config.authOptions.clientId,
      brokerRedirectUri: this.config.authOptions.redirectUri
    }), request.tokenBodyParameters && parameterBuilder.addExtraQueryParameters(request.tokenBodyParameters), 
    parameterBuilder.createQueryString();
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ class SilentFlowClient extends BaseClient {
  constructor(configuration, performanceClient) {
    super(configuration, performanceClient);
  }
  async acquireToken(request) {
    try {
      const [authResponse, cacheOutcome] = await this.acquireCachedToken({
        ...request,
        scopes: request.scopes?.length ? request.scopes : [ ...OIDC_DEFAULT_SCOPES ]
      });
      if (cacheOutcome === CacheOutcome_PROACTIVELY_REFRESHED) {
        this.logger.info("SilentFlowClient:acquireCachedToken - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed.");
        new RefreshTokenClient(this.config, this.performanceClient).acquireTokenByRefreshToken(request).catch(() => {});
      }
      return authResponse;
    } catch (e) {
      if (e instanceof ClientAuthError && "token_refresh_required" === e.errorCode) {
        return new RefreshTokenClient(this.config, this.performanceClient).acquireTokenByRefreshToken(request);
      }
      throw e;
    }
  }
  async acquireCachedToken(request) {
    this.performanceClient?.addQueueMeasurement(PerformanceEvents_SilentFlowClientAcquireCachedToken, request.correlationId);
    let lastCacheOutcome = CacheOutcome_NOT_APPLICABLE;
    if (request.forceRefresh || !this.config.cacheOptions.claimsBasedCachingEnabled && !StringUtils.isEmptyObj(request.claims)) {
      throw this.setCacheOutcome(CacheOutcome_FORCE_REFRESH_OR_CLAIMS, request.correlationId), 
      createClientAuthError("token_refresh_required");
    }
    if (!request.account) {
      throw createClientAuthError("no_account_in_silent_request");
    }
    const requestTenantId = request.account.tenantId || function(authority) {
      const authorityUrlComponents = new UrlString(authority).getUrlComponents(), tenantId = authorityUrlComponents.PathSegments.slice(-1)[0]?.toLowerCase();
      switch (tenantId) {
       case AADAuthorityConstants_COMMON:
       case AADAuthorityConstants_ORGANIZATIONS:
       case AADAuthorityConstants_CONSUMERS:
        return;

       default:
        return tenantId;
      }
    }(request.authority), tokenKeys = this.cacheManager.getTokenKeys(), cachedAccessToken = this.cacheManager.getAccessToken(request.account, request, tokenKeys, requestTenantId, this.performanceClient, request.correlationId);
    if (!cachedAccessToken) {
      throw this.setCacheOutcome(CacheOutcome_NO_CACHED_ACCESS_TOKEN, request.correlationId), 
      createClientAuthError("token_refresh_required");
    }
    if (cachedAt = cachedAccessToken.cachedAt, Number(cachedAt) > nowSeconds() || isTokenExpired(cachedAccessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
      throw this.setCacheOutcome(CacheOutcome_CACHED_ACCESS_TOKEN_EXPIRED, request.correlationId), 
      createClientAuthError("token_refresh_required");
    }
    var cachedAt;
    cachedAccessToken.refreshOn && isTokenExpired(cachedAccessToken.refreshOn, 0) && (lastCacheOutcome = CacheOutcome_PROACTIVELY_REFRESHED);
    const environment = request.authority || this.authority.getPreferredCache(), cacheRecord = {
      account: this.cacheManager.readAccountFromCache(request.account),
      accessToken: cachedAccessToken,
      idToken: this.cacheManager.getIdToken(request.account, tokenKeys, requestTenantId, this.performanceClient, request.correlationId),
      refreshToken: null,
      appMetadata: this.cacheManager.readAppMetadataFromCache(environment)
    };
    return this.setCacheOutcome(lastCacheOutcome, request.correlationId), this.config.serverTelemetryManager && this.config.serverTelemetryManager.incrementCacheHits(), 
    [ await invokeAsync(this.generateResultFromCacheRecord.bind(this), PerformanceEvents_SilentFlowClientGenerateResultFromCacheRecord, this.logger, this.performanceClient, request.correlationId)(cacheRecord, request), lastCacheOutcome ];
  }
  setCacheOutcome(cacheOutcome, correlationId) {
    this.serverTelemetryManager?.setCacheOutcome(cacheOutcome), this.performanceClient?.addFields({
      cacheOutcome: cacheOutcome
    }, correlationId), cacheOutcome !== CacheOutcome_NOT_APPLICABLE && this.logger.info(`Token refresh is required due to cache outcome: ${cacheOutcome}`);
  }
  async generateResultFromCacheRecord(cacheRecord, request) {
    let idTokenClaims;
    if (this.performanceClient?.addQueueMeasurement(PerformanceEvents_SilentFlowClientGenerateResultFromCacheRecord, request.correlationId), 
    cacheRecord.idToken && (idTokenClaims = extractTokenClaims(cacheRecord.idToken.secret, this.config.cryptoInterface.base64Decode)), 
    request.maxAge || 0 === request.maxAge) {
      const authTime = idTokenClaims?.auth_time;
      if (!authTime) {
        throw createClientAuthError("auth_time_not_found");
      }
      checkMaxAge(authTime, request.maxAge);
    }
    return ResponseHandler.generateAuthenticationResult(this.cryptoUtils, this.authority, cacheRecord, !0, request, idTokenClaims);
  }
}

/*! @azure/msal-common v14.16.0 2024-11-05 */ function makeExtraSkuString(params) {
  const {skus: skus, libraryName: libraryName, libraryVersion: libraryVersion, extensionName: extensionName, extensionVersion: extensionVersion} = params, skuMap = new Map([ [ 0, [ libraryName, libraryVersion ] ], [ 2, [ extensionName, extensionVersion ] ] ]);
  let skuArr = [];
  if (skus?.length) {
    if (skuArr = skus.split(","), skuArr.length < 4) {
      return skus;
    }
  } else {
    skuArr = Array.from({
      length: 4
    }, () => "|");
  }
  return skuMap.forEach((value, key) => {
    2 === value.length && value[0]?.length && value[1]?.length && function(params) {
      const {skuArr: skuArr, index: index, skuName: skuName, skuVersion: skuVersion} = params;
      if (index >= skuArr.length) {
        return;
      }
      skuArr[index] = [ skuName, skuVersion ].join("|");
    }({
      skuArr: skuArr,
      index: key,
      skuName: value[0],
      skuVersion: value[1]
    });
  }), skuArr.join(",");
}

class ServerTelemetryManager {
  constructor(telemetryRequest, cacheManager) {
    this.cacheOutcome = CacheOutcome_NOT_APPLICABLE, this.cacheManager = cacheManager, 
    this.apiId = telemetryRequest.apiId, this.correlationId = telemetryRequest.correlationId, 
    this.wrapperSKU = telemetryRequest.wrapperSKU || Constants$2.EMPTY_STRING, this.wrapperVer = telemetryRequest.wrapperVer || Constants$2.EMPTY_STRING, 
    this.telemetryCacheKey = SERVER_TELEM_CONSTANTS.CACHE_KEY + Separators_CACHE_KEY_SEPARATOR + telemetryRequest.clientId;
  }
  generateCurrentRequestHeaderValue() {
    const request = `${this.apiId}${SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR}${this.cacheOutcome}`, platformFieldsArr = [ this.wrapperSKU, this.wrapperVer ], nativeBrokerErrorCode = this.getNativeBrokerErrorCode();
    nativeBrokerErrorCode?.length && platformFieldsArr.push(`broker_error=${nativeBrokerErrorCode}`);
    const platformFields = platformFieldsArr.join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR), requestWithRegionDiscoveryFields = [ request, this.getRegionDiscoveryFields() ].join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
    return [ SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, requestWithRegionDiscoveryFields, platformFields ].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
  }
  generateLastRequestHeaderValue() {
    const lastRequests = this.getLastRequests(), maxErrors = ServerTelemetryManager.maxErrorsToSend(lastRequests), failedRequests = lastRequests.failedRequests.slice(0, 2 * maxErrors).join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR), errors = lastRequests.errors.slice(0, maxErrors).join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR), errorCount = lastRequests.errors.length, platformFields = [ errorCount, maxErrors < errorCount ? SERVER_TELEM_CONSTANTS.OVERFLOW_TRUE : SERVER_TELEM_CONSTANTS.OVERFLOW_FALSE ].join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
    return [ SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, lastRequests.cacheHits, failedRequests, errors, platformFields ].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
  }
  cacheFailedRequest(error) {
    const lastRequests = this.getLastRequests();
    lastRequests.errors.length >= SERVER_TELEM_CONSTANTS.MAX_CACHED_ERRORS && (lastRequests.failedRequests.shift(), 
    lastRequests.failedRequests.shift(), lastRequests.errors.shift()), lastRequests.failedRequests.push(this.apiId, this.correlationId), 
    error instanceof Error && error && error.toString() ? error instanceof AuthError ? error.subError ? lastRequests.errors.push(error.subError) : error.errorCode ? lastRequests.errors.push(error.errorCode) : lastRequests.errors.push(error.toString()) : lastRequests.errors.push(error.toString()) : lastRequests.errors.push(SERVER_TELEM_CONSTANTS.UNKNOWN_ERROR), 
    this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests);
  }
  incrementCacheHits() {
    const lastRequests = this.getLastRequests();
    return lastRequests.cacheHits += 1, this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests), 
    lastRequests.cacheHits;
  }
  getLastRequests() {
    return this.cacheManager.getServerTelemetry(this.telemetryCacheKey) || {
      failedRequests: [],
      errors: [],
      cacheHits: 0
    };
  }
  clearTelemetryCache() {
    const lastRequests = this.getLastRequests(), numErrorsFlushed = ServerTelemetryManager.maxErrorsToSend(lastRequests);
    if (numErrorsFlushed === lastRequests.errors.length) {
      this.cacheManager.removeItem(this.telemetryCacheKey);
    } else {
      const serverTelemEntity = {
        failedRequests: lastRequests.failedRequests.slice(2 * numErrorsFlushed),
        errors: lastRequests.errors.slice(numErrorsFlushed),
        cacheHits: 0
      };
      this.cacheManager.setServerTelemetry(this.telemetryCacheKey, serverTelemEntity);
    }
  }
  static maxErrorsToSend(serverTelemetryEntity) {
    let i, maxErrors = 0, dataSize = 0;
    const errorCount = serverTelemetryEntity.errors.length;
    for (i = 0; i < errorCount; i++) {
      const apiId = serverTelemetryEntity.failedRequests[2 * i] || Constants$2.EMPTY_STRING, correlationId = serverTelemetryEntity.failedRequests[2 * i + 1] || Constants$2.EMPTY_STRING, errorCode = serverTelemetryEntity.errors[i] || Constants$2.EMPTY_STRING;
      if (dataSize += apiId.toString().length + correlationId.toString().length + errorCode.length + 3, 
      !(dataSize < SERVER_TELEM_CONSTANTS.MAX_LAST_HEADER_BYTES)) {
        break;
      }
      maxErrors += 1;
    }
    return maxErrors;
  }
  getRegionDiscoveryFields() {
    const regionDiscoveryFields = [];
    return regionDiscoveryFields.push(this.regionUsed || Constants$2.EMPTY_STRING), 
    regionDiscoveryFields.push(this.regionSource || Constants$2.EMPTY_STRING), regionDiscoveryFields.push(this.regionOutcome || Constants$2.EMPTY_STRING), 
    regionDiscoveryFields.join(",");
  }
  updateRegionDiscoveryMetadata(regionDiscoveryMetadata) {
    this.regionUsed = regionDiscoveryMetadata.region_used, this.regionSource = regionDiscoveryMetadata.region_source, 
    this.regionOutcome = regionDiscoveryMetadata.region_outcome;
  }
  setCacheOutcome(cacheOutcome) {
    this.cacheOutcome = cacheOutcome;
  }
  setNativeBrokerErrorCode(errorCode) {
    const lastRequests = this.getLastRequests();
    lastRequests.nativeBrokerErrorCode = errorCode, this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests);
  }
  getNativeBrokerErrorCode() {
    return this.getLastRequests().nativeBrokerErrorCode;
  }
  clearNativeBrokerErrorCode() {
    const lastRequests = this.getLastRequests();
    delete lastRequests.nativeBrokerErrorCode, this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests);
  }
  static makeExtraSkuString(params) {
    return makeExtraSkuString(params);
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class Deserializer {
  static deserializeJSONBlob(jsonFile) {
    return jsonFile ? JSON.parse(jsonFile) : {};
  }
  static deserializeAccounts(accounts) {
    const accountObjects = {};
    return accounts && Object.keys(accounts).map(function(key) {
      const serializedAcc = accounts[key], mappedAcc = {
        homeAccountId: serializedAcc.home_account_id,
        environment: serializedAcc.environment,
        realm: serializedAcc.realm,
        localAccountId: serializedAcc.local_account_id,
        username: serializedAcc.username,
        authorityType: serializedAcc.authority_type,
        name: serializedAcc.name,
        clientInfo: serializedAcc.client_info,
        lastModificationTime: serializedAcc.last_modification_time,
        lastModificationApp: serializedAcc.last_modification_app,
        tenantProfiles: serializedAcc.tenantProfiles?.map(serializedTenantProfile => JSON.parse(serializedTenantProfile))
      }, account = new AccountEntity;
      CacheManager.toObject(account, mappedAcc), accountObjects[key] = account;
    }), accountObjects;
  }
  static deserializeIdTokens(idTokens) {
    const idObjects = {};
    return idTokens && Object.keys(idTokens).map(function(key) {
      const serializedIdT = idTokens[key], idToken = {
        homeAccountId: serializedIdT.home_account_id,
        environment: serializedIdT.environment,
        credentialType: serializedIdT.credential_type,
        clientId: serializedIdT.client_id,
        secret: serializedIdT.secret,
        realm: serializedIdT.realm
      };
      idObjects[key] = idToken;
    }), idObjects;
  }
  static deserializeAccessTokens(accessTokens) {
    const atObjects = {};
    return accessTokens && Object.keys(accessTokens).map(function(key) {
      const serializedAT = accessTokens[key], accessToken = {
        homeAccountId: serializedAT.home_account_id,
        environment: serializedAT.environment,
        credentialType: serializedAT.credential_type,
        clientId: serializedAT.client_id,
        secret: serializedAT.secret,
        realm: serializedAT.realm,
        target: serializedAT.target,
        cachedAt: serializedAT.cached_at,
        expiresOn: serializedAT.expires_on,
        extendedExpiresOn: serializedAT.extended_expires_on,
        refreshOn: serializedAT.refresh_on,
        keyId: serializedAT.key_id,
        tokenType: serializedAT.token_type,
        requestedClaims: serializedAT.requestedClaims,
        requestedClaimsHash: serializedAT.requestedClaimsHash,
        userAssertionHash: serializedAT.userAssertionHash
      };
      atObjects[key] = accessToken;
    }), atObjects;
  }
  static deserializeRefreshTokens(refreshTokens) {
    const rtObjects = {};
    return refreshTokens && Object.keys(refreshTokens).map(function(key) {
      const serializedRT = refreshTokens[key], refreshToken = {
        homeAccountId: serializedRT.home_account_id,
        environment: serializedRT.environment,
        credentialType: serializedRT.credential_type,
        clientId: serializedRT.client_id,
        secret: serializedRT.secret,
        familyId: serializedRT.family_id,
        target: serializedRT.target,
        realm: serializedRT.realm
      };
      rtObjects[key] = refreshToken;
    }), rtObjects;
  }
  static deserializeAppMetadata(appMetadata) {
    const appMetadataObjects = {};
    return appMetadata && Object.keys(appMetadata).map(function(key) {
      const serializedAmdt = appMetadata[key];
      appMetadataObjects[key] = {
        clientId: serializedAmdt.client_id,
        environment: serializedAmdt.environment,
        familyId: serializedAmdt.family_id
      };
    }), appMetadataObjects;
  }
  static deserializeAllCache(jsonCache) {
    return {
      accounts: jsonCache.Account ? this.deserializeAccounts(jsonCache.Account) : {},
      idTokens: jsonCache.IdToken ? this.deserializeIdTokens(jsonCache.IdToken) : {},
      accessTokens: jsonCache.AccessToken ? this.deserializeAccessTokens(jsonCache.AccessToken) : {},
      refreshTokens: jsonCache.RefreshToken ? this.deserializeRefreshTokens(jsonCache.RefreshToken) : {},
      appMetadata: jsonCache.AppMetadata ? this.deserializeAppMetadata(jsonCache.AppMetadata) : {}
    };
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ const HttpMethod_GET = "get", HttpMethod_POST = "post", ProxyStatus = {
  SUCCESS_RANGE_START: HttpStatus_SUCCESS_RANGE_START,
  SUCCESS_RANGE_END: HttpStatus_SUCCESS_RANGE_END,
  SERVER_ERROR: HttpStatus_SERVER_ERROR
}, Hash_SHA256 = "sha256", CharSet_CV_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", Constants$1_MSAL_SKU = "msal.js.node", Constants$1_JWT_BEARER_ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer", Constants$1_AUTHORIZATION_PENDING = "authorization_pending", Constants$1_HTTP_PROTOCOL = "http://", Constants$1_LOCALHOST = "localhost", ApiId_acquireTokenSilent = 62, ApiId_acquireTokenByUsernamePassword = 371, ApiId_acquireTokenByDeviceCode = 671, ApiId_acquireTokenByCode = 871, ApiId_acquireTokenByRefreshToken = 872, JwtConstants_RSA_256 = "RS256", JwtConstants_PSS_256 = "PS256", JwtConstants_X5T_256 = "x5t#S256", JwtConstants_X5T = "x5t", JwtConstants_X5C = "x5c", JwtConstants_AUDIENCE = "aud", JwtConstants_EXPIRATION_TIME = "exp", JwtConstants_ISSUER = "iss", JwtConstants_SUBJECT = "sub", JwtConstants_NOT_BEFORE = "nbf", JwtConstants_JWT_ID = "jti", LOOPBACK_SERVER_CONSTANTS_INTERVAL_MS = 100, LOOPBACK_SERVER_CONSTANTS_TIMEOUT_MS = 5e3;

/*! @azure/msal-node v2.16.2 2024-11-19 */
class NetworkUtils {
  static getNetworkResponse(headers, body, statusCode) {
    return {
      headers: headers,
      body: body,
      status: statusCode
    };
  }
  static urlToHttpOptions(url) {
    const options = {
      protocol: url.protocol,
      hostname: url.hostname && url.hostname.startsWith("[") ? url.hostname.slice(1, -1) : url.hostname,
      hash: url.hash,
      search: url.search,
      pathname: url.pathname,
      path: `${url.pathname || ""}${url.search || ""}`,
      href: url.href
    };
    return "" !== url.port && (options.port = Number(url.port)), (url.username || url.password) && (options.auth = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`), 
    options;
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class HttpClient {
  constructor(proxyUrl, customAgentOptions) {
    this.proxyUrl = proxyUrl || "", this.customAgentOptions = customAgentOptions || {};
  }
  async sendGetRequestAsync(url, options, timeout) {
    return this.proxyUrl ? networkRequestViaProxy(url, this.proxyUrl, HttpMethod_GET, options, this.customAgentOptions, timeout) : networkRequestViaHttps(url, HttpMethod_GET, options, this.customAgentOptions, timeout);
  }
  async sendPostRequestAsync(url, options) {
    return this.proxyUrl ? networkRequestViaProxy(url, this.proxyUrl, HttpMethod_POST, options, this.customAgentOptions) : networkRequestViaHttps(url, HttpMethod_POST, options, this.customAgentOptions);
  }
}

const networkRequestViaProxy = (destinationUrlString, proxyUrlString, httpMethod, options, agentOptions, timeout) => {
  const destinationUrl = new URL(destinationUrlString), proxyUrl = new URL(proxyUrlString), headers = options?.headers || {}, tunnelRequestOptions = {
    host: proxyUrl.hostname,
    port: proxyUrl.port,
    method: "CONNECT",
    path: destinationUrl.hostname,
    headers: headers
  };
  agentOptions && Object.keys(agentOptions).length && (tunnelRequestOptions.agent = new http.Agent(agentOptions));
  let postRequestStringContent = "";
  if (httpMethod === HttpMethod_POST) {
    const body = options?.body || "";
    postRequestStringContent = `Content-Type: application/x-www-form-urlencoded\r\nContent-Length: ${body.length}\r\n\r\n${body}`;
  } else {
    timeout && (tunnelRequestOptions.timeout = timeout);
  }
  const outgoingRequestString = `${httpMethod.toUpperCase()} ${destinationUrl.href} HTTP/1.1\r\nHost: ${destinationUrl.host}\r\nConnection: close\r\n` + postRequestStringContent + "\r\n";
  return new Promise((resolve, reject) => {
    const request = http.request(tunnelRequestOptions);
    timeout && request.on("timeout", () => {
      request.destroy(), reject(new Error("Request time out"));
    }), request.end(), request.on("connect", (response, socket) => {
      const proxyStatusCode = response?.statusCode || ProxyStatus.SERVER_ERROR;
      (proxyStatusCode < ProxyStatus.SUCCESS_RANGE_START || proxyStatusCode > ProxyStatus.SUCCESS_RANGE_END) && (request.destroy(), 
      socket.destroy(), reject(new Error(`Error connecting to proxy. Http status code: ${response.statusCode}. Http status message: ${response?.statusMessage || "Unknown"}`))), 
      socket.write(outgoingRequestString);
      const data = [];
      socket.on("data", chunk => {
        data.push(chunk);
      }), socket.on("end", () => {
        const dataStringArray = Buffer.concat([ ...data ]).toString().split("\r\n"), httpStatusCode = parseInt(dataStringArray[0].split(" ")[1]), statusMessage = dataStringArray[0].split(" ").slice(2).join(" "), body = dataStringArray[dataStringArray.length - 1], headersArray = dataStringArray.slice(1, dataStringArray.length - 2), entries = new Map;
        headersArray.forEach(header => {
          const headerKeyValue = header.split(new RegExp(/:\s(.*)/s)), headerKey = headerKeyValue[0];
          let headerValue = headerKeyValue[1];
          try {
            const object = JSON.parse(headerValue);
            object && "object" == typeof object && (headerValue = object);
          } catch (e) {}
          entries.set(headerKey, headerValue);
        });
        const parsedHeaders = Object.fromEntries(entries), networkResponse = NetworkUtils.getNetworkResponse(parsedHeaders, parseBody(httpStatusCode, statusMessage, parsedHeaders, body), httpStatusCode);
        (httpStatusCode < HttpStatus_SUCCESS_RANGE_START || httpStatusCode > HttpStatus_SUCCESS_RANGE_END) && networkResponse.body.error !== Constants$1_AUTHORIZATION_PENDING && request.destroy(), 
        resolve(networkResponse);
      }), socket.on("error", chunk => {
        request.destroy(), socket.destroy(), reject(new Error(chunk.toString()));
      });
    }), request.on("error", chunk => {
      request.destroy(), reject(new Error(chunk.toString()));
    });
  });
}, networkRequestViaHttps = (urlString, httpMethod, options, agentOptions, timeout) => {
  const isPostRequest = httpMethod === HttpMethod_POST, body = options?.body || "", url = new URL(urlString), customOptions = {
    method: httpMethod,
    headers: options?.headers || {},
    ...NetworkUtils.urlToHttpOptions(url)
  };
  return agentOptions && Object.keys(agentOptions).length && (customOptions.agent = new https.Agent(agentOptions)), 
  isPostRequest ? customOptions.headers = {
    ...customOptions.headers,
    "Content-Length": body.length
  } : timeout && (customOptions.timeout = timeout), new Promise((resolve, reject) => {
    let request;
    request = "http:" === customOptions.protocol ? http.request(customOptions) : https.request(customOptions), 
    isPostRequest && request.write(body), timeout && request.on("timeout", () => {
      request.destroy(), reject(new Error("Request time out"));
    }), request.end(), request.on("response", response => {
      const headers = response.headers, statusCode = response.statusCode, statusMessage = response.statusMessage, data = [];
      response.on("data", chunk => {
        data.push(chunk);
      }), response.on("end", () => {
        const body = Buffer.concat([ ...data ]).toString(), parsedHeaders = headers, networkResponse = NetworkUtils.getNetworkResponse(parsedHeaders, parseBody(statusCode, statusMessage, parsedHeaders, body), statusCode);
        (statusCode < HttpStatus_SUCCESS_RANGE_START || statusCode > HttpStatus_SUCCESS_RANGE_END) && networkResponse.body.error !== Constants$1_AUTHORIZATION_PENDING && request.destroy(), 
        resolve(networkResponse);
      });
    }), request.on("error", chunk => {
      request.destroy(), reject(new Error(chunk.toString()));
    });
  });
}, parseBody = (statusCode, statusMessage, headers, body) => {
  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch (error) {
    let errorType, errorDescriptionHelper;
    statusCode >= HttpStatus_CLIENT_ERROR_RANGE_START && statusCode <= HttpStatus_CLIENT_ERROR_RANGE_END ? (errorType = "client_error", 
    errorDescriptionHelper = "A client") : statusCode >= HttpStatus_SERVER_ERROR_RANGE_START && statusCode <= HttpStatus_SERVER_ERROR_RANGE_END ? (errorType = "server_error", 
    errorDescriptionHelper = "A server") : (errorType = "unknown_error", errorDescriptionHelper = "An unknown"), 
    parsedBody = {
      error: errorType,
      error_description: `${errorDescriptionHelper} error occured.\nHttp status code: ${statusCode}\nHttp status message: ${statusMessage || "Unknown"}\nHeaders: ${JSON.stringify(headers)}`
    };
  }
  return parsedBody;
}, NodeAuthErrorMessage_invalidLoopbackAddressType = {
  code: "invalid_loopback_server_address_type",
  desc: "Loopback server address is not type string. This is unexpected."
}, NodeAuthErrorMessage_unableToLoadRedirectUri = {
  code: "unable_to_load_redirectUrl",
  desc: "Loopback server callback was invoked without a url. This is unexpected."
}, NodeAuthErrorMessage_noAuthCodeInResponse = {
  code: "no_auth_code_in_response",
  desc: "No auth code found in the server response. Please check your network trace to determine what happened."
}, NodeAuthErrorMessage_noLoopbackServerExists = {
  code: "no_loopback_server_exists",
  desc: "No loopback server exists yet."
}, NodeAuthErrorMessage_loopbackServerAlreadyExists = {
  code: "loopback_server_already_exists",
  desc: "Loopback server already exists. Cannot create another."
}, NodeAuthErrorMessage_loopbackServerTimeout = {
  code: "loopback_server_timeout",
  desc: "Timed out waiting for auth code listener to be registered."
}, NodeAuthErrorMessage_stateNotFoundError = {
  code: "state_not_found",
  desc: "State not found. Please verify that the request originated from msal."
}, NodeAuthErrorMessage_thumbprintMissing = {
  code: "thumbprint_missing_from_client_certificate",
  desc: "Client certificate does not contain a SHA-1 or SHA-256 thumbprint."
};

class NodeAuthError extends AuthError {
  constructor(errorCode, errorMessage) {
    super(errorCode, errorMessage), this.name = "NodeAuthError";
  }
  static createInvalidLoopbackAddressTypeError() {
    return new NodeAuthError(NodeAuthErrorMessage_invalidLoopbackAddressType.code, `${NodeAuthErrorMessage_invalidLoopbackAddressType.desc}`);
  }
  static createUnableToLoadRedirectUrlError() {
    return new NodeAuthError(NodeAuthErrorMessage_unableToLoadRedirectUri.code, `${NodeAuthErrorMessage_unableToLoadRedirectUri.desc}`);
  }
  static createNoAuthCodeInResponseError() {
    return new NodeAuthError(NodeAuthErrorMessage_noAuthCodeInResponse.code, `${NodeAuthErrorMessage_noAuthCodeInResponse.desc}`);
  }
  static createNoLoopbackServerExistsError() {
    return new NodeAuthError(NodeAuthErrorMessage_noLoopbackServerExists.code, `${NodeAuthErrorMessage_noLoopbackServerExists.desc}`);
  }
  static createLoopbackServerAlreadyExistsError() {
    return new NodeAuthError(NodeAuthErrorMessage_loopbackServerAlreadyExists.code, `${NodeAuthErrorMessage_loopbackServerAlreadyExists.desc}`);
  }
  static createLoopbackServerTimeoutError() {
    return new NodeAuthError(NodeAuthErrorMessage_loopbackServerTimeout.code, `${NodeAuthErrorMessage_loopbackServerTimeout.desc}`);
  }
  static createStateNotFoundError() {
    return new NodeAuthError(NodeAuthErrorMessage_stateNotFoundError.code, NodeAuthErrorMessage_stateNotFoundError.desc);
  }
  static createThumbprintMissingError() {
    return new NodeAuthError(NodeAuthErrorMessage_thumbprintMissing.code, NodeAuthErrorMessage_thumbprintMissing.desc);
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ const DEFAULT_AUTH_OPTIONS = {
  clientId: Constants$2.EMPTY_STRING,
  authority: Constants$2.DEFAULT_AUTHORITY,
  clientSecret: Constants$2.EMPTY_STRING,
  clientAssertion: Constants$2.EMPTY_STRING,
  clientCertificate: {
    thumbprint: Constants$2.EMPTY_STRING,
    thumbprintSha256: Constants$2.EMPTY_STRING,
    privateKey: Constants$2.EMPTY_STRING,
    x5c: Constants$2.EMPTY_STRING
  },
  knownAuthorities: [],
  cloudDiscoveryMetadata: Constants$2.EMPTY_STRING,
  authorityMetadata: Constants$2.EMPTY_STRING,
  clientCapabilities: [],
  protocolMode: ProtocolMode_AAD,
  azureCloudOptions: {
    azureCloudInstance: AzureCloudInstance_None,
    tenant: Constants$2.EMPTY_STRING
  },
  skipAuthorityMetadataCache: !1
}, DEFAULT_CACHE_OPTIONS = {
  claimsBasedCachingEnabled: !1
}, DEFAULT_LOGGER_OPTIONS = {
  loggerCallback: () => {},
  piiLoggingEnabled: !1,
  logLevel: LogLevel.Info
}, DEFAULT_SYSTEM_OPTIONS = {
  loggerOptions: DEFAULT_LOGGER_OPTIONS,
  networkClient: new HttpClient,
  proxyUrl: Constants$2.EMPTY_STRING,
  customAgentOptions: {},
  disableInternalRetries: !1
}, DEFAULT_TELEMETRY_OPTIONS = {
  application: {
    appName: Constants$2.EMPTY_STRING,
    appVersion: Constants$2.EMPTY_STRING
  }
};

var getRandomValues, rnds8 = new Uint8Array(16);

function rng() {
  if (!getRandomValues && !(getRandomValues = "undefined" != typeof crypto && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || "undefined" != typeof msCrypto && "function" == typeof msCrypto.getRandomValues && msCrypto.getRandomValues.bind(msCrypto))) {
    throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
  }
  return getRandomValues(rnds8);
}

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

for (var byteToHex = [], i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).substr(1));
}

function stringify(arr) {
  var offset = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0, uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  if (!function(uuid) {
    return "string" == typeof uuid && REGEX.test(uuid);
  }(uuid)) {
    throw TypeError("Stringified UUID is invalid");
  }
  return uuid;
}

function v4(options, buf, offset) {
  var rnds = (options = options || {}).random || (options.rng || rng)();
  return rnds[6] = 15 & rnds[6] | 64, rnds[8] = 63 & rnds[8] | 128, stringify(rnds);
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class GuidGenerator {
  generateGuid() {
    return v4();
  }
  isGuid(guid) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(guid);
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class EncodingUtils {
  static base64Encode(str, encoding) {
    return Buffer.from(str, encoding).toString("base64");
  }
  static base64EncodeUrl(str, encoding) {
    return EncodingUtils.base64Encode(str, encoding).replace(/=/g, Constants$2.EMPTY_STRING).replace(/\+/g, "-").replace(/\//g, "_");
  }
  static base64Decode(base64Str) {
    return Buffer.from(base64Str, "base64").toString("utf8");
  }
  static base64DecodeUrl(base64Str) {
    let str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    for (;str.length % 4; ) {
      str += "=";
    }
    return EncodingUtils.base64Decode(str);
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class HashUtils {
  sha256(buffer) {
    return crypto$1.createHash(Hash_SHA256).update(buffer).digest();
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class PkceGenerator {
  constructor() {
    this.hashUtils = new HashUtils;
  }
  async generatePkceCodes() {
    const verifier = this.generateCodeVerifier();
    return {
      verifier: verifier,
      challenge: this.generateCodeChallengeFromVerifier(verifier)
    };
  }
  generateCodeVerifier() {
    const charArr = [], maxNumber = 256 - 256 % CharSet_CV_CHARSET.length;
    for (;charArr.length <= 32; ) {
      const byte = crypto$1.randomBytes(1)[0];
      if (byte >= maxNumber) {
        continue;
      }
      const index = byte % CharSet_CV_CHARSET.length;
      charArr.push(CharSet_CV_CHARSET[index]);
    }
    const verifier = charArr.join(Constants$2.EMPTY_STRING);
    return EncodingUtils.base64EncodeUrl(verifier);
  }
  generateCodeChallengeFromVerifier(codeVerifier) {
    return EncodingUtils.base64EncodeUrl(this.hashUtils.sha256(codeVerifier).toString("base64"), "base64");
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class CryptoProvider {
  constructor() {
    this.pkceGenerator = new PkceGenerator, this.guidGenerator = new GuidGenerator, 
    this.hashUtils = new HashUtils;
  }
  base64UrlEncode() {
    throw new Error("Method not implemented.");
  }
  encodeKid() {
    throw new Error("Method not implemented.");
  }
  createNewGuid() {
    return this.guidGenerator.generateGuid();
  }
  base64Encode(input) {
    return EncodingUtils.base64Encode(input);
  }
  base64Decode(input) {
    return EncodingUtils.base64Decode(input);
  }
  generatePkceCodes() {
    return this.pkceGenerator.generatePkceCodes();
  }
  getPublicKeyThumbprint() {
    throw new Error("Method not implemented.");
  }
  removeTokenBindingKey() {
    throw new Error("Method not implemented.");
  }
  clearKeystore() {
    throw new Error("Method not implemented.");
  }
  signJwt() {
    throw new Error("Method not implemented.");
  }
  async hashString(plainText) {
    return EncodingUtils.base64EncodeUrl(this.hashUtils.sha256(plainText).toString("base64"), "base64");
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class NodeStorage extends CacheManager {
  constructor(logger, clientId, cryptoImpl, staticAuthorityOptions) {
    super(clientId, cryptoImpl, logger, staticAuthorityOptions), this.cache = {}, this.changeEmitters = [], 
    this.logger = logger;
  }
  registerChangeEmitter(func) {
    this.changeEmitters.push(func);
  }
  emitChange() {
    this.changeEmitters.forEach(func => func.call(null));
  }
  cacheToInMemoryCache(cache) {
    const inMemoryCache = {
      accounts: {},
      idTokens: {},
      accessTokens: {},
      refreshTokens: {},
      appMetadata: {}
    };
    for (const key in cache) {
      const value = cache[key];
      if ("object" == typeof value) {
        if (value instanceof AccountEntity) {
          inMemoryCache.accounts[key] = value;
        } else if (isIdTokenEntity(value)) {
          inMemoryCache.idTokens[key] = value;
        } else if (isAccessTokenEntity(value)) {
          inMemoryCache.accessTokens[key] = value;
        } else if (isRefreshTokenEntity(value)) {
          inMemoryCache.refreshTokens[key] = value;
        } else {
          if (!isAppMetadataEntity(key, value)) {
            continue;
          }
          inMemoryCache.appMetadata[key] = value;
        }
      }
    }
    return inMemoryCache;
  }
  inMemoryCacheToCache(inMemoryCache) {
    let cache = this.getCache();
    return cache = {
      ...cache,
      ...inMemoryCache.accounts,
      ...inMemoryCache.idTokens,
      ...inMemoryCache.accessTokens,
      ...inMemoryCache.refreshTokens,
      ...inMemoryCache.appMetadata
    }, cache;
  }
  getInMemoryCache() {
    this.logger.trace("Getting in-memory cache");
    return this.cacheToInMemoryCache(this.getCache());
  }
  setInMemoryCache(inMemoryCache) {
    this.logger.trace("Setting in-memory cache");
    const cache = this.inMemoryCacheToCache(inMemoryCache);
    this.setCache(cache), this.emitChange();
  }
  getCache() {
    return this.logger.trace("Getting cache key-value store"), this.cache;
  }
  setCache(cache) {
    this.logger.trace("Setting cache key value store"), this.cache = cache, this.emitChange();
  }
  getItem(key) {
    this.logger.tracePii(`Item key: ${key}`);
    return this.getCache()[key];
  }
  setItem(key, value) {
    this.logger.tracePii(`Item key: ${key}`);
    const cache = this.getCache();
    cache[key] = value, this.setCache(cache);
  }
  getAccountKeys() {
    const inMemoryCache = this.getInMemoryCache();
    return Object.keys(inMemoryCache.accounts);
  }
  getTokenKeys() {
    const inMemoryCache = this.getInMemoryCache();
    return {
      idToken: Object.keys(inMemoryCache.idTokens),
      accessToken: Object.keys(inMemoryCache.accessTokens),
      refreshToken: Object.keys(inMemoryCache.refreshTokens)
    };
  }
  getAccount(accountKey) {
    const accountEntity = this.getCachedAccountEntity(accountKey);
    return accountEntity && AccountEntity.isAccountEntity(accountEntity) ? this.updateOutdatedCachedAccount(accountKey, accountEntity) : null;
  }
  getCachedAccountEntity(accountKey) {
    return this.getItem(accountKey) ? Object.assign(new AccountEntity, this.getItem(accountKey)) : null;
  }
  setAccount(account) {
    const accountKey = account.generateAccountKey();
    this.setItem(accountKey, account);
  }
  getIdTokenCredential(idTokenKey) {
    const idToken = this.getItem(idTokenKey);
    return isIdTokenEntity(idToken) ? idToken : null;
  }
  setIdTokenCredential(idToken) {
    const idTokenKey = generateCredentialKey(idToken);
    this.setItem(idTokenKey, idToken);
  }
  getAccessTokenCredential(accessTokenKey) {
    const accessToken = this.getItem(accessTokenKey);
    return isAccessTokenEntity(accessToken) ? accessToken : null;
  }
  setAccessTokenCredential(accessToken) {
    const accessTokenKey = generateCredentialKey(accessToken);
    this.setItem(accessTokenKey, accessToken);
  }
  getRefreshTokenCredential(refreshTokenKey) {
    const refreshToken = this.getItem(refreshTokenKey);
    return isRefreshTokenEntity(refreshToken) ? refreshToken : null;
  }
  setRefreshTokenCredential(refreshToken) {
    const refreshTokenKey = generateCredentialKey(refreshToken);
    this.setItem(refreshTokenKey, refreshToken);
  }
  getAppMetadata(appMetadataKey) {
    const appMetadata = this.getItem(appMetadataKey);
    return isAppMetadataEntity(appMetadataKey, appMetadata) ? appMetadata : null;
  }
  setAppMetadata(appMetadata) {
    const appMetadataKey = function({environment: environment, clientId: clientId}) {
      return [ "appmetadata", environment, clientId ].join(Separators_CACHE_KEY_SEPARATOR).toLowerCase();
    }(appMetadata);
    this.setItem(appMetadataKey, appMetadata);
  }
  getServerTelemetry(serverTelemetrykey) {
    const serverTelemetryEntity = this.getItem(serverTelemetrykey);
    return serverTelemetryEntity && function(key, entity) {
      const validateKey = 0 === key.indexOf(SERVER_TELEM_CONSTANTS.CACHE_KEY);
      let validateEntity = !0;
      return entity && (validateEntity = entity.hasOwnProperty("failedRequests") && entity.hasOwnProperty("errors") && entity.hasOwnProperty("cacheHits")), 
      validateKey && validateEntity;
    }(serverTelemetrykey, serverTelemetryEntity) ? serverTelemetryEntity : null;
  }
  setServerTelemetry(serverTelemetryKey, serverTelemetry) {
    this.setItem(serverTelemetryKey, serverTelemetry);
  }
  getAuthorityMetadata(key) {
    const authorityMetadataEntity = this.getItem(key);
    return authorityMetadataEntity && function(key, entity) {
      return !!entity && 0 === key.indexOf(AUTHORITY_METADATA_CONSTANTS_CACHE_KEY) && entity.hasOwnProperty("aliases") && entity.hasOwnProperty("preferred_cache") && entity.hasOwnProperty("preferred_network") && entity.hasOwnProperty("canonical_authority") && entity.hasOwnProperty("authorization_endpoint") && entity.hasOwnProperty("token_endpoint") && entity.hasOwnProperty("issuer") && entity.hasOwnProperty("aliasesFromNetwork") && entity.hasOwnProperty("endpointsFromNetwork") && entity.hasOwnProperty("expiresAt") && entity.hasOwnProperty("jwks_uri");
    }(key, authorityMetadataEntity) ? authorityMetadataEntity : null;
  }
  getAuthorityMetadataKeys() {
    return this.getKeys().filter(key => this.isAuthorityMetadata(key));
  }
  setAuthorityMetadata(key, metadata) {
    this.setItem(key, metadata);
  }
  getThrottlingCache(throttlingCacheKey) {
    const throttlingCache = this.getItem(throttlingCacheKey);
    return throttlingCache && function(key, entity) {
      let validateKey = !1;
      key && (validateKey = 0 === key.indexOf(ThrottlingConstants_THROTTLING_PREFIX));
      let validateEntity = !0;
      return entity && (validateEntity = entity.hasOwnProperty("throttleTime")), validateKey && validateEntity;
    }(throttlingCacheKey, throttlingCache) ? throttlingCache : null;
  }
  setThrottlingCache(throttlingCacheKey, throttlingCache) {
    this.setItem(throttlingCacheKey, throttlingCache);
  }
  removeItem(key) {
    this.logger.tracePii(`Item key: ${key}`);
    let result = !1;
    const cache = this.getCache();
    return cache[key] && (delete cache[key], result = !0), result && (this.setCache(cache), 
    this.emitChange()), result;
  }
  removeOutdatedAccount(accountKey) {
    this.removeItem(accountKey);
  }
  containsKey(key) {
    return this.getKeys().includes(key);
  }
  getKeys() {
    this.logger.trace("Retrieving all cache keys");
    const cache = this.getCache();
    return [ ...Object.keys(cache) ];
  }
  clear() {
    this.logger.trace("Clearing cache entries created by MSAL");
    this.getKeys().forEach(key => {
      this.removeItem(key);
    }), this.emitChange();
  }
  static generateInMemoryCache(cache) {
    return Deserializer.deserializeAllCache(Deserializer.deserializeJSONBlob(cache));
  }
  static generateJsonCache(inMemoryCache) {
    return Serializer.serializeAllCache(inMemoryCache);
  }
  updateCredentialCacheKey(currentCacheKey, credential) {
    const updatedCacheKey = generateCredentialKey(credential);
    if (currentCacheKey !== updatedCacheKey) {
      const cacheItem = this.getItem(currentCacheKey);
      if (cacheItem) {
        return this.removeItem(currentCacheKey), this.setItem(updatedCacheKey, cacheItem), 
        this.logger.verbose(`Updated an outdated ${credential.credentialType} cache key`), 
        updatedCacheKey;
      }
      this.logger.error(`Attempted to update an outdated ${credential.credentialType} cache key but no item matching the outdated key was found in storage`);
    }
    return currentCacheKey;
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ const defaultSerializedCache_Account = {}, defaultSerializedCache_IdToken = {}, defaultSerializedCache_AccessToken = {}, defaultSerializedCache_RefreshToken = {}, defaultSerializedCache_AppMetadata = {};

class TokenCache {
  constructor(storage, logger, cachePlugin) {
    this.cacheHasChanged = !1, this.storage = storage, this.storage.registerChangeEmitter(this.handleChangeEvent.bind(this)), 
    cachePlugin && (this.persistence = cachePlugin), this.logger = logger;
  }
  hasChanged() {
    return this.cacheHasChanged;
  }
  serialize() {
    this.logger.trace("Serializing in-memory cache");
    let finalState = Serializer.serializeAllCache(this.storage.getInMemoryCache());
    return this.cacheSnapshot ? (this.logger.trace("Reading cache snapshot from disk"), 
    finalState = this.mergeState(JSON.parse(this.cacheSnapshot), finalState)) : this.logger.trace("No cache snapshot to merge"), 
    this.cacheHasChanged = !1, JSON.stringify(finalState);
  }
  deserialize(cache) {
    if (this.logger.trace("Deserializing JSON to in-memory cache"), this.cacheSnapshot = cache, 
    this.cacheSnapshot) {
      this.logger.trace("Reading cache snapshot from disk");
      const deserializedCache = Deserializer.deserializeAllCache(this.overlayDefaults(JSON.parse(this.cacheSnapshot)));
      this.storage.setInMemoryCache(deserializedCache);
    } else {
      this.logger.trace("No cache snapshot to deserialize");
    }
  }
  getKVStore() {
    return this.storage.getCache();
  }
  async getAllAccounts() {
    let cacheContext;
    this.logger.trace("getAllAccounts called");
    try {
      return this.persistence && (cacheContext = new TokenCacheContext(this, !1), await this.persistence.beforeCacheAccess(cacheContext)), 
      this.storage.getAllAccounts();
    } finally {
      this.persistence && cacheContext && await this.persistence.afterCacheAccess(cacheContext);
    }
  }
  async getAccountByHomeId(homeAccountId) {
    const allAccounts = await this.getAllAccounts();
    return homeAccountId && allAccounts && allAccounts.length && allAccounts.filter(accountObj => accountObj.homeAccountId === homeAccountId)[0] || null;
  }
  async getAccountByLocalId(localAccountId) {
    const allAccounts = await this.getAllAccounts();
    return localAccountId && allAccounts && allAccounts.length && allAccounts.filter(accountObj => accountObj.localAccountId === localAccountId)[0] || null;
  }
  async removeAccount(account) {
    let cacheContext;
    this.logger.trace("removeAccount called");
    try {
      this.persistence && (cacheContext = new TokenCacheContext(this, !0), await this.persistence.beforeCacheAccess(cacheContext)), 
      await this.storage.removeAccount(AccountEntity.generateAccountCacheKey(account));
    } finally {
      this.persistence && cacheContext && await this.persistence.afterCacheAccess(cacheContext);
    }
  }
  handleChangeEvent() {
    this.cacheHasChanged = !0;
  }
  mergeState(oldState, currentState) {
    this.logger.trace("Merging in-memory cache with cache snapshot");
    const stateAfterRemoval = this.mergeRemovals(oldState, currentState);
    return this.mergeUpdates(stateAfterRemoval, currentState);
  }
  mergeUpdates(oldState, newState) {
    return Object.keys(newState).forEach(newKey => {
      const newValue = newState[newKey];
      if (oldState.hasOwnProperty(newKey)) {
        const newValueNotNull = null !== newValue, newValueIsObject = "object" == typeof newValue, newValueIsNotArray = !Array.isArray(newValue), oldStateNotUndefinedOrNull = void 0 !== oldState[newKey] && null !== oldState[newKey];
        newValueNotNull && newValueIsObject && newValueIsNotArray && oldStateNotUndefinedOrNull ? this.mergeUpdates(oldState[newKey], newValue) : oldState[newKey] = newValue;
      } else {
        null !== newValue && (oldState[newKey] = newValue);
      }
    }), oldState;
  }
  mergeRemovals(oldState, newState) {
    this.logger.trace("Remove updated entries in cache");
    const accounts = oldState.Account ? this.mergeRemovalsDict(oldState.Account, newState.Account) : oldState.Account, accessTokens = oldState.AccessToken ? this.mergeRemovalsDict(oldState.AccessToken, newState.AccessToken) : oldState.AccessToken, refreshTokens = oldState.RefreshToken ? this.mergeRemovalsDict(oldState.RefreshToken, newState.RefreshToken) : oldState.RefreshToken, idTokens = oldState.IdToken ? this.mergeRemovalsDict(oldState.IdToken, newState.IdToken) : oldState.IdToken, appMetadata = oldState.AppMetadata ? this.mergeRemovalsDict(oldState.AppMetadata, newState.AppMetadata) : oldState.AppMetadata;
    return {
      ...oldState,
      Account: accounts,
      AccessToken: accessTokens,
      RefreshToken: refreshTokens,
      IdToken: idTokens,
      AppMetadata: appMetadata
    };
  }
  mergeRemovalsDict(oldState, newState) {
    const finalState = {
      ...oldState
    };
    return Object.keys(oldState).forEach(oldKey => {
      newState && newState.hasOwnProperty(oldKey) || delete finalState[oldKey];
    }), finalState;
  }
  overlayDefaults(passedInCache) {
    return this.logger.trace("Overlaying input cache with the default cache"), {
      Account: {
        ...defaultSerializedCache_Account,
        ...passedInCache.Account
      },
      IdToken: {
        ...defaultSerializedCache_IdToken,
        ...passedInCache.IdToken
      },
      AccessToken: {
        ...defaultSerializedCache_AccessToken,
        ...passedInCache.AccessToken
      },
      RefreshToken: {
        ...defaultSerializedCache_RefreshToken,
        ...passedInCache.RefreshToken
      },
      AppMetadata: {
        ...defaultSerializedCache_AppMetadata,
        ...passedInCache.AppMetadata
      }
    };
  }
}

function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x.default : x;
}

var hasRequiredSafeBuffer, dataStream, hasRequiredDataStream, bufferEqualConstantTime, hasRequiredBufferEqualConstantTime, paramBytesForAlg_1, hasRequiredParamBytesForAlg, ecdsaSigFormatter, hasRequiredEcdsaSigFormatter, jwa, hasRequiredJwa, tostring, hasRequiredTostring, signStream, hasRequiredSignStream, verifyStream, hasRequiredVerifyStream, hasRequiredJws, decode$1, hasRequiredDecode, JsonWebTokenError_1, hasRequiredJsonWebTokenError, NotBeforeError_1, hasRequiredNotBeforeError, TokenExpiredError_1, hasRequiredTokenExpiredError, ms, hasRequiredMs, timespan, hasRequiredTimespan, jws = {}, safeBuffer = {
  exports: {}
};

function requireSafeBuffer() {
  return hasRequiredSafeBuffer || (hasRequiredSafeBuffer = 1, function(module, exports) {
    var buffer = require$$0, Buffer = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer(arg, encodingOrOffset, length);
    }
    Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow ? module.exports = buffer : (copyProps(buffer, exports), 
    exports.Buffer = SafeBuffer), SafeBuffer.prototype = Object.create(Buffer.prototype), 
    copyProps(Buffer, SafeBuffer), SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if ("number" == typeof arg) {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer(arg, encodingOrOffset, length);
    }, SafeBuffer.alloc = function(size, fill, encoding) {
      if ("number" != typeof size) {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer(size);
      return void 0 !== fill ? "string" == typeof encoding ? buf.fill(fill, encoding) : buf.fill(fill) : buf.fill(0), 
      buf;
    }, SafeBuffer.allocUnsafe = function(size) {
      if ("number" != typeof size) {
        throw new TypeError("Argument must be a number");
      }
      return Buffer(size);
    }, SafeBuffer.allocUnsafeSlow = function(size) {
      if ("number" != typeof size) {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }(safeBuffer, safeBuffer.exports)), safeBuffer.exports;
}

function requireDataStream() {
  if (hasRequiredDataStream) {
    return dataStream;
  }
  hasRequiredDataStream = 1;
  var Buffer = requireSafeBuffer().Buffer, Stream = require$$3;
  function DataStream(data) {
    if (this.buffer = null, this.writable = !0, this.readable = !0, !data) {
      return this.buffer = Buffer.alloc(0), this;
    }
    if ("function" == typeof data.pipe) {
      return this.buffer = Buffer.alloc(0), data.pipe(this), this;
    }
    if (data.length || "object" == typeof data) {
      return this.buffer = data, this.writable = !1, process.nextTick(function() {
        this.emit("end", data), this.readable = !1, this.emit("close");
      }.bind(this)), this;
    }
    throw new TypeError("Unexpected data type (" + typeof data + ")");
  }
  return require$$5.inherits(DataStream, Stream), DataStream.prototype.write = function(data) {
    this.buffer = Buffer.concat([ this.buffer, Buffer.from(data) ]), this.emit("data", data);
  }, DataStream.prototype.end = function(data) {
    data && this.write(data), this.emit("end", data), this.emit("close"), this.writable = !1, 
    this.readable = !1;
  }, dataStream = DataStream;
}

function requireEcdsaSigFormatter() {
  if (hasRequiredEcdsaSigFormatter) {
    return ecdsaSigFormatter;
  }
  hasRequiredEcdsaSigFormatter = 1;
  var Buffer = requireSafeBuffer().Buffer, getParamBytesForAlg = function() {
    if (hasRequiredParamBytesForAlg) {
      return paramBytesForAlg_1;
    }
    function getParamSize(keySize) {
      return (keySize / 8 | 0) + (keySize % 8 == 0 ? 0 : 1);
    }
    hasRequiredParamBytesForAlg = 1;
    var paramBytesForAlg = {
      ES256: getParamSize(256),
      ES384: getParamSize(384),
      ES512: getParamSize(521)
    };
    return paramBytesForAlg_1 = function(alg) {
      var paramBytes = paramBytesForAlg[alg];
      if (paramBytes) {
        return paramBytes;
      }
      throw new Error('Unknown algorithm "' + alg + '"');
    };
  }();
  function signatureAsBuffer(signature) {
    if (Buffer.isBuffer(signature)) {
      return signature;
    }
    if ("string" == typeof signature) {
      return Buffer.from(signature, "base64");
    }
    throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
  }
  function countPadding(buf, start, stop) {
    for (var padding = 0; start + padding < stop && 0 === buf[start + padding]; ) {
      ++padding;
    }
    return buf[start + padding] >= 128 && --padding, padding;
  }
  return ecdsaSigFormatter = {
    derToJose: function(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg), maxEncodedParamLength = paramBytes + 1, inputLength = signature.length, offset = 0;
      if (48 !== signature[offset++]) {
        throw new Error('Could not find expected "seq"');
      }
      var seqLength = signature[offset++];
      if (129 === seqLength && (seqLength = signature[offset++]), inputLength - offset < seqLength) {
        throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
      }
      if (2 !== signature[offset++]) {
        throw new Error('Could not find expected "int" for "r"');
      }
      var rLength = signature[offset++];
      if (inputLength - offset - 2 < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
      }
      if (maxEncodedParamLength < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var rOffset = offset;
      if (offset += rLength, 2 !== signature[offset++]) {
        throw new Error('Could not find expected "int" for "s"');
      }
      var sLength = signature[offset++];
      if (inputLength - offset !== sLength) {
        throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
      }
      if (maxEncodedParamLength < sLength) {
        throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var sOffset = offset;
      if ((offset += sLength) !== inputLength) {
        throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
      }
      var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength, dst = Buffer.allocUnsafe(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
      for (var o = offset = paramBytes; offset < o + sPadding; ++offset) {
        dst[offset] = 0;
      }
      return signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength), 
      dst = (dst = dst.toString("base64")).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    },
    joseToDer: function(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg), signatureBytes = signature.length;
      if (signatureBytes !== 2 * paramBytes) {
        throw new TypeError('"' + alg + '" signatures must be "' + 2 * paramBytes + '" bytes, saw "' + signatureBytes + '"');
      }
      var rPadding = countPadding(signature, 0, paramBytes), sPadding = countPadding(signature, paramBytes, signature.length), rLength = paramBytes - rPadding, sLength = paramBytes - sPadding, rsBytes = 2 + rLength + 1 + 1 + sLength, shortLength = rsBytes < 128, dst = Buffer.allocUnsafe((shortLength ? 2 : 3) + rsBytes), offset = 0;
      return dst[offset++] = 48, shortLength ? dst[offset++] = rsBytes : (dst[offset++] = 129, 
      dst[offset++] = 255 & rsBytes), dst[offset++] = 2, dst[offset++] = rLength, rPadding < 0 ? (dst[offset++] = 0, 
      offset += signature.copy(dst, offset, 0, paramBytes)) : offset += signature.copy(dst, offset, rPadding, paramBytes), 
      dst[offset++] = 2, dst[offset++] = sLength, sPadding < 0 ? (dst[offset++] = 0, signature.copy(dst, offset, paramBytes)) : signature.copy(dst, offset, paramBytes + sPadding), 
      dst;
    }
  };
}

function requireJwa() {
  if (hasRequiredJwa) {
    return jwa;
  }
  hasRequiredJwa = 1;
  var bufferEqual = function() {
    if (hasRequiredBufferEqualConstantTime) {
      return bufferEqualConstantTime;
    }
    hasRequiredBufferEqualConstantTime = 1;
    var Buffer = require$$0.Buffer, SlowBuffer = require$$0.SlowBuffer;
    function bufferEq(a, b) {
      if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        return !1;
      }
      if (a.length !== b.length) {
        return !1;
      }
      for (var c = 0, i = 0; i < a.length; i++) {
        c |= a[i] ^ b[i];
      }
      return 0 === c;
    }
    bufferEqualConstantTime = bufferEq, bufferEq.install = function() {
      Buffer.prototype.equal = SlowBuffer.prototype.equal = function(that) {
        return bufferEq(this, that);
      };
    };
    var origBufEqual = Buffer.prototype.equal, origSlowBufEqual = SlowBuffer.prototype.equal;
    return bufferEq.restore = function() {
      Buffer.prototype.equal = origBufEqual, SlowBuffer.prototype.equal = origSlowBufEqual;
    }, bufferEqualConstantTime;
  }(), Buffer = requireSafeBuffer().Buffer, crypto = crypto$1, formatEcdsa = requireEcdsaSigFormatter(), util = require$$5, MSG_INVALID_SECRET = "secret must be a string or buffer", MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer", supportsKeyObjects = "function" == typeof crypto.createPublicKey;
  function checkIsPublicKey(key) {
    if (!Buffer.isBuffer(key) && "string" != typeof key) {
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if ("object" != typeof key) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if ("string" != typeof key.type) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if ("string" != typeof key.asymmetricKeyType) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if ("function" != typeof key.export) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
    }
  }
  function checkIsPrivateKey(key) {
    if (!Buffer.isBuffer(key) && "string" != typeof key && "object" != typeof key) {
      throw typeError("key must be a string, a buffer or an object");
    }
  }
  function fromBase64(base64) {
    return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }
  function toBase64(base64url) {
    var padding = 4 - (base64url = base64url.toString()).length % 4;
    if (4 !== padding) {
      for (var i = 0; i < padding; ++i) {
        base64url += "=";
      }
    }
    return base64url.replace(/\-/g, "+").replace(/_/g, "/");
  }
  function typeError(template) {
    var args = [].slice.call(arguments, 1), errMsg = util.format.bind(util, template).apply(null, args);
    return new TypeError(errMsg);
  }
  function normalizeInput(thing) {
    var obj;
    return obj = thing, Buffer.isBuffer(obj) || "string" == typeof obj || (thing = JSON.stringify(thing)), 
    thing;
  }
  function createHmacSigner(bits) {
    return function(thing, secret) {
      !function(key) {
        if (!Buffer.isBuffer(key)) {
          if ("string" == typeof key) {
            return key;
          }
          if (!supportsKeyObjects) {
            throw typeError(MSG_INVALID_SECRET);
          }
          if ("object" != typeof key) {
            throw typeError(MSG_INVALID_SECRET);
          }
          if ("secret" !== key.type) {
            throw typeError(MSG_INVALID_SECRET);
          }
          if ("function" != typeof key.export) {
            throw typeError(MSG_INVALID_SECRET);
          }
        }
      }(secret), thing = normalizeInput(thing);
      var hmac = crypto.createHmac("sha" + bits, secret);
      return fromBase64((hmac.update(thing), hmac.digest("base64")));
    };
  }
  function createHmacVerifier(bits) {
    return function(thing, signature, secret) {
      var computedSig = createHmacSigner(bits)(thing, secret);
      return bufferEqual(Buffer.from(signature), Buffer.from(computedSig));
    };
  }
  function createKeySigner(bits) {
    return function(thing, privateKey) {
      checkIsPrivateKey(privateKey), thing = normalizeInput(thing);
      var signer = crypto.createSign("RSA-SHA" + bits);
      return fromBase64((signer.update(thing), signer.sign(privateKey, "base64")));
    };
  }
  function createKeyVerifier(bits) {
    return function(thing, signature, publicKey) {
      checkIsPublicKey(publicKey), thing = normalizeInput(thing), signature = toBase64(signature);
      var verifier = crypto.createVerify("RSA-SHA" + bits);
      return verifier.update(thing), verifier.verify(publicKey, signature, "base64");
    };
  }
  function createPSSKeySigner(bits) {
    return function(thing, privateKey) {
      checkIsPrivateKey(privateKey), thing = normalizeInput(thing);
      var signer = crypto.createSign("RSA-SHA" + bits);
      return fromBase64((signer.update(thing), signer.sign({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
      }, "base64")));
    };
  }
  function createPSSKeyVerifier(bits) {
    return function(thing, signature, publicKey) {
      checkIsPublicKey(publicKey), thing = normalizeInput(thing), signature = toBase64(signature);
      var verifier = crypto.createVerify("RSA-SHA" + bits);
      return verifier.update(thing), verifier.verify({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
      }, signature, "base64");
    };
  }
  function createECDSASigner(bits) {
    var inner = createKeySigner(bits);
    return function() {
      var signature = inner.apply(null, arguments);
      return signature = formatEcdsa.derToJose(signature, "ES" + bits);
    };
  }
  function createECDSAVerifer(bits) {
    var inner = createKeyVerifier(bits);
    return function(thing, signature, publicKey) {
      return signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64"), 
      inner(thing, signature, publicKey);
    };
  }
  function createNoneSigner() {
    return function() {
      return "";
    };
  }
  function createNoneVerifier() {
    return function(thing, signature) {
      return "" === signature;
    };
  }
  return supportsKeyObjects && (MSG_INVALID_VERIFIER_KEY += " or a KeyObject", MSG_INVALID_SECRET += "or a KeyObject"), 
  jwa = function(algorithm) {
    var signerFactories = {
      hs: createHmacSigner,
      rs: createKeySigner,
      ps: createPSSKeySigner,
      es: createECDSASigner,
      none: createNoneSigner
    }, verifierFactories = {
      hs: createHmacVerifier,
      rs: createKeyVerifier,
      ps: createPSSKeyVerifier,
      es: createECDSAVerifer,
      none: createNoneVerifier
    }, match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/i);
    if (!match) {
      throw typeError('"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".', algorithm);
    }
    var algo = (match[1] || match[3]).toLowerCase(), bits = match[2];
    return {
      sign: signerFactories[algo](bits),
      verify: verifierFactories[algo](bits)
    };
  };
}

function requireTostring() {
  if (hasRequiredTostring) {
    return tostring;
  }
  hasRequiredTostring = 1;
  var Buffer = require$$0.Buffer;
  return tostring = function(obj) {
    return "string" == typeof obj ? obj : "number" == typeof obj || Buffer.isBuffer(obj) ? obj.toString() : JSON.stringify(obj);
  };
}

function requireSignStream() {
  if (hasRequiredSignStream) {
    return signStream;
  }
  hasRequiredSignStream = 1;
  var Buffer = requireSafeBuffer().Buffer, DataStream = requireDataStream(), jwa = requireJwa(), Stream = require$$3, toString = requireTostring(), util = require$$5;
  function base64url(string, encoding) {
    return Buffer.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }
  function jwsSign(opts) {
    var header = opts.header, payload = opts.payload, secretOrKey = opts.secret || opts.privateKey, encoding = opts.encoding, algo = jwa(header.alg), securedInput = function(header, payload, encoding) {
      encoding = encoding || "utf8";
      var encodedHeader = base64url(toString(header), "binary"), encodedPayload = base64url(toString(payload), encoding);
      return util.format("%s.%s", encodedHeader, encodedPayload);
    }(header, payload, encoding), signature = algo.sign(securedInput, secretOrKey);
    return util.format("%s.%s", securedInput, signature);
  }
  function SignStream(opts) {
    var secret = opts.secret || opts.privateKey || opts.key, secretStream = new DataStream(secret);
    this.readable = !0, this.header = opts.header, this.encoding = opts.encoding, this.secret = this.privateKey = this.key = secretStream, 
    this.payload = new DataStream(opts.payload), this.secret.once("close", function() {
      !this.payload.writable && this.readable && this.sign();
    }.bind(this)), this.payload.once("close", function() {
      !this.secret.writable && this.readable && this.sign();
    }.bind(this));
  }
  return util.inherits(SignStream, Stream), SignStream.prototype.sign = function() {
    try {
      var signature = jwsSign({
        header: this.header,
        payload: this.payload.buffer,
        secret: this.secret.buffer,
        encoding: this.encoding
      });
      return this.emit("done", signature), this.emit("data", signature), this.emit("end"), 
      this.readable = !1, signature;
    } catch (e) {
      this.readable = !1, this.emit("error", e), this.emit("close");
    }
  }, SignStream.sign = jwsSign, signStream = SignStream;
}

function requireVerifyStream() {
  if (hasRequiredVerifyStream) {
    return verifyStream;
  }
  hasRequiredVerifyStream = 1;
  var Buffer = requireSafeBuffer().Buffer, DataStream = requireDataStream(), jwa = requireJwa(), Stream = require$$3, toString = requireTostring(), JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
  function safeJsonParse(thing) {
    if (function(thing) {
      return "[object Object]" === Object.prototype.toString.call(thing);
    }(thing)) {
      return thing;
    }
    try {
      return JSON.parse(thing);
    } catch (e) {
      return;
    }
  }
  function headerFromJWS(jwsSig) {
    var encodedHeader = jwsSig.split(".", 1)[0];
    return safeJsonParse(Buffer.from(encodedHeader, "base64").toString("binary"));
  }
  function signatureFromJWS(jwsSig) {
    return jwsSig.split(".")[2];
  }
  function isValidJws(string) {
    return JWS_REGEX.test(string) && !!headerFromJWS(string);
  }
  function jwsVerify(jwsSig, algorithm, secretOrKey) {
    if (!algorithm) {
      var err = new Error("Missing algorithm parameter for jws.verify");
      throw err.code = "MISSING_ALGORITHM", err;
    }
    var signature = signatureFromJWS(jwsSig = toString(jwsSig)), securedInput = function(jwsSig) {
      return jwsSig.split(".", 2).join(".");
    }(jwsSig);
    return jwa(algorithm).verify(securedInput, signature, secretOrKey);
  }
  function jwsDecode(jwsSig, opts) {
    if (opts = opts || {}, !isValidJws(jwsSig = toString(jwsSig))) {
      return null;
    }
    var header = headerFromJWS(jwsSig);
    if (!header) {
      return null;
    }
    var payload = function(jwsSig, encoding) {
      encoding = encoding || "utf8";
      var payload = jwsSig.split(".")[1];
      return Buffer.from(payload, "base64").toString(encoding);
    }(jwsSig);
    return ("JWT" === header.typ || opts.json) && (payload = JSON.parse(payload, opts.encoding)), 
    {
      header: header,
      payload: payload,
      signature: signatureFromJWS(jwsSig)
    };
  }
  function VerifyStream(opts) {
    var secretOrKey = (opts = opts || {}).secret || opts.publicKey || opts.key, secretStream = new DataStream(secretOrKey);
    this.readable = !0, this.algorithm = opts.algorithm, this.encoding = opts.encoding, 
    this.secret = this.publicKey = this.key = secretStream, this.signature = new DataStream(opts.signature), 
    this.secret.once("close", function() {
      !this.signature.writable && this.readable && this.verify();
    }.bind(this)), this.signature.once("close", function() {
      !this.secret.writable && this.readable && this.verify();
    }.bind(this));
  }
  return require$$5.inherits(VerifyStream, Stream), VerifyStream.prototype.verify = function() {
    try {
      var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer), obj = jwsDecode(this.signature.buffer, this.encoding);
      return this.emit("done", valid, obj), this.emit("data", valid), this.emit("end"), 
      this.readable = !1, valid;
    } catch (e) {
      this.readable = !1, this.emit("error", e), this.emit("close");
    }
  }, VerifyStream.decode = jwsDecode, VerifyStream.isValid = isValidJws, VerifyStream.verify = jwsVerify, 
  verifyStream = VerifyStream;
}

function requireJws() {
  if (hasRequiredJws) {
    return jws;
  }
  hasRequiredJws = 1;
  var SignStream = requireSignStream(), VerifyStream = requireVerifyStream();
  return jws.ALGORITHMS = [ "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" ], 
  jws.sign = SignStream.sign, jws.verify = VerifyStream.verify, jws.decode = VerifyStream.decode, 
  jws.isValid = VerifyStream.isValid, jws.createSign = function(opts) {
    return new SignStream(opts);
  }, jws.createVerify = function(opts) {
    return new VerifyStream(opts);
  }, jws;
}

function requireDecode() {
  if (hasRequiredDecode) {
    return decode$1;
  }
  hasRequiredDecode = 1;
  var jws = requireJws();
  return decode$1 = function(jwt, options) {
    options = options || {};
    var decoded = jws.decode(jwt, options);
    if (!decoded) {
      return null;
    }
    var payload = decoded.payload;
    if ("string" == typeof payload) {
      try {
        var obj = JSON.parse(payload);
        null !== obj && "object" == typeof obj && (payload = obj);
      } catch (e) {}
    }
    return !0 === options.complete ? {
      header: decoded.header,
      payload: payload,
      signature: decoded.signature
    } : payload;
  }, decode$1;
}

function requireJsonWebTokenError() {
  if (hasRequiredJsonWebTokenError) {
    return JsonWebTokenError_1;
  }
  hasRequiredJsonWebTokenError = 1;
  var JsonWebTokenError = function(message, error) {
    Error.call(this, message), Error.captureStackTrace && Error.captureStackTrace(this, this.constructor), 
    this.name = "JsonWebTokenError", this.message = message, error && (this.inner = error);
  };
  return (JsonWebTokenError.prototype = Object.create(Error.prototype)).constructor = JsonWebTokenError, 
  JsonWebTokenError_1 = JsonWebTokenError;
}

function requireNotBeforeError() {
  if (hasRequiredNotBeforeError) {
    return NotBeforeError_1;
  }
  hasRequiredNotBeforeError = 1;
  var JsonWebTokenError = requireJsonWebTokenError(), NotBeforeError = function(message, date) {
    JsonWebTokenError.call(this, message), this.name = "NotBeforeError", this.date = date;
  };
  return (NotBeforeError.prototype = Object.create(JsonWebTokenError.prototype)).constructor = NotBeforeError, 
  NotBeforeError_1 = NotBeforeError;
}

function requireTokenExpiredError() {
  if (hasRequiredTokenExpiredError) {
    return TokenExpiredError_1;
  }
  hasRequiredTokenExpiredError = 1;
  var JsonWebTokenError = requireJsonWebTokenError(), TokenExpiredError = function(message, expiredAt) {
    JsonWebTokenError.call(this, message), this.name = "TokenExpiredError", this.expiredAt = expiredAt;
  };
  return (TokenExpiredError.prototype = Object.create(JsonWebTokenError.prototype)).constructor = TokenExpiredError, 
  TokenExpiredError_1 = TokenExpiredError;
}

function requireMs() {
  if (hasRequiredMs) {
    return ms;
  }
  hasRequiredMs = 1;
  var s = 1e3, m = 60 * s, h = 60 * m, d = 24 * h, w = 7 * d, y = 365.25 * d;
  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= 1.5 * n;
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
  }
  return ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if ("string" === type && val.length > 0) {
      return function(str) {
        if ((str = String(str)).length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        switch ((match[2] || "ms").toLowerCase()) {
         case "years":
         case "year":
         case "yrs":
         case "yr":
         case "y":
          return n * y;

         case "weeks":
         case "week":
         case "w":
          return n * w;

         case "days":
         case "day":
         case "d":
          return n * d;

         case "hours":
         case "hour":
         case "hrs":
         case "hr":
         case "h":
          return n * h;

         case "minutes":
         case "minute":
         case "mins":
         case "min":
         case "m":
          return n * m;

         case "seconds":
         case "second":
         case "secs":
         case "sec":
         case "s":
          return n * s;

         case "milliseconds":
         case "millisecond":
         case "msecs":
         case "msec":
         case "ms":
          return n;

         default:
          return;
        }
      }(val);
    }
    if ("number" === type && isFinite(val)) {
      return options.long ? function(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s) {
          return plural(ms, msAbs, s, "second");
        }
        return ms + " ms";
      }(val) : function(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s) {
          return Math.round(ms / s) + "s";
        }
        return ms + "ms";
      }(val);
    }
    throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
  };
}

function requireTimespan() {
  if (hasRequiredTimespan) {
    return timespan;
  }
  hasRequiredTimespan = 1;
  var ms = requireMs();
  return timespan = function(time, iat) {
    var timestamp = iat || Math.floor(Date.now() / 1e3);
    if ("string" == typeof time) {
      var milliseconds = ms(time);
      if (void 0 === milliseconds) {
        return;
      }
      return Math.floor(timestamp + milliseconds / 1e3);
    }
    return "number" == typeof time ? timestamp + time : void 0;
  };
}

var constants, hasRequiredConstants, debug_1, hasRequiredDebug, hasRequiredRe, parseOptions_1, hasRequiredParseOptions, identifiers, hasRequiredIdentifiers, semver$1, hasRequiredSemver$1, parse_1, hasRequiredParse, valid_1, hasRequiredValid$1, clean_1, hasRequiredClean, inc_1, hasRequiredInc, diff_1, hasRequiredDiff, major_1, hasRequiredMajor, minor_1, hasRequiredMinor, patch_1, hasRequiredPatch, prerelease_1, hasRequiredPrerelease, compare_1, hasRequiredCompare, rcompare_1, hasRequiredRcompare, compareLoose_1, hasRequiredCompareLoose, compareBuild_1, hasRequiredCompareBuild, sort_1, hasRequiredSort, rsort_1, hasRequiredRsort, gt_1, hasRequiredGt, lt_1, hasRequiredLt, eq_1, hasRequiredEq, neq_1, hasRequiredNeq, gte_1, hasRequiredGte, lte_1, hasRequiredLte, cmp_1, hasRequiredCmp, coerce_1, hasRequiredCoerce, lrucache, hasRequiredLrucache, range, hasRequiredRange, comparator, hasRequiredComparator, satisfies_1, hasRequiredSatisfies, toComparators_1, hasRequiredToComparators, maxSatisfying_1, hasRequiredMaxSatisfying, minSatisfying_1, hasRequiredMinSatisfying, minVersion_1, hasRequiredMinVersion, valid, hasRequiredValid, outside_1, hasRequiredOutside, gtr_1, hasRequiredGtr, ltr_1, hasRequiredLtr, intersects_1, hasRequiredIntersects, simplify, hasRequiredSimplify, subset_1, hasRequiredSubset, semver, hasRequiredSemver, asymmetricKeyDetailsSupported, hasRequiredAsymmetricKeyDetailsSupported, rsaPssKeyDetailsSupported, hasRequiredRsaPssKeyDetailsSupported, validateAsymmetricKey, hasRequiredValidateAsymmetricKey, psSupported, hasRequiredPsSupported, verify, hasRequiredVerify, lodash_includes, hasRequiredLodash_includes, lodash_isboolean, hasRequiredLodash_isboolean, lodash_isinteger, hasRequiredLodash_isinteger, lodash_isnumber, hasRequiredLodash_isnumber, lodash_isplainobject, hasRequiredLodash_isplainobject, lodash_isstring, hasRequiredLodash_isstring, lodash_once, hasRequiredLodash_once, sign, hasRequiredSign, jsonwebtoken, hasRequiredJsonwebtoken, re = {
  exports: {}
};

function requireConstants() {
  if (hasRequiredConstants) {
    return constants;
  }
  hasRequiredConstants = 1;
  const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
  return constants = {
    MAX_LENGTH: 256,
    MAX_SAFE_COMPONENT_LENGTH: 16,
    MAX_SAFE_BUILD_LENGTH: 250,
    MAX_SAFE_INTEGER: MAX_SAFE_INTEGER,
    RELEASE_TYPES: [ "major", "premajor", "minor", "preminor", "patch", "prepatch", "prerelease" ],
    SEMVER_SPEC_VERSION: "2.0.0",
    FLAG_INCLUDE_PRERELEASE: 1,
    FLAG_LOOSE: 2
  };
}

function requireDebug() {
  if (hasRequiredDebug) {
    return debug_1;
  }
  hasRequiredDebug = 1;
  const debug = "object" == typeof process && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {};
  return debug_1 = debug;
}

function requireRe() {
  return hasRequiredRe || (hasRequiredRe = 1, function(module, exports) {
    const {MAX_SAFE_COMPONENT_LENGTH: MAX_SAFE_COMPONENT_LENGTH, MAX_SAFE_BUILD_LENGTH: MAX_SAFE_BUILD_LENGTH, MAX_LENGTH: MAX_LENGTH} = requireConstants(), debug = requireDebug(), re = (exports = module.exports = {}).re = [], safeRe = exports.safeRe = [], src = exports.src = [], safeSrc = exports.safeSrc = [], t = exports.t = {};
    let R = 0;
    const safeRegexReplacements = [ [ "\\s", 1 ], [ "\\d", MAX_LENGTH ], [ "[a-zA-Z0-9-]", MAX_SAFE_BUILD_LENGTH ] ], createToken = (name, value, isGlobal) => {
      const safe = (value => {
        for (const [token, max] of safeRegexReplacements) {
          value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
        }
        return value;
      })(value), index = R++;
      debug(name, index, value), t[name] = index, src[index] = value, safeSrc[index] = safe, 
      re[index] = new RegExp(value, isGlobal ? "g" : void 0), safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*"), createToken("NUMERICIDENTIFIERLOOSE", "\\d+"), 
    createToken("NONNUMERICIDENTIFIER", "\\d*[a-zA-Z-][a-zA-Z0-9-]*"), createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`), 
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`), 
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`), 
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`), 
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`), 
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`), 
    createToken("BUILDIDENTIFIER", "[a-zA-Z0-9-]+"), createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`), 
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`), 
    createToken("FULL", `^${src[t.FULLPLAIN]}$`), createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`), 
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`), createToken("GTLT", "((?:<|>)?=?)"), 
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), 
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`), createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`), 
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`), 
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`), createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`), 
    createToken("COERCEPLAIN", `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`), 
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`), createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?` + `(?:${src[t.BUILD]})?(?:$|[^\\d])`), 
    createToken("COERCERTL", src[t.COERCE], !0), createToken("COERCERTLFULL", src[t.COERCEFULL], !0), 
    createToken("LONETILDE", "(?:~>?)"), createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, !0), 
    exports.tildeTrimReplace = "$1~", createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`), 
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`), createToken("LONECARET", "(?:\\^)"), 
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, !0), exports.caretTrimReplace = "$1^", 
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`), createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`), 
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`), 
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`), createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, !0), 
    exports.comparatorTrimReplace = "$1$2$3", createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`), 
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`), 
    createToken("STAR", "(<|>)?=?\\s*\\*"), createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), 
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }(re, re.exports)), re.exports;
}

function requireParseOptions() {
  if (hasRequiredParseOptions) {
    return parseOptions_1;
  }
  hasRequiredParseOptions = 1;
  const looseOption = Object.freeze({
    loose: !0
  }), emptyOpts = Object.freeze({});
  return parseOptions_1 = options => options ? "object" != typeof options ? looseOption : options : emptyOpts;
}

function requireIdentifiers() {
  if (hasRequiredIdentifiers) {
    return identifiers;
  }
  hasRequiredIdentifiers = 1;
  const numeric = /^[0-9]+$/, compareIdentifiers = (a, b) => {
    const anum = numeric.test(a), bnum = numeric.test(b);
    return anum && bnum && (a = +a, b = +b), a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
  };
  return identifiers = {
    compareIdentifiers: compareIdentifiers,
    rcompareIdentifiers: (a, b) => compareIdentifiers(b, a)
  };
}

function requireSemver$1() {
  if (hasRequiredSemver$1) {
    return semver$1;
  }
  hasRequiredSemver$1 = 1;
  const debug = requireDebug(), {MAX_LENGTH: MAX_LENGTH, MAX_SAFE_INTEGER: MAX_SAFE_INTEGER} = requireConstants(), {safeRe: re, t: t} = requireRe(), parseOptions = requireParseOptions(), {compareIdentifiers: compareIdentifiers} = requireIdentifiers();
  class SemVer {
    constructor(version, options) {
      if (options = parseOptions(options), version instanceof SemVer) {
        if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
          return version;
        }
        version = version.version;
      } else if ("string" != typeof version) {
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
      }
      if (version.length > MAX_LENGTH) {
        throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);
      }
      debug("SemVer", version, options), this.options = options, this.loose = !!options.loose, 
      this.includePrerelease = !!options.includePrerelease;
      const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
      if (!m) {
        throw new TypeError(`Invalid Version: ${version}`);
      }
      if (this.raw = version, this.major = +m[1], this.minor = +m[2], this.patch = +m[3], 
      this.major > MAX_SAFE_INTEGER || this.major < 0) {
        throw new TypeError("Invalid major version");
      }
      if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
        throw new TypeError("Invalid minor version");
      }
      if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
        throw new TypeError("Invalid patch version");
      }
      m[4] ? this.prerelease = m[4].split(".").map(id => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num;
          }
        }
        return id;
      }) : this.prerelease = [], this.build = m[5] ? m[5].split(".") : [], this.format();
    }
    format() {
      return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), 
      this.version;
    }
    toString() {
      return this.version;
    }
    compare(other) {
      if (debug("SemVer.compare", this.version, this.options, other), !(other instanceof SemVer)) {
        if ("string" == typeof other && other === this.version) {
          return 0;
        }
        other = new SemVer(other, this.options);
      }
      return other.version === this.version ? 0 : this.compareMain(other) || this.comparePre(other);
    }
    compareMain(other) {
      return other instanceof SemVer || (other = new SemVer(other, this.options)), compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
    }
    comparePre(other) {
      if (other instanceof SemVer || (other = new SemVer(other, this.options)), this.prerelease.length && !other.prerelease.length) {
        return -1;
      }
      if (!this.prerelease.length && other.prerelease.length) {
        return 1;
      }
      if (!this.prerelease.length && !other.prerelease.length) {
        return 0;
      }
      let i = 0;
      do {
        const a = this.prerelease[i], b = other.prerelease[i];
        if (debug("prerelease compare", i, a, b), void 0 === a && void 0 === b) {
          return 0;
        }
        if (void 0 === b) {
          return 1;
        }
        if (void 0 === a) {
          return -1;
        }
        if (a !== b) {
          return compareIdentifiers(a, b);
        }
      } while (++i);
    }
    compareBuild(other) {
      other instanceof SemVer || (other = new SemVer(other, this.options));
      let i = 0;
      do {
        const a = this.build[i], b = other.build[i];
        if (debug("build compare", i, a, b), void 0 === a && void 0 === b) {
          return 0;
        }
        if (void 0 === b) {
          return 1;
        }
        if (void 0 === a) {
          return -1;
        }
        if (a !== b) {
          return compareIdentifiers(a, b);
        }
      } while (++i);
    }
    inc(release, identifier, identifierBase) {
      if (release.startsWith("pre")) {
        if (!identifier && !1 === identifierBase) {
          throw new Error("invalid increment argument: identifier is empty");
        }
        if (identifier) {
          const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
          if (!match || match[1] !== identifier) {
            throw new Error(`invalid identifier: ${identifier}`);
          }
        }
      }
      switch (release) {
       case "premajor":
        this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", identifier, identifierBase);
        break;

       case "preminor":
        this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", identifier, identifierBase);
        break;

       case "prepatch":
        this.prerelease.length = 0, this.inc("patch", identifier, identifierBase), this.inc("pre", identifier, identifierBase);
        break;

       case "prerelease":
        0 === this.prerelease.length && this.inc("patch", identifier, identifierBase), this.inc("pre", identifier, identifierBase);
        break;

       case "release":
        if (0 === this.prerelease.length) {
          throw new Error(`version ${this.raw} is not a prerelease`);
        }
        this.prerelease.length = 0;
        break;

       case "major":
        0 === this.minor && 0 === this.patch && 0 !== this.prerelease.length || this.major++, 
        this.minor = 0, this.patch = 0, this.prerelease = [];
        break;

       case "minor":
        0 === this.patch && 0 !== this.prerelease.length || this.minor++, this.patch = 0, 
        this.prerelease = [];
        break;

       case "patch":
        0 === this.prerelease.length && this.patch++, this.prerelease = [];
        break;

       case "pre":
        {
          const base = Number(identifierBase) ? 1 : 0;
          if (0 === this.prerelease.length) {
            this.prerelease = [ base ];
          } else {
            let i = this.prerelease.length;
            for (;--i >= 0; ) {
              "number" == typeof this.prerelease[i] && (this.prerelease[i]++, i = -2);
            }
            if (-1 === i) {
              if (identifier === this.prerelease.join(".") && !1 === identifierBase) {
                throw new Error("invalid increment argument: identifier already exists");
              }
              this.prerelease.push(base);
            }
          }
          if (identifier) {
            let prerelease = [ identifier, base ];
            !1 === identifierBase && (prerelease = [ identifier ]), 0 === compareIdentifiers(this.prerelease[0], identifier) ? isNaN(this.prerelease[1]) && (this.prerelease = prerelease) : this.prerelease = prerelease;
          }
          break;
        }

       default:
        throw new Error(`invalid increment argument: ${release}`);
      }
      return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), 
      this;
    }
  }
  return semver$1 = SemVer;
}

function requireParse() {
  if (hasRequiredParse) {
    return parse_1;
  }
  hasRequiredParse = 1;
  const SemVer = requireSemver$1();
  return parse_1 = (version, options, throwErrors = !1) => {
    if (version instanceof SemVer) {
      return version;
    }
    try {
      return new SemVer(version, options);
    } catch (er) {
      if (!throwErrors) {
        return null;
      }
      throw er;
    }
  }, parse_1;
}

function requireCompare() {
  if (hasRequiredCompare) {
    return compare_1;
  }
  hasRequiredCompare = 1;
  const SemVer = requireSemver$1();
  return compare_1 = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
}

function requireCompareBuild() {
  if (hasRequiredCompareBuild) {
    return compareBuild_1;
  }
  hasRequiredCompareBuild = 1;
  const SemVer = requireSemver$1();
  return compareBuild_1 = (a, b, loose) => {
    const versionA = new SemVer(a, loose), versionB = new SemVer(b, loose);
    return versionA.compare(versionB) || versionA.compareBuild(versionB);
  };
}

function requireGt() {
  if (hasRequiredGt) {
    return gt_1;
  }
  hasRequiredGt = 1;
  const compare = requireCompare();
  return gt_1 = (a, b, loose) => compare(a, b, loose) > 0;
}

function requireLt() {
  if (hasRequiredLt) {
    return lt_1;
  }
  hasRequiredLt = 1;
  const compare = requireCompare();
  return lt_1 = (a, b, loose) => compare(a, b, loose) < 0;
}

function requireEq() {
  if (hasRequiredEq) {
    return eq_1;
  }
  hasRequiredEq = 1;
  const compare = requireCompare();
  return eq_1 = (a, b, loose) => 0 === compare(a, b, loose);
}

function requireNeq() {
  if (hasRequiredNeq) {
    return neq_1;
  }
  hasRequiredNeq = 1;
  const compare = requireCompare();
  return neq_1 = (a, b, loose) => 0 !== compare(a, b, loose);
}

function requireGte() {
  if (hasRequiredGte) {
    return gte_1;
  }
  hasRequiredGte = 1;
  const compare = requireCompare();
  return gte_1 = (a, b, loose) => compare(a, b, loose) >= 0;
}

function requireLte() {
  if (hasRequiredLte) {
    return lte_1;
  }
  hasRequiredLte = 1;
  const compare = requireCompare();
  return lte_1 = (a, b, loose) => compare(a, b, loose) <= 0;
}

function requireCmp() {
  if (hasRequiredCmp) {
    return cmp_1;
  }
  hasRequiredCmp = 1;
  const eq = requireEq(), neq = requireNeq(), gt = requireGt(), gte = requireGte(), lt = requireLt(), lte = requireLte();
  return cmp_1 = (a, op, b, loose) => {
    switch (op) {
     case "===":
      return "object" == typeof a && (a = a.version), "object" == typeof b && (b = b.version), 
      a === b;

     case "!==":
      return "object" == typeof a && (a = a.version), "object" == typeof b && (b = b.version), 
      a !== b;

     case "":
     case "=":
     case "==":
      return eq(a, b, loose);

     case "!=":
      return neq(a, b, loose);

     case ">":
      return gt(a, b, loose);

     case ">=":
      return gte(a, b, loose);

     case "<":
      return lt(a, b, loose);

     case "<=":
      return lte(a, b, loose);

     default:
      throw new TypeError(`Invalid operator: ${op}`);
    }
  };
}

function requireRange() {
  if (hasRequiredRange) {
    return range;
  }
  hasRequiredRange = 1;
  const SPACE_CHARACTERS = /\s+/g;
  class Range {
    constructor(range, options) {
      if (options = parseOptions(options), range instanceof Range) {
        return range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease ? range : new Range(range.raw, options);
      }
      if (range instanceof Comparator) {
        return this.raw = range.value, this.set = [ [ range ] ], this.formatted = void 0, 
        this;
      }
      if (this.options = options, this.loose = !!options.loose, this.includePrerelease = !!options.includePrerelease, 
      this.raw = range.trim().replace(SPACE_CHARACTERS, " "), this.set = this.raw.split("||").map(r => this.parseRange(r.trim())).filter(c => c.length), 
      !this.set.length) {
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      }
      if (this.set.length > 1) {
        const first = this.set[0];
        if (this.set = this.set.filter(c => !isNullSet(c[0])), 0 === this.set.length) {
          this.set = [ first ];
        } else if (this.set.length > 1) {
          for (const c of this.set) {
            if (1 === c.length && isAny(c[0])) {
              this.set = [ c ];
              break;
            }
          }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (void 0 === this.formatted) {
        this.formatted = "";
        for (let i = 0; i < this.set.length; i++) {
          i > 0 && (this.formatted += "||");
          const comps = this.set[i];
          for (let k = 0; k < comps.length; k++) {
            k > 0 && (this.formatted += " "), this.formatted += comps[k].toString().trim();
          }
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(range) {
      const memoKey = ((this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE)) + ":" + range, cached = cache.get(memoKey);
      if (cached) {
        return cached;
      }
      const loose = this.options.loose, hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
      range = range.replace(hr, hyphenReplace(this.options.includePrerelease)), debug("hyphen replace", range), 
      range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace), debug("comparator trim", range), 
      range = range.replace(re[t.TILDETRIM], tildeTrimReplace), debug("tilde trim", range), 
      range = range.replace(re[t.CARETTRIM], caretTrimReplace), debug("caret trim", range);
      let rangeList = range.split(" ").map(comp => parseComparator(comp, this.options)).join(" ").split(/\s+/).map(comp => replaceGTE0(comp, this.options));
      loose && (rangeList = rangeList.filter(comp => (debug("loose invalid filter", comp, this.options), 
      !!comp.match(re[t.COMPARATORLOOSE])))), debug("range list", rangeList);
      const rangeMap = new Map, comparators = rangeList.map(comp => new Comparator(comp, this.options));
      for (const comp of comparators) {
        if (isNullSet(comp)) {
          return [ comp ];
        }
        rangeMap.set(comp.value, comp);
      }
      rangeMap.size > 1 && rangeMap.has("") && rangeMap.delete("");
      const result = [ ...rangeMap.values() ];
      return cache.set(memoKey, result), result;
    }
    intersects(range, options) {
      if (!(range instanceof Range)) {
        throw new TypeError("a Range is required");
      }
      return this.set.some(thisComparators => isSatisfiable(thisComparators, options) && range.set.some(rangeComparators => isSatisfiable(rangeComparators, options) && thisComparators.every(thisComparator => rangeComparators.every(rangeComparator => thisComparator.intersects(rangeComparator, options)))));
    }
    test(version) {
      if (!version) {
        return !1;
      }
      if ("string" == typeof version) {
        try {
          version = new SemVer(version, this.options);
        } catch (er) {
          return !1;
        }
      }
      for (let i = 0; i < this.set.length; i++) {
        if (testSet(this.set[i], version, this.options)) {
          return !0;
        }
      }
      return !1;
    }
  }
  range = Range;
  const cache = new (hasRequiredLrucache ? lrucache : (hasRequiredLrucache = 1, lrucache = class {
    constructor() {
      this.max = 1e3, this.map = new Map;
    }
    get(key) {
      const value = this.map.get(key);
      return void 0 === value ? void 0 : (this.map.delete(key), this.map.set(key, value), 
      value);
    }
    delete(key) {
      return this.map.delete(key);
    }
    set(key, value) {
      if (!this.delete(key) && void 0 !== value) {
        if (this.map.size >= this.max) {
          const firstKey = this.map.keys().next().value;
          this.delete(firstKey);
        }
        this.map.set(key, value);
      }
      return this;
    }
  })), parseOptions = requireParseOptions(), Comparator = requireComparator(), debug = requireDebug(), SemVer = requireSemver$1(), {safeRe: re, t: t, comparatorTrimReplace: comparatorTrimReplace, tildeTrimReplace: tildeTrimReplace, caretTrimReplace: caretTrimReplace} = requireRe(), {FLAG_INCLUDE_PRERELEASE: FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE: FLAG_LOOSE} = requireConstants(), isNullSet = c => "<0.0.0-0" === c.value, isAny = c => "" === c.value, isSatisfiable = (comparators, options) => {
    let result = !0;
    const remainingComparators = comparators.slice();
    let testComparator = remainingComparators.pop();
    for (;result && remainingComparators.length; ) {
      result = remainingComparators.every(otherComparator => testComparator.intersects(otherComparator, options)), 
      testComparator = remainingComparators.pop();
    }
    return result;
  }, parseComparator = (comp, options) => (debug("comp", comp, options), comp = replaceCarets(comp, options), 
  debug("caret", comp), comp = replaceTildes(comp, options), debug("tildes", comp), 
  comp = replaceXRanges(comp, options), debug("xrange", comp), comp = replaceStars(comp, options), 
  debug("stars", comp), comp), isX = id => !id || "x" === id.toLowerCase() || "*" === id, replaceTildes = (comp, options) => comp.trim().split(/\s+/).map(c => replaceTilde(c, options)).join(" "), replaceTilde = (comp, options) => {
    const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
    return comp.replace(r, (_, M, m, p, pr) => {
      let ret;
      return debug("tilde", comp, _, M, m, p, pr), isX(M) ? ret = "" : isX(m) ? ret = `>=${M}.0.0 <${+M + 1}.0.0-0` : isX(p) ? ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0` : pr ? (debug("replaceTilde pr", pr), 
      ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`) : ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`, 
      debug("tilde return", ret), ret;
    });
  }, replaceCarets = (comp, options) => comp.trim().split(/\s+/).map(c => replaceCaret(c, options)).join(" "), replaceCaret = (comp, options) => {
    debug("caret", comp, options);
    const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET], z = options.includePrerelease ? "-0" : "";
    return comp.replace(r, (_, M, m, p, pr) => {
      let ret;
      return debug("caret", comp, _, M, m, p, pr), isX(M) ? ret = "" : isX(m) ? ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0` : isX(p) ? ret = "0" === M ? `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0` : `>=${M}.${m}.0${z} <${+M + 1}.0.0-0` : pr ? (debug("replaceCaret pr", pr), 
      ret = "0" === M ? "0" === m ? `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0` : `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0` : `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`) : (debug("no pr"), 
      ret = "0" === M ? "0" === m ? `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0` : `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0` : `>=${M}.${m}.${p} <${+M + 1}.0.0-0`), 
      debug("caret return", ret), ret;
    });
  }, replaceXRanges = (comp, options) => (debug("replaceXRanges", comp, options), 
  comp.split(/\s+/).map(c => replaceXRange(c, options)).join(" ")), replaceXRange = (comp, options) => {
    comp = comp.trim();
    const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
      debug("xRange", comp, ret, gtlt, M, m, p, pr);
      const xM = isX(M), xm = xM || isX(m), xp = xm || isX(p), anyX = xp;
      return "=" === gtlt && anyX && (gtlt = ""), pr = options.includePrerelease ? "-0" : "", 
      xM ? ret = ">" === gtlt || "<" === gtlt ? "<0.0.0-0" : "*" : gtlt && anyX ? (xm && (m = 0), 
      p = 0, ">" === gtlt ? (gtlt = ">=", xm ? (M = +M + 1, m = 0, p = 0) : (m = +m + 1, 
      p = 0)) : "<=" === gtlt && (gtlt = "<", xm ? M = +M + 1 : m = +m + 1), "<" === gtlt && (pr = "-0"), 
      ret = `${gtlt + M}.${m}.${p}${pr}`) : xm ? ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0` : xp && (ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`), 
      debug("xRange return", ret), ret;
    });
  }, replaceStars = (comp, options) => (debug("replaceStars", comp, options), comp.trim().replace(re[t.STAR], "")), replaceGTE0 = (comp, options) => (debug("replaceGTE0", comp, options), 
  comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "")), hyphenReplace = incPr => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => `${from = isX(fM) ? "" : isX(fm) ? `>=${fM}.0.0${incPr ? "-0" : ""}` : isX(fp) ? `>=${fM}.${fm}.0${incPr ? "-0" : ""}` : fpr ? `>=${from}` : `>=${from}${incPr ? "-0" : ""}`} ${to = isX(tM) ? "" : isX(tm) ? `<${+tM + 1}.0.0-0` : isX(tp) ? `<${tM}.${+tm + 1}.0-0` : tpr ? `<=${tM}.${tm}.${tp}-${tpr}` : incPr ? `<${tM}.${tm}.${+tp + 1}-0` : `<=${to}`}`.trim(), testSet = (set, version, options) => {
    for (let i = 0; i < set.length; i++) {
      if (!set[i].test(version)) {
        return !1;
      }
    }
    if (version.prerelease.length && !options.includePrerelease) {
      for (let i = 0; i < set.length; i++) {
        if (debug(set[i].semver), set[i].semver !== Comparator.ANY && set[i].semver.prerelease.length > 0) {
          const allowed = set[i].semver;
          if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
            return !0;
          }
        }
      }
      return !1;
    }
    return !0;
  };
  return range;
}

function requireComparator() {
  if (hasRequiredComparator) {
    return comparator;
  }
  hasRequiredComparator = 1;
  const ANY = Symbol("SemVer ANY");
  class Comparator {
    static get ANY() {
      return ANY;
    }
    constructor(comp, options) {
      if (options = parseOptions(options), comp instanceof Comparator) {
        if (comp.loose === !!options.loose) {
          return comp;
        }
        comp = comp.value;
      }
      comp = comp.trim().split(/\s+/).join(" "), debug("comparator", comp, options), this.options = options, 
      this.loose = !!options.loose, this.parse(comp), this.semver === ANY ? this.value = "" : this.value = this.operator + this.semver.version, 
      debug("comp", this);
    }
    parse(comp) {
      const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR], m = comp.match(r);
      if (!m) {
        throw new TypeError(`Invalid comparator: ${comp}`);
      }
      this.operator = void 0 !== m[1] ? m[1] : "", "=" === this.operator && (this.operator = ""), 
      m[2] ? this.semver = new SemVer(m[2], this.options.loose) : this.semver = ANY;
    }
    toString() {
      return this.value;
    }
    test(version) {
      if (debug("Comparator.test", version, this.options.loose), this.semver === ANY || version === ANY) {
        return !0;
      }
      if ("string" == typeof version) {
        try {
          version = new SemVer(version, this.options);
        } catch (er) {
          return !1;
        }
      }
      return cmp(version, this.operator, this.semver, this.options);
    }
    intersects(comp, options) {
      if (!(comp instanceof Comparator)) {
        throw new TypeError("a Comparator is required");
      }
      return "" === this.operator ? "" === this.value || new Range(comp.value, options).test(this.value) : "" === comp.operator ? "" === comp.value || new Range(this.value, options).test(comp.semver) : (!(options = parseOptions(options)).includePrerelease || "<0.0.0-0" !== this.value && "<0.0.0-0" !== comp.value) && (!(!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) && (!(!this.operator.startsWith(">") || !comp.operator.startsWith(">")) || (!(!this.operator.startsWith("<") || !comp.operator.startsWith("<")) || (!(this.semver.version !== comp.semver.version || !this.operator.includes("=") || !comp.operator.includes("=")) || (!!(cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) || !!(cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")))))));
    }
  }
  comparator = Comparator;
  const parseOptions = requireParseOptions(), {safeRe: re, t: t} = requireRe(), cmp = requireCmp(), debug = requireDebug(), SemVer = requireSemver$1(), Range = requireRange();
  return comparator;
}

function requireSatisfies() {
  if (hasRequiredSatisfies) {
    return satisfies_1;
  }
  hasRequiredSatisfies = 1;
  const Range = requireRange();
  return satisfies_1 = (version, range, options) => {
    try {
      range = new Range(range, options);
    } catch (er) {
      return !1;
    }
    return range.test(version);
  }, satisfies_1;
}

function requireValid() {
  if (hasRequiredValid) {
    return valid;
  }
  hasRequiredValid = 1;
  const Range = requireRange();
  return valid = (range, options) => {
    try {
      return new Range(range, options).range || "*";
    } catch (er) {
      return null;
    }
  }, valid;
}

function requireOutside() {
  if (hasRequiredOutside) {
    return outside_1;
  }
  hasRequiredOutside = 1;
  const SemVer = requireSemver$1(), Comparator = requireComparator(), {ANY: ANY} = Comparator, Range = requireRange(), satisfies = requireSatisfies(), gt = requireGt(), lt = requireLt(), lte = requireLte(), gte = requireGte();
  return outside_1 = (version, range, hilo, options) => {
    let gtfn, ltefn, ltfn, comp, ecomp;
    switch (version = new SemVer(version, options), range = new Range(range, options), 
    hilo) {
     case ">":
      gtfn = gt, ltefn = lte, ltfn = lt, comp = ">", ecomp = ">=";
      break;

     case "<":
      gtfn = lt, ltefn = gte, ltfn = gt, comp = "<", ecomp = "<=";
      break;

     default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (satisfies(version, range, options)) {
      return !1;
    }
    for (let i = 0; i < range.set.length; ++i) {
      const comparators = range.set[i];
      let high = null, low = null;
      if (comparators.forEach(comparator => {
        comparator.semver === ANY && (comparator = new Comparator(">=0.0.0")), high = high || comparator, 
        low = low || comparator, gtfn(comparator.semver, high.semver, options) ? high = comparator : ltfn(comparator.semver, low.semver, options) && (low = comparator);
      }), high.operator === comp || high.operator === ecomp) {
        return !1;
      }
      if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
        return !1;
      }
      if (low.operator === ecomp && ltfn(version, low.semver)) {
        return !1;
      }
    }
    return !0;
  }, outside_1;
}

function requireSemver() {
  if (hasRequiredSemver) {
    return semver;
  }
  hasRequiredSemver = 1;
  const internalRe = requireRe(), constants = requireConstants(), SemVer = requireSemver$1(), identifiers = requireIdentifiers(), parse = requireParse(), valid = function() {
    if (hasRequiredValid$1) {
      return valid_1;
    }
    hasRequiredValid$1 = 1;
    const parse = requireParse();
    return valid_1 = (version, options) => {
      const v = parse(version, options);
      return v ? v.version : null;
    }, valid_1;
  }(), clean = function() {
    if (hasRequiredClean) {
      return clean_1;
    }
    hasRequiredClean = 1;
    const parse = requireParse();
    return clean_1 = (version, options) => {
      const s = parse(version.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    }, clean_1;
  }(), inc = function() {
    if (hasRequiredInc) {
      return inc_1;
    }
    hasRequiredInc = 1;
    const SemVer = requireSemver$1();
    return inc_1 = (version, release, options, identifier, identifierBase) => {
      "string" == typeof options && (identifierBase = identifier, identifier = options, 
      options = void 0);
      try {
        return new SemVer(version instanceof SemVer ? version.version : version, options).inc(release, identifier, identifierBase).version;
      } catch (er) {
        return null;
      }
    }, inc_1;
  }(), diff = function() {
    if (hasRequiredDiff) {
      return diff_1;
    }
    hasRequiredDiff = 1;
    const parse = requireParse();
    return diff_1 = (version1, version2) => {
      const v1 = parse(version1, null, !0), v2 = parse(version2, null, !0), comparison = v1.compare(v2);
      if (0 === comparison) {
        return null;
      }
      const v1Higher = comparison > 0, highVersion = v1Higher ? v1 : v2, lowVersion = v1Higher ? v2 : v1, highHasPre = !!highVersion.prerelease.length;
      if (lowVersion.prerelease.length && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (0 === lowVersion.compareMain(highVersion)) {
          return lowVersion.minor && !lowVersion.patch ? "minor" : "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      return v1.major !== v2.major ? prefix + "major" : v1.minor !== v2.minor ? prefix + "minor" : v1.patch !== v2.patch ? prefix + "patch" : "prerelease";
    };
  }(), major = function() {
    if (hasRequiredMajor) {
      return major_1;
    }
    hasRequiredMajor = 1;
    const SemVer = requireSemver$1();
    return major_1 = (a, loose) => new SemVer(a, loose).major;
  }(), minor = function() {
    if (hasRequiredMinor) {
      return minor_1;
    }
    hasRequiredMinor = 1;
    const SemVer = requireSemver$1();
    return minor_1 = (a, loose) => new SemVer(a, loose).minor;
  }(), patch = function() {
    if (hasRequiredPatch) {
      return patch_1;
    }
    hasRequiredPatch = 1;
    const SemVer = requireSemver$1();
    return patch_1 = (a, loose) => new SemVer(a, loose).patch;
  }(), prerelease = function() {
    if (hasRequiredPrerelease) {
      return prerelease_1;
    }
    hasRequiredPrerelease = 1;
    const parse = requireParse();
    return prerelease_1 = (version, options) => {
      const parsed = parse(version, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    }, prerelease_1;
  }(), compare = requireCompare(), rcompare = function() {
    if (hasRequiredRcompare) {
      return rcompare_1;
    }
    hasRequiredRcompare = 1;
    const compare = requireCompare();
    return rcompare_1 = (a, b, loose) => compare(b, a, loose);
  }(), compareLoose = function() {
    if (hasRequiredCompareLoose) {
      return compareLoose_1;
    }
    hasRequiredCompareLoose = 1;
    const compare = requireCompare();
    return compareLoose_1 = (a, b) => compare(a, b, !0);
  }(), compareBuild = requireCompareBuild(), sort = function() {
    if (hasRequiredSort) {
      return sort_1;
    }
    hasRequiredSort = 1;
    const compareBuild = requireCompareBuild();
    return sort_1 = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
  }(), rsort = function() {
    if (hasRequiredRsort) {
      return rsort_1;
    }
    hasRequiredRsort = 1;
    const compareBuild = requireCompareBuild();
    return rsort_1 = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
  }(), gt = requireGt(), lt = requireLt(), eq = requireEq(), neq = requireNeq(), gte = requireGte(), lte = requireLte(), cmp = requireCmp(), coerce = function() {
    if (hasRequiredCoerce) {
      return coerce_1;
    }
    hasRequiredCoerce = 1;
    const SemVer = requireSemver$1(), parse = requireParse(), {safeRe: re, t: t} = requireRe();
    return coerce_1 = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if ("number" == typeof version && (version = String(version)), "string" != typeof version) {
        return null;
      }
      let match = null;
      if ((options = options || {}).rtl) {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        for (;(next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length); ) {
          match && next.index + next[0].length === match.index + match[0].length || (match = next), 
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      } else {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      }
      if (null === match) {
        return null;
      }
      const major = match[2], minor = match[3] || "0", patch = match[4] || "0", prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "", build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    }, coerce_1;
  }(), Comparator = requireComparator(), Range = requireRange(), satisfies = requireSatisfies(), toComparators = function() {
    if (hasRequiredToComparators) {
      return toComparators_1;
    }
    hasRequiredToComparators = 1;
    const Range = requireRange();
    return toComparators_1 = (range, options) => new Range(range, options).set.map(comp => comp.map(c => c.value).join(" ").trim().split(" ")), 
    toComparators_1;
  }(), maxSatisfying = function() {
    if (hasRequiredMaxSatisfying) {
      return maxSatisfying_1;
    }
    hasRequiredMaxSatisfying = 1;
    const SemVer = requireSemver$1(), Range = requireRange();
    return maxSatisfying_1 = (versions, range, options) => {
      let max = null, maxSV = null, rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      return versions.forEach(v => {
        rangeObj.test(v) && (max && -1 !== maxSV.compare(v) || (max = v, maxSV = new SemVer(max, options)));
      }), max;
    }, maxSatisfying_1;
  }(), minSatisfying = function() {
    if (hasRequiredMinSatisfying) {
      return minSatisfying_1;
    }
    hasRequiredMinSatisfying = 1;
    const SemVer = requireSemver$1(), Range = requireRange();
    return minSatisfying_1 = (versions, range, options) => {
      let min = null, minSV = null, rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      return versions.forEach(v => {
        rangeObj.test(v) && (min && 1 !== minSV.compare(v) || (min = v, minSV = new SemVer(min, options)));
      }), min;
    }, minSatisfying_1;
  }(), minVersion = function() {
    if (hasRequiredMinVersion) {
      return minVersion_1;
    }
    hasRequiredMinVersion = 1;
    const SemVer = requireSemver$1(), Range = requireRange(), gt = requireGt();
    return minVersion_1 = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      if (minver = new SemVer("0.0.0-0"), range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach(comparator => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
           case ">":
            0 === compver.prerelease.length ? compver.patch++ : compver.prerelease.push(0), 
            compver.raw = compver.format();

           case "":
           case ">=":
            setMin && !gt(compver, setMin) || (setMin = compver);
            break;

           case "<":
           case "<=":
            break;

           default:
            throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        }), !setMin || minver && !gt(minver, setMin) || (minver = setMin);
      }
      return minver && range.test(minver) ? minver : null;
    }, minVersion_1;
  }(), validRange = requireValid(), outside = requireOutside(), gtr = function() {
    if (hasRequiredGtr) {
      return gtr_1;
    }
    hasRequiredGtr = 1;
    const outside = requireOutside();
    return gtr_1 = (version, range, options) => outside(version, range, ">", options), 
    gtr_1;
  }(), ltr = function() {
    if (hasRequiredLtr) {
      return ltr_1;
    }
    hasRequiredLtr = 1;
    const outside = requireOutside();
    return ltr_1 = (version, range, options) => outside(version, range, "<", options), 
    ltr_1;
  }(), intersects = function() {
    if (hasRequiredIntersects) {
      return intersects_1;
    }
    hasRequiredIntersects = 1;
    const Range = requireRange();
    return intersects_1 = (r1, r2, options) => (r1 = new Range(r1, options), r2 = new Range(r2, options), 
    r1.intersects(r2, options));
  }(), simplifyRange = function() {
    if (hasRequiredSimplify) {
      return simplify;
    }
    hasRequiredSimplify = 1;
    const satisfies = requireSatisfies(), compare = requireCompare();
    return simplify = (versions, range, options) => {
      const set = [];
      let first = null, prev = null;
      const v = versions.sort((a, b) => compare(a, b, options));
      for (const version of v) {
        satisfies(version, range, options) ? (prev = version, first || (first = version)) : (prev && set.push([ first, prev ]), 
        prev = null, first = null);
      }
      first && set.push([ first, null ]);
      const ranges = [];
      for (const [min, max] of set) {
        min === max ? ranges.push(min) : max || min !== v[0] ? max ? min === v[0] ? ranges.push(`<=${max}`) : ranges.push(`${min} - ${max}`) : ranges.push(`>=${min}`) : ranges.push("*");
      }
      const simplified = ranges.join(" || "), original = "string" == typeof range.raw ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    }, simplify;
  }(), subset = function() {
    if (hasRequiredSubset) {
      return subset_1;
    }
    hasRequiredSubset = 1;
    const Range = requireRange(), Comparator = requireComparator(), {ANY: ANY} = Comparator, satisfies = requireSatisfies(), compare = requireCompare(), minimumVersionWithPreRelease = [ new Comparator(">=0.0.0-0") ], minimumVersion = [ new Comparator(">=0.0.0") ], simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return !0;
      }
      if (1 === sub.length && sub[0].semver === ANY) {
        if (1 === dom.length && dom[0].semver === ANY) {
          return !0;
        }
        sub = options.includePrerelease ? minimumVersionWithPreRelease : minimumVersion;
      }
      if (1 === dom.length && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return !0;
        }
        dom = minimumVersion;
      }
      const eqSet = new Set;
      let gt, lt, gtltComp, higher, lower, hasDomLT, hasDomGT;
      for (const c of sub) {
        ">" === c.operator || ">=" === c.operator ? gt = higherGT(gt, c, options) : "<" === c.operator || "<=" === c.operator ? lt = lowerLT(lt, c, options) : eqSet.add(c.semver);
      }
      if (eqSet.size > 1) {
        return null;
      }
      if (gt && lt) {
        if (gtltComp = compare(gt.semver, lt.semver, options), gtltComp > 0) {
          return null;
        }
        if (0 === gtltComp && (">=" !== gt.operator || "<=" !== lt.operator)) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return !1;
          }
        }
        return !0;
      }
      let needDomLTPre = !(!lt || options.includePrerelease || !lt.semver.prerelease.length) && lt.semver, needDomGTPre = !(!gt || options.includePrerelease || !gt.semver.prerelease.length) && gt.semver;
      needDomLTPre && 1 === needDomLTPre.prerelease.length && "<" === lt.operator && 0 === needDomLTPre.prerelease[0] && (needDomLTPre = !1);
      for (const c of dom) {
        if (hasDomGT = hasDomGT || ">" === c.operator || ">=" === c.operator, hasDomLT = hasDomLT || "<" === c.operator || "<=" === c.operator, 
        gt) {
          if (needDomGTPre && c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch && (needDomGTPre = !1), 
          ">" === c.operator || ">=" === c.operator) {
            if (higher = higherGT(gt, c, options), higher === c && higher !== gt) {
              return !1;
            }
          } else if (">=" === gt.operator && !satisfies(gt.semver, String(c), options)) {
            return !1;
          }
        }
        if (lt) {
          if (needDomLTPre && c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch && (needDomLTPre = !1), 
          "<" === c.operator || "<=" === c.operator) {
            if (lower = lowerLT(lt, c, options), lower === c && lower !== lt) {
              return !1;
            }
          } else if ("<=" === lt.operator && !satisfies(lt.semver, String(c), options)) {
            return !1;
          }
        }
        if (!c.operator && (lt || gt) && 0 !== gtltComp) {
          return !1;
        }
      }
      return !(gt && hasDomLT && !lt && 0 !== gtltComp || lt && hasDomGT && !gt && 0 !== gtltComp || needDomGTPre || needDomLTPre);
    }, higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 || ">" === b.operator && ">=" === a.operator ? b : a;
    }, lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 || "<" === b.operator && "<=" === a.operator ? b : a;
    };
    return subset_1 = (sub, dom, options = {}) => {
      if (sub === dom) {
        return !0;
      }
      sub = new Range(sub, options), dom = new Range(dom, options);
      let sawNonNull = !1;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          if (sawNonNull = sawNonNull || null !== isSub, isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return !1;
        }
      }
      return !0;
    };
  }();
  return semver = {
    parse: parse,
    valid: valid,
    clean: clean,
    inc: inc,
    diff: diff,
    major: major,
    minor: minor,
    patch: patch,
    prerelease: prerelease,
    compare: compare,
    rcompare: rcompare,
    compareLoose: compareLoose,
    compareBuild: compareBuild,
    sort: sort,
    rsort: rsort,
    gt: gt,
    lt: lt,
    eq: eq,
    neq: neq,
    gte: gte,
    lte: lte,
    cmp: cmp,
    coerce: coerce,
    Comparator: Comparator,
    Range: Range,
    satisfies: satisfies,
    toComparators: toComparators,
    maxSatisfying: maxSatisfying,
    minSatisfying: minSatisfying,
    minVersion: minVersion,
    validRange: validRange,
    outside: outside,
    gtr: gtr,
    ltr: ltr,
    intersects: intersects,
    simplifyRange: simplifyRange,
    subset: subset,
    SemVer: SemVer,
    re: internalRe.re,
    src: internalRe.src,
    tokens: internalRe.t,
    SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: constants.RELEASE_TYPES,
    compareIdentifiers: identifiers.compareIdentifiers,
    rcompareIdentifiers: identifiers.rcompareIdentifiers
  };
}

function requireValidateAsymmetricKey() {
  if (hasRequiredValidateAsymmetricKey) {
    return validateAsymmetricKey;
  }
  hasRequiredValidateAsymmetricKey = 1;
  const ASYMMETRIC_KEY_DETAILS_SUPPORTED = function() {
    if (hasRequiredAsymmetricKeyDetailsSupported) {
      return asymmetricKeyDetailsSupported;
    }
    hasRequiredAsymmetricKeyDetailsSupported = 1;
    const semver = requireSemver();
    return asymmetricKeyDetailsSupported = semver.satisfies(process.version, ">=15.7.0");
  }(), RSA_PSS_KEY_DETAILS_SUPPORTED = function() {
    if (hasRequiredRsaPssKeyDetailsSupported) {
      return rsaPssKeyDetailsSupported;
    }
    hasRequiredRsaPssKeyDetailsSupported = 1;
    const semver = requireSemver();
    return rsaPssKeyDetailsSupported = semver.satisfies(process.version, ">=16.9.0");
  }(), allowedAlgorithmsForKeys = {
    ec: [ "ES256", "ES384", "ES512" ],
    rsa: [ "RS256", "PS256", "RS384", "PS384", "RS512", "PS512" ],
    "rsa-pss": [ "PS256", "PS384", "PS512" ]
  }, allowedCurves = {
    ES256: "prime256v1",
    ES384: "secp384r1",
    ES512: "secp521r1"
  };
  return validateAsymmetricKey = function(algorithm, key) {
    if (!algorithm || !key) {
      return;
    }
    const keyType = key.asymmetricKeyType;
    if (!keyType) {
      return;
    }
    const allowedAlgorithms = allowedAlgorithmsForKeys[keyType];
    if (!allowedAlgorithms) {
      throw new Error(`Unknown key type "${keyType}".`);
    }
    if (!allowedAlgorithms.includes(algorithm)) {
      throw new Error(`"alg" parameter for "${keyType}" key type must be one of: ${allowedAlgorithms.join(", ")}.`);
    }
    if (ASYMMETRIC_KEY_DETAILS_SUPPORTED) {
      switch (keyType) {
       case "ec":
        const keyCurve = key.asymmetricKeyDetails.namedCurve, allowedCurve = allowedCurves[algorithm];
        if (keyCurve !== allowedCurve) {
          throw new Error(`"alg" parameter "${algorithm}" requires curve "${allowedCurve}".`);
        }
        break;

       case "rsa-pss":
        if (RSA_PSS_KEY_DETAILS_SUPPORTED) {
          const length = parseInt(algorithm.slice(-3), 10), {hashAlgorithm: hashAlgorithm, mgf1HashAlgorithm: mgf1HashAlgorithm, saltLength: saltLength} = key.asymmetricKeyDetails;
          if (hashAlgorithm !== `sha${length}` || mgf1HashAlgorithm !== hashAlgorithm) {
            throw new Error(`Invalid key for this operation, its RSA-PSS parameters do not meet the requirements of "alg" ${algorithm}.`);
          }
          if (void 0 !== saltLength && saltLength > length >> 3) {
            throw new Error(`Invalid key for this operation, its RSA-PSS parameter saltLength does not meet the requirements of "alg" ${algorithm}.`);
          }
        }
      }
    }
  };
}

function requirePsSupported() {
  if (hasRequiredPsSupported) {
    return psSupported;
  }
  hasRequiredPsSupported = 1;
  var semver = requireSemver();
  return psSupported = semver.satisfies(process.version, "^6.12.0 || >=8.0.0");
}

function requireVerify() {
  if (hasRequiredVerify) {
    return verify;
  }
  hasRequiredVerify = 1;
  const JsonWebTokenError = requireJsonWebTokenError(), NotBeforeError = requireNotBeforeError(), TokenExpiredError = requireTokenExpiredError(), decode = requireDecode(), timespan = requireTimespan(), validateAsymmetricKey = requireValidateAsymmetricKey(), PS_SUPPORTED = requirePsSupported(), jws = requireJws(), {KeyObject: KeyObject, createSecretKey: createSecretKey, createPublicKey: createPublicKey} = crypto$1, PUB_KEY_ALGS = [ "RS256", "RS384", "RS512" ], EC_KEY_ALGS = [ "ES256", "ES384", "ES512" ], RSA_KEY_ALGS = [ "RS256", "RS384", "RS512" ], HS_ALGS = [ "HS256", "HS384", "HS512" ];
  return PS_SUPPORTED && (PUB_KEY_ALGS.splice(PUB_KEY_ALGS.length, 0, "PS256", "PS384", "PS512"), 
  RSA_KEY_ALGS.splice(RSA_KEY_ALGS.length, 0, "PS256", "PS384", "PS512")), verify = function(jwtString, secretOrPublicKey, options, callback) {
    let done;
    if ("function" != typeof options || callback || (callback = options, options = {}), 
    options || (options = {}), options = Object.assign({}, options), done = callback || function(err, data) {
      if (err) {
        throw err;
      }
      return data;
    }, options.clockTimestamp && "number" != typeof options.clockTimestamp) {
      return done(new JsonWebTokenError("clockTimestamp must be a number"));
    }
    if (void 0 !== options.nonce && ("string" != typeof options.nonce || "" === options.nonce.trim())) {
      return done(new JsonWebTokenError("nonce must be a non-empty string"));
    }
    if (void 0 !== options.allowInvalidAsymmetricKeyTypes && "boolean" != typeof options.allowInvalidAsymmetricKeyTypes) {
      return done(new JsonWebTokenError("allowInvalidAsymmetricKeyTypes must be a boolean"));
    }
    const clockTimestamp = options.clockTimestamp || Math.floor(Date.now() / 1e3);
    if (!jwtString) {
      return done(new JsonWebTokenError("jwt must be provided"));
    }
    if ("string" != typeof jwtString) {
      return done(new JsonWebTokenError("jwt must be a string"));
    }
    const parts = jwtString.split(".");
    if (3 !== parts.length) {
      return done(new JsonWebTokenError("jwt malformed"));
    }
    let decodedToken;
    try {
      decodedToken = decode(jwtString, {
        complete: !0
      });
    } catch (err) {
      return done(err);
    }
    if (!decodedToken) {
      return done(new JsonWebTokenError("invalid token"));
    }
    const header = decodedToken.header;
    let getSecret;
    if ("function" == typeof secretOrPublicKey) {
      if (!callback) {
        return done(new JsonWebTokenError("verify must be called asynchronous if secret or public key is provided as a callback"));
      }
      getSecret = secretOrPublicKey;
    } else {
      getSecret = function(header, secretCallback) {
        return secretCallback(null, secretOrPublicKey);
      };
    }
    return getSecret(header, function(err, secretOrPublicKey) {
      if (err) {
        return done(new JsonWebTokenError("error in secret or public key callback: " + err.message));
      }
      const hasSignature = "" !== parts[2].trim();
      if (!hasSignature && secretOrPublicKey) {
        return done(new JsonWebTokenError("jwt signature is required"));
      }
      if (hasSignature && !secretOrPublicKey) {
        return done(new JsonWebTokenError("secret or public key must be provided"));
      }
      if (!hasSignature && !options.algorithms) {
        return done(new JsonWebTokenError('please specify "none" in "algorithms" to verify unsigned tokens'));
      }
      if (null != secretOrPublicKey && !(secretOrPublicKey instanceof KeyObject)) {
        try {
          secretOrPublicKey = createPublicKey(secretOrPublicKey);
        } catch (_) {
          try {
            secretOrPublicKey = createSecretKey("string" == typeof secretOrPublicKey ? Buffer.from(secretOrPublicKey) : secretOrPublicKey);
          } catch (_) {
            return done(new JsonWebTokenError("secretOrPublicKey is not valid key material"));
          }
        }
      }
      if (options.algorithms || ("secret" === secretOrPublicKey.type ? options.algorithms = HS_ALGS : [ "rsa", "rsa-pss" ].includes(secretOrPublicKey.asymmetricKeyType) ? options.algorithms = RSA_KEY_ALGS : "ec" === secretOrPublicKey.asymmetricKeyType ? options.algorithms = EC_KEY_ALGS : options.algorithms = PUB_KEY_ALGS), 
      -1 === options.algorithms.indexOf(decodedToken.header.alg)) {
        return done(new JsonWebTokenError("invalid algorithm"));
      }
      if (header.alg.startsWith("HS") && "secret" !== secretOrPublicKey.type) {
        return done(new JsonWebTokenError(`secretOrPublicKey must be a symmetric key when using ${header.alg}`));
      }
      if (/^(?:RS|PS|ES)/.test(header.alg) && "public" !== secretOrPublicKey.type) {
        return done(new JsonWebTokenError(`secretOrPublicKey must be an asymmetric key when using ${header.alg}`));
      }
      if (!options.allowInvalidAsymmetricKeyTypes) {
        try {
          validateAsymmetricKey(header.alg, secretOrPublicKey);
        } catch (e) {
          return done(e);
        }
      }
      let valid;
      try {
        valid = jws.verify(jwtString, decodedToken.header.alg, secretOrPublicKey);
      } catch (e) {
        return done(e);
      }
      if (!valid) {
        return done(new JsonWebTokenError("invalid signature"));
      }
      const payload = decodedToken.payload;
      if (void 0 !== payload.nbf && !options.ignoreNotBefore) {
        if ("number" != typeof payload.nbf) {
          return done(new JsonWebTokenError("invalid nbf value"));
        }
        if (payload.nbf > clockTimestamp + (options.clockTolerance || 0)) {
          return done(new NotBeforeError("jwt not active", new Date(1e3 * payload.nbf)));
        }
      }
      if (void 0 !== payload.exp && !options.ignoreExpiration) {
        if ("number" != typeof payload.exp) {
          return done(new JsonWebTokenError("invalid exp value"));
        }
        if (clockTimestamp >= payload.exp + (options.clockTolerance || 0)) {
          return done(new TokenExpiredError("jwt expired", new Date(1e3 * payload.exp)));
        }
      }
      if (options.audience) {
        const audiences = Array.isArray(options.audience) ? options.audience : [ options.audience ];
        if (!(Array.isArray(payload.aud) ? payload.aud : [ payload.aud ]).some(function(targetAudience) {
          return audiences.some(function(audience) {
            return audience instanceof RegExp ? audience.test(targetAudience) : audience === targetAudience;
          });
        })) {
          return done(new JsonWebTokenError("jwt audience invalid. expected: " + audiences.join(" or ")));
        }
      }
      if (options.issuer) {
        if ("string" == typeof options.issuer && payload.iss !== options.issuer || Array.isArray(options.issuer) && -1 === options.issuer.indexOf(payload.iss)) {
          return done(new JsonWebTokenError("jwt issuer invalid. expected: " + options.issuer));
        }
      }
      if (options.subject && payload.sub !== options.subject) {
        return done(new JsonWebTokenError("jwt subject invalid. expected: " + options.subject));
      }
      if (options.jwtid && payload.jti !== options.jwtid) {
        return done(new JsonWebTokenError("jwt jwtid invalid. expected: " + options.jwtid));
      }
      if (options.nonce && payload.nonce !== options.nonce) {
        return done(new JsonWebTokenError("jwt nonce invalid. expected: " + options.nonce));
      }
      if (options.maxAge) {
        if ("number" != typeof payload.iat) {
          return done(new JsonWebTokenError("iat required when maxAge is specified"));
        }
        const maxAgeTimestamp = timespan(options.maxAge, payload.iat);
        if (void 0 === maxAgeTimestamp) {
          return done(new JsonWebTokenError('"maxAge" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
        }
        if (clockTimestamp >= maxAgeTimestamp + (options.clockTolerance || 0)) {
          return done(new TokenExpiredError("maxAge exceeded", new Date(1e3 * maxAgeTimestamp)));
        }
      }
      if (!0 === options.complete) {
        const signature = decodedToken.signature;
        return done(null, {
          header: header,
          payload: payload,
          signature: signature
        });
      }
      return done(null, payload);
    });
  }, verify;
}

function requireLodash_includes() {
  if (hasRequiredLodash_includes) {
    return lodash_includes;
  }
  hasRequiredLodash_includes = 1;
  var MAX_INTEGER = 17976931348623157e292, genTag = "[object GeneratorFunction]", reTrim = /^\s+|\s+$/g, reIsBadHex = /^[-+]0x[0-9a-f]+$/i, reIsBinary = /^0b[01]+$/i, reIsOctal = /^0o[0-7]+$/i, reIsUint = /^(?:0|[1-9]\d*)$/, freeParseInt = parseInt;
  function baseIsNaN(value) {
    return value != value;
  }
  function baseValues(object, props) {
    return function(array, iteratee) {
      for (var index = -1, length = array ? array.length : 0, result = Array(length); ++index < length; ) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }(props, function(key) {
      return object[key];
    });
  }
  var func, transform, objectProto = Object.prototype, hasOwnProperty = objectProto.hasOwnProperty, objectToString = objectProto.toString, propertyIsEnumerable = objectProto.propertyIsEnumerable, nativeKeys = (func = Object.keys, 
  transform = Object, function(arg) {
    return func(transform(arg));
  }), nativeMax = Math.max;
  function arrayLikeKeys(value, inherited) {
    var result = isArray(value) || function(value) {
      return function(value) {
        return isObjectLike(value) && isArrayLike(value);
      }(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || "[object Arguments]" == objectToString.call(value));
    }(value) ? function(n, iteratee) {
      for (var index = -1, result = Array(n); ++index < n; ) {
        result[index] = iteratee(index);
      }
      return result;
    }(value.length, String) : [], length = result.length, skipIndexes = !!length;
    for (var key in value) {
      !hasOwnProperty.call(value, key) || skipIndexes && ("length" == key || isIndex(key, length)) || result.push(key);
    }
    return result;
  }
  function baseKeys(object) {
    if (Ctor = (value = object) && value.constructor, proto = "function" == typeof Ctor && Ctor.prototype || objectProto, 
    value !== proto) {
      return nativeKeys(object);
    }
    var value, Ctor, proto, result = [];
    for (var key in Object(object)) {
      hasOwnProperty.call(object, key) && "constructor" != key && result.push(key);
    }
    return result;
  }
  function isIndex(value, length) {
    return !!(length = null == length ? 9007199254740991 : length) && ("number" == typeof value || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
  }
  var isArray = Array.isArray;
  function isArrayLike(value) {
    return null != value && function(value) {
      return "number" == typeof value && value > -1 && value % 1 == 0 && value <= 9007199254740991;
    }(value.length) && !function(value) {
      var tag = isObject(value) ? objectToString.call(value) : "";
      return "[object Function]" == tag || tag == genTag;
    }(value);
  }
  function isObject(value) {
    var type = typeof value;
    return !!value && ("object" == type || "function" == type);
  }
  function isObjectLike(value) {
    return !!value && "object" == typeof value;
  }
  return lodash_includes = function(collection, value, fromIndex, guard) {
    var object;
    collection = isArrayLike(collection) ? collection : (object = collection) ? baseValues(object, function(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }(object)) : [], fromIndex = fromIndex && !guard ? function(value) {
      var result = function(value) {
        if (!value) {
          return 0 === value ? value : 0;
        }
        if (value = function(value) {
          if ("number" == typeof value) {
            return value;
          }
          if (function(value) {
            return "symbol" == typeof value || isObjectLike(value) && "[object Symbol]" == objectToString.call(value);
          }(value)) {
            return NaN;
          }
          if (isObject(value)) {
            var other = "function" == typeof value.valueOf ? value.valueOf() : value;
            value = isObject(other) ? other + "" : other;
          }
          if ("string" != typeof value) {
            return 0 === value ? value : +value;
          }
          value = value.replace(reTrim, "");
          var isBinary = reIsBinary.test(value);
          return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NaN : +value;
        }(value), Infinity === value || -Infinity === value) {
          return (value < 0 ? -1 : 1) * MAX_INTEGER;
        }
        return value == value ? value : 0;
      }(value), remainder = result % 1;
      return result == result ? remainder ? result - remainder : result : 0;
    }(fromIndex) : 0;
    var length = collection.length;
    return fromIndex < 0 && (fromIndex = nativeMax(length + fromIndex, 0)), function(value) {
      return "string" == typeof value || !isArray(value) && isObjectLike(value) && "[object String]" == objectToString.call(value);
    }(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && function(array, value, fromIndex) {
      if (value != value) {
        return function(array, predicate, fromIndex) {
          for (var length = array.length, index = fromIndex + -1; ++index < length; ) {
            if (predicate(array[index], index, array)) {
              return index;
            }
          }
          return -1;
        }(array, baseIsNaN, fromIndex);
      }
      for (var index = fromIndex - 1, length = array.length; ++index < length; ) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }(collection, value, fromIndex) > -1;
  };
}

function requireLodash_isinteger() {
  if (hasRequiredLodash_isinteger) {
    return lodash_isinteger;
  }
  hasRequiredLodash_isinteger = 1;
  var MAX_INTEGER = 17976931348623157e292, reTrim = /^\s+|\s+$/g, reIsBadHex = /^[-+]0x[0-9a-f]+$/i, reIsBinary = /^0b[01]+$/i, reIsOctal = /^0o[0-7]+$/i, freeParseInt = parseInt, objectToString = Object.prototype.toString;
  function isObject(value) {
    var type = typeof value;
    return !!value && ("object" == type || "function" == type);
  }
  return lodash_isinteger = function(value) {
    return "number" == typeof value && value == function(value) {
      var result = function(value) {
        if (!value) {
          return 0 === value ? value : 0;
        }
        if (value = function(value) {
          if ("number" == typeof value) {
            return value;
          }
          if (function(value) {
            return "symbol" == typeof value || function(value) {
              return !!value && "object" == typeof value;
            }(value) && "[object Symbol]" == objectToString.call(value);
          }(value)) {
            return NaN;
          }
          if (isObject(value)) {
            var other = "function" == typeof value.valueOf ? value.valueOf() : value;
            value = isObject(other) ? other + "" : other;
          }
          if ("string" != typeof value) {
            return 0 === value ? value : +value;
          }
          value = value.replace(reTrim, "");
          var isBinary = reIsBinary.test(value);
          return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NaN : +value;
        }(value), Infinity === value || -Infinity === value) {
          return (value < 0 ? -1 : 1) * MAX_INTEGER;
        }
        return value == value ? value : 0;
      }(value), remainder = result % 1;
      return result == result ? remainder ? result - remainder : result : 0;
    }(value);
  };
}

function requireLodash_once() {
  if (hasRequiredLodash_once) {
    return lodash_once;
  }
  hasRequiredLodash_once = 1;
  var MAX_INTEGER = 17976931348623157e292, reTrim = /^\s+|\s+$/g, reIsBadHex = /^[-+]0x[0-9a-f]+$/i, reIsBinary = /^0b[01]+$/i, reIsOctal = /^0o[0-7]+$/i, freeParseInt = parseInt, objectToString = Object.prototype.toString;
  function before(n, func) {
    var result;
    if ("function" != typeof func) {
      throw new TypeError("Expected a function");
    }
    return n = function(value) {
      var result = function(value) {
        if (!value) {
          return 0 === value ? value : 0;
        }
        if (value = function(value) {
          if ("number" == typeof value) {
            return value;
          }
          if (function(value) {
            return "symbol" == typeof value || function(value) {
              return !!value && "object" == typeof value;
            }(value) && "[object Symbol]" == objectToString.call(value);
          }(value)) {
            return NaN;
          }
          if (isObject(value)) {
            var other = "function" == typeof value.valueOf ? value.valueOf() : value;
            value = isObject(other) ? other + "" : other;
          }
          if ("string" != typeof value) {
            return 0 === value ? value : +value;
          }
          value = value.replace(reTrim, "");
          var isBinary = reIsBinary.test(value);
          return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NaN : +value;
        }(value), Infinity === value || -Infinity === value) {
          return (value < 0 ? -1 : 1) * MAX_INTEGER;
        }
        return value == value ? value : 0;
      }(value), remainder = result % 1;
      return result == result ? remainder ? result - remainder : result : 0;
    }(n), function() {
      return --n > 0 && (result = func.apply(this, arguments)), n <= 1 && (func = void 0), 
      result;
    };
  }
  function isObject(value) {
    var type = typeof value;
    return !!value && ("object" == type || "function" == type);
  }
  return lodash_once = function(func) {
    return before(2, func);
  };
}

function requireSign() {
  if (hasRequiredSign) {
    return sign;
  }
  hasRequiredSign = 1;
  const timespan = requireTimespan(), PS_SUPPORTED = requirePsSupported(), validateAsymmetricKey = requireValidateAsymmetricKey(), jws = requireJws(), includes = requireLodash_includes(), isBoolean = function() {
    if (hasRequiredLodash_isboolean) {
      return lodash_isboolean;
    }
    hasRequiredLodash_isboolean = 1;
    var objectToString = Object.prototype.toString;
    return lodash_isboolean = function(value) {
      return !0 === value || !1 === value || function(value) {
        return !!value && "object" == typeof value;
      }(value) && "[object Boolean]" == objectToString.call(value);
    };
  }(), isInteger = requireLodash_isinteger(), isNumber = function() {
    if (hasRequiredLodash_isnumber) {
      return lodash_isnumber;
    }
    hasRequiredLodash_isnumber = 1;
    var objectToString = Object.prototype.toString;
    return lodash_isnumber = function(value) {
      return "number" == typeof value || function(value) {
        return !!value && "object" == typeof value;
      }(value) && "[object Number]" == objectToString.call(value);
    };
  }(), isPlainObject = function() {
    if (hasRequiredLodash_isplainobject) {
      return lodash_isplainobject;
    }
    hasRequiredLodash_isplainobject = 1;
    var func, transform, funcProto = Function.prototype, objectProto = Object.prototype, funcToString = funcProto.toString, hasOwnProperty = objectProto.hasOwnProperty, objectCtorString = funcToString.call(Object), objectToString = objectProto.toString, getPrototype = (func = Object.getPrototypeOf, 
    transform = Object, function(arg) {
      return func(transform(arg));
    });
    return lodash_isplainobject = function(value) {
      if (!function(value) {
        return !!value && "object" == typeof value;
      }(value) || "[object Object]" != objectToString.call(value) || function(value) {
        var result = !1;
        if (null != value && "function" != typeof value.toString) {
          try {
            result = !!(value + "");
          } catch (e) {}
        }
        return result;
      }(value)) {
        return !1;
      }
      var proto = getPrototype(value);
      if (null === proto) {
        return !0;
      }
      var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
      return "function" == typeof Ctor && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
    };
  }(), isString = function() {
    if (hasRequiredLodash_isstring) {
      return lodash_isstring;
    }
    hasRequiredLodash_isstring = 1;
    var objectToString = Object.prototype.toString, isArray = Array.isArray;
    return lodash_isstring = function(value) {
      return "string" == typeof value || !isArray(value) && function(value) {
        return !!value && "object" == typeof value;
      }(value) && "[object String]" == objectToString.call(value);
    };
  }(), once = requireLodash_once(), {KeyObject: KeyObject, createSecretKey: createSecretKey, createPrivateKey: createPrivateKey} = crypto$1, SUPPORTED_ALGS = [ "RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "HS256", "HS384", "HS512", "none" ];
  PS_SUPPORTED && SUPPORTED_ALGS.splice(3, 0, "PS256", "PS384", "PS512");
  const sign_options_schema = {
    expiresIn: {
      isValid: function(value) {
        return isInteger(value) || isString(value) && value;
      },
      message: '"expiresIn" should be a number of seconds or string representing a timespan'
    },
    notBefore: {
      isValid: function(value) {
        return isInteger(value) || isString(value) && value;
      },
      message: '"notBefore" should be a number of seconds or string representing a timespan'
    },
    audience: {
      isValid: function(value) {
        return isString(value) || Array.isArray(value);
      },
      message: '"audience" must be a string or array'
    },
    algorithm: {
      isValid: includes.bind(null, SUPPORTED_ALGS),
      message: '"algorithm" must be a valid string enum value'
    },
    header: {
      isValid: isPlainObject,
      message: '"header" must be an object'
    },
    encoding: {
      isValid: isString,
      message: '"encoding" must be a string'
    },
    issuer: {
      isValid: isString,
      message: '"issuer" must be a string'
    },
    subject: {
      isValid: isString,
      message: '"subject" must be a string'
    },
    jwtid: {
      isValid: isString,
      message: '"jwtid" must be a string'
    },
    noTimestamp: {
      isValid: isBoolean,
      message: '"noTimestamp" must be a boolean'
    },
    keyid: {
      isValid: isString,
      message: '"keyid" must be a string'
    },
    mutatePayload: {
      isValid: isBoolean,
      message: '"mutatePayload" must be a boolean'
    },
    allowInsecureKeySizes: {
      isValid: isBoolean,
      message: '"allowInsecureKeySizes" must be a boolean'
    },
    allowInvalidAsymmetricKeyTypes: {
      isValid: isBoolean,
      message: '"allowInvalidAsymmetricKeyTypes" must be a boolean'
    }
  }, registered_claims_schema = {
    iat: {
      isValid: isNumber,
      message: '"iat" should be a number of seconds'
    },
    exp: {
      isValid: isNumber,
      message: '"exp" should be a number of seconds'
    },
    nbf: {
      isValid: isNumber,
      message: '"nbf" should be a number of seconds'
    }
  };
  function validate(schema, allowUnknown, object, parameterName) {
    if (!isPlainObject(object)) {
      throw new Error('Expected "' + parameterName + '" to be a plain object.');
    }
    Object.keys(object).forEach(function(key) {
      const validator = schema[key];
      if (validator) {
        if (!validator.isValid(object[key])) {
          throw new Error(validator.message);
        }
      } else if (!allowUnknown) {
        throw new Error('"' + key + '" is not allowed in "' + parameterName + '"');
      }
    });
  }
  const options_to_payload = {
    audience: "aud",
    issuer: "iss",
    subject: "sub",
    jwtid: "jti"
  }, options_for_objects = [ "expiresIn", "notBefore", "noTimestamp", "audience", "issuer", "subject", "jwtid" ];
  return sign = function(payload, secretOrPrivateKey, options, callback) {
    "function" == typeof options ? (callback = options, options = {}) : options = options || {};
    const isObjectPayload = "object" == typeof payload && !Buffer.isBuffer(payload), header = Object.assign({
      alg: options.algorithm || "HS256",
      typ: isObjectPayload ? "JWT" : void 0,
      kid: options.keyid
    }, options.header);
    function failure(err) {
      if (callback) {
        return callback(err);
      }
      throw err;
    }
    if (!secretOrPrivateKey && "none" !== options.algorithm) {
      return failure(new Error("secretOrPrivateKey must have a value"));
    }
    if (null != secretOrPrivateKey && !(secretOrPrivateKey instanceof KeyObject)) {
      try {
        secretOrPrivateKey = createPrivateKey(secretOrPrivateKey);
      } catch (_) {
        try {
          secretOrPrivateKey = createSecretKey("string" == typeof secretOrPrivateKey ? Buffer.from(secretOrPrivateKey) : secretOrPrivateKey);
        } catch (_) {
          return failure(new Error("secretOrPrivateKey is not valid key material"));
        }
      }
    }
    if (header.alg.startsWith("HS") && "secret" !== secretOrPrivateKey.type) {
      return failure(new Error(`secretOrPrivateKey must be a symmetric key when using ${header.alg}`));
    }
    if (/^(?:RS|PS|ES)/.test(header.alg)) {
      if ("private" !== secretOrPrivateKey.type) {
        return failure(new Error(`secretOrPrivateKey must be an asymmetric key when using ${header.alg}`));
      }
      if (!options.allowInsecureKeySizes && !header.alg.startsWith("ES") && void 0 !== secretOrPrivateKey.asymmetricKeyDetails && secretOrPrivateKey.asymmetricKeyDetails.modulusLength < 2048) {
        return failure(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
      }
    }
    if (void 0 === payload) {
      return failure(new Error("payload is required"));
    }
    if (isObjectPayload) {
      try {
        !function(payload) {
          validate(registered_claims_schema, !0, payload, "payload");
        }(payload);
      } catch (error) {
        return failure(error);
      }
      options.mutatePayload || (payload = Object.assign({}, payload));
    } else {
      const invalid_options = options_for_objects.filter(function(opt) {
        return void 0 !== options[opt];
      });
      if (invalid_options.length > 0) {
        return failure(new Error("invalid " + invalid_options.join(",") + " option for " + typeof payload + " payload"));
      }
    }
    if (void 0 !== payload.exp && void 0 !== options.expiresIn) {
      return failure(new Error('Bad "options.expiresIn" option the payload already has an "exp" property.'));
    }
    if (void 0 !== payload.nbf && void 0 !== options.notBefore) {
      return failure(new Error('Bad "options.notBefore" option the payload already has an "nbf" property.'));
    }
    try {
      !function(options) {
        validate(sign_options_schema, !1, options, "options");
      }(options);
    } catch (error) {
      return failure(error);
    }
    if (!options.allowInvalidAsymmetricKeyTypes) {
      try {
        validateAsymmetricKey(header.alg, secretOrPrivateKey);
      } catch (error) {
        return failure(error);
      }
    }
    const timestamp = payload.iat || Math.floor(Date.now() / 1e3);
    if (options.noTimestamp ? delete payload.iat : isObjectPayload && (payload.iat = timestamp), 
    void 0 !== options.notBefore) {
      try {
        payload.nbf = timespan(options.notBefore, timestamp);
      } catch (err) {
        return failure(err);
      }
      if (void 0 === payload.nbf) {
        return failure(new Error('"notBefore" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
      }
    }
    if (void 0 !== options.expiresIn && "object" == typeof payload) {
      try {
        payload.exp = timespan(options.expiresIn, timestamp);
      } catch (err) {
        return failure(err);
      }
      if (void 0 === payload.exp) {
        return failure(new Error('"expiresIn" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
      }
    }
    Object.keys(options_to_payload).forEach(function(key) {
      const claim = options_to_payload[key];
      if (void 0 !== options[key]) {
        if (void 0 !== payload[claim]) {
          return failure(new Error('Bad "options.' + key + '" option. The payload already has an "' + claim + '" property.'));
        }
        payload[claim] = options[key];
      }
    });
    const encoding = options.encoding || "utf8";
    if ("function" != typeof callback) {
      let signature = jws.sign({
        header: header,
        payload: payload,
        secret: secretOrPrivateKey,
        encoding: encoding
      });
      if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
        throw new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`);
      }
      return signature;
    }
    callback = callback && once(callback), jws.createSign({
      header: header,
      privateKey: secretOrPrivateKey,
      payload: payload,
      encoding: encoding
    }).once("error", callback).once("done", function(signature) {
      if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
        return callback(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
      }
      callback(null, signature);
    });
  };
}

var jwt = getDefaultExportFromCjs(hasRequiredJsonwebtoken ? jsonwebtoken : (hasRequiredJsonwebtoken = 1, 
jsonwebtoken = {
  decode: requireDecode(),
  verify: requireVerify(),
  sign: requireSign(),
  JsonWebTokenError: requireJsonWebTokenError(),
  NotBeforeError: requireNotBeforeError(),
  TokenExpiredError: requireTokenExpiredError()
}));

/*! @azure/msal-node v2.16.2 2024-11-19 */
class ClientAssertion {
  static fromAssertion(assertion) {
    const clientAssertion = new ClientAssertion;
    return clientAssertion.jwt = assertion, clientAssertion;
  }
  static fromCertificate(thumbprint, privateKey, publicCertificate) {
    const clientAssertion = new ClientAssertion;
    return clientAssertion.privateKey = privateKey, clientAssertion.thumbprint = thumbprint, 
    clientAssertion.useSha256 = !1, publicCertificate && (clientAssertion.publicCertificate = this.parseCertificate(publicCertificate)), 
    clientAssertion;
  }
  static fromCertificateWithSha256Thumbprint(thumbprint, privateKey, publicCertificate) {
    const clientAssertion = new ClientAssertion;
    return clientAssertion.privateKey = privateKey, clientAssertion.thumbprint = thumbprint, 
    clientAssertion.useSha256 = !0, publicCertificate && (clientAssertion.publicCertificate = this.parseCertificate(publicCertificate)), 
    clientAssertion;
  }
  getJwt(cryptoProvider, issuer, jwtAudience) {
    if (this.privateKey && this.thumbprint) {
      return this.jwt && !this.isExpired() && issuer === this.issuer && jwtAudience === this.jwtAudience ? this.jwt : this.createJwt(cryptoProvider, issuer, jwtAudience);
    }
    if (this.jwt) {
      return this.jwt;
    }
    throw createClientAuthError("invalid_assertion");
  }
  createJwt(cryptoProvider, issuer, jwtAudience) {
    this.issuer = issuer, this.jwtAudience = jwtAudience;
    const issuedAt = nowSeconds();
    this.expirationTime = issuedAt + 600;
    const header = {
      alg: this.useSha256 ? JwtConstants_PSS_256 : JwtConstants_RSA_256
    }, thumbprintHeader = this.useSha256 ? JwtConstants_X5T_256 : JwtConstants_X5T;
    Object.assign(header, {
      [thumbprintHeader]: EncodingUtils.base64EncodeUrl(this.thumbprint, "hex")
    }), this.publicCertificate && Object.assign(header, {
      [JwtConstants_X5C]: this.publicCertificate
    });
    const payload = {
      [JwtConstants_AUDIENCE]: this.jwtAudience,
      [JwtConstants_EXPIRATION_TIME]: this.expirationTime,
      [JwtConstants_ISSUER]: this.issuer,
      [JwtConstants_SUBJECT]: this.issuer,
      [JwtConstants_NOT_BEFORE]: issuedAt,
      [JwtConstants_JWT_ID]: cryptoProvider.createNewGuid()
    };
    return this.jwt = jwt.sign(payload, this.privateKey, {
      header: header
    }), this.jwt;
  }
  isExpired() {
    return this.expirationTime < nowSeconds();
  }
  static parseCertificate(publicCertificate) {
    const regexToFindCerts = /-----BEGIN CERTIFICATE-----\r*\n(.+?)\r*\n-----END CERTIFICATE-----/gs, certs = [];
    let matches;
    for (;null !== (matches = regexToFindCerts.exec(publicCertificate)); ) {
      certs.push(matches[1].replace(/\r*\n/g, Constants$2.EMPTY_STRING));
    }
    return certs;
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */
/*! @azure/msal-node v2.16.2 2024-11-19 */
class UsernamePasswordClient extends BaseClient {
  constructor(configuration) {
    super(configuration);
  }
  async acquireToken(request) {
    this.logger.info("in acquireToken call in username-password client");
    const reqTimestamp = nowSeconds(), response = await this.executeTokenRequest(this.authority, request), responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin);
    responseHandler.validateTokenResponse(response.body);
    return responseHandler.handleServerTokenResponse(response.body, this.authority, reqTimestamp, request);
  }
  async executeTokenRequest(authority, request) {
    const queryParametersString = this.createTokenQueryParameters(request), endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString), requestBody = await this.createTokenRequestBody(request), headers = this.createTokenRequestHeaders({
      credential: request.username,
      type: CcsCredentialType_UPN
    }), thumbprint = {
      clientId: this.config.authOptions.clientId,
      authority: authority.canonicalAuthority,
      scopes: request.scopes,
      claims: request.claims,
      authenticationScheme: request.authenticationScheme,
      resourceRequestMethod: request.resourceRequestMethod,
      resourceRequestUri: request.resourceRequestUri,
      shrClaims: request.shrClaims,
      sshKid: request.sshKid
    };
    return this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint, request.correlationId);
  }
  async createTokenRequestBody(request) {
    const parameterBuilder = new RequestParameterBuilder;
    parameterBuilder.addClientId(this.config.authOptions.clientId), parameterBuilder.addUsername(request.username), 
    parameterBuilder.addPassword(request.password), parameterBuilder.addScopes(request.scopes), 
    parameterBuilder.addResponseTypeForTokenAndIdToken(), parameterBuilder.addGrantType(GrantType_RESOURCE_OWNER_PASSWORD_GRANT), 
    parameterBuilder.addClientInfo(), parameterBuilder.addLibraryInfo(this.config.libraryInfo), 
    parameterBuilder.addApplicationTelemetry(this.config.telemetry.application), parameterBuilder.addThrottling(), 
    this.serverTelemetryManager && parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
    const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
    parameterBuilder.addCorrelationId(correlationId), this.config.clientCredentials.clientSecret && parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret);
    const clientAssertion = this.config.clientCredentials.clientAssertion;
    return clientAssertion && (parameterBuilder.addClientAssertion(await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri)), 
    parameterBuilder.addClientAssertionType(clientAssertion.assertionType)), (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) && parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities), 
    this.config.systemOptions.preventCorsPreflight && request.username && parameterBuilder.addCcsUpn(request.username), 
    parameterBuilder.createQueryString();
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class ClientApplication {
  constructor(configuration) {
    this.config = function({auth: auth, broker: broker, cache: cache, system: system, telemetry: telemetry}) {
      const systemOptions = {
        ...DEFAULT_SYSTEM_OPTIONS,
        networkClient: new HttpClient(system?.proxyUrl, system?.customAgentOptions),
        loggerOptions: system?.loggerOptions || DEFAULT_LOGGER_OPTIONS,
        disableInternalRetries: system?.disableInternalRetries || !1
      };
      if (auth.clientCertificate && !auth.clientCertificate.thumbprint && !auth.clientCertificate.thumbprintSha256) {
        throw NodeAuthError.createStateNotFoundError();
      }
      return {
        auth: {
          ...DEFAULT_AUTH_OPTIONS,
          ...auth
        },
        broker: {
          ...broker
        },
        cache: {
          ...DEFAULT_CACHE_OPTIONS,
          ...cache
        },
        system: {
          ...systemOptions,
          ...system
        },
        telemetry: {
          ...DEFAULT_TELEMETRY_OPTIONS,
          ...telemetry
        }
      };
    }(configuration), this.cryptoProvider = new CryptoProvider, this.logger = new Logger(this.config.system.loggerOptions, "@azure/msal-node", "2.16.2"), 
    this.storage = new NodeStorage(this.logger, this.config.auth.clientId, this.cryptoProvider, function(authOptions) {
      const rawCloudDiscoveryMetadata = authOptions.cloudDiscoveryMetadata;
      let cloudDiscoveryMetadata;
      if (rawCloudDiscoveryMetadata) {
        try {
          cloudDiscoveryMetadata = JSON.parse(rawCloudDiscoveryMetadata);
        } catch (e) {
          throw createClientConfigurationError("invalid_cloud_discovery_metadata");
        }
      }
      return {
        canonicalAuthority: authOptions.authority ? formatAuthorityUri(authOptions.authority) : void 0,
        knownAuthorities: authOptions.knownAuthorities,
        cloudDiscoveryMetadata: cloudDiscoveryMetadata
      };
    }(this.config.auth)), this.tokenCache = new TokenCache(this.storage, this.logger, this.config.cache.cachePlugin);
  }
  async getAuthCodeUrl(request) {
    this.logger.info("getAuthCodeUrl called", request.correlationId);
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      responseMode: request.responseMode || ResponseMode.QUERY,
      authenticationScheme: AuthenticationScheme.BEARER
    }, authClientConfig = await this.buildOauthClientConfiguration(validRequest.authority, validRequest.correlationId, validRequest.redirectUri, void 0, void 0, request.azureCloudOptions), authorizationCodeClient = new AuthorizationCodeClient(authClientConfig);
    return this.logger.verbose("Auth code client created", validRequest.correlationId), 
    authorizationCodeClient.getAuthCodeUrl(validRequest);
  }
  async acquireTokenByCode(request, authCodePayLoad) {
    this.logger.info("acquireTokenByCode called"), request.state && authCodePayLoad && (this.logger.info("acquireTokenByCode - validating state"), 
    this.validateState(request.state, authCodePayLoad.state || ""), authCodePayLoad = {
      ...authCodePayLoad,
      state: ""
    });
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      authenticationScheme: AuthenticationScheme.BEARER
    }, serverTelemetryManager = this.initializeServerTelemetryManager(ApiId_acquireTokenByCode, validRequest.correlationId);
    try {
      const authClientConfig = await this.buildOauthClientConfiguration(validRequest.authority, validRequest.correlationId, validRequest.redirectUri, serverTelemetryManager, void 0, request.azureCloudOptions), authorizationCodeClient = new AuthorizationCodeClient(authClientConfig);
      return this.logger.verbose("Auth code client created", validRequest.correlationId), 
      await authorizationCodeClient.acquireToken(validRequest, authCodePayLoad);
    } catch (e) {
      throw e instanceof AuthError && e.setCorrelationId(validRequest.correlationId), 
      serverTelemetryManager.cacheFailedRequest(e), e;
    }
  }
  async acquireTokenByRefreshToken(request) {
    this.logger.info("acquireTokenByRefreshToken called", request.correlationId);
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      authenticationScheme: AuthenticationScheme.BEARER
    }, serverTelemetryManager = this.initializeServerTelemetryManager(ApiId_acquireTokenByRefreshToken, validRequest.correlationId);
    try {
      const refreshTokenClientConfig = await this.buildOauthClientConfiguration(validRequest.authority, validRequest.correlationId, validRequest.redirectUri || "", serverTelemetryManager, void 0, request.azureCloudOptions), refreshTokenClient = new RefreshTokenClient(refreshTokenClientConfig);
      return this.logger.verbose("Refresh token client created", validRequest.correlationId), 
      await refreshTokenClient.acquireToken(validRequest);
    } catch (e) {
      throw e instanceof AuthError && e.setCorrelationId(validRequest.correlationId), 
      serverTelemetryManager.cacheFailedRequest(e), e;
    }
  }
  async acquireTokenSilent(request) {
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      forceRefresh: request.forceRefresh || !1
    }, serverTelemetryManager = this.initializeServerTelemetryManager(ApiId_acquireTokenSilent, validRequest.correlationId, validRequest.forceRefresh);
    try {
      const silentFlowClientConfig = await this.buildOauthClientConfiguration(validRequest.authority, validRequest.correlationId, validRequest.redirectUri || "", serverTelemetryManager, void 0, request.azureCloudOptions), silentFlowClient = new SilentFlowClient(silentFlowClientConfig);
      return this.logger.verbose("Silent flow client created", validRequest.correlationId), 
      await silentFlowClient.acquireToken(validRequest);
    } catch (e) {
      throw e instanceof AuthError && e.setCorrelationId(validRequest.correlationId), 
      serverTelemetryManager.cacheFailedRequest(e), e;
    }
  }
  async acquireTokenByUsernamePassword(request) {
    this.logger.info("acquireTokenByUsernamePassword called", request.correlationId);
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request)
    }, serverTelemetryManager = this.initializeServerTelemetryManager(ApiId_acquireTokenByUsernamePassword, validRequest.correlationId);
    try {
      const usernamePasswordClientConfig = await this.buildOauthClientConfiguration(validRequest.authority, validRequest.correlationId, "", serverTelemetryManager, void 0, request.azureCloudOptions), usernamePasswordClient = new UsernamePasswordClient(usernamePasswordClientConfig);
      return this.logger.verbose("Username password client created", validRequest.correlationId), 
      await usernamePasswordClient.acquireToken(validRequest);
    } catch (e) {
      throw e instanceof AuthError && e.setCorrelationId(validRequest.correlationId), 
      serverTelemetryManager.cacheFailedRequest(e), e;
    }
  }
  getTokenCache() {
    return this.logger.info("getTokenCache called"), this.tokenCache;
  }
  validateState(state, cachedState) {
    if (!state) {
      throw NodeAuthError.createStateNotFoundError();
    }
    if (state !== cachedState) {
      throw createClientAuthError("state_mismatch");
    }
  }
  getLogger() {
    return this.logger;
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async buildOauthClientConfiguration(authority, requestCorrelationId, redirectUri, serverTelemetryManager, azureRegionConfiguration, azureCloudOptions) {
    this.logger.verbose("buildOauthClientConfiguration called", requestCorrelationId);
    const userAzureCloudOptions = azureCloudOptions || this.config.auth.azureCloudOptions, discoveredAuthority = await this.createAuthority(authority, requestCorrelationId, azureRegionConfiguration, userAzureCloudOptions);
    this.logger.info(`Building oauth client configuration with the following authority: ${discoveredAuthority.tokenEndpoint}.`, requestCorrelationId), 
    serverTelemetryManager?.updateRegionDiscoveryMetadata(discoveredAuthority.regionDiscoveryMetadata);
    return {
      authOptions: {
        clientId: this.config.auth.clientId,
        authority: discoveredAuthority,
        clientCapabilities: this.config.auth.clientCapabilities,
        redirectUri: redirectUri
      },
      loggerOptions: {
        logLevel: this.config.system.loggerOptions.logLevel,
        loggerCallback: this.config.system.loggerOptions.loggerCallback,
        piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled,
        correlationId: requestCorrelationId
      },
      cacheOptions: {
        claimsBasedCachingEnabled: this.config.cache.claimsBasedCachingEnabled
      },
      cryptoInterface: this.cryptoProvider,
      networkInterface: this.config.system.networkClient,
      storageInterface: this.storage,
      serverTelemetryManager: serverTelemetryManager,
      clientCredentials: {
        clientSecret: this.clientSecret,
        clientAssertion: await this.getClientAssertion(discoveredAuthority)
      },
      libraryInfo: {
        sku: Constants$1_MSAL_SKU,
        version: "2.16.2",
        cpu: process.arch || Constants$2.EMPTY_STRING,
        os: process.platform || Constants$2.EMPTY_STRING
      },
      telemetry: this.config.telemetry,
      persistencePlugin: this.config.cache.cachePlugin,
      serializableCache: this.tokenCache
    };
  }
  async getClientAssertion(authority) {
    return this.developerProvidedClientAssertion && (this.clientAssertion = ClientAssertion.fromAssertion(await getClientAssertion(this.developerProvidedClientAssertion, this.config.auth.clientId, authority.tokenEndpoint))), 
    this.clientAssertion && {
      assertion: this.clientAssertion.getJwt(this.cryptoProvider, this.config.auth.clientId, authority.tokenEndpoint),
      assertionType: Constants$1_JWT_BEARER_ASSERTION_TYPE
    };
  }
  async initializeBaseRequest(authRequest) {
    return this.logger.verbose("initializeRequestScopes called", authRequest.correlationId), 
    authRequest.authenticationScheme && authRequest.authenticationScheme === AuthenticationScheme.POP && this.logger.verbose("Authentication Scheme 'pop' is not supported yet, setting Authentication Scheme to 'Bearer' for request", authRequest.correlationId), 
    authRequest.authenticationScheme = AuthenticationScheme.BEARER, this.config.cache.claimsBasedCachingEnabled && authRequest.claims && !StringUtils.isEmptyObj(authRequest.claims) && (authRequest.requestedClaimsHash = await this.cryptoProvider.hashString(authRequest.claims)), 
    {
      ...authRequest,
      scopes: [ ...authRequest && authRequest.scopes || [], ...OIDC_DEFAULT_SCOPES ],
      correlationId: authRequest && authRequest.correlationId || this.cryptoProvider.createNewGuid(),
      authority: authRequest.authority || this.config.auth.authority
    };
  }
  initializeServerTelemetryManager(apiId, correlationId, forceRefresh) {
    const telemetryPayload = {
      clientId: this.config.auth.clientId,
      correlationId: correlationId,
      apiId: apiId,
      forceRefresh: forceRefresh || !1
    };
    return new ServerTelemetryManager(telemetryPayload, this.storage);
  }
  async createAuthority(authorityString, requestCorrelationId, azureRegionConfiguration, azureCloudOptions) {
    this.logger.verbose("createAuthority called", requestCorrelationId);
    const authorityUrl = Authority.generateAuthority(authorityString, azureCloudOptions), authorityOptions = {
      protocolMode: this.config.auth.protocolMode,
      knownAuthorities: this.config.auth.knownAuthorities,
      cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
      authorityMetadata: this.config.auth.authorityMetadata,
      azureRegionConfiguration: azureRegionConfiguration,
      skipAuthorityMetadataCache: this.config.auth.skipAuthorityMetadataCache
    };
    return createDiscoveredInstance(authorityUrl, this.config.system.networkClient, this.storage, authorityOptions, this.logger, requestCorrelationId);
  }
  clearCache() {
    this.storage.clear();
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class LoopbackClient {
  async listenForAuthCode(successTemplate, errorTemplate) {
    if (this.server) {
      throw NodeAuthError.createLoopbackServerAlreadyExistsError();
    }
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const url = req.url;
        if (!url) {
          return res.end(errorTemplate || "Error occurred loading redirectUrl"), void reject(NodeAuthError.createUnableToLoadRedirectUrlError());
        }
        if (url === Constants$2.FORWARD_SLASH) {
          return void res.end(successTemplate || "Auth code was successfully acquired. You can close this window now.");
        }
        const redirectUri = this.getRedirectUri(), authCodeResponse = getDeserializedResponse(new URL(url, redirectUri).search) || {};
        authCodeResponse.code && (res.writeHead(HttpStatus_REDIRECT, {
          location: redirectUri
        }), res.end()), authCodeResponse.error && res.end(errorTemplate || `Error occurred: ${authCodeResponse.error}`), 
        resolve(authCodeResponse);
      }), this.server.listen(0, "127.0.0.1");
    });
  }
  getRedirectUri() {
    if (!this.server || !this.server.listening) {
      throw NodeAuthError.createNoLoopbackServerExistsError();
    }
    const address = this.server.address();
    if (!address || "string" == typeof address || !address.port) {
      throw this.closeServer(), NodeAuthError.createInvalidLoopbackAddressTypeError();
    }
    const port = address && address.port;
    return `${Constants$1_HTTP_PROTOCOL}${Constants$1_LOCALHOST}:${port}`;
  }
  closeServer() {
    this.server && (this.server.close(), "function" == typeof this.server.closeAllConnections && this.server.closeAllConnections(), 
    this.server.unref(), this.server = void 0);
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class DeviceCodeClient extends BaseClient {
  constructor(configuration) {
    super(configuration);
  }
  async acquireToken(request) {
    const deviceCodeResponse = await this.getDeviceCode(request);
    request.deviceCodeCallback(deviceCodeResponse);
    const reqTimestamp = nowSeconds(), response = await this.acquireTokenWithDeviceCode(request, deviceCodeResponse), responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin);
    return responseHandler.validateTokenResponse(response), responseHandler.handleServerTokenResponse(response, this.authority, reqTimestamp, request);
  }
  async getDeviceCode(request) {
    const queryParametersString = this.createExtraQueryParameters(request), endpoint = UrlString.appendQueryString(this.authority.deviceCodeEndpoint, queryParametersString), queryString = this.createQueryString(request), headers = this.createTokenRequestHeaders(), thumbprint = {
      clientId: this.config.authOptions.clientId,
      authority: request.authority,
      scopes: request.scopes,
      claims: request.claims,
      authenticationScheme: request.authenticationScheme,
      resourceRequestMethod: request.resourceRequestMethod,
      resourceRequestUri: request.resourceRequestUri,
      shrClaims: request.shrClaims,
      sshKid: request.sshKid
    };
    return this.executePostRequestToDeviceCodeEndpoint(endpoint, queryString, headers, thumbprint, request.correlationId);
  }
  createExtraQueryParameters(request) {
    const parameterBuilder = new RequestParameterBuilder;
    return request.extraQueryParameters && parameterBuilder.addExtraQueryParameters(request.extraQueryParameters), 
    parameterBuilder.createQueryString();
  }
  async executePostRequestToDeviceCodeEndpoint(deviceCodeEndpoint, queryString, headers, thumbprint, correlationId) {
    const {body: {user_code: userCode, device_code: deviceCode, verification_uri: verificationUri, expires_in: expiresIn, interval: interval, message: message}} = await this.sendPostRequest(thumbprint, deviceCodeEndpoint, {
      body: queryString,
      headers: headers
    }, correlationId);
    return {
      userCode: userCode,
      deviceCode: deviceCode,
      verificationUri: verificationUri,
      expiresIn: expiresIn,
      interval: interval,
      message: message
    };
  }
  createQueryString(request) {
    const parameterBuilder = new RequestParameterBuilder;
    return parameterBuilder.addScopes(request.scopes), parameterBuilder.addClientId(this.config.authOptions.clientId), 
    request.extraQueryParameters && parameterBuilder.addExtraQueryParameters(request.extraQueryParameters), 
    (request.claims || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) && parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities), 
    parameterBuilder.createQueryString();
  }
  continuePolling(deviceCodeExpirationTime, userSpecifiedTimeout, userSpecifiedCancelFlag) {
    if (userSpecifiedCancelFlag) {
      throw this.logger.error("Token request cancelled by setting DeviceCodeRequest.cancel = true"), 
      createClientAuthError("device_code_polling_cancelled");
    }
    if (userSpecifiedTimeout && userSpecifiedTimeout < deviceCodeExpirationTime && nowSeconds() > userSpecifiedTimeout) {
      throw this.logger.error(`User defined timeout for device code polling reached. The timeout was set for ${userSpecifiedTimeout}`), 
      createClientAuthError("user_timeout_reached");
    }
    if (nowSeconds() > deviceCodeExpirationTime) {
      throw userSpecifiedTimeout && this.logger.verbose(`User specified timeout ignored as the device code has expired before the timeout elapsed. The user specified timeout was set for ${userSpecifiedTimeout}`), 
      this.logger.error(`Device code expired. Expiration time of device code was ${deviceCodeExpirationTime}`), 
      createClientAuthError("device_code_expired");
    }
    return !0;
  }
  async acquireTokenWithDeviceCode(request, deviceCodeResponse) {
    const queryParametersString = this.createTokenQueryParameters(request), endpoint = UrlString.appendQueryString(this.authority.tokenEndpoint, queryParametersString), requestBody = this.createTokenRequestBody(request, deviceCodeResponse), headers = this.createTokenRequestHeaders(), userSpecifiedTimeout = request.timeout ? nowSeconds() + request.timeout : void 0, deviceCodeExpirationTime = nowSeconds() + deviceCodeResponse.expiresIn, pollingIntervalMilli = 1e3 * deviceCodeResponse.interval;
    for (;this.continuePolling(deviceCodeExpirationTime, userSpecifiedTimeout, request.cancel); ) {
      const thumbprint = {
        clientId: this.config.authOptions.clientId,
        authority: request.authority,
        scopes: request.scopes,
        claims: request.claims,
        authenticationScheme: request.authenticationScheme,
        resourceRequestMethod: request.resourceRequestMethod,
        resourceRequestUri: request.resourceRequestUri,
        shrClaims: request.shrClaims,
        sshKid: request.sshKid
      }, response = await this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint, request.correlationId);
      if (!response.body || !response.body.error) {
        return this.logger.verbose("Authorization completed successfully. Polling stopped."), 
        response.body;
      }
      if (response.body.error !== Constants$2.AUTHORIZATION_PENDING) {
        throw this.logger.info("Unexpected error in polling from the server"), createAuthError("post_request_failed", response.body.error);
      }
      this.logger.info("Authorization pending. Continue polling."), await delay(pollingIntervalMilli);
    }
    throw this.logger.error("Polling stopped for unknown reasons."), createClientAuthError("device_code_unknown_error");
  }
  createTokenRequestBody(request, deviceCodeResponse) {
    const requestParameters = new RequestParameterBuilder;
    requestParameters.addScopes(request.scopes), requestParameters.addClientId(this.config.authOptions.clientId), 
    requestParameters.addGrantType(GrantType_DEVICE_CODE_GRANT), requestParameters.addDeviceCode(deviceCodeResponse.deviceCode);
    const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
    return requestParameters.addCorrelationId(correlationId), requestParameters.addClientInfo(), 
    requestParameters.addLibraryInfo(this.config.libraryInfo), requestParameters.addApplicationTelemetry(this.config.telemetry.application), 
    requestParameters.addThrottling(), this.serverTelemetryManager && requestParameters.addServerTelemetry(this.serverTelemetryManager), 
    (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) && requestParameters.addClaims(request.claims, this.config.authOptions.clientCapabilities), 
    requestParameters.createQueryString();
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ class PublicClientApplication extends ClientApplication {
  constructor(configuration) {
    super(configuration), this.config.broker.nativeBrokerPlugin && (this.config.broker.nativeBrokerPlugin.isBrokerAvailable ? (this.nativeBrokerPlugin = this.config.broker.nativeBrokerPlugin, 
    this.nativeBrokerPlugin.setLogger(this.config.system.loggerOptions)) : this.logger.warning("NativeBroker implementation was provided but the broker is unavailable.")), 
    this.skus = ServerTelemetryManager.makeExtraSkuString({
      libraryName: Constants$1_MSAL_SKU,
      libraryVersion: "2.16.2"
    });
  }
  async acquireTokenByDeviceCode(request) {
    this.logger.info("acquireTokenByDeviceCode called", request.correlationId);
    const validRequest = Object.assign(request, await this.initializeBaseRequest(request)), serverTelemetryManager = this.initializeServerTelemetryManager(ApiId_acquireTokenByDeviceCode, validRequest.correlationId);
    try {
      const deviceCodeConfig = await this.buildOauthClientConfiguration(validRequest.authority, validRequest.correlationId, "", serverTelemetryManager, void 0, request.azureCloudOptions), deviceCodeClient = new DeviceCodeClient(deviceCodeConfig);
      return this.logger.verbose("Device code client created", validRequest.correlationId), 
      await deviceCodeClient.acquireToken(validRequest);
    } catch (e) {
      throw e instanceof AuthError && e.setCorrelationId(validRequest.correlationId), 
      serverTelemetryManager.cacheFailedRequest(e), e;
    }
  }
  async acquireTokenInteractive(request) {
    const correlationId = request.correlationId || this.cryptoProvider.createNewGuid();
    this.logger.trace("acquireTokenInteractive called", correlationId);
    const {openBrowser: openBrowser, successTemplate: successTemplate, errorTemplate: errorTemplate, windowHandle: windowHandle, loopbackClient: customLoopbackClient, ...remainingProperties} = request;
    if (this.nativeBrokerPlugin) {
      const brokerRequest = {
        ...remainingProperties,
        clientId: this.config.auth.clientId,
        scopes: request.scopes || OIDC_DEFAULT_SCOPES,
        redirectUri: `${Constants$1_HTTP_PROTOCOL}${Constants$1_LOCALHOST}`,
        authority: request.authority || this.config.auth.authority,
        correlationId: correlationId,
        extraParameters: {
          ...remainingProperties.extraQueryParameters,
          ...remainingProperties.tokenQueryParameters,
          [X_CLIENT_EXTRA_SKU]: this.skus
        },
        accountId: remainingProperties.account?.nativeAccountId
      };
      return this.nativeBrokerPlugin.acquireTokenInteractive(brokerRequest, windowHandle);
    }
    const {verifier: verifier, challenge: challenge} = await this.cryptoProvider.generatePkceCodes(), loopbackClient = customLoopbackClient || new LoopbackClient;
    let authCodeResponse = {}, authCodeListenerError = null;
    try {
      const authCodeListener = loopbackClient.listenForAuthCode(successTemplate, errorTemplate).then(response => {
        authCodeResponse = response;
      }).catch(e => {
        authCodeListenerError = e;
      }), redirectUri = await this.waitForRedirectUri(loopbackClient), validRequest = {
        ...remainingProperties,
        correlationId: correlationId,
        scopes: request.scopes || OIDC_DEFAULT_SCOPES,
        redirectUri: redirectUri,
        responseMode: ResponseMode.QUERY,
        codeChallenge: challenge,
        codeChallengeMethod: CodeChallengeMethodValues.S256
      }, authCodeUrl = await this.getAuthCodeUrl(validRequest);
      if (await openBrowser(authCodeUrl), await authCodeListener, authCodeListenerError) {
        throw authCodeListenerError;
      }
      if (authCodeResponse.error) {
        throw new ServerError(authCodeResponse.error, authCodeResponse.error_description, authCodeResponse.suberror);
      }
      if (!authCodeResponse.code) {
        throw NodeAuthError.createNoAuthCodeInResponseError();
      }
      const clientInfo = authCodeResponse.client_info, tokenRequest = {
        code: authCodeResponse.code,
        codeVerifier: verifier,
        clientInfo: clientInfo || Constants$2.EMPTY_STRING,
        ...validRequest
      };
      return await this.acquireTokenByCode(tokenRequest);
    } finally {
      loopbackClient.closeServer();
    }
  }
  async acquireTokenSilent(request) {
    const correlationId = request.correlationId || this.cryptoProvider.createNewGuid();
    if (this.logger.trace("acquireTokenSilent called", correlationId), this.nativeBrokerPlugin) {
      const brokerRequest = {
        ...request,
        clientId: this.config.auth.clientId,
        scopes: request.scopes || OIDC_DEFAULT_SCOPES,
        redirectUri: `${Constants$1_HTTP_PROTOCOL}${Constants$1_LOCALHOST}`,
        authority: request.authority || this.config.auth.authority,
        correlationId: correlationId,
        extraParameters: {
          ...request.tokenQueryParameters,
          [X_CLIENT_EXTRA_SKU]: this.skus
        },
        accountId: request.account.nativeAccountId,
        forceRefresh: request.forceRefresh || !1
      };
      return this.nativeBrokerPlugin.acquireTokenSilent(brokerRequest);
    }
    return super.acquireTokenSilent(request);
  }
  async signOut(request) {
    if (this.nativeBrokerPlugin && request.account.nativeAccountId) {
      const signoutRequest = {
        clientId: this.config.auth.clientId,
        accountId: request.account.nativeAccountId,
        correlationId: request.correlationId || this.cryptoProvider.createNewGuid()
      };
      await this.nativeBrokerPlugin.signOut(signoutRequest);
    }
    await this.getTokenCache().removeAccount(request.account);
  }
  async getAllAccounts() {
    if (this.nativeBrokerPlugin) {
      const correlationId = this.cryptoProvider.createNewGuid();
      return this.nativeBrokerPlugin.getAllAccounts(this.config.auth.clientId, correlationId);
    }
    return this.getTokenCache().getAllAccounts();
  }
  async waitForRedirectUri(loopbackClient) {
    return new Promise((resolve, reject) => {
      let ticks = 0;
      const id = setInterval(() => {
        if (LOOPBACK_SERVER_CONSTANTS_TIMEOUT_MS / LOOPBACK_SERVER_CONSTANTS_INTERVAL_MS < ticks) {
          return clearInterval(id), void reject(NodeAuthError.createLoopbackServerTimeoutError());
        }
        try {
          const r = loopbackClient.getRedirectUri();
          return clearInterval(id), void resolve(r);
        } catch (e) {
          return e instanceof AuthError && e.errorCode === NodeAuthErrorMessage_noLoopbackServerExists.code ? void ticks++ : (clearInterval(id), 
          void reject(e));
        }
      }, LOOPBACK_SERVER_CONSTANTS_INTERVAL_MS);
    });
  }
}

/*! @azure/msal-node v2.16.2 2024-11-19 */ process.env.ProgramData, process.env.ProgramFiles;

let DataView$1 = class {
  constructor(buffer) {
    if (function(buffer) {
      return "object" != typeof buffer || void 0 === buffer.length || void 0 === buffer.readUInt8 || void 0 === buffer.readUInt16LE || void 0 === buffer.readUInt16BE || void 0 === buffer.readUInt32LE || void 0 === buffer.readUInt32BE || void 0 === buffer.readInt32LE || void 0 === buffer.readInt32BE;
    }(buffer)) {
      throw new Error("DataView: Passed buffer type is unsupported.");
    }
    this.buffer = buffer, this.byteLength = this.buffer.length;
  }
  getUint8(offset) {
    return this.buffer.readUInt8(offset);
  }
  getUint16(offset, littleEndian) {
    return littleEndian ? this.buffer.readUInt16LE(offset) : this.buffer.readUInt16BE(offset);
  }
  getUint32(offset, littleEndian) {
    return littleEndian ? this.buffer.readUInt32LE(offset) : this.buffer.readUInt32BE(offset);
  }
  getInt32(offset, littleEndian) {
    return littleEndian ? this.buffer.readInt32LE(offset) : this.buffer.readInt32BE(offset);
  }
};

function getDataView$1(data, byteOffset, byteLength) {
  try {
    return new DataView(data, byteOffset, byteLength);
  } catch (error) {
    return new DataView$1(data, byteOffset, byteLength);
  }
}

function getStringFromDataView(dataView, offset, length) {
  const chars = [];
  for (let i = 0; i < length && offset + i < dataView.byteLength; i++) {
    chars.push(dataView.getUint8(offset + i));
  }
  return getStringValueFromArray(chars);
}

function getNullTerminatedStringFromDataView(dataView, offset) {
  const chars = [];
  let i = 0;
  for (;offset + i < dataView.byteLength; ) {
    const char = dataView.getUint8(offset + i);
    if (0 === char) {
      break;
    }
    chars.push(char), i++;
  }
  return getStringValueFromArray(chars);
}

function getUnicodeStringFromDataView(dataView, offset, length) {
  const chars = [];
  for (let i = 0; i < length && offset + i < dataView.byteLength; i += 2) {
    chars.push(dataView.getUint16(offset + i));
  }
  return 0 === chars[chars.length - 1] && chars.pop(), getStringValueFromArray(chars);
}

function getPascalStringFromDataView(dataView, offset) {
  const size = dataView.getUint8(offset);
  return [ size, getStringFromDataView(dataView, offset + 1, size) ];
}

function getStringValueFromArray(charArray) {
  return charArray.map(charCode => String.fromCharCode(charCode)).join("");
}

function objectAssign() {
  for (let i = 1; i < arguments.length; i++) {
    for (const property in arguments[i]) {
      arguments[0][property] = arguments[i][property];
    }
  }
  return arguments[0];
}

function deferInit(object, key, initializer) {
  let initialized = !1;
  Object.defineProperty(object, key, {
    get: () => (initialized || (initialized = !0, Object.defineProperty(object, key, {
      configurable: !0,
      enumerable: !0,
      value: initializer.apply(object),
      writable: !0
    })), object[key]),
    configurable: !0,
    enumerable: !0
  });
}

function getBase64Image(image) {
  return "undefined" != typeof btoa ? "string" == typeof image ? btoa(image) : btoa(Array.prototype.reduce.call(new Uint8Array(image), (data, byte) => data + String.fromCharCode(byte), "")) : "undefined" != typeof Buffer ? void 0 !== Buffer.from ? Buffer.from(image).toString("base64") : new Buffer(image).toString("base64") : void 0;
}

function strRepeat(string, num) {
  return new Array(num + 1).join(string);
}

function decompress(dataView, compressionMethod, encoding, returnType = "string") {
  if (0 === compressionMethod && "function" == typeof DecompressionStream) {
    const decompressionStream = new DecompressionStream("deflate"), decompressedStream = new Blob([ dataView ]).stream().pipeThrough(decompressionStream);
    return "dataview" === returnType ? new Response(decompressedStream).arrayBuffer().then(arrayBuffer => new DataView(arrayBuffer)) : new Response(decompressedStream).arrayBuffer().then(buffer => new TextDecoder(encoding).decode(buffer));
  }
  return void 0 !== compressionMethod ? Promise.reject(`Unknown compression method ${compressionMethod}.`) : dataView;
}

var Constants_USE_EXIF = !0, Constants_USE_IPTC = !0;

function getStringValue(value) {
  return value.map(charCode => String.fromCharCode(charCode)).join("");
}

function getEncodedString(value) {
  if (value.length >= 8) {
    const encoding = getStringValue(value.slice(0, 8));
    if ("ASCII\0\0\0" === encoding) {
      return getStringValue(value.slice(8));
    }
    if ("JIS\0\0\0\0\0" === encoding) {
      return "[JIS encoded text]";
    }
    if ("UNICODE\0" === encoding) {
      return "[Unicode encoded text]";
    }
    if ("\0\0\0\0\0\0\0\0" === encoding) {
      return "[Undefined encoding]";
    }
  }
  return "Undefined";
}

function getCalculatedGpsValue(value) {
  return value[0][0] / value[0][1] + value[1][0] / value[1][1] / 60 + value[2][0] / value[2][1] / 3600;
}

var ByteOrder = {
  BIG_ENDIAN: 19789,
  LITTLE_ENDIAN: 18761,
  getByteOrder: function(dataView, tiffHeaderOffset) {
    if (18761 === dataView.getUint16(tiffHeaderOffset)) {
      return 18761;
    }
    if (19789 === dataView.getUint16(tiffHeaderOffset)) {
      return 19789;
    }
    throw new Error("Illegal byte order value. Faulty image.");
  }
};

var Tiff = {
  isTiffFile: function(dataView) {
    return !!dataView && dataView.byteLength >= 4 && function(dataView) {
      const TIFF_ID = 42, TIFF_ID_OFFSET = 2, littleEndian = dataView.getUint16(0) === ByteOrder.LITTLE_ENDIAN;
      return dataView.getUint16(TIFF_ID_OFFSET, littleEndian) === TIFF_ID;
    }(dataView);
  },
  findTiffOffsets: function() {
    return {
      hasAppMarkers: !0,
      tiffHeaderOffset: 0
    };
  }
};

var Jpeg = {
  isJpegFile: function(dataView) {
    return !!dataView && dataView.byteLength >= MIN_JPEG_DATA_BUFFER_LENGTH && dataView.getUint16(0) === JPEG_ID;
  },
  findJpegOffsets: function(dataView) {
    let fieldLength, sof0DataOffset, sof2DataOffset, jfifDataOffset, tiffHeaderOffset, iptcDataOffset, xmpChunks, iccChunks, mpfDataOffset, appMarkerPosition = JPEG_ID_SIZE;
    for (;appMarkerPosition + APP_ID_OFFSET + 5 <= dataView.byteLength; ) {
      if (isSOF0Marker(dataView, appMarkerPosition)) {
        fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE), sof0DataOffset = appMarkerPosition + APP_MARKER_SIZE;
      } else if (isSOF2Marker(dataView, appMarkerPosition)) {
        fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE), sof2DataOffset = appMarkerPosition + APP_MARKER_SIZE;
      } else if (isApp0JfifMarker(dataView, appMarkerPosition)) {
        fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE), jfifDataOffset = appMarkerPosition + JFIF_DATA_OFFSET;
      } else if (isApp1ExifMarker(dataView, appMarkerPosition)) {
        fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE), tiffHeaderOffset = appMarkerPosition + TIFF_HEADER_OFFSET;
      } else if (isApp1XmpMarker(dataView, appMarkerPosition)) {
        xmpChunks || (xmpChunks = []), fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE), 
        xmpChunks.push(getXmpChunkDetails(appMarkerPosition, fieldLength));
      } else if (isApp1ExtendedXmpMarker(dataView, appMarkerPosition)) {
        xmpChunks || (xmpChunks = []), fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE), 
        xmpChunks.push(getExtendedXmpChunkDetails(appMarkerPosition, fieldLength));
      } else if (isApp13PhotoshopMarker(dataView, appMarkerPosition)) {
        fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE), iptcDataOffset = appMarkerPosition + IPTC_DATA_OFFSET;
      } else if (isApp2ICCMarker(dataView, appMarkerPosition)) {
        fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
        const iccDataOffset = appMarkerPosition + APP2_ICC_DATA_OFFSET, iccDataLength = fieldLength - (APP2_ICC_DATA_OFFSET - APP_MARKER_SIZE), iccChunkNumber = dataView.getUint8(appMarkerPosition + ICC_CHUNK_NUMBER_OFFSET), iccChunksTotal = dataView.getUint8(appMarkerPosition + ICC_TOTAL_CHUNKS_OFFSET);
        iccChunks || (iccChunks = []), iccChunks.push({
          offset: iccDataOffset,
          length: iccDataLength,
          chunkNumber: iccChunkNumber,
          chunksTotal: iccChunksTotal
        });
      } else if (isApp2MPFMarker(dataView, appMarkerPosition)) {
        fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE), mpfDataOffset = appMarkerPosition + MPF_DATA_OFFSET;
      } else {
        if (!isAppMarker(dataView, appMarkerPosition)) {
          if (isFillByte(dataView, appMarkerPosition)) {
            appMarkerPosition++;
            continue;
          }
          break;
        }
        fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      }
      appMarkerPosition += APP_MARKER_SIZE + fieldLength;
    }
    return {
      hasAppMarkers: appMarkerPosition > JPEG_ID_SIZE,
      fileDataOffset: sof0DataOffset || sof2DataOffset,
      jfifDataOffset: jfifDataOffset,
      tiffHeaderOffset: tiffHeaderOffset,
      iptcDataOffset: iptcDataOffset,
      xmpChunks: xmpChunks,
      iccChunks: iccChunks,
      mpfDataOffset: mpfDataOffset
    };
  }
};

const MIN_JPEG_DATA_BUFFER_LENGTH = 2, JPEG_ID = 65496, JPEG_ID_SIZE = 2, APP_ID_OFFSET = 4, APP_MARKER_SIZE = 2, JFIF_DATA_OFFSET = 2, TIFF_HEADER_OFFSET = 10, IPTC_DATA_OFFSET = 18, XMP_DATA_OFFSET = 33, XMP_EXTENDED_DATA_OFFSET = 79, APP2_ICC_DATA_OFFSET = 18, MPF_DATA_OFFSET = 8, APP2_ICC_IDENTIFIER = "ICC_PROFILE\0", ICC_CHUNK_NUMBER_OFFSET = APP_ID_OFFSET + APP2_ICC_IDENTIFIER.length, ICC_TOTAL_CHUNKS_OFFSET = ICC_CHUNK_NUMBER_OFFSET + 1, APP2_MPF_IDENTIFIER = "MPF\0", SOF0_MARKER = 65472, SOF2_MARKER = 65474, DHT_MARKER = 65476, DQT_MARKER = 65499, DRI_MARKER = 65501, SOS_MARKER = 65498, APP0_MARKER = 65504, APP1_MARKER = 65505, APP2_MARKER = 65506, APP13_MARKER = 65517, APP15_MARKER = 65519, COMMENT_MARKER = 65534, FILL_BYTE = 65535, APP0_JFIF_IDENTIFIER = "JFIF", APP1_EXIF_IDENTIFIER = "Exif", APP1_XMP_IDENTIFIER = "http://ns.adobe.com/xap/1.0/\0", APP1_XMP_EXTENDED_IDENTIFIER = "http://ns.adobe.com/xmp/extension/\0", APP13_IPTC_IDENTIFIER = "Photoshop 3.0";

function isSOF0Marker(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === SOF0_MARKER;
}

function isSOF2Marker(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === SOF2_MARKER;
}

function isApp2ICCMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP2_ICC_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP2_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP2_ICC_IDENTIFIER;
}

function isApp2MPFMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP2_MPF_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP2_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP2_MPF_IDENTIFIER;
}

function isApp0JfifMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP0_JFIF_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP0_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP0_JFIF_IDENTIFIER && 0 === dataView.getUint8(appMarkerPosition + APP_ID_OFFSET + markerIdLength);
}

function isApp1ExifMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP1_EXIF_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP1_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP1_EXIF_IDENTIFIER && 0 === dataView.getUint8(appMarkerPosition + APP_ID_OFFSET + markerIdLength);
}

function isApp1XmpMarker(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === APP1_MARKER && function(dataView, appMarkerPosition) {
    const markerIdLength = APP1_XMP_IDENTIFIER.length;
    return getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP1_XMP_IDENTIFIER;
  }(dataView, appMarkerPosition);
}

function isApp1ExtendedXmpMarker(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === APP1_MARKER && function(dataView, appMarkerPosition) {
    const markerIdLength = APP1_XMP_EXTENDED_IDENTIFIER.length;
    return getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP1_XMP_EXTENDED_IDENTIFIER;
  }(dataView, appMarkerPosition);
}

function getXmpChunkDetails(appMarkerPosition, fieldLength) {
  return {
    dataOffset: appMarkerPosition + XMP_DATA_OFFSET,
    length: fieldLength - (XMP_DATA_OFFSET - APP_MARKER_SIZE)
  };
}

function getExtendedXmpChunkDetails(appMarkerPosition, fieldLength) {
  return {
    dataOffset: appMarkerPosition + XMP_EXTENDED_DATA_OFFSET,
    length: fieldLength - (XMP_EXTENDED_DATA_OFFSET - APP_MARKER_SIZE)
  };
}

function isApp13PhotoshopMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP13_IPTC_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP13_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP13_IPTC_IDENTIFIER && 0 === dataView.getUint8(appMarkerPosition + APP_ID_OFFSET + markerIdLength);
}

function isAppMarker(dataView, appMarkerPosition) {
  const appMarker = dataView.getUint16(appMarkerPosition);
  return appMarker >= APP0_MARKER && appMarker <= APP15_MARKER || appMarker === COMMENT_MARKER || appMarker === SOF0_MARKER || appMarker === SOF2_MARKER || appMarker === DHT_MARKER || appMarker === DQT_MARKER || appMarker === DRI_MARKER || appMarker === SOS_MARKER;
}

function isFillByte(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === FILL_BYTE;
}

var Png = {
  isPngFile: function(dataView) {
    return !!dataView && getStringFromDataView(dataView, 0, PNG_ID.length) === PNG_ID;
  },
  findPngOffsets: function(dataView, async) {
    const offsets = {
      hasAppMarkers: !1
    };
    let offset = PNG_ID.length;
    for (;offset + PNG_CHUNK_LENGTH_SIZE + PNG_CHUNK_TYPE_SIZE <= dataView.byteLength; ) {
      if (isPngImageHeaderChunk(dataView, offset)) {
        offsets.hasAppMarkers = !0, offsets.pngHeaderOffset = offset + PNG_CHUNK_DATA_OFFSET;
      } else if (isPngXmpChunk(dataView, offset)) {
        const dataOffset = getPngXmpDataOffset(dataView, offset);
        void 0 !== dataOffset && (offsets.hasAppMarkers = !0, offsets.xmpChunks = [ {
          dataOffset: dataOffset,
          length: dataView.getUint32(offset + PNG_CHUNK_LENGTH_OFFSET) - (dataOffset - (offset + PNG_CHUNK_DATA_OFFSET))
        } ]);
      } else if (isPngTextChunk(dataView, offset, async)) {
        offsets.hasAppMarkers = !0;
        const chunkType = getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE);
        offsets.pngTextChunks || (offsets.pngTextChunks = []), offsets.pngTextChunks.push({
          length: dataView.getUint32(offset + PNG_CHUNK_LENGTH_OFFSET),
          type: chunkType,
          offset: offset + PNG_CHUNK_DATA_OFFSET
        });
      } else if (isPngExifChunk(dataView, offset)) {
        offsets.hasAppMarkers = !0, offsets.tiffHeaderOffset = offset + PNG_CHUNK_DATA_OFFSET;
      } else if (async && isPngIccpChunk(dataView, offset)) {
        offsets.hasAppMarkers = !0;
        const chunkDataLength = dataView.getUint32(offset + PNG_CHUNK_LENGTH_OFFSET), iccHeaderOffset = offset + PNG_CHUNK_DATA_OFFSET, {profileName: profileName, compressionMethod: compressionMethod, compressedProfileOffset: compressedProfileOffset} = parseIccHeader(dataView, iccHeaderOffset);
        offsets.iccChunks || (offsets.iccChunks = []), offsets.iccChunks.push({
          offset: compressedProfileOffset,
          length: chunkDataLength - (compressedProfileOffset - iccHeaderOffset),
          chunkNumber: 1,
          chunksTotal: 1,
          profileName: profileName,
          compressionMethod: compressionMethod
        });
      } else {
        isPngChunk(dataView, offset) && (offsets.hasAppMarkers = !0, offsets.pngChunkOffsets || (offsets.pngChunkOffsets = []), 
        offsets.pngChunkOffsets.push(offset + PNG_CHUNK_LENGTH_OFFSET));
      }
      offset += dataView.getUint32(offset + PNG_CHUNK_LENGTH_OFFSET) + PNG_CHUNK_LENGTH_SIZE + PNG_CHUNK_TYPE_SIZE + 4;
    }
    return offsets;
  }
};

const PNG_ID = "PNG\r\n\n", PNG_CHUNK_LENGTH_SIZE = 4, PNG_CHUNK_TYPE_SIZE = 4, PNG_CHUNK_LENGTH_OFFSET = 0, PNG_CHUNK_TYPE_OFFSET = PNG_CHUNK_LENGTH_SIZE, PNG_CHUNK_DATA_OFFSET = PNG_CHUNK_LENGTH_SIZE + PNG_CHUNK_TYPE_SIZE, PNG_XMP_PREFIX = "XML:com.adobe.xmp\0", TYPE_TEXT = "tEXt", TYPE_ITXT = "iTXt", TYPE_ZTXT = "zTXt", TYPE_PHYS = "pHYs", TYPE_TIME = "tIME", TYPE_EXIF = "eXIf", TYPE_ICCP = "iCCP";

function isPngImageHeaderChunk(dataView, offset) {
  return "IHDR" === getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE);
}

function isPngXmpChunk(dataView, offset) {
  return getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE) === TYPE_ITXT && getStringFromDataView(dataView, offset + PNG_CHUNK_DATA_OFFSET, PNG_XMP_PREFIX.length) === PNG_XMP_PREFIX;
}

function isPngTextChunk(dataView, offset, async) {
  const chunkType = getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE);
  return chunkType === TYPE_TEXT || chunkType === TYPE_ITXT || chunkType === TYPE_ZTXT && async;
}

function isPngExifChunk(dataView, offset) {
  return getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE) === TYPE_EXIF;
}

function isPngIccpChunk(dataView, offset) {
  return getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE) === TYPE_ICCP;
}

function isPngChunk(dataView, offset) {
  const SUPPORTED_PNG_CHUNK_TYPES = [ TYPE_PHYS, TYPE_TIME ], chunkType = getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE);
  return SUPPORTED_PNG_CHUNK_TYPES.includes(chunkType);
}

function getPngXmpDataOffset(dataView, offset) {
  offset += PNG_CHUNK_DATA_OFFSET + PNG_XMP_PREFIX.length + 1 + 1;
  let numberOfNullSeparators = 0;
  for (;numberOfNullSeparators < 2 && offset < dataView.byteLength; ) {
    0 === dataView.getUint8(offset) && numberOfNullSeparators++, offset++;
  }
  if (!(numberOfNullSeparators < 2)) {
    return offset;
  }
}

function parseIccHeader(dataView, offset) {
  const profileName = getNullTerminatedStringFromDataView(dataView, offset);
  offset += profileName.length + 1;
  return {
    profileName: profileName,
    compressionMethod: dataView.getUint8(offset),
    compressedProfileOffset: offset += 1
  };
}

function parseItemLocationBox(dataView, version, contentOffset, boxLength) {
  const {offsets: offsets, sizes: sizes} = function(version, contentOffset) {
    const sizes = {
      item: {
        dataReferenceIndex: 2,
        extentCount: 2,
        extent: {}
      }
    };
    version < 2 ? (sizes.itemCount = 2, sizes.item.itemId = 2) : 2 === version && (sizes.itemCount = 4, 
    sizes.item.itemId = 4);
    sizes.item.constructionMethod = 1 === version || 2 === version ? 2 : 0;
    const offsets = {
      offsetSize: contentOffset,
      lengthSize: contentOffset,
      baseOffsetSize: contentOffset + 1,
      indexSize: contentOffset + 1
    };
    return offsets.itemCount = contentOffset + 2, offsets.items = offsets.itemCount + sizes.itemCount, 
    offsets.item = {
      itemId: 0
    }, offsets.item.constructionMethod = offsets.item.itemId + sizes.item.itemId, offsets.item.dataReferenceIndex = offsets.item.constructionMethod + sizes.item.constructionMethod, 
    {
      offsets: offsets,
      sizes: sizes
    };
  }(version, contentOffset + 3), offsetSize = dataView.getUint8(offsets.offsetSize) >> 4;
  sizes.item.extent.extentOffset = offsetSize;
  const lengthSize = 15 & dataView.getUint8(offsets.lengthSize);
  sizes.item.extent.extentLength = lengthSize;
  const baseOffsetSize = dataView.getUint8(offsets.baseOffsetSize) >> 4;
  sizes.item.baseOffset = baseOffsetSize;
  const indexSize = function(dataView, offset, version) {
    if (1 === version || 2 === version) {
      return 15 & dataView.getUint8(offset);
    }
    return;
  }(dataView, offsets.indexSize, version);
  sizes.item.extent.extentIndex = void 0 !== indexSize ? indexSize : 0;
  const itemCount = function(dataView, offset, version) {
    if (version < 2) {
      return dataView.getUint16(offset);
    }
    if (2 === version) {
      return dataView.getUint32(offset);
    }
    return;
  }(dataView, offsets.itemCount, version);
  return {
    type: "iloc",
    items: getItems(dataView, version, offsets, sizes, offsetSize, lengthSize, indexSize, itemCount),
    length: boxLength
  };
}

function getItems(dataView, version, offsets, sizes, offsetSize, lengthSize, indexSize, itemCount) {
  if (void 0 === itemCount) {
    return [];
  }
  const items = [];
  let offset = offsets.items;
  for (let i = 0; i < itemCount; i++) {
    const item = {
      extents: []
    };
    item.itemId = getItemId(dataView, offset, version), offset += sizes.item.itemId, 
    item.constructionMethod = 1 === version || 2 === version ? 15 & dataView.getUint16(offset) : void 0, 
    offset += sizes.item.constructionMethod, item.dataReferenceIndex = dataView.getUint16(offset), 
    offset += sizes.item.dataReferenceIndex, item.baseOffset = getVariableSizedValue(dataView, offset, sizes.item.baseOffset), 
    offset += sizes.item.baseOffset, item.extentCount = dataView.getUint16(offset), 
    offset += sizes.item.extentCount;
    for (let j = 0; j < item.extentCount; j++) {
      const extent = {};
      extent.extentIndex = getExtentIndex(dataView, version, offset, indexSize), offset += sizes.item.extent.extentIndex, 
      extent.extentOffset = getVariableSizedValue(dataView, offset, offsetSize), offset += sizes.item.extent.extentOffset, 
      extent.extentLength = getVariableSizedValue(dataView, offset, lengthSize), offset += sizes.item.extent.extentLength, 
      item.extents.push(extent);
    }
    items.push(item);
  }
  return items;
}

function getItemId(dataView, offset, version) {
  return version < 2 ? dataView.getUint16(offset) : 2 === version ? dataView.getUint32(offset) : void 0;
}

function getExtentIndex(dataView, version, offset, indexSize) {
  if ((1 === version || 2 === version) && indexSize > 0) {
    return getVariableSizedValue(dataView, offset, indexSize);
  }
}

function getVariableSizedValue(dataView, offset, size) {
  return 4 === size ? dataView.getUint32(offset) : 8 === size ? (console.warn("This file uses an 8-bit offset which is currently not supported by ExifReader. Contact the maintainer to get it fixed."), 
  function(dataView, offset) {
    return dataView.getUint32(offset + 4);
  }(dataView, offset)) : 0;
}

function parseBox(dataView, offset) {
  const {length: length, contentOffset: contentOffset} = function(dataView, offset) {
    const BOX_LENGTH_SIZE = 4, BOX_TYPE_SIZE = 4, BOX_EXTENDED_SIZE = 8, BOX_EXTENDED_SIZE_LOW_OFFSET = 12, boxLength = dataView.getUint32(offset);
    if (function(boxLength) {
      return 0 === boxLength;
    }(boxLength)) {
      return {
        length: dataView.byteLength - offset,
        contentOffset: offset + BOX_LENGTH_SIZE + BOX_TYPE_SIZE
      };
    }
    if (function(boxLength) {
      return 1 === boxLength;
    }(boxLength) && function(dataView, offset) {
      const BOX_EXTENDED_SIZE_OFFSET = 8;
      return 0 === dataView.getUint32(offset + BOX_EXTENDED_SIZE_OFFSET);
    }(dataView, offset)) {
      return {
        length: dataView.getUint32(offset + BOX_EXTENDED_SIZE_LOW_OFFSET),
        contentOffset: offset + BOX_LENGTH_SIZE + BOX_TYPE_SIZE + BOX_EXTENDED_SIZE
      };
    }
    return {
      length: boxLength,
      contentOffset: offset + BOX_LENGTH_SIZE + BOX_TYPE_SIZE
    };
  }(dataView, offset);
  if (length < 8) {
    return;
  }
  const type = dataView.getUint32(offset + 4);
  if (1718909296 === type) {
    return function(dataView, contentOffset, boxLength) {
      const majorBrand = getStringFromDataView(dataView, contentOffset, 4);
      return {
        type: "ftyp",
        majorBrand: majorBrand,
        length: boxLength
      };
    }(dataView, contentOffset, length);
  }
  if (1768977008 === type) {
    return function(dataView, startOffset, contentOffset, length) {
      return {
        type: "iprp",
        subBoxes: parseSubBoxes(dataView, contentOffset, length - (contentOffset - startOffset)),
        length: length
      };
    }(dataView, offset, contentOffset, length);
  }
  if (1768973167 === type) {
    return function(dataView, startOffset, contentOffset, length) {
      return {
        type: "ipco",
        properties: parseSubBoxes(dataView, contentOffset, length - (contentOffset - startOffset)),
        length: length
      };
    }(dataView, offset, contentOffset, length);
  }
  if (1668246642 === type) {
    return function(dataView, contentOffset, length) {
      return {
        type: "colr",
        icc: parseIcc(dataView, contentOffset),
        length: length
      };
    }(dataView, contentOffset, length);
  }
  const version = dataView.getUint8(contentOffset);
  return 1835365473 === type ? function(dataView, startOffset, contentOffset, length) {
    const FLAGS_SIZE = 3;
    return {
      type: "meta",
      subBoxes: parseSubBoxes(dataView, contentOffset + FLAGS_SIZE, length - (contentOffset + FLAGS_SIZE - startOffset)),
      length: length
    };
  }(dataView, offset, contentOffset + 1, length) : 1768714083 === type ? parseItemLocationBox(dataView, version, contentOffset + 1, length) : 1768517222 === type ? function(dataView, startOffset, version, contentOffset, length) {
    const {offsets: offsets} = function(version, contentOffset) {
      const offsets = {
        entryCount: contentOffset + 3
      }, sizes = {};
      sizes.entryCount = 0 === version ? 2 : 4;
      return offsets.itemInfos = offsets.entryCount + sizes.entryCount, {
        offsets: offsets
      };
    }(version, contentOffset);
    return {
      type: "iinf",
      itemInfos: parseSubBoxes(dataView, offsets.itemInfos, length - (offsets.itemInfos - startOffset)),
      length: length
    };
  }(dataView, offset, version, contentOffset + 1, length) : 1768842853 === type ? function(dataView, startOffset, version, contentOffset, length) {
    contentOffset += 3;
    const entry = {
      type: "infe",
      length: length
    };
    0 !== version && 1 !== version || (entry.itemId = dataView.getUint16(contentOffset), 
    contentOffset += 2, entry.itemProtectionIndex = dataView.getUint16(contentOffset), 
    contentOffset += 2, entry.itemName = getNullTerminatedStringFromDataView(dataView, contentOffset), 
    contentOffset += entry.itemName.length + 1);
    version >= 2 && (2 === version ? (entry.itemId = dataView.getUint16(contentOffset), 
    contentOffset += 2) : 3 === version && (entry.itemId = dataView.getUint32(contentOffset), 
    contentOffset += 4), entry.itemProtectionIndex = dataView.getUint16(contentOffset), 
    contentOffset += 2, entry.itemType = dataView.getUint32(contentOffset), contentOffset += 4, 
    entry.itemName = getNullTerminatedStringFromDataView(dataView, contentOffset), contentOffset += entry.itemName.length + 1, 
    1835625829 === entry.itemType ? (entry.contentType = getNullTerminatedStringFromDataView(dataView, contentOffset), 
    startOffset + length > (contentOffset += entry.contentType.length + 1) && (entry.contentEncoding = getNullTerminatedStringFromDataView(dataView, contentOffset), 
    contentOffset += entry.contentEncoding.length + 1)) : 1970432288 === entry.itemType && (entry.itemUri = getNullTerminatedStringFromDataView(dataView, contentOffset), 
    contentOffset += entry.itemUri.length + 1));
    return entry;
  }(dataView, offset, version, contentOffset + 1, length) : {
    type: void 0,
    length: length
  };
}

function findOffsets$3(dataView) {
  {
    const offsets = {}, metaBox = function(dataView) {
      const BOX_LENGTH_SIZE = 4, BOX_TYPE_SIZE = 4;
      let offset = 0;
      for (;offset + BOX_LENGTH_SIZE + BOX_TYPE_SIZE <= dataView.byteLength; ) {
        const box = parseBox(dataView, offset);
        if (void 0 === box) {
          break;
        }
        if ("meta" === box.type) {
          return box;
        }
        offset += box.length;
      }
      return;
    }(dataView);
    return metaBox ? (offsets.tiffHeaderOffset = function(dataView, metaBox) {
      try {
        const exifItemId = function(metaBox) {
          return metaBox.subBoxes.find(box => "iinf" === box.type).itemInfos.find(itemInfo => 1165519206 === itemInfo.itemType);
        }(metaBox).itemId, ilocItem = findIlocItem(metaBox, exifItemId);
        return function(dataView, exifOffset) {
          return exifOffset + 4 + dataView.getUint32(exifOffset);
        }(dataView, ilocItem.baseOffset + ilocItem.extents[0].extentOffset);
      } catch (error) {
        return;
      }
    }(dataView, metaBox), offsets.xmpChunks = function(metaBox) {
      try {
        const xmpItemId = function(metaBox) {
          return metaBox.subBoxes.find(box => "iinf" === box.type).itemInfos.find(itemInfo => 1835625829 === itemInfo.itemType && "application/rdf+xml" === itemInfo.contentType);
        }(metaBox).itemId, ilocItem = findIlocItem(metaBox, xmpItemId), ilocItemExtent = findIlocItem(metaBox, xmpItemId).extents[0];
        return [ {
          dataOffset: ilocItem.baseOffset + ilocItemExtent.extentOffset,
          length: ilocItemExtent.extentLength
        } ];
      } catch (error) {
        return;
      }
    }(metaBox), offsets.iccChunks = function(metaBox) {
      try {
        const icc = metaBox.subBoxes.find(box => "iprp" === box.type).subBoxes.find(box => "ipco" === box.type).properties.find(box => "colr" === box.type).icc;
        if (icc) {
          return [ icc ];
        }
      } catch (error) {}
      return;
    }(metaBox), offsets.hasAppMarkers = void 0 !== offsets.tiffHeaderOffset || void 0 !== offsets.xmpChunks || void 0 !== offsets.iccChunks, 
    offsets) : {
      hasAppMarkers: !1
    };
  }
}

function findIlocItem(metaBox, itemId) {
  return metaBox.subBoxes.find(box => "iloc" === box.type).items.find(item => item.itemId === itemId);
}

function parseIcc(dataView, contentOffset) {
  const colorType = getStringFromDataView(dataView, contentOffset, 4);
  if ("prof" === colorType || "rICC" === colorType) {
    return {
      offset: contentOffset + 4,
      length: dataView.getUint32(contentOffset + 4),
      chunkNumber: 1,
      chunksTotal: 1
    };
  }
}

function parseSubBoxes(dataView, offset, length) {
  const ACCEPTED_ITEM_INFO_TYPES = [ 1165519206, 1835625829 ], subBoxes = [];
  let currentOffset = offset;
  for (;currentOffset < offset + length; ) {
    const box = parseBox(dataView, currentOffset);
    if (void 0 === box) {
      break;
    }
    void 0 === box.type || void 0 !== box.itemType && -1 === ACCEPTED_ITEM_INFO_TYPES.indexOf(box.itemType) || subBoxes.push(box), 
    currentOffset += box.length;
  }
  return subBoxes;
}

var Heic = {
  isHeicFile: function(dataView) {
    if (!dataView) {
      return !1;
    }
    const HEIC_MAJOR_BRANDS = [ "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1" ];
    try {
      const headerBox = parseBox(dataView, 0);
      return headerBox && -1 !== HEIC_MAJOR_BRANDS.indexOf(headerBox.majorBrand);
    } catch (error) {
      return !1;
    }
  },
  findHeicOffsets: function(dataView) {
    return findOffsets$3(dataView);
  }
};

var Avif = {
  isAvifFile: function(dataView) {
    if (!dataView) {
      return !1;
    }
    try {
      const headerBox = parseBox(dataView, 0);
      return headerBox && "avif" === headerBox.majorBrand;
    } catch (error) {
      return !1;
    }
  },
  findAvifOffsets: function(dataView) {
    return findOffsets$3(dataView);
  }
};

var Webp = {
  isWebpFile: function(dataView) {
    return !!dataView && "RIFF" === getStringFromDataView(dataView, 0, 4) && "WEBP" === getStringFromDataView(dataView, 8, 4);
  },
  findOffsets: function(dataView) {
    let tiffHeaderOffset, xmpChunks, iccChunks, vp8xChunkOffset, offset = 12, hasAppMarkers = !1;
    for (;offset + 8 < dataView.byteLength; ) {
      const chunkId = getStringFromDataView(dataView, offset, 4), chunkSize = dataView.getUint32(offset + 4, !0);
      "EXIF" === chunkId ? (hasAppMarkers = !0, tiffHeaderOffset = "Exif\0\0" === getStringFromDataView(dataView, offset + 8, 6) ? offset + 8 + 6 : offset + 8) : "XMP " === chunkId ? (hasAppMarkers = !0, 
      xmpChunks = [ {
        dataOffset: offset + 8,
        length: chunkSize
      } ]) : "ICCP" === chunkId ? (hasAppMarkers = !0, iccChunks = [ {
        offset: offset + 8,
        length: chunkSize,
        chunkNumber: 1,
        chunksTotal: 1
      } ]) : "VP8X" === chunkId && (hasAppMarkers = !0, vp8xChunkOffset = offset + 8), 
      offset += 8 + (chunkSize % 2 == 0 ? chunkSize : chunkSize + 1);
    }
    return {
      hasAppMarkers: hasAppMarkers,
      tiffHeaderOffset: tiffHeaderOffset,
      xmpChunks: xmpChunks,
      iccChunks: iccChunks,
      vp8xChunkOffset: vp8xChunkOffset
    };
  }
};

var Gif = {
  isGifFile: function(dataView) {
    return !!dataView && GIF_SIGNATURES.includes(getStringFromDataView(dataView, 0, GIF_SIGNATURE_SIZE));
  },
  findOffsets: function() {
    return {
      gifHeaderOffset: 0
    };
  }
};

const GIF_SIGNATURE_SIZE = 6, GIF_SIGNATURES = [ "GIF87a", "GIF89a" ];

var Xml = {
  isXMLFile: function(dataView) {
    return !!dataView && getStringFromDataView(dataView, XML_MARKER_OFFSET, XML_MARKER.length) === XML_MARKER;
  },
  findOffsets: function(dataView) {
    const xmpChunks = [];
    return xmpChunks.push({
      dataOffset: XML_MARKER_OFFSET,
      length: dataView.byteLength
    }), {
      xmpChunks: xmpChunks
    };
  }
};

const XML_MARKER_OFFSET = 0, XML_MARKER = "<?xpacket begin";

var ImageHeader = {
  parseAppMarkers: function(dataView, async) {
    if (Tiff.isTiffFile(dataView)) {
      return addFileType(Tiff.findTiffOffsets(), "tiff", "TIFF");
    }
    if (Jpeg.isJpegFile(dataView)) {
      return addFileType(Jpeg.findJpegOffsets(dataView), "jpeg", "JPEG");
    }
    if (Png.isPngFile(dataView)) {
      return addFileType(Png.findPngOffsets(dataView, async), "png", "PNG");
    }
    if (Heic.isHeicFile(dataView)) {
      return addFileType(Heic.findHeicOffsets(dataView), "heic", "HEIC");
    }
    if (Avif.isAvifFile(dataView)) {
      return addFileType(Avif.findAvifOffsets(dataView), "avif", "AVIF");
    }
    if (Webp.isWebpFile(dataView)) {
      return addFileType(Webp.findOffsets(dataView), "webp", "WebP");
    }
    if (Gif.isGifFile(dataView)) {
      return addFileType(Gif.findOffsets(dataView), "gif", "GIF");
    }
    if (Xml.isXMLFile(dataView)) {
      return addFileType(Xml.findOffsets(dataView), "xml", "XML");
    }
    throw new Error("Invalid image format");
  }
};

function addFileType(offsets, fileType, fileTypeDescription) {
  return objectAssign({}, offsets, {
    fileType: {
      value: fileType,
      description: fileTypeDescription
    }
  });
}

var TagNamesCommon = {
  ApertureValue: value => Math.pow(Math.sqrt(2), value[0] / value[1]).toFixed(2),
  ColorSpace: value => 1 === value ? "sRGB" : 65535 === value ? "Uncalibrated" : "Unknown",
  ComponentsConfiguration: value => value.map(character => 49 === character ? "Y" : 50 === character ? "Cb" : 51 === character ? "Cr" : 52 === character ? "R" : 53 === character ? "G" : 54 === character ? "B" : void 0).join(""),
  Contrast: value => 0 === value ? "Normal" : 1 === value ? "Soft" : 2 === value ? "Hard" : "Unknown",
  CustomRendered: value => 0 === value ? "Normal process" : 1 === value ? "Custom process" : "Unknown",
  ExposureMode: value => 0 === value ? "Auto exposure" : 1 === value ? "Manual exposure" : 2 === value ? "Auto bracket" : "Unknown",
  ExposureProgram: value => 0 === value ? "Undefined" : 1 === value ? "Manual" : 2 === value ? "Normal program" : 3 === value ? "Aperture priority" : 4 === value ? "Shutter priority" : 5 === value ? "Creative program" : 6 === value ? "Action program" : 7 === value ? "Portrait mode" : 8 === value ? "Landscape mode" : 9 === value ? "Bulb" : "Unknown",
  ExposureTime(value) {
    if (value[0] / value[1] > .25) {
      const decimal = value[0] / value[1];
      return Number.isInteger(decimal) ? "" + decimal : decimal.toFixed(1);
    }
    return 0 !== value[0] ? `1/${Math.round(value[1] / value[0])}` : `0/${value[1]}`;
  },
  FNumber: value => `f/${Number(value[0] / value[1]).toFixed(1)}`,
  FocalLength: value => value[0] / value[1] + " mm",
  FocalPlaneResolutionUnit: value => 2 === value ? "inches" : 3 === value ? "centimeters" : 4 === value ? "millimeters" : "Unknown",
  LightSource: value => 1 === value ? "Daylight" : 2 === value ? "Fluorescent" : 3 === value ? "Tungsten (incandescent light)" : 4 === value ? "Flash" : 9 === value ? "Fine weather" : 10 === value ? "Cloudy weather" : 11 === value ? "Shade" : 12 === value ? "Daylight fluorescent (D 5700 – 7100K)" : 13 === value ? "Day white fluorescent (N 4600 – 5400K)" : 14 === value ? "Cool white fluorescent (W 3900 – 4500K)" : 15 === value ? "White fluorescent (WW 3200 – 3700K)" : 17 === value ? "Standard light A" : 18 === value ? "Standard light B" : 19 === value ? "Standard light C" : 20 === value ? "D55" : 21 === value ? "D65" : 22 === value ? "D75" : 23 === value ? "D50" : 24 === value ? "ISO studio tungsten" : 255 === value ? "Other light source" : "Unknown",
  MeteringMode: value => 1 === value ? "Average" : 2 === value ? "CenterWeightedAverage" : 3 === value ? "Spot" : 4 === value ? "MultiSpot" : 5 === value ? "Pattern" : 6 === value ? "Partial" : 255 === value ? "Other" : "Unknown",
  ResolutionUnit: value => 2 === value ? "inches" : 3 === value ? "centimeters" : "Unknown",
  Saturation: value => 0 === value ? "Normal" : 1 === value ? "Low saturation" : 2 === value ? "High saturation" : "Unknown",
  FocalLengthIn35mmFilm: value => 0 === value ? "Unknown" : value + " mm",
  SceneCaptureType: value => 0 === value ? "Standard" : 1 === value ? "Landscape" : 2 === value ? "Portrait" : 3 === value ? "Night scene" : "Unknown",
  Sharpness: value => 0 === value ? "Normal" : 1 === value ? "Soft" : 2 === value ? "Hard" : "Unknown",
  ShutterSpeedValue(value) {
    const denominator = Math.pow(2, value[0] / value[1]);
    return denominator <= 1 ? `${Math.round(1 / denominator)}` : `1/${Math.round(denominator)}`;
  },
  WhiteBalance: value => 0 === value ? "Auto white balance" : 1 === value ? "Manual white balance" : "Unknown",
  XResolution: value => "" + Math.round(value[0] / value[1]),
  YResolution: value => "" + Math.round(value[0] / value[1])
}, TagNames0thIfd = {
  11: "ProcessingSoftware",
  254: {
    name: "SubfileType",
    description: value => ({
      0: "Full-resolution image",
      1: "Reduced-resolution image",
      2: "Single page of multi-page image",
      3: "Single page of multi-page reduced-resolution image",
      4: "Transparency mask",
      5: "Transparency mask of reduced-resolution image",
      6: "Transparency mask of multi-page image",
      7: "Transparency mask of reduced-resolution multi-page image",
      65537: "Alternate reduced-resolution image",
      4294967295: "Invalid"
    }[value] || "Unknown")
  },
  255: {
    name: "OldSubfileType",
    description: value => ({
      0: "Full-resolution image",
      1: "Reduced-resolution image",
      2: "Single page of multi-page image"
    }[value] || "Unknown")
  },
  256: "ImageWidth",
  257: "ImageLength",
  258: "BitsPerSample",
  259: "Compression",
  262: "PhotometricInterpretation",
  263: {
    name: "Thresholding",
    description: value => ({
      1: "No dithering or halftoning",
      2: "Ordered dither or halfton",
      3: "Randomized dither"
    }[value] || "Unknown")
  },
  264: "CellWidth",
  265: "CellLength",
  266: {
    name: "FillOrder",
    description: value => ({
      1: "Normal",
      2: "Reversed"
    }[value] || "Unknown")
  },
  269: "DocumentName",
  270: "ImageDescription",
  271: "Make",
  272: "Model",
  273: "StripOffsets",
  274: {
    name: "Orientation",
    description: value => 1 === value ? "top-left" : 2 === value ? "top-right" : 3 === value ? "bottom-right" : 4 === value ? "bottom-left" : 5 === value ? "left-top" : 6 === value ? "right-top" : 7 === value ? "right-bottom" : 8 === value ? "left-bottom" : "Undefined"
  },
  277: "SamplesPerPixel",
  278: "RowsPerStrip",
  279: "StripByteCounts",
  280: "MinSampleValue",
  281: "MaxSampleValue",
  282: {
    name: "XResolution",
    description: TagNamesCommon.XResolution
  },
  283: {
    name: "YResolution",
    description: TagNamesCommon.YResolution
  },
  284: "PlanarConfiguration",
  285: "PageName",
  286: {
    name: "XPosition",
    description: value => "" + Math.round(value[0] / value[1])
  },
  287: {
    name: "YPosition",
    description: value => "" + Math.round(value[0] / value[1])
  },
  290: {
    name: "GrayResponseUnit",
    description: value => ({
      1: "0.1",
      2: "0.001",
      3: "0.0001",
      4: "1e-05",
      5: "1e-06"
    }[value] || "Unknown")
  },
  296: {
    name: "ResolutionUnit",
    description: TagNamesCommon.ResolutionUnit
  },
  297: "PageNumber",
  301: "TransferFunction",
  305: "Software",
  306: "DateTime",
  315: "Artist",
  316: "HostComputer",
  317: "Predictor",
  318: {
    name: "WhitePoint",
    description: values => values.map(value => `${value[0]}/${value[1]}`).join(", ")
  },
  319: {
    name: "PrimaryChromaticities",
    description: values => values.map(value => `${value[0]}/${value[1]}`).join(", ")
  },
  321: "HalftoneHints",
  322: "TileWidth",
  323: "TileLength",
  330: "A100DataOffset",
  332: {
    name: "InkSet",
    description: value => ({
      1: "CMYK",
      2: "Not CMYK"
    }[value] || "Unknown")
  },
  337: "TargetPrinter",
  338: {
    name: "ExtraSamples",
    description: value => ({
      0: "Unspecified",
      1: "Associated Alpha",
      2: "Unassociated Alpha"
    }[value] || "Unknown")
  },
  339: {
    name: "SampleFormat",
    description: value => {
      const formats = {
        1: "Unsigned",
        2: "Signed",
        3: "Float",
        4: "Undefined",
        5: "Complex int",
        6: "Complex float"
      };
      return Array.isArray(value) ? value.map(sample => formats[sample] || "Unknown").join(", ") : "Unknown";
    }
  },
  513: "JPEGInterchangeFormat",
  514: "JPEGInterchangeFormatLength",
  529: {
    name: "YCbCrCoefficients",
    description: values => values.map(value => "" + value[0] / value[1]).join("/")
  },
  530: "YCbCrSubSampling",
  531: {
    name: "YCbCrPositioning",
    description: value => 1 === value ? "centered" : 2 === value ? "co-sited" : "undefined " + value
  },
  532: {
    name: "ReferenceBlackWhite",
    description: values => values.map(value => "" + value[0] / value[1]).join(", ")
  },
  700: "ApplicationNotes",
  18246: "Rating",
  18249: "RatingPercent",
  33432: {
    name: "Copyright",
    description: value => value.join("; ")
  },
  33550: "PixelScale",
  33723: "IPTC-NAA",
  33920: "IntergraphMatrix",
  33922: "ModelTiePoint",
  34118: "SEMInfo",
  34264: "ModelTransform",
  34377: "PhotoshopSettings",
  34665: "Exif IFD Pointer",
  34675: "ICC_Profile",
  34735: "GeoTiffDirectory",
  34736: "GeoTiffDoubleParams",
  34737: "GeoTiffAsciiParams",
  34853: "GPS Info IFD Pointer",
  40091: {
    name: "XPTitle",
    description: decodeXPValue
  },
  40092: {
    name: "XPComment",
    description: decodeXPValue
  },
  40093: {
    name: "XPAuthor",
    description: decodeXPValue
  },
  40094: {
    name: "XPKeywords",
    description: decodeXPValue
  },
  40095: {
    name: "XPSubject",
    description: decodeXPValue
  },
  42112: "GDALMetadata",
  42113: "GDALNoData",
  50341: "PrintIM",
  50707: "DNGBackwardVersion",
  50708: "UniqueCameraModel",
  50709: "LocalizedCameraModel",
  50721: "ColorMatrix1",
  50722: "ColorMatrix2",
  50723: "CameraCalibration1",
  50724: "CameraCalibration2",
  50725: "ReductionMatrix1",
  50726: "ReductionMatrix2",
  50727: "AnalogBalance",
  50728: "AsShotNeutral",
  50729: "AsShotWhiteXY",
  50730: "BaselineExposure",
  50731: "BaselineNoise",
  50732: "BaselineSharpness",
  50734: "LinearResponseLimit",
  50735: "CameraSerialNumber",
  50736: "DNGLensInfo",
  50739: "ShadowScale",
  50741: {
    name: "MakerNoteSafety",
    description: value => ({
      0: "Unsafe",
      1: "Safe"
    }[value] || "Unknown")
  },
  50778: {
    name: "CalibrationIlluminant1",
    description: TagNamesCommon.LightSource
  },
  50779: {
    name: "CalibrationIlluminant2",
    description: TagNamesCommon.LightSource
  },
  50781: "RawDataUniqueID",
  50827: "OriginalRawFileName",
  50828: "OriginalRawFileData",
  50831: "AsShotICCProfile",
  50832: "AsShotPreProfileMatrix",
  50833: "CurrentICCProfile",
  50834: "CurrentPreProfileMatrix",
  50879: "ColorimetricReference",
  50885: "SRawType",
  50898: "PanasonicTitle",
  50899: "PanasonicTitle2",
  50931: "CameraCalibrationSig",
  50932: "ProfileCalibrationSig",
  50933: "ProfileIFD",
  50934: "AsShotProfileName",
  50936: "ProfileName",
  50937: "ProfileHueSatMapDims",
  50938: "ProfileHueSatMapData1",
  50939: "ProfileHueSatMapData2",
  50940: "ProfileToneCurve",
  50941: {
    name: "ProfileEmbedPolicy",
    description: value => ({
      0: "Allow Copying",
      1: "Embed if Used",
      2: "Never Embed",
      3: "No Restrictions"
    }[value] || "Unknown")
  },
  50942: "ProfileCopyright",
  50964: "ForwardMatrix1",
  50965: "ForwardMatrix2",
  50966: "PreviewApplicationName",
  50967: "PreviewApplicationVersion",
  50968: "PreviewSettingsName",
  50969: "PreviewSettingsDigest",
  50970: {
    name: "PreviewColorSpace",
    description: value => ({
      1: "Gray Gamma 2.2",
      2: "sRGB",
      3: "Adobe RGB",
      4: "ProPhoto RGB"
    }[value] || "Unknown")
  },
  50971: "PreviewDateTime",
  50972: "RawImageDigest",
  50973: "OriginalRawFileDigest",
  50981: "ProfileLookTableDims",
  50982: "ProfileLookTableData",
  51043: "TimeCodes",
  51044: "FrameRate",
  51058: "TStop",
  51081: "ReelName",
  51089: "OriginalDefaultFinalSize",
  51090: "OriginalBestQualitySize",
  51091: "OriginalDefaultCropSize",
  51105: "CameraLabel",
  51107: {
    name: "ProfileHueSatMapEncoding",
    description: value => ({
      0: "Linear",
      1: "sRGB"
    }[value] || "Unknown")
  },
  51108: {
    name: "ProfileLookTableEncoding",
    description: value => ({
      0: "Linear",
      1: "sRGB"
    }[value] || "Unknown")
  },
  51109: "BaselineExposureOffset",
  51110: {
    name: "DefaultBlackRender",
    description: value => ({
      0: "Auto",
      1: "None"
    }[value] || "Unknown")
  },
  51111: "NewRawImageDigest",
  51112: "RawToPreviewGain"
};

function decodeXPValue(value) {
  return new TextDecoder("utf-16").decode(new Uint8Array(value)).replace(/\u0000+$/, "");
}

var TagNamesGpsIfd = {
  0: {
    name: "GPSVersionID",
    description: value => 2 === value[0] && 2 === value[1] && 0 === value[2] && 0 === value[3] ? "Version 2.2" : "Unknown"
  },
  1: {
    name: "GPSLatitudeRef",
    description: value => {
      const ref = value.join("");
      return "N" === ref ? "North latitude" : "S" === ref ? "South latitude" : "Unknown";
    }
  },
  2: {
    name: "GPSLatitude",
    description: getCalculatedGpsValue
  },
  3: {
    name: "GPSLongitudeRef",
    description: value => {
      const ref = value.join("");
      return "E" === ref ? "East longitude" : "W" === ref ? "West longitude" : "Unknown";
    }
  },
  4: {
    name: "GPSLongitude",
    description: getCalculatedGpsValue
  },
  5: {
    name: "GPSAltitudeRef",
    description: value => 0 === value ? "Sea level" : 1 === value ? "Sea level reference (negative value)" : "Unknown"
  },
  6: {
    name: "GPSAltitude",
    description: value => value[0] / value[1] + " m"
  },
  7: {
    name: "GPSTimeStamp",
    description: values => values.map(([numerator, denominator]) => {
      const num = numerator / denominator;
      return /^\d(\.|$)/.test(`${num}`) ? `0${num}` : num;
    }).join(":")
  },
  8: "GPSSatellites",
  9: {
    name: "GPSStatus",
    description: value => {
      const status = value.join("");
      return "A" === status ? "Measurement in progress" : "V" === status ? "Measurement Interoperability" : "Unknown";
    }
  },
  10: {
    name: "GPSMeasureMode",
    description: value => {
      const mode = value.join("");
      return "2" === mode ? "2-dimensional measurement" : "3" === mode ? "3-dimensional measurement" : "Unknown";
    }
  },
  11: "GPSDOP",
  12: {
    name: "GPSSpeedRef",
    description: value => {
      const ref = value.join("");
      return "K" === ref ? "Kilometers per hour" : "M" === ref ? "Miles per hour" : "N" === ref ? "Knots" : "Unknown";
    }
  },
  13: "GPSSpeed",
  14: {
    name: "GPSTrackRef",
    description: value => {
      const ref = value.join("");
      return "T" === ref ? "True direction" : "M" === ref ? "Magnetic direction" : "Unknown";
    }
  },
  15: "GPSTrack",
  16: {
    name: "GPSImgDirectionRef",
    description: value => {
      const ref = value.join("");
      return "T" === ref ? "True direction" : "M" === ref ? "Magnetic direction" : "Unknown";
    }
  },
  17: "GPSImgDirection",
  18: "GPSMapDatum",
  19: {
    name: "GPSDestLatitudeRef",
    description: value => {
      const ref = value.join("");
      return "N" === ref ? "North latitude" : "S" === ref ? "South latitude" : "Unknown";
    }
  },
  20: {
    name: "GPSDestLatitude",
    description: value => value[0][0] / value[0][1] + value[1][0] / value[1][1] / 60 + value[2][0] / value[2][1] / 3600
  },
  21: {
    name: "GPSDestLongitudeRef",
    description: value => {
      const ref = value.join("");
      return "E" === ref ? "East longitude" : "W" === ref ? "West longitude" : "Unknown";
    }
  },
  22: {
    name: "GPSDestLongitude",
    description: value => value[0][0] / value[0][1] + value[1][0] / value[1][1] / 60 + value[2][0] / value[2][1] / 3600
  },
  23: {
    name: "GPSDestBearingRef",
    description: value => {
      const ref = value.join("");
      return "T" === ref ? "True direction" : "M" === ref ? "Magnetic direction" : "Unknown";
    }
  },
  24: "GPSDestBearing",
  25: {
    name: "GPSDestDistanceRef",
    description: value => {
      const ref = value.join("");
      return "K" === ref ? "Kilometers" : "M" === ref ? "Miles" : "N" === ref ? "Knots" : "Unknown";
    }
  },
  26: "GPSDestDistance",
  27: {
    name: "GPSProcessingMethod",
    description: getEncodedString
  },
  28: {
    name: "GPSAreaInformation",
    description: getEncodedString
  },
  29: "GPSDateStamp",
  30: {
    name: "GPSDifferential",
    description: value => 0 === value ? "Measurement without differential correction" : 1 === value ? "Differential correction applied" : "Unknown"
  },
  31: "GPSHPositioningError"
}, TagNamesInteroperabilityIfd = {
  1: "InteroperabilityIndex",
  2: {
    name: "InteroperabilityVersion",
    description: value => getStringValue(value)
  },
  4096: "RelatedImageFileFormat",
  4097: "RelatedImageWidth",
  4098: "RelatedImageHeight"
}, TagNamesMpfIfd = {
  45056: {
    name: "MPFVersion",
    description: value => getStringValue(value)
  },
  45057: "NumberOfImages",
  45058: "MPEntry",
  45059: "ImageUIDList",
  45060: "TotalFrames"
};

const tagNames0thExifIfds = objectAssign({}, TagNames0thIfd, {
  33434: {
    name: "ExposureTime",
    description: TagNamesCommon.ExposureTime
  },
  33437: {
    name: "FNumber",
    description: TagNamesCommon.FNumber
  },
  34850: {
    name: "ExposureProgram",
    description: TagNamesCommon.ExposureProgram
  },
  34852: "SpectralSensitivity",
  34855: "ISOSpeedRatings",
  34856: {
    name: "OECF",
    description: () => "[Raw OECF table data]"
  },
  34858: "TimeZoneOffset",
  34859: "SelfTimerMode",
  34864: {
    name: "SensitivityType",
    description: value => ({
      1: "Standard Output Sensitivity",
      2: "Recommended Exposure Index",
      3: "ISO Speed",
      4: "Standard Output Sensitivity and Recommended Exposure Index",
      5: "Standard Output Sensitivity and ISO Speed",
      6: "Recommended Exposure Index and ISO Speed",
      7: "Standard Output Sensitivity, Recommended Exposure Index and ISO Speed"
    }[value] || "Unknown")
  },
  34865: "StandardOutputSensitivity",
  34866: "RecommendedExposureIndex",
  34867: "ISOSpeed",
  34868: "ISOSpeedLatitudeyyy",
  34869: "ISOSpeedLatitudezzz",
  36864: {
    name: "ExifVersion",
    description: value => getStringValue(value)
  },
  36867: "DateTimeOriginal",
  36868: "DateTimeDigitized",
  36873: "GooglePlusUploadCode",
  36880: "OffsetTime",
  36881: "OffsetTimeOriginal",
  36882: "OffsetTimeDigitized",
  37121: {
    name: "ComponentsConfiguration",
    description: TagNamesCommon.ComponentsConfiguration
  },
  37122: "CompressedBitsPerPixel",
  37377: {
    name: "ShutterSpeedValue",
    description: TagNamesCommon.ShutterSpeedValue
  },
  37378: {
    name: "ApertureValue",
    description: TagNamesCommon.ApertureValue
  },
  37379: "BrightnessValue",
  37380: "ExposureBiasValue",
  37381: {
    name: "MaxApertureValue",
    description: value => Math.pow(Math.sqrt(2), value[0] / value[1]).toFixed(2)
  },
  37382: {
    name: "SubjectDistance",
    description: value => value[0] / value[1] + " m"
  },
  37383: {
    name: "MeteringMode",
    description: TagNamesCommon.MeteringMode
  },
  37384: {
    name: "LightSource",
    description: TagNamesCommon.LightSource
  },
  37385: {
    name: "Flash",
    description: value => 0 === value ? "Flash did not fire" : 1 === value ? "Flash fired" : 5 === value ? "Strobe return light not detected" : 7 === value ? "Strobe return light detected" : 9 === value ? "Flash fired, compulsory flash mode" : 13 === value ? "Flash fired, compulsory flash mode, return light not detected" : 15 === value ? "Flash fired, compulsory flash mode, return light detected" : 16 === value ? "Flash did not fire, compulsory flash mode" : 24 === value ? "Flash did not fire, auto mode" : 25 === value ? "Flash fired, auto mode" : 29 === value ? "Flash fired, auto mode, return light not detected" : 31 === value ? "Flash fired, auto mode, return light detected" : 32 === value ? "No flash function" : 65 === value ? "Flash fired, red-eye reduction mode" : 69 === value ? "Flash fired, red-eye reduction mode, return light not detected" : 71 === value ? "Flash fired, red-eye reduction mode, return light detected" : 73 === value ? "Flash fired, compulsory flash mode, red-eye reduction mode" : 77 === value ? "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected" : 79 === value ? "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected" : 89 === value ? "Flash fired, auto mode, red-eye reduction mode" : 93 === value ? "Flash fired, auto mode, return light not detected, red-eye reduction mode" : 95 === value ? "Flash fired, auto mode, return light detected, red-eye reduction mode" : "Unknown"
  },
  37386: {
    name: "FocalLength",
    description: TagNamesCommon.FocalLength
  },
  37393: "ImageNumber",
  37394: {
    name: "SecurityClassification",
    description: value => ({
      C: "Confidential",
      R: "Restricted",
      S: "Secret",
      T: "Top Secret",
      U: "Unclassified"
    }[value] || "Unknown")
  },
  37395: "ImageHistory",
  37396: {
    name: "SubjectArea",
    description: value => 2 === value.length ? `Location; X: ${value[0]}, Y: ${value[1]}` : 3 === value.length ? `Circle; X: ${value[0]}, Y: ${value[1]}, diameter: ${value[2]}` : 4 === value.length ? `Rectangle; X: ${value[0]}, Y: ${value[1]}, width: ${value[2]}, height: ${value[3]}` : "Unknown"
  },
  37500: {
    name: "MakerNote",
    description: () => "[Raw maker note data]"
  },
  37510: {
    name: "UserComment",
    description: getEncodedString
  },
  37520: "SubSecTime",
  37521: "SubSecTimeOriginal",
  37522: "SubSecTimeDigitized",
  37724: "ImageSourceData",
  37888: {
    name: "AmbientTemperature",
    description: value => value[0] / value[1] + " °C"
  },
  37889: {
    name: "Humidity",
    description: value => value[0] / value[1] + " %"
  },
  37890: {
    name: "Pressure",
    description: value => value[0] / value[1] + " hPa"
  },
  37891: {
    name: "WaterDepth",
    description: value => value[0] / value[1] + " m"
  },
  37892: {
    name: "Acceleration",
    description: value => value[0] / value[1] + " mGal"
  },
  37893: {
    name: "CameraElevationAngle",
    description: value => value[0] / value[1] + " °"
  },
  40960: {
    name: "FlashpixVersion",
    description: value => value.map(charCode => String.fromCharCode(charCode)).join("")
  },
  40961: {
    name: "ColorSpace",
    description: TagNamesCommon.ColorSpace
  },
  40962: "PixelXDimension",
  40963: "PixelYDimension",
  40964: "RelatedSoundFile",
  40965: "Interoperability IFD Pointer",
  41483: "FlashEnergy",
  41484: {
    name: "SpatialFrequencyResponse",
    description: () => "[Raw SFR table data]"
  },
  41486: "FocalPlaneXResolution",
  41487: "FocalPlaneYResolution",
  41488: {
    name: "FocalPlaneResolutionUnit",
    description: TagNamesCommon.FocalPlaneResolutionUnit
  },
  41492: {
    name: "SubjectLocation",
    description: ([x, y]) => `X: ${x}, Y: ${y}`
  },
  41493: "ExposureIndex",
  41495: {
    name: "SensingMethod",
    description: value => 1 === value ? "Undefined" : 2 === value ? "One-chip color area sensor" : 3 === value ? "Two-chip color area sensor" : 4 === value ? "Three-chip color area sensor" : 5 === value ? "Color sequential area sensor" : 7 === value ? "Trilinear sensor" : 8 === value ? "Color sequential linear sensor" : "Unknown"
  },
  41728: {
    name: "FileSource",
    description: value => 3 === value ? "DSC" : "Unknown"
  },
  41729: {
    name: "SceneType",
    description: value => 1 === value ? "A directly photographed image" : "Unknown"
  },
  41730: {
    name: "CFAPattern",
    description: () => "[Raw CFA pattern table data]"
  },
  41985: {
    name: "CustomRendered",
    description: TagNamesCommon.CustomRendered
  },
  41986: {
    name: "ExposureMode",
    description: TagNamesCommon.ExposureMode
  },
  41987: {
    name: "WhiteBalance",
    description: TagNamesCommon.WhiteBalance
  },
  41988: {
    name: "DigitalZoomRatio",
    description: value => 0 === value[0] ? "Digital zoom was not used" : "" + value[0] / value[1]
  },
  41989: {
    name: "FocalLengthIn35mmFilm",
    description: TagNamesCommon.FocalLengthIn35mmFilm
  },
  41990: {
    name: "SceneCaptureType",
    description: TagNamesCommon.SceneCaptureType
  },
  41991: {
    name: "GainControl",
    description: value => 0 === value ? "None" : 1 === value ? "Low gain up" : 2 === value ? "High gain up" : 3 === value ? "Low gain down" : 4 === value ? "High gain down" : "Unknown"
  },
  41992: {
    name: "Contrast",
    description: TagNamesCommon.Contrast
  },
  41993: {
    name: "Saturation",
    description: TagNamesCommon.Saturation
  },
  41994: {
    name: "Sharpness",
    description: TagNamesCommon.Sharpness
  },
  41995: {
    name: "DeviceSettingDescription",
    description: () => "[Raw device settings table data]"
  },
  41996: {
    name: "SubjectDistanceRange",
    description: value => 1 === value ? "Macro" : 2 === value ? "Close view" : 3 === value ? "Distant view" : "Unknown"
  },
  42016: "ImageUniqueID",
  42032: "CameraOwnerName",
  42033: "BodySerialNumber",
  42034: {
    name: "LensSpecification",
    description: value => {
      const focalLengths = `${parseFloat((value[0][0] / value[0][1]).toFixed(5))}-${parseFloat((value[1][0] / value[1][1]).toFixed(5))} mm`;
      if (0 === value[3][1]) {
        return `${focalLengths} f/?`;
      }
      const maxAperture = 1 / (value[2][1] / value[2][1] / (value[3][0] / value[3][1]));
      return `${focalLengths} f/${parseFloat(maxAperture.toFixed(5))}`;
    }
  },
  42035: "LensMake",
  42036: "LensModel",
  42037: "LensSerialNumber",
  42080: {
    name: "CompositeImage",
    description: value => ({
      1: "Not a Composite Image",
      2: "General Composite Image",
      3: "Composite Image Captured While Shooting"
    }[value] || "Unknown")
  },
  42081: "SourceImageNumberOfCompositeImage",
  42082: "SourceExposureTimesOfCompositeImage",
  42240: "Gamma",
  59932: "Padding",
  59933: "OffsetSchema",
  65e3: "OwnerName",
  65001: "SerialNumber",
  65002: "Lens",
  65100: "RawFile",
  65101: "Converter",
  65102: "WhiteBalance",
  65105: "Exposure",
  65106: "Shadows",
  65107: "Brightness",
  65108: "Contrast",
  65109: "Saturation",
  65110: "Sharpness",
  65111: "Smoothness",
  65112: "MoireFilter"
}), IFD_TYPE_0TH = "0th", IFD_TYPE_1ST = "1st", IFD_TYPE_EXIF = "exif", IFD_TYPE_GPS = "gps", IFD_TYPE_INTEROPERABILITY = "interoperability", IFD_TYPE_MPF = "mpf", IFD_TYPE_CANON = "canon", IFD_TYPE_PENTAX = "pentax";

var TagNames$1 = {
  [IFD_TYPE_0TH]: tagNames0thExifIfds,
  [IFD_TYPE_1ST]: TagNames0thIfd,
  [IFD_TYPE_EXIF]: tagNames0thExifIfds,
  [IFD_TYPE_GPS]: TagNamesGpsIfd,
  [IFD_TYPE_INTEROPERABILITY]: TagNamesInteroperabilityIfd,
  [IFD_TYPE_MPF]: TagNamesMpfIfd,
  [IFD_TYPE_CANON]: {
    4: {
      name: "ShotInfo",
      description: value => value
    }
  },
  [IFD_TYPE_PENTAX]: {
    0: {
      name: "PentaxVersion",
      description: value => value.join(".")
    },
    5: "PentaxModelID",
    555: "LevelInfo"
  }
};

const typeSizes = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  7: 1,
  9: 4,
  10: 8,
  13: 4
}, tagTypes = {
  BYTE: 1,
  ASCII: 2,
  SHORT: 3,
  LONG: 4,
  RATIONAL: 5,
  UNDEFINED: 7,
  SLONG: 9,
  SRATIONAL: 10,
  IFD: 13
};

var Types = {
  getAsciiValue: function(charArray) {
    return charArray.map(charCode => String.fromCharCode(charCode));
  },
  getByteAt: getByteAt,
  getAsciiAt: function(dataView, offset) {
    return dataView.getUint8(offset);
  },
  getShortAt: function(dataView, offset, byteOrder) {
    return dataView.getUint16(offset, byteOrder === ByteOrder.LITTLE_ENDIAN);
  },
  getLongAt: getLongAt,
  getRationalAt: function(dataView, offset, byteOrder) {
    return [ getLongAt(dataView, offset, byteOrder), getLongAt(dataView, offset + 4, byteOrder) ];
  },
  getUndefinedAt: function(dataView, offset) {
    return getByteAt(dataView, offset);
  },
  getSlongAt: getSlongAt,
  getSrationalAt: function(dataView, offset, byteOrder) {
    return [ getSlongAt(dataView, offset, byteOrder), getSlongAt(dataView, offset + 4, byteOrder) ];
  },
  getIfdPointerAt: function(dataView, offset, byteOrder) {
    return getLongAt(dataView, offset, byteOrder);
  },
  typeSizes: typeSizes,
  tagTypes: tagTypes,
  getTypeSize: function(typeName) {
    if (void 0 === tagTypes[typeName]) {
      throw new Error("No such type found.");
    }
    return typeSizes[tagTypes[typeName]];
  }
};

function getByteAt(dataView, offset) {
  return dataView.getUint8(offset);
}

function getLongAt(dataView, offset, byteOrder) {
  return dataView.getUint32(offset, byteOrder === ByteOrder.LITTLE_ENDIAN);
}

function getSlongAt(dataView, offset, byteOrder) {
  return dataView.getInt32(offset, byteOrder === ByteOrder.LITTLE_ENDIAN);
}

const getTagValueAt = {
  1: Types.getByteAt,
  2: Types.getAsciiAt,
  3: Types.getShortAt,
  4: Types.getLongAt,
  5: Types.getRationalAt,
  7: Types.getUndefinedAt,
  9: Types.getSlongAt,
  10: Types.getSrationalAt,
  13: Types.getIfdPointerAt
};

function get0thIfdOffset(dataView, tiffHeaderOffset, byteOrder) {
  return tiffHeaderOffset + Types.getLongAt(dataView, tiffHeaderOffset + 4, byteOrder);
}

function readIfd(dataView, ifdType, offsetOrigin, offset, byteOrder, includeUnknown) {
  const FIELD_COUNT_SIZE = Types.getTypeSize("SHORT"), tags = {}, numberOfFields = function(dataView, offset, byteOrder) {
    if (offset + Types.getTypeSize("SHORT") <= dataView.byteLength) {
      return Types.getShortAt(dataView, offset, byteOrder);
    }
    return 0;
  }(dataView, offset, byteOrder);
  offset += FIELD_COUNT_SIZE;
  for (let fieldIndex = 0; fieldIndex < numberOfFields && !(offset + 12 > dataView.byteLength); fieldIndex++) {
    const tag = readTag$1(dataView, ifdType, offsetOrigin, offset, byteOrder, includeUnknown);
    void 0 !== tag && (tags[tag.name] = {
      id: tag.id,
      value: tag.value,
      description: tag.description
    }, ("MakerNote" === tag.name || "pentax" === ifdType && "LevelInfo" === tag.name) && (tags[tag.name].__offset = tag.__offset)), 
    offset += 12;
  }
  if (offset < dataView.byteLength - Types.getTypeSize("LONG")) {
    const nextIfdOffset = Types.getLongAt(dataView, offset, byteOrder);
    0 !== nextIfdOffset && "0th" === ifdType && (tags.Thumbnail = readIfd(dataView, "1st", offsetOrigin, offsetOrigin + nextIfdOffset, byteOrder, includeUnknown));
  }
  return tags;
}

function readTag$1(dataView, ifdType, offsetOrigin, offset, byteOrder, includeUnknown) {
  const TAG_TYPE_OFFSET = Types.getTypeSize("SHORT"), TAG_COUNT_OFFSET = TAG_TYPE_OFFSET + Types.getTypeSize("SHORT"), TAG_VALUE_OFFSET = TAG_COUNT_OFFSET + Types.getTypeSize("LONG"), tagCode = Types.getShortAt(dataView, offset, byteOrder), tagType = Types.getShortAt(dataView, offset + TAG_TYPE_OFFSET, byteOrder), tagCount = Types.getLongAt(dataView, offset + TAG_COUNT_OFFSET, byteOrder);
  let tagValue, tagValueOffset;
  if (void 0 === Types.typeSizes[tagType] || !includeUnknown && void 0 === TagNames$1[ifdType][tagCode]) {
    return;
  }
  if (function(tagType, tagCount) {
    return Types.typeSizes[tagType] * tagCount <= Types.getTypeSize("LONG");
  }(tagType, tagCount)) {
    tagValueOffset = offset + TAG_VALUE_OFFSET, tagValue = getTagValue$2(dataView, tagValueOffset, tagType, tagCount, byteOrder);
  } else if (tagValueOffset = Types.getLongAt(dataView, offset + TAG_VALUE_OFFSET, byteOrder), 
  function(dataView, offsetOrigin, tagValueOffset, tagType, tagCount) {
    return offsetOrigin + tagValueOffset + Types.typeSizes[tagType] * tagCount <= dataView.byteLength;
  }(dataView, offsetOrigin, tagValueOffset, tagType, tagCount)) {
    tagValue = getTagValue$2(dataView, offsetOrigin + tagValueOffset, tagType, tagCount, byteOrder, 33723 === tagCode);
  } else {
    tagValue = "<faulty value>";
  }
  tagType === Types.tagTypes.ASCII && (tagValue = function(string) {
    const tagValue = [];
    let i = 0;
    for (let j = 0; j < string.length; j++) {
      "\0" !== string[j] ? (void 0 === tagValue[i] && (tagValue[i] = ""), tagValue[i] += string[j]) : i++;
    }
    return tagValue;
  }(tagValue), tagValue = function(asciiValue) {
    try {
      return asciiValue.map(value => decodeURIComponent(escape(value)));
    } catch (error) {
      return asciiValue;
    }
  }(tagValue));
  let tagName = `undefined-${tagCode}`, tagDescription = tagValue;
  if (void 0 !== TagNames$1[ifdType][tagCode]) {
    if (void 0 !== TagNames$1[ifdType][tagCode].name && void 0 !== TagNames$1[ifdType][tagCode].description) {
      tagName = TagNames$1[ifdType][tagCode].name;
      try {
        tagDescription = TagNames$1[ifdType][tagCode].description(tagValue);
      } catch (error) {
        tagDescription = getDescriptionFromTagValue(tagValue);
      }
    } else {
      tagType === Types.tagTypes.RATIONAL || tagType === Types.tagTypes.SRATIONAL ? (tagName = TagNames$1[ifdType][tagCode], 
      tagDescription = "" + tagValue[0] / tagValue[1]) : (tagName = TagNames$1[ifdType][tagCode], 
      tagDescription = getDescriptionFromTagValue(tagValue));
    }
  }
  return {
    id: tagCode,
    name: tagName,
    value: tagValue,
    description: tagDescription,
    __offset: tagValueOffset
  };
}

function getTagValue$2(dataView, offset, type, count, byteOrder, forceByteType = !1) {
  let value = [];
  forceByteType && (count *= Types.typeSizes[type], type = Types.tagTypes.BYTE);
  for (let valueIndex = 0; valueIndex < count; valueIndex++) {
    value.push(getTagValueAt[type](dataView, offset, byteOrder)), offset += Types.typeSizes[type];
  }
  return type === Types.tagTypes.ASCII ? value = Types.getAsciiValue(value) : 1 === value.length && (value = value[0]), 
  value;
}

function getDescriptionFromTagValue(tagValue) {
  return tagValue instanceof Array ? tagValue.join(", ") : tagValue;
}

var Tags = {
  read: function(dataView, tiffHeaderOffset, includeUnknown) {
    const byteOrder = ByteOrder.getByteOrder(dataView, tiffHeaderOffset);
    let tags = function(dataView, tiffHeaderOffset, byteOrder, includeUnknown) {
      return readIfd(dataView, "0th", tiffHeaderOffset, get0thIfdOffset(dataView, tiffHeaderOffset, byteOrder), byteOrder, includeUnknown);
    }(dataView, tiffHeaderOffset, byteOrder, includeUnknown);
    return tags = readExifIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown), 
    tags = readGpsIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown), 
    tags = readInteroperabilityIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown), 
    {
      tags: tags,
      byteOrder: byteOrder
    };
  }
};

function readExifIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown) {
  return void 0 !== tags["Exif IFD Pointer"] ? objectAssign(tags, readIfd(dataView, "exif", tiffHeaderOffset, tiffHeaderOffset + tags["Exif IFD Pointer"].value, byteOrder, includeUnknown)) : tags;
}

function readGpsIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown) {
  return void 0 !== tags["GPS Info IFD Pointer"] ? objectAssign(tags, readIfd(dataView, "gps", tiffHeaderOffset, tiffHeaderOffset + tags["GPS Info IFD Pointer"].value, byteOrder, includeUnknown)) : tags;
}

function readInteroperabilityIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown) {
  return void 0 !== tags["Interoperability IFD Pointer"] ? objectAssign(tags, readIfd(dataView, "interoperability", tiffHeaderOffset, tiffHeaderOffset + tags["Interoperability IFD Pointer"].value, byteOrder, includeUnknown)) : tags;
}

var MpfTags = {
  read: function(dataView, dataOffset, includeUnknown) {
    const byteOrder = ByteOrder.getByteOrder(dataView, dataOffset), tags = readIfd(dataView, "mpf", dataOffset, get0thIfdOffset(dataView, dataOffset, byteOrder), byteOrder, includeUnknown);
    return function(dataView, dataOffset, tags, byteOrder) {
      if (!tags.MPEntry) {
        return tags;
      }
      const images = [];
      for (let i = 0; i < Math.ceil(tags.MPEntry.value.length / ENTRY_SIZE); i++) {
        images[i] = {};
        const attributes = getImageNumberValue(tags.MPEntry.value, i * ENTRY_SIZE, Types.getTypeSize("LONG"), byteOrder);
        images[i].ImageFlags = getImageFlags(attributes), images[i].ImageFormat = getImageFormat(attributes), 
        images[i].ImageType = getImageType(attributes);
        const imageSize = getImageNumberValue(tags.MPEntry.value, i * ENTRY_SIZE + 4, Types.getTypeSize("LONG"), byteOrder);
        images[i].ImageSize = {
          value: imageSize,
          description: "" + imageSize
        };
        const imageOffset = getImageOffset(i, tags.MPEntry, byteOrder, dataOffset);
        images[i].ImageOffset = {
          value: imageOffset,
          description: "" + imageOffset
        };
        const dependentImage1EntryNumber = getImageNumberValue(tags.MPEntry.value, i * ENTRY_SIZE + 12, Types.getTypeSize("SHORT"), byteOrder);
        images[i].DependentImage1EntryNumber = {
          value: dependentImage1EntryNumber,
          description: "" + dependentImage1EntryNumber
        };
        const dependentImage2EntryNumber = getImageNumberValue(tags.MPEntry.value, i * ENTRY_SIZE + 14, Types.getTypeSize("SHORT"), byteOrder);
        images[i].DependentImage2EntryNumber = {
          value: dependentImage2EntryNumber,
          description: "" + dependentImage2EntryNumber
        }, images[i].image = dataView.buffer.slice(imageOffset, imageOffset + imageSize), 
        deferInit(images[i], "base64", function() {
          return getBase64Image(this.image);
        });
      }
      return tags.Images = images, tags;
    }(dataView, dataOffset, tags, byteOrder);
  }
};

const ENTRY_SIZE = 16;

function getImageNumberValue(entries, offset, size, byteOrder) {
  if (byteOrder === ByteOrder.LITTLE_ENDIAN) {
    let value = 0;
    for (let i = 0; i < size; i++) {
      value += entries[offset + i] << 8 * i;
    }
    return value;
  }
  let value = 0;
  for (let i = 0; i < size; i++) {
    value += entries[offset + i] << 8 * (size - 1 - i);
  }
  return value;
}

function getImageFlags(attributes) {
  const flags = [ attributes >> 31 & 1, attributes >> 30 & 1, attributes >> 29 & 1 ], flagsDescription = [];
  return flags[0] && flagsDescription.push("Dependent Parent Image"), flags[1] && flagsDescription.push("Dependent Child Image"), 
  flags[2] && flagsDescription.push("Representative Image"), {
    value: flags,
    description: flagsDescription.join(", ") || "None"
  };
}

function getImageFormat(attributes) {
  const imageFormat = attributes >> 24 & 7;
  return {
    value: imageFormat,
    description: 0 === imageFormat ? "JPEG" : "Unknown"
  };
}

function getImageType(attributes) {
  const type = 16777215 & attributes;
  return {
    value: type,
    description: {
      196608: "Baseline MP Primary Image",
      65537: "Large Thumbnail (VGA equivalent)",
      65538: "Large Thumbnail (Full HD equivalent)",
      131073: "Multi-Frame Image (Panorama)",
      131074: "Multi-Frame Image (Disparity)",
      131075: "Multi-Frame Image (Multi-Angle)",
      0: "Undefined"
    }[type] || "Unknown"
  };
}

function getImageOffset(imageIndex, mpEntry, byteOrder, dataOffset) {
  return function(imageIndex) {
    return 0 === imageIndex;
  }(imageIndex) ? 0 : getImageNumberValue(mpEntry.value, imageIndex * ENTRY_SIZE + 8, Types.getTypeSize("LONG"), byteOrder) + dataOffset;
}

var FileTags = {
  read: function(dataView, fileDataOffset) {
    const length = function(dataView, fileDataOffset) {
      return Types.getShortAt(dataView, fileDataOffset);
    }(dataView, fileDataOffset), numberOfColorComponents = function(dataView, fileDataOffset, length) {
      const OFFSET = 7;
      if (OFFSET + 1 > length) {
        return;
      }
      const value = Types.getByteAt(dataView, fileDataOffset + OFFSET);
      return {
        value: value,
        description: "" + value
      };
    }(dataView, fileDataOffset, length);
    return {
      "Bits Per Sample": getDataPrecision(dataView, fileDataOffset, length),
      "Image Height": getImageHeight$2(dataView, fileDataOffset, length),
      "Image Width": getImageWidth$2(dataView, fileDataOffset, length),
      "Color Components": numberOfColorComponents,
      Subsampling: numberOfColorComponents && getSubsampling(dataView, fileDataOffset, numberOfColorComponents.value, length)
    };
  }
};

function getDataPrecision(dataView, fileDataOffset, length) {
  if (3 > length) {
    return;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + 2);
  return {
    value: value,
    description: "" + value
  };
}

function getImageHeight$2(dataView, fileDataOffset, length) {
  if (5 > length) {
    return;
  }
  const value = Types.getShortAt(dataView, fileDataOffset + 3);
  return {
    value: value,
    description: `${value}px`
  };
}

function getImageWidth$2(dataView, fileDataOffset, length) {
  if (7 > length) {
    return;
  }
  const value = Types.getShortAt(dataView, fileDataOffset + 5);
  return {
    value: value,
    description: `${value}px`
  };
}

function getSubsampling(dataView, fileDataOffset, numberOfColorComponents, length) {
  if (8 + 3 * numberOfColorComponents > length) {
    return;
  }
  const components = [];
  for (let i = 0; i < numberOfColorComponents; i++) {
    const componentOffset = fileDataOffset + 8 + 3 * i;
    components.push([ Types.getByteAt(dataView, componentOffset), Types.getByteAt(dataView, componentOffset + 1), Types.getByteAt(dataView, componentOffset + 2) ]);
  }
  return {
    value: components,
    description: components.length > 1 ? getComponentIds(components) + getSamplingType(components) : ""
  };
}

function getComponentIds(components) {
  const ids = {
    1: "Y",
    2: "Cb",
    3: "Cr",
    4: "I",
    5: "Q"
  };
  return components.map(compontent => ids[compontent[0]]).join("");
}

function getSamplingType(components) {
  const types = {
    17: "4:4:4 (1 1)",
    18: "4:4:0 (1 2)",
    20: "4:4:1 (1 4)",
    33: "4:2:2 (2 1)",
    34: "4:2:0 (2 2)",
    36: "4:2:1 (2 4)",
    65: "4:1:1 (4 1)",
    66: "4:1:0 (4 2)"
  };
  return 0 === components.length || void 0 === components[0][1] || void 0 === types[components[0][1]] ? "" : types[components[0][1]];
}

var JfifTags = {
  read: function(dataView, jfifDataOffset) {
    const length = function(dataView, jfifDataOffset) {
      return Types.getShortAt(dataView, jfifDataOffset);
    }(dataView, jfifDataOffset), thumbnailWidth = function(dataView, jfifDataOffset, length) {
      const OFFSET = 14;
      if (OFFSET + 1 > length) {
        return;
      }
      const value = Types.getByteAt(dataView, jfifDataOffset + OFFSET);
      return {
        value: value,
        description: `${value}px`
      };
    }(dataView, jfifDataOffset, length), thumbnailHeight = function(dataView, jfifDataOffset, length) {
      const OFFSET = 15;
      if (OFFSET + 1 > length) {
        return;
      }
      const value = Types.getByteAt(dataView, jfifDataOffset + OFFSET);
      return {
        value: value,
        description: `${value}px`
      };
    }(dataView, jfifDataOffset, length), tags = {
      "JFIF Version": getVersion(dataView, jfifDataOffset, length),
      "Resolution Unit": getResolutionUnit(dataView, jfifDataOffset, length),
      XResolution: getXResolution(dataView, jfifDataOffset, length),
      YResolution: getYResolution(dataView, jfifDataOffset, length),
      "JFIF Thumbnail Width": thumbnailWidth,
      "JFIF Thumbnail Height": thumbnailHeight
    };
    if (void 0 !== thumbnailWidth && void 0 !== thumbnailHeight) {
      const thumbnail = function(dataView, jfifDataOffset, thumbnailLength, length) {
        const OFFSET = 16;
        if (0 === thumbnailLength || OFFSET + thumbnailLength > length) {
          return;
        }
        const value = dataView.buffer.slice(jfifDataOffset + OFFSET, jfifDataOffset + OFFSET + thumbnailLength);
        return {
          value: value,
          description: "<24-bit RGB pixel data>"
        };
      }(dataView, jfifDataOffset, 3 * thumbnailWidth.value * thumbnailHeight.value, length);
      thumbnail && (tags["JFIF Thumbnail"] = thumbnail);
    }
    for (const tagName in tags) {
      void 0 === tags[tagName] && delete tags[tagName];
    }
    return tags;
  }
};

function getVersion(dataView, jfifDataOffset, length) {
  if (9 > length) {
    return;
  }
  const majorVersion = Types.getByteAt(dataView, jfifDataOffset + 7), minorVersion = Types.getByteAt(dataView, jfifDataOffset + 7 + 1);
  return {
    value: 256 * majorVersion + minorVersion,
    description: majorVersion + "." + minorVersion
  };
}

function getResolutionUnit(dataView, jfifDataOffset, length) {
  if (10 > length) {
    return;
  }
  const value = Types.getByteAt(dataView, jfifDataOffset + 9);
  return {
    value: value,
    description: getResolutionUnitDescription(value)
  };
}

function getResolutionUnitDescription(value) {
  return 0 === value ? "None" : 1 === value ? "inches" : 2 === value ? "cm" : "Unknown";
}

function getXResolution(dataView, jfifDataOffset, length) {
  if (12 > length) {
    return;
  }
  const value = Types.getShortAt(dataView, jfifDataOffset + 10);
  return {
    value: value,
    description: "" + value
  };
}

function getYResolution(dataView, jfifDataOffset, length) {
  if (14 > length) {
    return;
  }
  const value = Types.getShortAt(dataView, jfifDataOffset + 12);
  return {
    value: value,
    description: "" + value
  };
}

var IptcTagNames = {
  iptc: {
    256: {
      name: "Model Version",
      description: value => ((value[0] << 8) + value[1]).toString()
    },
    261: {
      name: "Destination",
      repeatable: !0
    },
    276: {
      name: "File Format",
      description: value => ((value[0] << 8) + value[1]).toString()
    },
    278: {
      name: "File Format Version",
      description: value => ((value[0] << 8) + value[1]).toString()
    },
    286: "Service Identifier",
    296: "Envelope Number",
    306: "Product ID",
    316: "Envelope Priority",
    326: {
      name: "Date Sent",
      description: getCreationDate
    },
    336: {
      name: "Time Sent",
      description: getCreationTime
    },
    346: {
      name: "Coded Character Set",
      description: getEncodingName,
      encoding_name: getEncodingName
    },
    356: "UNO",
    376: {
      name: "ARM Identifier",
      description: value => ((value[0] << 8) + value[1]).toString()
    },
    378: {
      name: "ARM Version",
      description: value => ((value[0] << 8) + value[1]).toString()
    },
    512: {
      name: "Record Version",
      description: value => ((value[0] << 8) + value[1]).toString()
    },
    515: "Object Type Reference",
    516: "Object Attribute Reference",
    517: "Object Name",
    519: "Edit Status",
    520: {
      name: "Editorial Update",
      description: value => "01" === getStringValue(value) ? "Additional Language" : "Unknown"
    },
    522: "Urgency",
    524: {
      name: "Subject Reference",
      repeatable: !0,
      description: value => {
        const parts = getStringValue(value).split(":");
        return parts[2] + (parts[3] ? "/" + parts[3] : "") + (parts[4] ? "/" + parts[4] : "");
      }
    },
    527: "Category",
    532: {
      name: "Supplemental Category",
      repeatable: !0
    },
    534: "Fixture Identifier",
    537: {
      name: "Keywords",
      repeatable: !0
    },
    538: {
      name: "Content Location Code",
      repeatable: !0
    },
    539: {
      name: "Content Location Name",
      repeatable: !0
    },
    542: "Release Date",
    547: "Release Time",
    549: "Expiration Date",
    550: "Expiration Time",
    552: "Special Instructions",
    554: {
      name: "Action Advised",
      description: value => {
        const string = getStringValue(value);
        return "01" === string ? "Object Kill" : "02" === string ? "Object Replace" : "03" === string ? "Object Append" : "04" === string ? "Object Reference" : "Unknown";
      }
    },
    557: {
      name: "Reference Service",
      repeatable: !0
    },
    559: {
      name: "Reference Date",
      repeatable: !0
    },
    562: {
      name: "Reference Number",
      repeatable: !0
    },
    567: {
      name: "Date Created",
      description: getCreationDate
    },
    572: {
      name: "Time Created",
      description: getCreationTime
    },
    574: {
      name: "Digital Creation Date",
      description: getCreationDate
    },
    575: {
      name: "Digital Creation Time",
      description: getCreationTime
    },
    577: "Originating Program",
    582: "Program Version",
    587: {
      name: "Object Cycle",
      description: value => {
        const string = getStringValue(value);
        return "a" === string ? "morning" : "p" === string ? "evening" : "b" === string ? "both" : "Unknown";
      }
    },
    592: {
      name: "By-line",
      repeatable: !0
    },
    597: {
      name: "By-line Title",
      repeatable: !0
    },
    602: "City",
    604: "Sub-location",
    607: "Province/State",
    612: "Country/Primary Location Code",
    613: "Country/Primary Location Name",
    615: "Original Transmission Reference",
    617: "Headline",
    622: "Credit",
    627: "Source",
    628: "Copyright Notice",
    630: {
      name: "Contact",
      repeatable: !0
    },
    632: "Caption/Abstract",
    634: {
      name: "Writer/Editor",
      repeatable: !0
    },
    637: {
      name: "Rasterized Caption",
      description: value => value
    },
    642: "Image Type",
    643: {
      name: "Image Orientation",
      description: value => {
        const string = getStringValue(value);
        return "P" === string ? "Portrait" : "L" === string ? "Landscape" : "S" === string ? "Square" : "Unknown";
      }
    },
    647: "Language Identifier",
    662: {
      name: "Audio Type",
      description: value => {
        const stringValue = getStringValue(value), character0 = stringValue.charAt(0), character1 = stringValue.charAt(1);
        let description = "";
        return "1" === character0 ? description += "Mono" : "2" === character0 && (description += "Stereo"), 
        "A" === character1 ? description += ", actuality" : "C" === character1 ? description += ", question and answer session" : "M" === character1 ? description += ", music, transmitted by itself" : "Q" === character1 ? description += ", response to a question" : "R" === character1 ? description += ", raw sound" : "S" === character1 ? description += ", scener" : "V" === character1 ? description += ", voicer" : "W" === character1 && (description += ", wrap"), 
        "" !== description ? description : stringValue;
      }
    },
    663: {
      name: "Audio Sampling Rate",
      description: value => parseInt(getStringValue(value), 10) + " Hz"
    },
    664: {
      name: "Audio Sampling Resolution",
      description: value => {
        const bits = parseInt(getStringValue(value), 10);
        return bits + (1 === bits ? " bit" : " bits");
      }
    },
    665: {
      name: "Audio Duration",
      description: value => {
        const duration = getStringValue(value);
        return duration.length >= 6 ? duration.substr(0, 2) + ":" + duration.substr(2, 2) + ":" + duration.substr(4, 2) : duration;
      }
    },
    666: "Audio Outcue",
    698: "Short Document ID",
    699: "Unique Document ID",
    700: "Owner ID",
    712: {
      name: value => 2 === value.length ? "ObjectData Preview File Format" : "Record 2 destination",
      description: value => {
        if (2 === value.length) {
          const intValue = (value[0] << 8) + value[1];
          return 0 === intValue ? "No ObjectData" : 1 === intValue ? "IPTC-NAA Digital Newsphoto Parameter Record" : 2 === intValue ? "IPTC7901 Recommended Message Format" : 3 === intValue ? "Tagged Image File Format (Adobe/Aldus Image data)" : 4 === intValue ? "Illustrator (Adobe Graphics data)" : 5 === intValue ? "AppleSingle (Apple Computer Inc)" : 6 === intValue ? "NAA 89-3 (ANPA 1312)" : 7 === intValue ? "MacBinary II" : 8 === intValue ? "IPTC Unstructured Character Oriented File Format (UCOFF)" : 9 === intValue ? "United Press International ANPA 1312 variant" : 10 === intValue ? "United Press International Down-Load Message" : 11 === intValue ? "JPEG File Interchange (JFIF)" : 12 === intValue ? "Photo-CD Image-Pac (Eastman Kodak)" : 13 === intValue ? "Microsoft Bit Mapped Graphics File [*.BMP]" : 14 === intValue ? "Digital Audio File [*.WAV] (Microsoft & Creative Labs)" : 15 === intValue ? "Audio plus Moving Video [*.AVI] (Microsoft)" : 16 === intValue ? "PC DOS/Windows Executable Files [*.COM][*.EXE]" : 17 === intValue ? "Compressed Binary File [*.ZIP] (PKWare Inc)" : 18 === intValue ? "Audio Interchange File Format AIFF (Apple Computer Inc)" : 19 === intValue ? "RIFF Wave (Microsoft Corporation)" : 20 === intValue ? "Freehand (Macromedia/Aldus)" : 21 === intValue ? 'Hypertext Markup Language "HTML" (The Internet Society)' : 22 === intValue ? "MPEG 2 Audio Layer 2 (Musicom), ISO/IEC" : 23 === intValue ? "MPEG 2 Audio Layer 3, ISO/IEC" : 24 === intValue ? "Portable Document File (*.PDF) Adobe" : 25 === intValue ? "News Industry Text Format (NITF)" : 26 === intValue ? "Tape Archive (*.TAR)" : 27 === intValue ? "Tidningarnas Telegrambyrå NITF version (TTNITF DTD)" : 28 === intValue ? "Ritzaus Bureau NITF version (RBNITF DTD)" : 29 === intValue ? "Corel Draw [*.CDR]" : `Unknown format ${intValue}`;
        }
        return getStringValue(value);
      }
    },
    713: {
      name: "ObjectData Preview File Format Version",
      description: (value, tags) => {
        const formatVersions = {
          "00": {
            "00": "1"
          },
          "01": {
            "01": "1",
            "02": "2",
            "03": "3",
            "04": "4"
          },
          "02": {
            "04": "4"
          },
          "03": {
            "01": "5.0",
            "02": "6.0"
          },
          "04": {
            "01": "1.40"
          },
          "05": {
            "01": "2"
          },
          "06": {
            "01": "1"
          },
          11: {
            "01": "1.02"
          },
          20: {
            "01": "3.1",
            "02": "4.0",
            "03": "5.0",
            "04": "5.5"
          },
          21: {
            "02": "2.0"
          }
        }, stringValue = getStringValue(value);
        if (tags["ObjectData Preview File Format"]) {
          const objectDataPreviewFileFormat = getStringValue(tags["ObjectData Preview File Format"].value);
          if (formatVersions[objectDataPreviewFileFormat] && formatVersions[objectDataPreviewFileFormat][stringValue]) {
            return formatVersions[objectDataPreviewFileFormat][stringValue];
          }
        }
        return stringValue;
      }
    },
    714: "ObjectData Preview Data",
    1802: {
      name: "Size Mode",
      description: value => value[0].toString()
    },
    1812: {
      name: "Max Subfile Size",
      description: value => {
        let n = 0;
        for (let i = 0; i < value.length; i++) {
          n = (n << 8) + value[i];
        }
        return n.toString();
      }
    },
    1882: {
      name: "ObjectData Size Announced",
      description: value => {
        let n = 0;
        for (let i = 0; i < value.length; i++) {
          n = (n << 8) + value[i];
        }
        return n.toString();
      }
    },
    1887: {
      name: "Maximum ObjectData Size",
      description: value => {
        let n = 0;
        for (let i = 0; i < value.length; i++) {
          n = (n << 8) + value[i];
        }
        return n.toString();
      }
    }
  }
};

function getCreationDate(value) {
  const date = getStringValue(value);
  return date.length >= 8 ? date.substr(0, 4) + "-" + date.substr(4, 2) + "-" + date.substr(6, 2) : date;
}

function getCreationTime(value) {
  const time = getStringValue(value);
  let parsedTime = time;
  return time.length >= 6 && (parsedTime = time.substr(0, 2) + ":" + time.substr(2, 2) + ":" + time.substr(4, 2), 
  11 === time.length && (parsedTime += time.substr(6, 1) + time.substr(7, 2) + ":" + time.substr(9, 2))), 
  parsedTime;
}

function getEncodingName(value) {
  const string = getStringValue(value);
  return "%G" === string ? "UTF-8" : "%5" === string ? "Windows-1252" : "%/G" === string ? "UTF-8 Level 1" : "%/H" === string ? "UTF-8 Level 2" : "%/I" === string ? "UTF-8 Level 3" : "/A" === string ? "ISO-8859-1" : "/B" === string ? "ISO-8859-2" : "/C" === string ? "ISO-8859-3" : "/D" === string ? "ISO-8859-4" : "/@" === string ? "ISO-8859-5" : "/G" === string ? "ISO-8859-6" : "/F" === string ? "ISO-8859-7" : "/H" === string ? "ISO-8859-8" : "Unknown";
}

var TextDecoder$1 = {
  get: function() {
    if ("undefined" != typeof TextDecoder) {
      return TextDecoder;
    }
    return;
  }
};

var TagDecoder = {
  decode: function(encoding, tagValue) {
    const Decoder = TextDecoder$1.get();
    if (void 0 !== Decoder && void 0 !== encoding) {
      try {
        return new Decoder(encoding).decode(tagValue instanceof DataView ? tagValue.buffer : Uint8Array.from(tagValue));
      } catch (error) {}
    }
    return function(asciiValue) {
      try {
        return decodeURIComponent(escape(asciiValue));
      } catch (error) {
        return asciiValue;
      }
    }(tagValue.map(charCode => String.fromCharCode(charCode)).join(""));
  },
  TAG_HEADER_SIZE: 5
};

var IptcTags = {
  read: function(dataView, dataOffset, includeUnknown) {
    try {
      if (Array.isArray(dataView)) {
        return parseTags$1(new DataView(Uint8Array.from(dataView).buffer), {
          size: dataView.length
        }, 0, includeUnknown);
      }
      const {naaBlock: naaBlock, dataOffset: newDataOffset} = function(dataView, dataOffset) {
        for (;dataOffset + 12 <= dataView.byteLength; ) {
          const resourceBlock = getResourceBlock(dataView, dataOffset);
          if (isNaaResourceBlock(resourceBlock)) {
            return {
              naaBlock: resourceBlock,
              dataOffset: dataOffset + resourceBlock.headerSize
            };
          }
          dataOffset += resourceBlock.headerSize + resourceBlock.size + getBlockPadding(resourceBlock);
        }
        throw new Error("No IPTC NAA resource block.");
      }(dataView, dataOffset);
      return parseTags$1(dataView, naaBlock, newDataOffset, includeUnknown);
    } catch (error) {
      return {};
    }
  }
};

function getResourceBlock(dataView, dataOffset) {
  if (943868237 !== dataView.getUint32(dataOffset, !1)) {
    throw new Error("Not an IPTC resource block.");
  }
  const resourceNameSize = dataView.getUint8(dataOffset + 4 + 2), resourceNameTotalSize = (resourceNameSize % 2 == 0 ? resourceNameSize + 1 : resourceNameSize) + 1;
  return {
    headerSize: 6 + resourceNameTotalSize + 4,
    type: dataView.getUint16(dataOffset + 4),
    size: dataView.getUint32(dataOffset + 4 + 2 + resourceNameTotalSize)
  };
}

function isNaaResourceBlock(resourceBlock) {
  return 1028 === resourceBlock.type;
}

function getBlockPadding(resourceBlock) {
  return resourceBlock.size % 2 != 0 ? 1 : 0;
}

function parseTags$1(dataView, naaBlock, dataOffset, includeUnknown) {
  const tags = {};
  let encoding;
  const endOfBlockOffset = dataOffset + naaBlock.size;
  for (;dataOffset < endOfBlockOffset && dataOffset < dataView.byteLength; ) {
    const {tag: tag, tagSize: tagSize} = readTag(dataView, dataOffset, tags, encoding, includeUnknown);
    if (null === tag) {
      break;
    }
    tag && ("encoding" in tag && (encoding = tag.encoding), void 0 === tags[tag.name] || void 0 === tag.repeatable ? tags[tag.name] = {
      id: tag.id,
      value: tag.value,
      description: tag.description
    } : (tags[tag.name] instanceof Array || (tags[tag.name] = [ {
      id: tags[tag.name].id,
      value: tags[tag.name].value,
      description: tags[tag.name].description
    } ]), tags[tag.name].push({
      id: tag.id,
      value: tag.value,
      description: tag.description
    }))), dataOffset += 5 + tagSize;
  }
  return tags;
}

function readTag(dataView, dataOffset, tags, encoding, includeUnknown) {
  if (function(dataView, dataOffset) {
    const TAG_LEAD_BYTE = 28;
    return dataView.getUint8(dataOffset) !== TAG_LEAD_BYTE;
  }(dataView, dataOffset)) {
    return {
      tag: null,
      tagSize: 0
    };
  }
  const tagCode = dataView.getUint16(dataOffset + 1), tagSize = dataView.getUint16(dataOffset + 3);
  if (!includeUnknown && !IptcTagNames.iptc[tagCode]) {
    return {
      tag: void 0,
      tagSize: tagSize
    };
  }
  const tagValue = function(dataView, offset, size) {
    const value = [];
    for (let valueIndex = 0; valueIndex < size; valueIndex++) {
      value.push(dataView.getUint8(offset + valueIndex));
    }
    return value;
  }(dataView, dataOffset + 5, tagSize), tag = {
    id: tagCode,
    name: getTagName$1(IptcTagNames.iptc[tagCode], tagCode, tagValue),
    value: tagValue,
    description: getTagDescription(IptcTagNames.iptc[tagCode], tagValue, tags, encoding)
  };
  return function(tagCode) {
    return IptcTagNames.iptc[tagCode] && IptcTagNames.iptc[tagCode].repeatable;
  }(tagCode) && (tag.repeatable = !0), function(tagCode) {
    return IptcTagNames.iptc[tagCode] && void 0 !== IptcTagNames.iptc[tagCode].encoding_name;
  }(tagCode) && (tag.encoding = IptcTagNames.iptc[tagCode].encoding_name(tagValue)), 
  {
    tag: tag,
    tagSize: tagSize
  };
}

function getTagName$1(tag, tagCode, tagValue) {
  return tag ? function(tag) {
    return "string" == typeof tag;
  }(tag) ? tag : function(tag) {
    return "function" == typeof tag.name;
  }(tag) ? tag.name(tagValue) : tag.name : `undefined-${tagCode}`;
}

function getTagDescription(tag, tagValue, tags, encoding) {
  if (function(tag) {
    return tag && void 0 !== tag.description;
  }(tag)) {
    try {
      return tag.description(tagValue, tags);
    } catch (error) {}
  }
  return function(tag, tagValue) {
    return tag && tagValue instanceof Array;
  }(tag, tagValue) ? TagDecoder.decode(encoding, tagValue) : tagValue;
}

var XmpTagNames = {
  "tiff:Orientation": value => "1" === value ? "Horizontal (normal)" : "2" === value ? "Mirror horizontal" : "3" === value ? "Rotate 180" : "4" === value ? "Mirror vertical" : "5" === value ? "Mirror horizontal and rotate 270 CW" : "6" === value ? "Rotate 90 CW" : "7" === value ? "Mirror horizontal and rotate 90 CW" : "8" === value ? "Rotate 270 CW" : value,
  "tiff:ResolutionUnit": value => TagNamesCommon.ResolutionUnit(parseInt(value, 10)),
  "tiff:XResolution": value => fraction(TagNamesCommon.XResolution, value),
  "tiff:YResolution": value => fraction(TagNamesCommon.YResolution, value),
  "exif:ApertureValue": value => fraction(TagNamesCommon.ApertureValue, value),
  "exif:GPSLatitude": calculateGPSValue,
  "exif:GPSLongitude": calculateGPSValue,
  "exif:FNumber": value => fraction(TagNamesCommon.FNumber, value),
  "exif:FocalLength": value => fraction(TagNamesCommon.FocalLength, value),
  "exif:FocalPlaneResolutionUnit": value => TagNamesCommon.FocalPlaneResolutionUnit(parseInt(value, 10)),
  "exif:ColorSpace": value => TagNamesCommon.ColorSpace(function(value) {
    if ("0x" === value.substring(0, 2)) {
      return parseInt(value.substring(2), 16);
    }
    return parseInt(value, 10);
  }(value)),
  "exif:ComponentsConfiguration"(value, description) {
    if (/^\d, \d, \d, \d$/.test(description)) {
      const numbers = description.split(", ").map(number => number.charCodeAt(0));
      return TagNamesCommon.ComponentsConfiguration(numbers);
    }
    return description;
  },
  "exif:Contrast": value => TagNamesCommon.Contrast(parseInt(value, 10)),
  "exif:CustomRendered": value => TagNamesCommon.CustomRendered(parseInt(value, 10)),
  "exif:ExposureMode": value => TagNamesCommon.ExposureMode(parseInt(value, 10)),
  "exif:ExposureProgram": value => TagNamesCommon.ExposureProgram(parseInt(value, 10)),
  "exif:ExposureTime": value => isFraction(value) ? TagNamesCommon.ExposureTime(value.split("/").map(number => parseInt(number, 10))) : value,
  "exif:MeteringMode": value => TagNamesCommon.MeteringMode(parseInt(value, 10)),
  "exif:Saturation": value => TagNamesCommon.Saturation(parseInt(value, 10)),
  "exif:SceneCaptureType": value => TagNamesCommon.SceneCaptureType(parseInt(value, 10)),
  "exif:Sharpness": value => TagNamesCommon.Sharpness(parseInt(value, 10)),
  "exif:ShutterSpeedValue": value => fraction(TagNamesCommon.ShutterSpeedValue, value),
  "exif:WhiteBalance": value => TagNamesCommon.WhiteBalance(parseInt(value, 10))
};

function fraction(func, value) {
  return isFraction(value) ? func(value.split("/")) : value;
}

function isFraction(value) {
  return /^-?\d+\/-?\d+$/.test(value);
}

function calculateGPSValue(value) {
  const [degreesString, minutesString] = value.split(",");
  if (void 0 !== degreesString && void 0 !== minutesString) {
    const degrees = parseFloat(degreesString), minutes = parseFloat(minutesString), ref = minutesString.charAt(minutesString.length - 1);
    if (!Number.isNaN(degrees) && !Number.isNaN(minutes)) {
      return "" + (degrees + minutes / 60) + ref;
    }
  }
  return value;
}

var DOMParser$1 = {
  get: function(domParser) {
    if (domParser) {
      return domParser;
    }
    if ("undefined" != typeof DOMParser) {
      return new DOMParser;
    }
    try {
      const {DOMParser: DOMParser, onErrorStopParsing: onErrorStopParsing} = __non_webpack_require__("@xmldom/xmldom");
      return new DOMParser({
        onError: onErrorStopParsing
      });
    } catch (error) {
      return;
    }
  }
};

function addMissingNamespaces(xmlString) {
  const rootTagMatch = xmlString.match(/<([A-Za-z_][A-Za-z0-9._-]*)([^>]*)>/);
  if (!rootTagMatch) {
    return xmlString;
  }
  const rootTagName = rootTagMatch[1], declaredPrefixes = function(xmlContent) {
    const prefixes = [], namespaceDeclarationRegex = /xmlns:([\w-]+)=["'][^"']+["']/g;
    let match;
    for (;null !== (match = namespaceDeclarationRegex.exec(xmlContent)); ) {
      -1 === prefixes.indexOf(match[1]) && prefixes.push(match[1]);
    }
    return prefixes;
  }(xmlString), missingPrefixes = function(xmlContent) {
    const prefixes = [], prefixUsageRegex = /\b([A-Za-z_][A-Za-z0-9._-]*):[A-Za-z_][A-Za-z0-9._-]*\b/g;
    let match;
    for (;null !== (match = prefixUsageRegex.exec(xmlContent)); ) {
      const prefix = match[1];
      "xmlns" !== prefix && "xml" !== prefix && (-1 === prefixes.indexOf(prefix) && prefixes.push(prefix));
    }
    return prefixes;
  }(xmlString).filter(prefix => -1 === declaredPrefixes.indexOf(prefix));
  if (0 === missingPrefixes.length) {
    return xmlString;
  }
  const namespaceDeclarations = function(prefixes) {
    const declarations = [];
    for (let i = 0; i < prefixes.length; i++) {
      const prefix = prefixes[i], uri = KNOWN_NAMESPACE_URIS[prefix] || "http://fallback.namespace/" + prefix;
      declarations.push(" xmlns:" + prefix + '="' + uri + '"');
    }
    return declarations.join("");
  }(missingPrefixes);
  return function(xmlString, rootTagName, declarations) {
    const rootTagPattern = new RegExp("<" + rootTagName + "([^>]*)>");
    return xmlString.replace(rootTagPattern, "<" + rootTagName + "$1" + declarations + ">");
  }(xmlString, rootTagName, namespaceDeclarations);
}

const KNOWN_NAMESPACE_URIS = {
  xmp: "http://ns.adobe.com/xap/1.0/",
  tiff: "http://ns.adobe.com/tiff/1.0/",
  exif: "http://ns.adobe.com/exif/1.0/",
  dc: "http://purl.org/dc/elements/1.1/",
  xmpMM: "http://ns.adobe.com/xap/1.0/mm/",
  stEvt: "http://ns.adobe.com/xap/1.0/sType/ResourceEvent#",
  stRef: "http://ns.adobe.com/xap/1.0/sType/ResourceRef#",
  photoshop: "http://ns.adobe.com/photoshop/1.0/"
};

var XmpTags = {
  read: function(dataView, chunks, domParser) {
    const tags = {};
    if ("string" == typeof dataView) {
      return readTags(tags, dataView, domParser), tags;
    }
    const [standardXmp, extendedXmp] = function(dataView, chunks) {
      if (0 === chunks.length) {
        return [];
      }
      const completeChunks = [ combineChunks(dataView, chunks.slice(0, 1)) ];
      chunks.length > 1 && completeChunks.push(combineChunks(dataView, chunks.slice(1)));
      return completeChunks;
    }(dataView, chunks), hasStandardTags = readTags(tags, standardXmp, domParser);
    if (extendedXmp) {
      const hasExtendedTags = readTags(tags, extendedXmp, domParser);
      hasStandardTags || hasExtendedTags || (delete tags._raw, readTags(tags, combineChunks(dataView, chunks), domParser));
    }
    return tags;
  }
};

class ParseError extends Error {
  constructor(message) {
    super(message), this.name = "ParseError";
  }
}

function combineChunks(dataView, chunks) {
  const totalLength = chunks.reduce((size, chunk) => size + chunk.length, 0), combinedChunks = new Uint8Array(totalLength);
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i], slice = dataView.buffer.slice(chunk.dataOffset, chunk.dataOffset + chunk.length);
    combinedChunks.set(new Uint8Array(slice), offset), offset += chunk.length;
  }
  return new DataView(combinedChunks.buffer);
}

function readTags(tags, chunkDataView, domParser) {
  try {
    const {doc: doc, raw: raw} = function(chunkDataView, _domParser) {
      const domParser = DOMParser$1.get(_domParser);
      if (!domParser) {
        throw console.warn("Warning: DOMParser is not available. It is needed to be able to parse XMP tags."), 
        new Error;
      }
      const xmlString = "string" == typeof chunkDataView ? chunkDataView : getStringFromDataView(chunkDataView, 0, chunkDataView.byteLength), doc = parseFromString(domParser, (xmlSource = xmlString, 
      xmlSource.replace(/^.+(<\?xpacket begin)/, "$1").replace(/(<\?xpacket end=".*"\?>).+$/, "$1")));
      var xmlSource;
      return {
        doc: doc,
        raw: xmlString
      };
    }(chunkDataView, domParser);
    tags._raw = (tags._raw || "") + raw;
    return objectAssign(tags, parseXMPObject(convertToObject(getRDF(doc), !0))), !0;
  } catch (error) {
    return !1;
  }
}

function parseFromString(domParser, xmlString, isRetry = !1) {
  try {
    const doc = domParser.parseFromString(xmlString, "application/xml"), errors = doc.getElementsByTagName("parsererror");
    if (errors.length > 0) {
      throw new ParseError(errors[0].textContent);
    }
    return doc;
  } catch (error) {
    if ("ParseError" === error.name && function(error) {
      const missingNamespaceStrings = [ "prefix is non-null and namespace is null", "prefix not bound to a namespace", "prefix inte bundet till en namnrymd", /Namespace prefix .+ is not defined/ ];
      for (let i = 0; i < missingNamespaceStrings.length; i++) {
        if (new RegExp(missingNamespaceStrings[i]).test(error.message)) {
          return !0;
        }
      }
      return !1;
    }(error) && !isRetry) {
      return parseFromString(domParser, addMissingNamespaces(xmlString), !0);
    }
    throw error;
  }
}

function getRDF(node) {
  for (let i = 0; i < node.childNodes.length; i++) {
    if ("x:xmpmeta" === node.childNodes[i].tagName) {
      return getRDF(node.childNodes[i]);
    }
    if ("rdf:RDF" === node.childNodes[i].tagName) {
      return node.childNodes[i];
    }
  }
  throw new Error;
}

function convertToObject(node, isTopNode = !1) {
  const childNodes = function(node) {
    const elements = [];
    for (let i = 0; i < node.childNodes.length; i++) {
      elements.push(node.childNodes[i]);
    }
    return elements;
  }(node);
  return 1 === (nodes = childNodes).length && "#text" === nodes[0].nodeName ? isTopNode ? {} : function(node) {
    return node.nodeValue;
  }(childNodes[0]) : function(nodes) {
    const elements = {};
    return nodes.forEach(node => {
      if (function(node) {
        return node.nodeName && "#text" !== node.nodeName;
      }(node)) {
        const nodeElement = function(node) {
          return {
            attributes: getAttributes(node),
            value: convertToObject(node)
          };
        }(node);
        void 0 !== elements[node.nodeName] ? (Array.isArray(elements[node.nodeName]) || (elements[node.nodeName] = [ elements[node.nodeName] ]), 
        elements[node.nodeName].push(nodeElement)) : elements[node.nodeName] = nodeElement;
      }
    }), elements;
  }(childNodes);
  var nodes;
}

function getAttributes(element) {
  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    attributes[element.attributes[i].nodeName] = decodeURIComponent(escape(element.attributes[i].value));
  }
  return attributes;
}

function parseXMPObject(xmpObject) {
  const tags = {};
  if ("string" == typeof xmpObject) {
    return xmpObject;
  }
  for (const nodeName in xmpObject) {
    let nodes = xmpObject[nodeName];
    Array.isArray(nodes) || (nodes = [ nodes ]), nodes.forEach(node => {
      objectAssign(tags, parseNodeAttributesAsTags(node.attributes)), "object" == typeof node.value && objectAssign(tags, parseNodeChildrenAsTags(node.value));
    });
  }
  return tags;
}

function parseNodeAttributesAsTags(attributes) {
  const tags = {};
  for (const name in attributes) {
    try {
      isTagAttribute(name) && (tags[getLocalName(name)] = {
        value: attributes[name],
        attributes: {},
        description: getDescription$1(attributes[name], name)
      });
    } catch (error) {}
  }
  return tags;
}

function isTagAttribute(name) {
  return "rdf:parseType" !== name && !isNamespaceDefinition(name);
}

function isNamespaceDefinition(name) {
  return "xmlns" === name.split(":")[0];
}

function getLocalName(name) {
  return /^MicrosoftPhoto(_\d+_)?:Rating$/i.test(name) ? "RatingPercent" : name.split(":")[1];
}

function getDescription$1(value, name = void 0) {
  if (Array.isArray(value)) {
    const arrayDescription = function(value) {
      return value.map(item => void 0 !== item.value ? getDescription$1(item.value) : getDescription$1(item)).join(", ");
    }(value);
    return name && "function" == typeof XmpTagNames[name] ? XmpTagNames[name](value, arrayDescription) : arrayDescription;
  }
  if ("object" == typeof value) {
    return function(value) {
      const descriptions = [];
      for (const key in value) {
        descriptions.push(`${getClearTextKey(key)}: ${getDescription$1(value[key].value)}`);
      }
      return descriptions.join("; ");
    }(value);
  }
  try {
    return name && "function" == typeof XmpTagNames[name] ? XmpTagNames[name](value) : decodeURIComponent(escape(value));
  } catch (error) {
    return value;
  }
}

function getClearTextKey(key) {
  return "CiAdrCity" === key ? "CreatorCity" : "CiAdrCtry" === key ? "CreatorCountry" : "CiAdrExtadr" === key ? "CreatorAddress" : "CiAdrPcode" === key ? "CreatorPostalCode" : "CiAdrRegion" === key ? "CreatorRegion" : "CiEmailWork" === key ? "CreatorWorkEmail" : "CiTelWork" === key ? "CreatorWorkPhone" : "CiUrlWork" === key ? "CreatorWorkUrl" : key;
}

function parseNodeChildrenAsTags(children) {
  const tags = {};
  for (const name in children) {
    try {
      isNamespaceDefinition(name) || (tags[getLocalName(name)] = parseNodeAsTag(children[name], name));
    } catch (error) {}
  }
  return tags;
}

function parseNodeAsTag(node, name) {
  return function(node) {
    return Array.isArray(node);
  }(node) ? function(node, name) {
    return parseNodeAsSimpleValue(node[node.length - 1], name);
  }(node, name) : function(node) {
    return "Resource" === node.attributes["rdf:parseType"] && "string" == typeof node.value && "" === node.value.trim();
  }(node) ? {
    value: "",
    attributes: {},
    description: ""
  } : hasNestedSimpleRdfDescription(node) ? parseNodeAsSimpleRdfDescription(node, name) : hasNestedStructureRdfDescription(node) ? parseNodeAsStructureRdfDescription(node, name) : isCompactStructure(node) ? parseNodeAsCompactStructure(node, name) : function(node) {
    return void 0 !== getArrayChild(node.value);
  }(node) ? function(node, name) {
    let items = getArrayChild(node.value).value["rdf:li"];
    const attributes = parseNodeAttributes(node), value = [];
    void 0 === items ? items = [] : Array.isArray(items) || (items = [ items ]);
    return items.forEach(item => {
      value.push(function(item) {
        if (hasNestedSimpleRdfDescription(item)) {
          return parseNodeAsSimpleRdfDescription(item);
        }
        if (hasNestedStructureRdfDescription(item)) {
          return parseNodeAsStructureRdfDescription(item).value;
        }
        if (isCompactStructure(item)) {
          return parseNodeAsCompactStructure(item).value;
        }
        return parseNodeAsSimpleValue(item);
      }(item));
    }), {
      value: value,
      attributes: attributes,
      description: getDescription$1(value, name)
    };
  }(node, name) : parseNodeAsSimpleValue(node, name);
}

function hasNestedSimpleRdfDescription(node) {
  return "Resource" === node.attributes["rdf:parseType"] && void 0 !== node.value["rdf:value"] || void 0 !== node.value["rdf:Description"] && void 0 !== node.value["rdf:Description"].value["rdf:value"];
}

function parseNodeAsSimpleRdfDescription(node, name) {
  const attributes = parseNodeAttributes(node);
  void 0 !== node.value["rdf:Description"] && (node = node.value["rdf:Description"]), 
  objectAssign(attributes, parseNodeAttributes(node), function(node) {
    const attributes = {};
    for (const name in node.value) {
      "rdf:value" === name || isNamespaceDefinition(name) || (attributes[getLocalName(name)] = node.value[name].value);
    }
    return attributes;
  }(node));
  const value = function(node) {
    return getURIValue(node.value["rdf:value"]) || node.value["rdf:value"].value;
  }(node);
  return {
    value: value,
    attributes: attributes,
    description: getDescription$1(value, name)
  };
}

function parseNodeAttributes(node) {
  const attributes = {};
  for (const name in node.attributes) {
    "rdf:parseType" === name || "rdf:resource" === name || isNamespaceDefinition(name) || (attributes[getLocalName(name)] = node.attributes[name]);
  }
  return attributes;
}

function hasNestedStructureRdfDescription(node) {
  return "Resource" === node.attributes["rdf:parseType"] || void 0 !== node.value["rdf:Description"] && void 0 === node.value["rdf:Description"].value["rdf:value"];
}

function parseNodeAsStructureRdfDescription(node, name) {
  const tag = {
    value: {},
    attributes: {}
  };
  return void 0 !== node.value["rdf:Description"] && (objectAssign(tag.value, parseNodeAttributesAsTags(node.value["rdf:Description"].attributes)), 
  objectAssign(tag.attributes, parseNodeAttributes(node)), node = node.value["rdf:Description"]), 
  objectAssign(tag.value, parseNodeChildrenAsTags(node.value)), tag.description = getDescription$1(tag.value, name), 
  tag;
}

function isCompactStructure(node) {
  return 0 === Object.keys(node.value).length && void 0 === node.attributes["xml:lang"] && void 0 === node.attributes["rdf:resource"];
}

function parseNodeAsCompactStructure(node, name) {
  const value = parseNodeAttributesAsTags(node.attributes);
  return {
    value: value,
    attributes: {},
    description: getDescription$1(value, name)
  };
}

function getArrayChild(value) {
  return value["rdf:Bag"] || value["rdf:Seq"] || value["rdf:Alt"];
}

function parseNodeAsSimpleValue(node, name) {
  const value = getURIValue(node) || parseXMPObject(node.value);
  return {
    value: value,
    attributes: parseNodeAttributes(node),
    description: getDescription$1(value, name)
  };
}

function getURIValue(node) {
  return node.attributes && node.attributes["rdf:resource"];
}

const PathRecordTypes_CLOSED_SUBPATH_LENGTH = 0, PathRecordTypes_CLOSED_SUBPATH_BEZIER_LINKED = 1, PathRecordTypes_CLOSED_SUBPATH_BEZIER_UNLINKED = 2, PathRecordTypes_OPEN_SUBPATH_LENGTH = 3, PathRecordTypes_OPEN_SUBPATH_BEZIER_LINKED = 4, PathRecordTypes_OPEN_SUBPATH_BEZIER_UNLINKED = 5, PathRecordTypes_FILL_RULE = 6, PathRecordTypes_CLIPBOARD = 7, PathRecordTypes_INITIAL_FILL_RULE = 8;

var TagNames = {
  2e3: {
    name: "PathInformation",
    description: function(dataView) {
      const types = {}, paths = [];
      for (let offset = 0; offset < dataView.byteLength; offset += 26) {
        const type = Types.getShortAt(dataView, offset);
        PATH_RECORD_TYPES[type] && (types[type] || (types[type] = PATH_RECORD_TYPES[type].description), 
        paths.push({
          type: type,
          path: PATH_RECORD_TYPES[type].path(dataView, offset + 2)
        }));
      }
      return JSON.stringify({
        types: types,
        paths: paths
      });
    }
  },
  2999: {
    name: "ClippingPathName",
    description(dataView) {
      const [, string] = getPascalStringFromDataView(dataView, 0);
      return string;
    }
  }
};

const PATH_RECORD_TYPES = {
  [PathRecordTypes_CLOSED_SUBPATH_LENGTH]: {
    description: "Closed subpath length",
    path: (dataView, offset) => [ Types.getShortAt(dataView, offset) ]
  },
  [PathRecordTypes_CLOSED_SUBPATH_BEZIER_LINKED]: {
    description: "Closed subpath Bezier knot, linked",
    path: parseBezierKnot
  },
  [PathRecordTypes_CLOSED_SUBPATH_BEZIER_UNLINKED]: {
    description: "Closed subpath Bezier knot, unlinked",
    path: parseBezierKnot
  },
  [PathRecordTypes_OPEN_SUBPATH_LENGTH]: {
    description: "Open subpath length",
    path: (dataView, offset) => [ Types.getShortAt(dataView, offset) ]
  },
  [PathRecordTypes_OPEN_SUBPATH_BEZIER_LINKED]: {
    description: "Open subpath Bezier knot, linked",
    path: parseBezierKnot
  },
  [PathRecordTypes_OPEN_SUBPATH_BEZIER_UNLINKED]: {
    description: "Open subpath Bezier knot, unlinked",
    path: parseBezierKnot
  },
  [PathRecordTypes_FILL_RULE]: {
    description: "Path fill rule",
    path: () => []
  },
  [PathRecordTypes_INITIAL_FILL_RULE]: {
    description: "Initial fill rule",
    path: (dataView, offset) => [ Types.getShortAt(dataView, offset) ]
  },
  [PathRecordTypes_CLIPBOARD]: {
    description: "Clipboard",
    path: function(dataView, offset) {
      return [ [ getFixedPointNumber(dataView, offset, 8), getFixedPointNumber(dataView, offset + 4, 8), getFixedPointNumber(dataView, offset + 8, 8), getFixedPointNumber(dataView, offset + 12, 8) ], getFixedPointNumber(dataView, offset + 16, 8) ];
    }
  }
};

function parseBezierKnot(dataView, offset) {
  const path = [];
  for (let i = 0; i < 24; i += 8) {
    path.push(parsePathPoint(dataView, offset + i));
  }
  return path;
}

function parsePathPoint(dataView, offset) {
  const vertical = getFixedPointNumber(dataView, offset, 8);
  return [ getFixedPointNumber(dataView, offset + 4, 8), vertical ];
}

function getFixedPointNumber(dataView, offset, binaryPoint) {
  const number = Types.getLongAt(dataView, offset), sign = number >>> 31 == 0 ? 1 : -1, integer = (2130706432 & number) >>> 32 - binaryPoint, fraction = number & parseInt(strRepeat("1", 32 - binaryPoint), 2);
  return sign * function(string, radix) {
    return parseInt(string.replace(".", ""), radix) / Math.pow(radix, (string.split(".")[1] || "").length);
  }(integer.toString(2) + "." + (string = fraction.toString(2), strRepeat("0", 32 - binaryPoint - string.length) + string), 2);
  var string;
}

var PhotoshopTags = {
  read: function(bytes, includeUnknown) {
    const dataView = getDataView$1(new Uint8Array(bytes).buffer), tags = {};
    let offset = 0;
    for (;offset < bytes.length; ) {
      const signature = getStringFromDataView(dataView, offset, SIGNATURE_SIZE);
      offset += SIGNATURE_SIZE;
      const tagId = Types.getShortAt(dataView, offset);
      offset += TAG_ID_SIZE;
      const {tagName: tagName, tagNameSize: tagNameSize} = getTagName(dataView, offset);
      offset += tagNameSize;
      const resourceSize = Types.getLongAt(dataView, offset);
      if (offset += RESOURCE_LENGTH_SIZE, signature === SIGNATURE) {
        const valueDataView = getDataView$1(dataView.buffer, offset, resourceSize), tag = {
          id: tagId,
          value: getStringFromDataView(valueDataView, 0, resourceSize)
        };
        if (TagNames[tagId]) {
          try {
            tag.description = TagNames[tagId].description(valueDataView);
          } catch (error) {
            tag.description = "<no description formatter>";
          }
          tags[tagName || TagNames[tagId].name] = tag;
        } else {
          includeUnknown && (tags[`undefined-${tagId}`] = tag);
        }
      }
      offset += resourceSize + resourceSize % 2;
    }
    return tags;
  }
};

const SIGNATURE = "8BIM", TAG_ID_SIZE = 2, RESOURCE_LENGTH_SIZE = 4, SIGNATURE_SIZE = SIGNATURE.length;

function getTagName(dataView, offset) {
  const [stringSize, string] = getPascalStringFromDataView(dataView, offset);
  return {
    tagName: string,
    tagNameSize: 1 + stringSize + (stringSize % 2 == 0 ? 1 : 0)
  };
}

const iccTags = {
  desc: {
    name: "ICC Description"
  },
  cprt: {
    name: "ICC Copyright"
  },
  dmdd: {
    name: "ICC Device Model Description"
  },
  vued: {
    name: "ICC Viewing Conditions Description"
  },
  dmnd: {
    name: "ICC Device Manufacturer for Display"
  },
  tech: {
    name: "Technology"
  }
}, iccProfile = {
  4: {
    name: "Preferred CMM type",
    value: (dataView, offset) => getStringFromDataView(dataView, offset, 4),
    description: value => null !== value ? toCompany(value) : ""
  },
  8: {
    name: "Profile Version",
    value: (dataView, offset) => dataView.getUint8(offset).toString(10) + "." + (dataView.getUint8(offset + 1) >> 4).toString(10) + "." + (dataView.getUint8(offset + 1) % 16).toString(10)
  },
  12: {
    name: "Profile/Device class",
    value: (dataView, offset) => getStringFromDataView(dataView, offset, 4),
    description: value => {
      switch (value.toLowerCase()) {
       case "scnr":
        return "Input Device profile";

       case "mntr":
        return "Display Device profile";

       case "prtr":
        return "Output Device profile";

       case "link":
        return "DeviceLink profile";

       case "abst":
        return "Abstract profile";

       case "spac":
        return "ColorSpace profile";

       case "nmcl":
        return "NamedColor profile";

       case "cenc":
        return "ColorEncodingSpace profile";

       case "mid ":
        return "MultiplexIdentification profile";

       case "mlnk":
        return "MultiplexLink profile";

       case "mvis":
        return "MultiplexVisualization profile";

       default:
        return value;
      }
    }
  },
  16: {
    name: "Color Space",
    value: (dataView, offset) => getStringFromDataView(dataView, offset, 4)
  },
  20: {
    name: "Connection Space",
    value: (dataView, offset) => getStringFromDataView(dataView, offset, 4)
  },
  24: {
    name: "ICC Profile Date",
    value: (dataView, offset) => function(dataView, offset) {
      const year = dataView.getUint16(offset), month = dataView.getUint16(offset + 2) - 1, day = dataView.getUint16(offset + 4), hours = dataView.getUint16(offset + 6), minutes = dataView.getUint16(offset + 8), seconds = dataView.getUint16(offset + 10);
      return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    }(dataView, offset).toISOString()
  },
  36: {
    name: "ICC Signature",
    value: (dataView, offset) => {
      return slice = dataView.buffer.slice(offset, offset + 4), String.fromCharCode.apply(null, new Uint8Array(slice));
      var slice;
    }
  },
  40: {
    name: "Primary Platform",
    value: (dataView, offset) => getStringFromDataView(dataView, offset, 4),
    description: value => toCompany(value)
  },
  48: {
    name: "Device Manufacturer",
    value: (dataView, offset) => getStringFromDataView(dataView, offset, 4),
    description: value => toCompany(value)
  },
  52: {
    name: "Device Model Number",
    value: (dataView, offset) => getStringFromDataView(dataView, offset, 4)
  },
  64: {
    name: "Rendering Intent",
    value: (dataView, offset) => dataView.getUint32(offset),
    description: value => {
      switch (value) {
       case 0:
        return "Perceptual";

       case 1:
        return "Relative Colorimetric";

       case 2:
        return "Saturation";

       case 3:
        return "Absolute Colorimetric";

       default:
        return value;
      }
    }
  },
  80: {
    name: "Profile Creator",
    value: (dataView, offset) => getStringFromDataView(dataView, offset, 4)
  }
};

function toCompany(value) {
  switch (value.toLowerCase()) {
   case "appl":
    return "Apple";

   case "adbe":
    return "Adobe";

   case "msft":
    return "Microsoft";

   case "sunw":
    return "Sun Microsystems";

   case "sgi":
    return "Silicon Graphics";

   case "tgnt":
    return "Taligent";

   default:
    return value;
  }
}

var IccTags = {
  read: function(dataView, iccData, async) {
    if (async && undefined !== iccData[0].compressionMethod) {
      return function(dataView, iccData) {
        if (compressionMethod = iccData[0].compressionMethod, 0 !== compressionMethod) {
          return {};
        }
        var compressionMethod;
        const compressedDataView = new DataView(dataView.buffer.slice(iccData[0].offset, iccData[0].offset + iccData[0].length));
        return decompress(compressedDataView, iccData[0].compressionMethod, "utf-8", "dataview").then(parseTags).catch(() => ({}));
      }(dataView, iccData);
    }
    return function(dataView, iccData) {
      try {
        const totalIccProfileLength = iccData.reduce((sum, icc) => sum + icc.length, 0), iccBinaryData = new Uint8Array(totalIccProfileLength);
        let offset = 0;
        const buffer = function(dataView) {
          if (Array.isArray(dataView)) {
            return new DataView(Uint8Array.from(dataView).buffer).buffer;
          }
          return dataView.buffer;
        }(dataView);
        for (let chunkNumber = 1; chunkNumber <= iccData.length; chunkNumber++) {
          const iccDataChunk = iccData.find(x => x.chunkNumber === chunkNumber);
          if (!iccDataChunk) {
            throw new Error(`ICC chunk ${chunkNumber} not found`);
          }
          const data = buffer.slice(iccDataChunk.offset, iccDataChunk.offset + iccDataChunk.length), chunkData = new Uint8Array(data);
          iccBinaryData.set(chunkData, offset), offset += chunkData.length;
        }
        return parseTags(new DataView(iccBinaryData.buffer));
      } catch (error) {
        return {};
      }
    }(dataView, iccData);
  }
};

const PROFILE_HEADER_LENGTH = 84, ICC_TAG_COUNT_OFFSET = 128, ICC_SIGNATURE = "acsp", TAG_TYPE_DESC = "desc", TAG_TYPE_MULTI_LOCALIZED_UNICODE_TYPE = "mluc", TAG_TYPE_TEXT = "text", TAG_TYPE_SIGNATURE = "sig ", TAG_TABLE_SINGLE_TAG_DATA = 12;

function hasTagsData(buffer, tagHeaderOffset) {
  return buffer.length < tagHeaderOffset + TAG_TABLE_SINGLE_TAG_DATA;
}

function parseTags(dataView) {
  const buffer = dataView.buffer, length = dataView.getUint32();
  if (dataView.byteLength !== length) {
    throw new Error("ICC profile length not matching");
  }
  if (dataView.length < PROFILE_HEADER_LENGTH) {
    throw new Error("ICC profile too short");
  }
  const tags = {}, iccProfileKeys = Object.keys(iccProfile);
  for (let i = 0; i < iccProfileKeys.length; i++) {
    const offset = iccProfileKeys[i], profileEntry = iccProfile[offset], value = profileEntry.value(dataView, parseInt(offset, 10));
    let description = value;
    profileEntry.description && (description = profileEntry.description(value)), tags[profileEntry.name] = {
      value: value,
      description: description
    };
  }
  if (sliceToString(buffer.slice(36, 40)) !== ICC_SIGNATURE) {
    throw new Error("ICC profile: missing signature");
  }
  if (function(buffer) {
    return buffer.length < ICC_TAG_COUNT_OFFSET + 4;
  }(buffer)) {
    return tags;
  }
  const tagCount = dataView.getUint32(128);
  let tagHeaderOffset = 132;
  for (let i = 0; i < tagCount; i++) {
    if (hasTagsData(buffer, tagHeaderOffset)) {
      return tags;
    }
    const tagSignature = getStringFromDataView(dataView, tagHeaderOffset, 4), tagOffset = dataView.getUint32(tagHeaderOffset + 4), tagSize = dataView.getUint32(tagHeaderOffset + 8);
    if (tagOffset > buffer.length) {
      return tags;
    }
    const tagType = getStringFromDataView(dataView, tagOffset, 4);
    if (tagType === TAG_TYPE_DESC) {
      const tagValueSize = dataView.getUint32(tagOffset + 8);
      if (tagValueSize > tagSize) {
        return tags;
      }
      addTag(tags, tagSignature, sliceToString(buffer.slice(tagOffset + 12, tagOffset + tagValueSize + 11)));
    } else if (tagType === TAG_TYPE_MULTI_LOCALIZED_UNICODE_TYPE) {
      const numRecords = dataView.getUint32(tagOffset + 8), recordSize = dataView.getUint32(tagOffset + 12);
      let offset = tagOffset + 16;
      const val = [];
      for (let recordNum = 0; recordNum < numRecords; recordNum++) {
        const languageCode = getStringFromDataView(dataView, offset + 0, 2), countryCode = getStringFromDataView(dataView, offset + 2, 2), textLength = dataView.getUint32(offset + 4), textOffset = dataView.getUint32(offset + 8), text = getUnicodeStringFromDataView(dataView, tagOffset + textOffset, textLength);
        val.push({
          languageCode: languageCode,
          countryCode: countryCode,
          text: text
        }), offset += recordSize;
      }
      if (1 === numRecords) {
        addTag(tags, tagSignature, val[0].text);
      } else {
        const valObj = {};
        for (let valIndex = 0; valIndex < val.length; valIndex++) {
          valObj[`${val[valIndex].languageCode}-${val[valIndex].countryCode}`] = val[valIndex].text;
        }
        addTag(tags, tagSignature, valObj);
      }
    } else if (tagType === TAG_TYPE_TEXT) {
      addTag(tags, tagSignature, sliceToString(buffer.slice(tagOffset + 8, tagOffset + tagSize - 7)));
    } else if (tagType === TAG_TYPE_SIGNATURE) {
      addTag(tags, tagSignature, sliceToString(buffer.slice(tagOffset + 8, tagOffset + 12)));
    }
    tagHeaderOffset += 12;
  }
  return tags;
}

function sliceToString(slice) {
  return String.fromCharCode.apply(null, new Uint8Array(slice));
}

function addTag(tags, tagSignature, value) {
  iccTags[tagSignature] ? tags[iccTags[tagSignature].name] = {
    value: value,
    description: value
  } : tags[tagSignature] = {
    value: value,
    description: value
  };
}

var CanonTags = {
  read: function(dataView, tiffHeaderOffset, offset, byteOrder, includeUnknown) {
    let tags = readIfd(dataView, "canon", tiffHeaderOffset, tiffHeaderOffset + offset, byteOrder, includeUnknown);
    tags.ShotInfo && (tags = objectAssign({}, tags, function(shotInfoData) {
      const tags = {};
      void 0 !== shotInfoData[27] && (tags.AutoRotate = {
        value: shotInfoData[27],
        description: getAutoRotateDescription(shotInfoData[27])
      });
      return tags;
    }(tags.ShotInfo.value)), delete tags.ShotInfo);
    return tags;
  },
  SHOT_INFO_AUTO_ROTATE: 27
};

function getAutoRotateDescription(autoRotate) {
  return 0 === autoRotate ? "None" : 1 === autoRotate ? "Rotate 90 CW" : 2 === autoRotate ? "Rotate 180" : 3 === autoRotate ? "Rotate 270 CW" : "Unknown";
}

const MODEL_ID = {
  K3_III: 78420
}, LIK3III = {
  CAMERA_ORIENTATION: 1,
  ROLL_ANGLE: 3,
  PITCH_ANGLE: 5
};

var PentaxTags = {
  read: function(dataView, tiffHeaderOffset, offset, includeUnknown) {
    const byteOrder = ByteOrder.getByteOrder(dataView, tiffHeaderOffset + offset + 8), originOffset = tiffHeaderOffset + offset;
    let tags = readIfd(dataView, "pentax", originOffset, originOffset + 10, byteOrder, includeUnknown);
    (function(tags) {
      return tags.PentaxModelID && tags.PentaxModelID.value === MODEL_ID.K3_III && tags.LevelInfo;
    })(tags) && (tags = objectAssign({}, tags, function(dataView, levelInfoOffset, byteOrder) {
      const tags = {};
      if (levelInfoOffset + 7 > dataView.byteLength) {
        return tags;
      }
      const cameraOrientation = dataView.getInt8(levelInfoOffset + LIK3III.CAMERA_ORIENTATION);
      tags.CameraOrientation = {
        value: cameraOrientation,
        description: getOrientationDescription(cameraOrientation)
      };
      const rollAngle = dataView.getInt16(levelInfoOffset + LIK3III.ROLL_ANGLE, byteOrder === ByteOrder.LITTLE_ENDIAN);
      tags.RollAngle = {
        value: rollAngle,
        description: getRollAngleDescription(rollAngle)
      };
      const pitchAngle = dataView.getInt16(levelInfoOffset + LIK3III.PITCH_ANGLE, byteOrder === ByteOrder.LITTLE_ENDIAN);
      return tags.PitchAngle = {
        value: pitchAngle,
        description: getPitchAngleDescription(pitchAngle)
      }, tags;
    }(dataView, originOffset + tags.LevelInfo.__offset, byteOrder)), delete tags.LevelInfo);
    return tags;
  },
  PENTAX_IFD_OFFSET: 10,
  MODEL_ID: MODEL_ID,
  LIK3III: LIK3III
};

function getOrientationDescription(orientation) {
  return 0 === orientation ? "Horizontal (normal)" : 1 === orientation ? "Rotate 270 CW" : 2 === orientation ? "Rotate 180" : 3 === orientation ? "Rotate 90 CW" : 4 === orientation ? "Upwards" : 5 === orientation ? "Downwards" : "Unknown";
}

function getRollAngleDescription(rollAngle) {
  return "" + -.5 * rollAngle;
}

function getPitchAngleDescription(pitchAngle) {
  return "" + -.5 * pitchAngle;
}

var PngFileTags = {
  read: function(dataView, fileDataOffset) {
    return {
      "Image Width": getImageWidth$1(dataView, fileDataOffset),
      "Image Height": getImageHeight$1(dataView, fileDataOffset),
      "Bit Depth": getBitDepth$1(dataView, fileDataOffset),
      "Color Type": getColorType(dataView, fileDataOffset),
      Compression: getCompression(dataView, fileDataOffset),
      Filter: getFilter(dataView, fileDataOffset),
      Interlace: getInterlace(dataView, fileDataOffset)
    };
  }
};

function getImageWidth$1(dataView, fileDataOffset) {
  if (fileDataOffset + 0 + 4 > dataView.byteLength) {
    return;
  }
  const value = Types.getLongAt(dataView, fileDataOffset);
  return {
    value: value,
    description: `${value}px`
  };
}

function getImageHeight$1(dataView, fileDataOffset) {
  if (fileDataOffset + 4 + 4 > dataView.byteLength) {
    return;
  }
  const value = Types.getLongAt(dataView, fileDataOffset + 4);
  return {
    value: value,
    description: `${value}px`
  };
}

function getBitDepth$1(dataView, fileDataOffset) {
  if (fileDataOffset + 8 + 1 > dataView.byteLength) {
    return;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + 8);
  return {
    value: value,
    description: `${value}`
  };
}

function getColorType(dataView, fileDataOffset) {
  if (fileDataOffset + 9 + 1 > dataView.byteLength) {
    return;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + 9);
  return {
    value: value,
    description: {
      0: "Grayscale",
      2: "RGB",
      3: "Palette",
      4: "Grayscale with Alpha",
      6: "RGB with Alpha"
    }[value] || "Unknown"
  };
}

function getCompression(dataView, fileDataOffset) {
  if (fileDataOffset + 10 + 1 > dataView.byteLength) {
    return;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + 10);
  return {
    value: value,
    description: 0 === value ? "Deflate/Inflate" : "Unknown"
  };
}

function getFilter(dataView, fileDataOffset) {
  if (fileDataOffset + 11 + 1 > dataView.byteLength) {
    return;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + 11);
  return {
    value: value,
    description: 0 === value ? "Adaptive" : "Unknown"
  };
}

function getInterlace(dataView, fileDataOffset) {
  if (fileDataOffset + 12 + 1 > dataView.byteLength) {
    return;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + 12);
  return {
    value: value,
    description: {
      0: "Noninterlaced",
      1: "Adam7 Interlace"
    }[value] || "Unknown"
  };
}

var PngTextTags = {
  read: function(dataView, pngTextChunks, async, includeUnknown) {
    const tags = {}, tagsPromises = [];
    for (let i = 0; i < pngTextChunks.length; i++) {
      const {offset: offset, length: length, type: type} = pngTextChunks[i], nameAndValue = getNameAndValue(dataView, offset, length, type, async);
      if (nameAndValue instanceof Promise) {
        tagsPromises.push(nameAndValue.then(({name: name, value: value, description: description}) => {
          try {
            if (Constants_USE_EXIF && isExifGroupTag(name, value)) {
              return {
                __exif: Tags.read(decodeRawData(value), EXIF_OFFSET, includeUnknown).tags
              };
            }
            if (Constants_USE_IPTC && isIptcGroupTag(name, value)) {
              return {
                __iptc: IptcTags.read(decodeRawData(value), 0, includeUnknown)
              };
            }
            if (name && !isExifGroupTag(name, value) && !isIptcGroupTag(name, value)) {
              return {
                [name]: {
                  value: value,
                  description: description
                }
              };
            }
          } catch (error) {}
          return {};
        }));
      } else {
        const {name: name, value: value, description: description} = nameAndValue;
        name && (tags[name] = {
          value: value,
          description: description
        });
      }
    }
    return {
      readTags: tags,
      readTagsPromise: tagsPromises.length > 0 ? Promise.all(tagsPromises) : void 0
    };
  }
};

const STATE_KEYWORD = "STATE_KEYWORD", STATE_COMPRESSION = "STATE_COMPRESSION", STATE_LANG = "STATE_LANG", STATE_TRANSLATED_KEYWORD = "STATE_TRANSLATED_KEYWORD", STATE_TEXT = "STATE_TEXT", COMPRESSION_SECTION_ITXT_EXTRA_BYTE = 1, COMPRESSION_FLAG_COMPRESSED = 1, EXIF_OFFSET = 6;

function getNameAndValue(dataView, offset, length, type, async) {
  const keywordChars = [], langChars = [];
  let valueChars, compressionMethod, parsingState = STATE_KEYWORD;
  for (let i = 0; i < length && offset + i < dataView.byteLength; i++) {
    if (parsingState === STATE_COMPRESSION) {
      compressionMethod = getCompressionMethod({
        type: type,
        dataView: dataView,
        offset: offset + i
      }), type === TYPE_ITXT && (i += COMPRESSION_SECTION_ITXT_EXTRA_BYTE), parsingState = moveToNextState(type, parsingState);
      continue;
    }
    if (parsingState === STATE_TEXT) {
      valueChars = new DataView(dataView.buffer.slice(offset + i, offset + length));
      break;
    }
    const byte = dataView.getUint8(offset + i);
    0 === byte ? parsingState = moveToNextState(type, parsingState) : parsingState === STATE_KEYWORD ? keywordChars.push(byte) : parsingState === STATE_LANG && langChars.push(byte);
  }
  if (undefined !== compressionMethod && !async) {
    return {};
  }
  const decompressedValueChars = decompress(valueChars, compressionMethod, function(type) {
    if (type === TYPE_TEXT || type === TYPE_ZTXT) {
      return "latin1";
    }
    return "utf-8";
  }(type));
  return decompressedValueChars instanceof Promise ? decompressedValueChars.then(_decompressedValueChars => constructTag(_decompressedValueChars, type, langChars, keywordChars)).catch(() => constructTag("<text using unknown compression>".split(""), type, langChars, keywordChars)) : constructTag(decompressedValueChars, type, langChars, keywordChars);
}

function getCompressionMethod({type: type, dataView: dataView, offset: offset}) {
  if (type === TYPE_ITXT) {
    if (dataView.getUint8(offset) === COMPRESSION_FLAG_COMPRESSED) {
      return dataView.getUint8(offset + 1);
    }
  } else if (type === TYPE_ZTXT) {
    return dataView.getUint8(offset);
  }
}

function moveToNextState(type, parsingState) {
  return parsingState === STATE_KEYWORD && [ TYPE_ITXT, TYPE_ZTXT ].includes(type) ? STATE_COMPRESSION : parsingState === STATE_COMPRESSION ? type === TYPE_ITXT ? STATE_LANG : STATE_TEXT : parsingState === STATE_LANG ? STATE_TRANSLATED_KEYWORD : STATE_TEXT;
}

function constructTag(valueChars, type, langChars, keywordChars) {
  const value = function(valueChars) {
    if (valueChars instanceof DataView) {
      return getStringFromDataView(valueChars, 0, valueChars.byteLength);
    }
    return valueChars;
  }(valueChars);
  return {
    name: getName(type, langChars, keywordChars),
    value: value,
    description: type === TYPE_ITXT ? getDescription(valueChars) : value
  };
}

function getName(type, langChars, keywordChars) {
  const name = getStringValueFromArray(keywordChars);
  if (type === TYPE_TEXT || 0 === langChars.length) {
    return name;
  }
  return `${name} (${getStringValueFromArray(langChars)})`;
}

function getDescription(valueChars) {
  return TagDecoder.decode("UTF-8", valueChars);
}

function isExifGroupTag(name, value) {
  return "raw profile type exif" === name.toLowerCase() && "exif" === value.substring(1, 5);
}

function isIptcGroupTag(name, value) {
  return "raw profile type iptc" === name.toLowerCase() && "iptc" === value.substring(1, 5);
}

function decodeRawData(value) {
  return function(hex) {
    const dataView = new DataView(new ArrayBuffer(hex.length / 2));
    for (let i = 0; i < hex.length; i += 2) {
      dataView.setUint8(i / 2, parseInt(hex.substring(i, i + 2), 16));
    }
    return dataView;
  }(value.match(/\n(exif|iptc)\n\s*\d+\n([\s\S]*)$/)[2].replace(/\n/g, ""));
}

var PngTags = {
  read: function(dataView, chunkOffsets) {
    const tags = {};
    for (let i = 0; i < chunkOffsets.length; i++) {
      const chunkLength = Types.getLongAt(dataView, chunkOffsets[i] + PNG_CHUNK_LENGTH_OFFSET), chunkType = getStringFromDataView(dataView, chunkOffsets[i] + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE);
      chunkType === TYPE_PHYS ? (tags["Pixels Per Unit X"] = getPixelsPerUnitX(dataView, chunkOffsets[i], chunkLength), 
      tags["Pixels Per Unit Y"] = getPixelsPerUnitY(dataView, chunkOffsets[i], chunkLength), 
      tags["Pixel Units"] = getPixelUnits(dataView, chunkOffsets[i], chunkLength)) : chunkType === TYPE_TIME && (tags["Modify Date"] = getModifyDate(dataView, chunkOffsets[i], chunkLength));
    }
    return tags;
  }
};

function getPixelsPerUnitX(dataView, chunkOffset, chunkLength) {
  if (!tagFitsInBuffer(dataView, chunkOffset, chunkLength, 0, 4)) {
    return;
  }
  const value = Types.getLongAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 0);
  return {
    value: value,
    description: "" + value
  };
}

function getPixelsPerUnitY(dataView, chunkOffset, chunkLength) {
  if (!tagFitsInBuffer(dataView, chunkOffset, chunkLength, 4, 4)) {
    return;
  }
  const value = Types.getLongAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 4);
  return {
    value: value,
    description: "" + value
  };
}

function getPixelUnits(dataView, chunkOffset, chunkLength) {
  if (!tagFitsInBuffer(dataView, chunkOffset, chunkLength, 8, 1)) {
    return;
  }
  const value = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 8);
  return {
    value: value,
    description: 1 === value ? "meters" : "Unknown"
  };
}

function getModifyDate(dataView, chunkOffset, chunkLength) {
  if (!tagFitsInBuffer(dataView, chunkOffset, chunkLength, 0, 7)) {
    return;
  }
  const year = Types.getShortAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET), month = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 2), day = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 3), hours = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 4), minutes = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 5), seconds = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 6);
  return {
    value: [ year, month, day, hours, minutes, seconds ],
    description: `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)} ${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}`
  };
}

function tagFitsInBuffer(dataView, chunkOffset, chunkLength, tagOffset, tagSize) {
  return tagOffset + tagSize <= chunkLength && chunkOffset + PNG_CHUNK_DATA_OFFSET + tagOffset + tagSize <= dataView.byteLength;
}

function pad(number, size) {
  return `${"0".repeat(size - ("" + number).length)}${number}`;
}

var Vp8xTags = {
  read: function(dataView, chunkOffset) {
    const tags = {}, flags = Types.getByteAt(dataView, chunkOffset);
    return tags.Alpha = getAlpha(flags), tags.Animation = getAnimation(flags), tags.ImageWidth = getThreeByteValue(dataView, chunkOffset + IMAGE_WIDTH_OFFSET), 
    tags.ImageHeight = getThreeByteValue(dataView, chunkOffset + IMAGE_HEIGHT_OFFSET), 
    tags;
  }
};

const IMAGE_WIDTH_OFFSET = 4, IMAGE_HEIGHT_OFFSET = 7;

function getAlpha(flags) {
  const value = 16 & flags;
  return {
    value: value ? 1 : 0,
    description: value ? "Yes" : "No"
  };
}

function getAnimation(flags) {
  const value = 2 & flags;
  return {
    value: value ? 1 : 0,
    description: value ? "Yes" : "No"
  };
}

function getThreeByteValue(dataView, offset) {
  const value = Types.getByteAt(dataView, offset) + 256 * Types.getByteAt(dataView, offset + 1) + 65536 * Types.getByteAt(dataView, offset + 2) + 1;
  return {
    value: value,
    description: value + "px"
  };
}

var GifFileTags = {
  read: function(dataView) {
    return {
      "GIF Version": getGifVersion(dataView),
      "Image Width": getImageWidth(dataView),
      "Image Height": getImageHeight(dataView),
      "Global Color Map": getGlobalColorMap(dataView),
      "Bits Per Pixel": getBitDepth(dataView),
      "Color Resolution Depth": getColorResolution(dataView)
    };
  }
};

function getGifVersion(dataView) {
  if (6 > dataView.byteLength) {
    return;
  }
  const value = getStringFromDataView(dataView, 3, 3);
  return {
    value: value,
    description: value
  };
}

function getImageWidth(dataView) {
  if (8 > dataView.byteLength) {
    return;
  }
  const value = dataView.getUint16(6, !0);
  return {
    value: value,
    description: `${value}px`
  };
}

function getImageHeight(dataView) {
  if (10 > dataView.byteLength) {
    return;
  }
  const value = dataView.getUint16(8, !0);
  return {
    value: value,
    description: `${value}px`
  };
}

function getGlobalColorMap(dataView) {
  if (11 > dataView.byteLength) {
    return;
  }
  const value = (128 & dataView.getUint8(10)) >>> 7;
  return {
    value: value,
    description: 1 === value ? "Yes" : "No"
  };
}

function getColorResolution(dataView) {
  if (11 > dataView.byteLength) {
    return;
  }
  const value = ((112 & dataView.getUint8(10)) >>> 4) + 1;
  return {
    value: value,
    description: `${value} ${1 === value ? "bit" : "bits"}`
  };
}

function getBitDepth(dataView) {
  if (11 > dataView.byteLength) {
    return;
  }
  const value = 1 + (7 & dataView.getUint8(10));
  return {
    value: value,
    description: `${value} ${1 === value ? "bit" : "bits"}`
  };
}

const COMPRESSION_JPEG = [ 6, 7, 99 ];

var Thumbnail = {
  get: function(dataView, thumbnailTags, tiffHeaderOffset) {
    if (tags = thumbnailTags, tags && (void 0 === tags.Compression || COMPRESSION_JPEG.includes(tags.Compression.value)) && tags.JPEGInterchangeFormat && tags.JPEGInterchangeFormat.value && tags.JPEGInterchangeFormatLength && tags.JPEGInterchangeFormatLength.value) {
      thumbnailTags.type = "image/jpeg";
      const offset = tiffHeaderOffset + thumbnailTags.JPEGInterchangeFormat.value;
      thumbnailTags.image = dataView.buffer.slice(offset, offset + thumbnailTags.JPEGInterchangeFormatLength.value), 
      deferInit(thumbnailTags, "base64", function() {
        return getBase64Image(this.image);
      });
    }
    var tags;
    return thumbnailTags;
  }
};

const FOCAL_PLANE_RESOLUTION_UNIT_INCHES = 2, FOCAL_PLANE_RESOLUTION_UNIT_CENTIMETERS = 3, FOCAL_PLANE_RESOLUTION_UNIT_MILLIMETERS = 4, UNIT_FACTORS_INCHES_TO_MM = 25.4, UNIT_FACTORS_CM_TO_MM = 10, UNIT_FACTORS_MM_TO_MM = 1;

var Composite = {
  get: function(tags, expanded) {
    const compositeTags = {};
    let hasCompositeTags = !1;
    const focalLength = getTagValue(tags, "exif", "FocalLength", expanded), focalPlaneXResolution = getTagValue(tags, "exif", "FocalPlaneXResolution", expanded), focalPlaneYResolution = getTagValue(tags, "exif", "FocalPlaneYResolution", expanded), focalPlaneResolutionUnit = getTagValue(tags, "exif", "FocalPlaneResolutionUnit", expanded), imageWidth = getTagValue(tags, "file", "Image Width", expanded), imageHeight = getTagValue(tags, "file", "Image Height", expanded), focalLengthIn35mmFilm = getTagValue(tags, "exif", "FocalLengthIn35mmFilm", expanded) || function(focalPlaneXResolution, focalPlaneYResolution, focalPlaneResolutionUnit, imageWidth, imageHeight, focalLength) {
      const DIAGONAL_35mm = 43.27;
      if (focalPlaneXResolution && focalPlaneYResolution && focalPlaneResolutionUnit && imageWidth && imageHeight && focalLength) {
        try {
          let resolutionUnitFactor;
          switch (focalPlaneResolutionUnit) {
           case FOCAL_PLANE_RESOLUTION_UNIT_INCHES:
            resolutionUnitFactor = UNIT_FACTORS_INCHES_TO_MM;
            break;

           case FOCAL_PLANE_RESOLUTION_UNIT_CENTIMETERS:
            resolutionUnitFactor = UNIT_FACTORS_CM_TO_MM;
            break;

           case FOCAL_PLANE_RESOLUTION_UNIT_MILLIMETERS:
            resolutionUnitFactor = UNIT_FACTORS_MM_TO_MM;
            break;

           default:
            return;
          }
          const focalPlaneXResolutionMm = focalPlaneXResolution[0] / focalPlaneXResolution[1] * resolutionUnitFactor, focalPlaneYResolutionMm = focalPlaneYResolution[0] / focalPlaneYResolution[1] * resolutionUnitFactor, sensorWidthMm = imageWidth / focalPlaneXResolutionMm, sensorHeightMm = imageHeight / focalPlaneYResolutionMm, sensorDiagonal = Math.sqrt(sensorWidthMm ** 2 + sensorHeightMm ** 2);
          return focalLength[0] / focalLength[1] * (DIAGONAL_35mm / sensorDiagonal);
        } catch (error) {}
      }
      return;
    }(focalPlaneXResolution, focalPlaneYResolution, focalPlaneResolutionUnit, imageWidth, imageHeight, focalLength);
    focalLengthIn35mmFilm && (compositeTags.FocalLength35efl = {
      value: focalLengthIn35mmFilm,
      description: TagNamesCommon.FocalLengthIn35mmFilm(focalLengthIn35mmFilm)
    }, hasCompositeTags = !0);
    const scaleFactorTo35mmEquivalent = function(focalLength, focalLengthIn35mmFilm) {
      if (focalLength && focalLengthIn35mmFilm) {
        try {
          const value = focalLengthIn35mmFilm / (focalLength[0] / focalLength[1]);
          return {
            value: value,
            description: value.toFixed(1)
          };
        } catch (error) {}
      }
      return;
    }(focalLength, focalLengthIn35mmFilm);
    scaleFactorTo35mmEquivalent && (compositeTags.ScaleFactorTo35mmEquivalent = scaleFactorTo35mmEquivalent, 
    hasCompositeTags = !0);
    const fieldOfView = function(focalLengthIn35mmFilm) {
      const FULL_FRAME_SENSOR_WIDTH_MM = 36;
      if (focalLengthIn35mmFilm) {
        try {
          const value = 2 * Math.atan(FULL_FRAME_SENSOR_WIDTH_MM / (2 * focalLengthIn35mmFilm)) * (180 / Math.PI);
          return {
            value: value,
            description: value.toFixed(1) + " deg"
          };
        } catch (error) {}
      }
      return;
    }(focalLengthIn35mmFilm);
    fieldOfView && (compositeTags.FieldOfView = fieldOfView, hasCompositeTags = !0);
    if (hasCompositeTags) {
      return compositeTags;
    }
    return;
  }
};

function getTagValue(tags, group, tagName, expanded) {
  return expanded && tags[group] && tags[group][tagName] ? tags[group][tagName].value : !expanded && tags[tagName] ? tags[tagName].value : void 0;
}

function MetadataMissingError(message) {
  this.name = "MetadataMissingError", this.message = message || "No Exif data", this.stack = (new Error).stack;
}

MetadataMissingError.prototype = new Error;

var exifErrors = {
  MetadataMissingError: MetadataMissingError
}, ExifReader = {
  load: function(data, options = {}) {
    if (function(data) {
      return "string" == typeof data;
    }(data)) {
      return options.async = !0, function(filename, options) {
        if (/^\w+:\/\//.test(filename)) {
          return "undefined" != typeof fetch ? function(url, {length: length} = {}) {
            const options = {
              method: "GET"
            };
            Number.isInteger(length) && length >= 0 && (options.headers = {
              range: "bytes=0-" + (length - 1)
            });
            return fetch(url, options).then(response => response.arrayBuffer());
          }(filename, options) : function(url, {length: length} = {}) {
            return new Promise((resolve, reject) => {
              const options = {};
              Number.isInteger(length) && length >= 0 && (options.headers = {
                range: "bytes=0-" + (length - 1)
              });
              const get = function(url) {
                if (/^https:\/\//.test(url)) {
                  return __non_webpack_require__("https").get;
                }
                return __non_webpack_require__("http").get;
              }(url);
              get(url, options, response => {
                if (response.statusCode >= 200 && response.statusCode <= 299) {
                  const data = [];
                  response.on("data", chunk => data.push(Buffer.from(chunk))), response.on("error", error => reject(error)), 
                  response.on("end", () => resolve(Buffer.concat(data)));
                } else {
                  reject(`Could not fetch file: ${response.statusCode} ${response.statusMessage}`), 
                  response.resume();
                }
              }).on("error", error => reject(error));
            });
          }(filename, options);
        }
        if (function(filename) {
          return /^data:[^;,]*(;base64)?,/.test(filename);
        }(filename)) {
          return Promise.resolve(function(dataUri) {
            const data = dataUri.substring(dataUri.indexOf(",") + 1);
            if (-1 !== dataUri.indexOf(";base64")) {
              if ("undefined" != typeof atob) {
                return Uint8Array.from(atob(data), char => char.charCodeAt(0)).buffer;
              }
              if ("undefined" == typeof Buffer) {
                return;
              }
              return void 0 !== Buffer.from ? Buffer.from(data, "base64") : new Buffer(data, "base64");
            }
            const decodedData = decodeURIComponent(data);
            return "undefined" != typeof Buffer ? void 0 !== Buffer.from ? Buffer.from(decodedData) : new Buffer(decodedData) : Uint8Array.from(decodedData, char => char.charCodeAt(0)).buffer;
          }(filename));
        }
        return function(filename, {length: length} = {}) {
          return new Promise((resolve, reject) => {
            const fs = function() {
              try {
                return __non_webpack_require__("fs");
              } catch (error) {
                return;
              }
            }();
            fs.open(filename, (error, fd) => {
              error ? reject(error) : fs.stat(filename, (error, stat) => {
                if (error) {
                  reject(error);
                } else {
                  const size = Math.min(stat.size, void 0 !== length ? length : stat.size), buffer = Buffer.alloc(size), options = {
                    buffer: buffer,
                    length: size
                  };
                  fs.read(fd, options, error => {
                    error ? reject(error) : fs.close(fd, error => {
                      error && console.warn(`Could not close file ${filename}:`, error), resolve(buffer);
                    });
                  });
                }
              });
            });
          });
        }(filename, options);
      }(data, options).then(fileContents => loadFromData(fileContents, options));
    }
    if (function(data) {
      return "undefined" != typeof File && data instanceof File;
    }(data)) {
      return options.async = !0, (file = data, new Promise((resolve, reject) => {
        const reader = new FileReader;
        reader.onload = readerEvent => resolve(readerEvent.target.result), reader.onerror = () => reject(reader.error), 
        reader.readAsArrayBuffer(file);
      })).then(fileContents => loadFromData(fileContents, options));
    }
    var file;
    return loadFromData(data, options);
  },
  loadView: loadView,
  errors: exifErrors
};

function loadFromData(data, options) {
  return function(data) {
    try {
      return Buffer.isBuffer(data);
    } catch (error) {
      return !1;
    }
  }(data) && (data = new Uint8Array(data).buffer), loadView(function(data) {
    try {
      return new DataView(data);
    } catch (error) {
      return new DataView$1(data);
    }
  }(data), options);
}

function loadView(dataView, {expanded: expanded = !1, async: async = !1, includeUnknown: includeUnknown = !1, domParser: domParser} = {
  expanded: !1,
  async: !1,
  includeUnknown: !1,
  domParser: void 0
}) {
  let foundMetaData = !1, tags = {};
  const tagsPromises = [], {fileType: fileType, fileDataOffset: fileDataOffset, jfifDataOffset: jfifDataOffset, tiffHeaderOffset: tiffHeaderOffset, iptcDataOffset: iptcDataOffset, xmpChunks: xmpChunks, iccChunks: iccChunks, mpfDataOffset: mpfDataOffset, pngHeaderOffset: pngHeaderOffset, pngTextChunks: pngTextChunks, pngChunkOffsets: pngChunkOffsets, vp8xChunkOffset: vp8xChunkOffset, gifHeaderOffset: gifHeaderOffset} = ImageHeader.parseAppMarkers(dataView, async);
  if (function(fileDataOffset) {
    return void 0 !== fileDataOffset;
  }(fileDataOffset)) {
    foundMetaData = !0;
    const readTags = FileTags.read(dataView, fileDataOffset);
    expanded ? tags.file = readTags : tags = objectAssign({}, tags, readTags);
  }
  if (function(jfifDataOffset) {
    return void 0 !== jfifDataOffset;
  }(jfifDataOffset)) {
    foundMetaData = !0;
    const readTags = JfifTags.read(dataView, jfifDataOffset);
    expanded ? tags.jfif = readTags : tags = objectAssign({}, tags, readTags);
  }
  if (function(tiffHeaderOffset) {
    return void 0 !== tiffHeaderOffset;
  }(tiffHeaderOffset)) {
    foundMetaData = !0;
    const {tags: readTags, byteOrder: byteOrder} = Tags.read(dataView, tiffHeaderOffset, includeUnknown);
    if (readTags.Thumbnail && (tags.Thumbnail = readTags.Thumbnail, delete readTags.Thumbnail), 
    expanded ? (tags.exif = readTags, function(tags) {
      if (tags.exif) {
        if (tags.exif.GPSLatitude && tags.exif.GPSLatitudeRef) {
          try {
            tags.gps = tags.gps || {}, tags.gps.Latitude = getCalculatedGpsValue(tags.exif.GPSLatitude.value), 
            "S" === tags.exif.GPSLatitudeRef.value.join("") && (tags.gps.Latitude = -tags.gps.Latitude);
          } catch (error) {}
        }
        if (tags.exif.GPSLongitude && tags.exif.GPSLongitudeRef) {
          try {
            tags.gps = tags.gps || {}, tags.gps.Longitude = getCalculatedGpsValue(tags.exif.GPSLongitude.value), 
            "W" === tags.exif.GPSLongitudeRef.value.join("") && (tags.gps.Longitude = -tags.gps.Longitude);
          } catch (error) {}
        }
        if (tags.exif.GPSAltitude && tags.exif.GPSAltitudeRef) {
          try {
            tags.gps = tags.gps || {}, tags.gps.Altitude = tags.exif.GPSAltitude.value[0] / tags.exif.GPSAltitude.value[1], 
            1 === tags.exif.GPSAltitudeRef.value && (tags.gps.Altitude = -tags.gps.Altitude);
          } catch (error) {}
        }
      }
    }(tags)) : tags = objectAssign({}, tags, readTags), readTags["IPTC-NAA"] && !hasIptcData(iptcDataOffset)) {
      const readIptcTags = IptcTags.read(readTags["IPTC-NAA"].value, 0, includeUnknown);
      expanded ? tags.iptc = readIptcTags : tags = objectAssign({}, tags, readIptcTags);
    }
    if (readTags.ApplicationNotes && !hasXmpData(xmpChunks)) {
      const readXmpTags = XmpTags.read(getStringValueFromArray(readTags.ApplicationNotes.value), void 0, domParser);
      expanded ? tags.xmp = readXmpTags : (delete readXmpTags._raw, tags = objectAssign({}, tags, readXmpTags));
    }
    if (readTags.ImageSourceData && readTags.PhotoshopSettings) {
      const readPhotoshopTags = PhotoshopTags.read(readTags.PhotoshopSettings.value, includeUnknown);
      expanded ? tags.photoshop = readPhotoshopTags : tags = objectAssign({}, tags, readPhotoshopTags);
    }
    if (readTags.ICC_Profile && !hasIccData(iccChunks)) {
      const readIccTags = IccTags.read(readTags.ICC_Profile.value, [ {
        offset: 0,
        length: readTags.ICC_Profile.value.length,
        chunkNumber: 1,
        chunksTotal: 1
      } ]);
      expanded ? tags.icc = readIccTags : tags = objectAssign({}, tags, readIccTags);
    }
    if (readTags.MakerNote) {
      if (function(tags) {
        return tags.Make && tags.Make.value && Array.isArray(tags.Make.value) && "Canon" === tags.Make.value[0] && tags.MakerNote && tags.MakerNote.__offset;
      }(readTags)) {
        const readCanonTags = CanonTags.read(dataView, tiffHeaderOffset, readTags.MakerNote.__offset, byteOrder, includeUnknown);
        expanded ? tags.makerNotes = readCanonTags : tags = objectAssign({}, tags, readCanonTags);
      } else if (function(tags) {
        const PENTAX_ID_STRING = "PENTAX ";
        return tags.MakerNote.value.length > PENTAX_ID_STRING.length && getStringValueFromArray(tags.MakerNote.value.slice(0, PENTAX_ID_STRING.length)) === PENTAX_ID_STRING && tags.MakerNote.__offset;
      }(readTags)) {
        const readPentaxTags = PentaxTags.read(dataView, tiffHeaderOffset, readTags.MakerNote.__offset, includeUnknown);
        expanded ? tags.makerNotes = readPentaxTags : tags = objectAssign({}, tags, readPentaxTags);
      }
    }
    readTags.MakerNote && delete readTags.MakerNote.__offset;
  }
  if (hasIptcData(iptcDataOffset)) {
    foundMetaData = !0;
    const readTags = IptcTags.read(dataView, iptcDataOffset, includeUnknown);
    expanded ? tags.iptc = readTags : tags = objectAssign({}, tags, readTags);
  }
  if (hasXmpData(xmpChunks)) {
    foundMetaData = !0;
    const readTags = XmpTags.read(dataView, xmpChunks, domParser);
    expanded ? tags.xmp = readTags : (delete readTags._raw, tags = objectAssign({}, tags, readTags));
  }
  if (hasIccData(iccChunks)) {
    foundMetaData = !0;
    const readTags = IccTags.read(dataView, iccChunks, async);
    readTags instanceof Promise ? tagsPromises.push(readTags.then(addIccTags)) : addIccTags(readTags);
  }
  if (function(mpfDataOffset) {
    return void 0 !== mpfDataOffset;
  }(mpfDataOffset)) {
    foundMetaData = !0;
    const readMpfTags = MpfTags.read(dataView, mpfDataOffset, includeUnknown);
    expanded ? tags.mpf = readMpfTags : tags = objectAssign({}, tags, readMpfTags);
  }
  if (void 0 !== pngHeaderOffset) {
    foundMetaData = !0;
    const readTags = PngFileTags.read(dataView, pngHeaderOffset);
    expanded ? (tags.png = tags.png ? objectAssign({}, tags.png, readTags) : readTags, 
    tags.pngFile = readTags) : tags = objectAssign({}, tags, readTags);
  }
  if (function(pngTextChunks) {
    return void 0 !== pngTextChunks;
  }(pngTextChunks)) {
    foundMetaData = !0;
    const {readTags: readTags, readTagsPromise: readTagsPromise} = PngTextTags.read(dataView, pngTextChunks, async, includeUnknown);
    addPngTextTags(readTags), readTagsPromise && tagsPromises.push(readTagsPromise.then(tagList => tagList.forEach(addPngTextTags)));
  }
  if (function(pngChunkOffsets) {
    return void 0 !== pngChunkOffsets;
  }(pngChunkOffsets)) {
    foundMetaData = !0;
    const readTags = PngTags.read(dataView, pngChunkOffsets);
    expanded ? tags.png = tags.png ? objectAssign({}, tags.png, readTags) : readTags : tags = objectAssign({}, tags, readTags);
  }
  if (function(vp8xChunkOffset) {
    return void 0 !== vp8xChunkOffset;
  }(vp8xChunkOffset)) {
    foundMetaData = !0;
    const readTags = Vp8xTags.read(dataView, vp8xChunkOffset);
    expanded ? tags.riff = tags.riff ? objectAssign({}, tags.riff, readTags) : readTags : tags = objectAssign({}, tags, readTags);
  }
  if (function(gifHeaderOffset) {
    return void 0 !== gifHeaderOffset;
  }(gifHeaderOffset)) {
    foundMetaData = !0;
    const readTags = GifFileTags.read(dataView, gifHeaderOffset);
    expanded ? tags.gif = tags.gif ? objectAssign({}, tags.gif, readTags) : readTags : tags = objectAssign({}, tags, readTags);
  }
  const composite = Composite.get(tags, expanded);
  composite && (expanded ? tags.composite = composite : tags = objectAssign({}, tags, composite));
  const thumbnail = Thumbnail.get(dataView, tags.Thumbnail, tiffHeaderOffset);
  if (thumbnail ? (foundMetaData = !0, tags.Thumbnail = thumbnail) : delete tags.Thumbnail, 
  fileType && (expanded ? (tags.file || (tags.file = {}), tags.file.FileType = fileType) : tags.FileType = fileType, 
  foundMetaData = !0), !foundMetaData) {
    throw new exifErrors.MetadataMissingError;
  }
  return async ? Promise.all(tagsPromises).then(() => tags) : tags;
  function addIccTags(readTags) {
    expanded ? tags.icc = readTags : tags = objectAssign({}, tags, readTags);
  }
  function addPngTextTags(readTags) {
    if (expanded) {
      for (const group of [ "exif", "iptc" ]) {
        const groupKey = `__${group}`;
        readTags[groupKey] && (tags[group] = tags[group] ? objectAssign({}, tags.exif, readTags[groupKey]) : readTags[groupKey], 
        delete readTags[groupKey]);
      }
      tags.png = tags.png ? objectAssign({}, tags.png, readTags) : readTags, tags.pngText = tags.pngText ? objectAssign({}, tags.png, readTags) : readTags;
    } else {
      tags = objectAssign({}, tags, readTags.__exif ? readTags.__exif : {}, readTags.__iptc ? readTags.__iptc : {}, readTags), 
      delete tags.__exif, delete tags.__iptc;
    }
  }
}

function hasIptcData(iptcDataOffset) {
  return void 0 !== iptcDataOffset;
}

function hasXmpData(xmpChunks) {
  return Array.isArray(xmpChunks) && xmpChunks.length > 0;
}

function hasIccData(iccDataOffsets) {
  return Array.isArray(iccDataOffsets) && iccDataOffsets.length > 0;
}

const error_to_string = error => {
  const logMessage = [];
  return error?.response ? logMessage.push("response.data:", JSON.stringify(error?.response?.data), "response.status:", JSON.stringify(error?.response?.status), "headers:", JSON.stringify(error?.response?.headers)) : error?.request ? logMessage.push("request:", JSON.stringify(error?.request)) : (logMessage.push(error?.message), 
  logMessage.push("stack:", error?.stack)), error?.config && logMessage.push("config:", JSON.stringify(error?.config)), 
  logMessage.join("\n");
}, msalConfig = {
  auth: {
    clientId: "f1ffa820-44a2-43da-9016-d3302c89c36a",
    authority: "https://login.microsoftonline.com//consumers"
  },
  cache: {
    cachePlugin: null
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, _containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: !1,
      logLevel: LogLevel.Error
    }
  }
}, GRAPH_ENDPOINT_HOST = "https://graph.microsoft.com/", protectedResources = {
  graphMe: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/me`,
    scopes: [ "User.Read", "Files.Read", "offline_access" ]
  },
  listAllAlbums: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/me/drive/bundles?filter=${encodeURIComponent("bundle/album ne null")}`
  },
  getChildrenInAlbum: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/me/drives/$$userId$$/items/$$albumId$$/children?$top=1000`
  },
  getItem: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/drives/$$userId$$/items/$$itemId$$`
  },
  getThumbnail: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/drive/items/$$itemId$$/thumbnails`
  },
  $batch: {
    endpoint: `${GRAPH_ENDPOINT_HOST}v1.0/$batch`
  }
};

function sleep(ms = 1e3) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

class AuthProvider {
  clientApplication;
  account;
  constructor(msalConfig) {
    this.clientApplication = new PublicClientApplication(msalConfig), this.account = null;
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
    if (!this.account) {
      return;
    }
    const cache = this.clientApplication.getTokenCache();
    try {
      await cache.removeAccount(this.account), this.account = null;
    } catch (error) {
      this.logError(error);
    }
  }
  async getToken(tokenRequest, forceAuthInteractive, deviceCodeCallback = null, waitInteractiveCallback = null) {
    let authResponse;
    const account = this.account || await this.getAccount();
    if (account && (tokenRequest.account = account, authResponse = await this.getTokenSilent(tokenRequest)), 
    !authResponse) {
      if (this.logWarn("Failed to call getTokenSilent"), forceAuthInteractive) {
        waitInteractiveCallback("Please switch to browser window and continue the authorization process."), 
        authResponse = await this.getTokenInteractive(tokenRequest);
      } else {
        try {
          authResponse = await this.getTokenDeviceCode(tokenRequest, deviceCodeCallback);
        } catch {
          waitInteractiveCallback("Please switch to browser window and continue the authorization process."), 
          authResponse = await this.getTokenInteractive(tokenRequest);
        }
      }
    }
    return authResponse ? (this.account = authResponse.account, this.logInfo("getToken done")) : this.logError("Failed to acquire token, no authResponse returned."), 
    authResponse;
  }
  async getTokenSilent(tokenRequest, maxRetries = 3) {
    let attempt = 0;
    for (;attempt < maxRetries; ) {
      try {
        return await this.clientApplication.acquireTokenSilent(tokenRequest);
      } catch (error) {
        this.logError(error), error instanceof InteractionRequiredAuthError && this.logError("Silent token acquisition failed"), 
        error instanceof ServerError && "invalid_grant" === error.errorCode && this.logError("Silent token acquisition failed"), 
        error instanceof ClientAuthError && "network_error" === error.errorCode && (this.logWarn("Network error occurred, waiting 60 seconds before retrying..."), 
        await sleep(6e4)), attempt++, this.logWarn(`getTokenSilent failed, attempt ${attempt}/${maxRetries}.`), 
        await sleep(2e3);
      }
    }
  }
  async getTokenInteractive(tokenRequest) {
    this.logInfo("Requesting a token interactively via the browser");
    const authResponse = await this.clientApplication.acquireTokenInteractive({
      ...tokenRequest,
      openBrowser: async url => {
        try {
          const {shell: shell} = require("electron");
          await shell.openExternal(url);
        } catch (e) {
          throw this.logError("Unable to open external browser. Please run the module with a screen UI environment ", e), 
          e;
        }
      },
      successTemplate: "<h1>Successfully signed in!</h1> <p>You can close this window now.</p>",
      errorTemplate: "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>"
    });
    return authResponse && (this.account = authResponse.account), this.logInfo("getTokenInteractive done"), 
    authResponse;
  }
  async getTokenDeviceCode(tokenRequest, callback = null) {
    const deviceCodeRequest = {
      ...tokenRequest,
      deviceCodeCallback: response => {
        this.logInfo(response.message), callback && callback(response);
      }
    };
    this.logInfo("Requesting a token using OAuth2.0 device code flow");
    const authResponse = await this.clientApplication.acquireTokenByDeviceCode(deviceCodeRequest);
    return authResponse && (this.account = authResponse.account), this.logInfo("getTokenDeviceCode done"), 
    authResponse;
  }
  async getAccount() {
    try {
      const cache = this.clientApplication.getTokenCache(), currentAccounts = await cache.getAllAccounts();
      return currentAccounts ? currentAccounts.length > 1 ? (console.log("Multiple accounts detected, need to add choose account code."), 
      currentAccounts[0]) : 1 === currentAccounts.length ? currentAccounts[0] : null : (this.logError("No accounts detected"), 
      null);
    } catch (error) {
      return this.logError("Error getting account:", error), null;
    }
  }
}

const generateNewExpirationDate = () => new Date(Date.now() + 33e5).toISOString();

class OneDrivePhotos extends events.EventEmitter {
  #graphClient=null;
  #userId=null;
  #debug=!1;
  config;
  getAuthProvider;
  constructor(options) {
    super(), this.#debug = !!options.debug && options.debug, this.config = options.config;
    let authProviderInstance = null;
    this.getAuthProvider = () => {
      return authProviderInstance ? (this.log("Get AuthProvider from cache"), authProviderInstance) : (this.log("Initializing AuthProvider"), 
      this.#debug && (msalConfig.system.loggerOptions.logLevel = LogLevel.Trace), authProviderInstance = new AuthProvider({
        ...msalConfig,
        cache: {
          cachePlugin: (CACHE_LOCATION = options.authTokenCachePath, {
            beforeCacheAccess: async cacheContext => {
              try {
                if (fs.existsSync(CACHE_LOCATION)) {
                  const data = await fs.promises.readFile(CACHE_LOCATION, "utf-8");
                  cacheContext.tokenCache.deserialize(data);
                } else {
                  await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
                }
              } catch {
                await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
              }
            },
            afterCacheAccess: async cacheContext => {
              cacheContext.cacheHasChanged && await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
            }
          })
        }
      }), this.log("AuthProvider created"), authProviderInstance);
      var CACHE_LOCATION;
    };
  }
  log(...args) {
    Log.info("[MMM-OneDrive] [OneDrivePhotos]", ...args);
  }
  logError(...args) {
    Log.error("[MMM-OneDrive] [OneDrivePhotos]", ...args);
  }
  logDebug(...args) {
    Log.debug("[MMM-OneDrive] [OneDrivePhotos]", ...args);
  }
  logWarn(...args) {
    Log.warn("[MMM-OneDrive] [OneDrivePhotos]", ...args);
  }
  deviceCodeCallback(response) {
    const expireDt = new Date(Date.now() + 1e3 * response.expiresIn), message = response.message + `\nToken will be expired at ${expireDt.toLocaleTimeString(void 0, {
      hour12: !0
    })}.`;
    this.emit("errorMessage", message);
  }
  async onAuthReady(maxRetries = 3) {
    let attempt = 0;
    for (;attempt < maxRetries; ) {
      const tokenRequest = {
        scopes: protectedResources.graphMe.scopes,
        correlationId: crypto$1.randomUUID()
      };
      try {
        const tokenResponse = await this.getAuthProvider().getToken(tokenRequest, this.config.forceAuthInteractive, r => this.deviceCodeCallback(r), message => this.emit("errorMessage", message));
        this.#graphClient = Client.init({
          authProvider: done => {
            done(null, tokenResponse.accessToken);
          }
        });
        const graphResponse = await this.#graphClient.api(protectedResources.graphMe.endpoint).get();
        return this.#userId = graphResponse.id, this.log(`onAuthReady done, retry count: ${attempt}`), 
        void this.emit("authSuccess");
      } catch (err) {
        this.logError("onAuthReady error", err), this.logWarn(`Retrying onAuthReady, retry count: ${attempt}`), 
        "InvalidAuthenticationToken" === err.code && await this.getAuthProvider().logout();
        if (![ "UnknownError", "TypeError", "InvalidAuthenticationToken" ].includes(err.code)) {
          throw this.logError("Not retrying onAuthReady due to unknown error"), err;
        }
        attempt++, await sleep(2e3), this.logWarn("Retrying onAuthReady");
      }
    }
    throw this.logError(`Failed to wait onAuthReady after ${maxRetries} attempts.`), 
    new Error(`Failed to wait onAuthReady after ${maxRetries} attempts.`);
  }
  async request(logContext, url, method = "get", data = null) {
    this.logDebug((logContext ? `[${logContext}]` : "") + ` request ${method} URL: ${url}`);
    try {
      return await this.#graphClient.api(url)[method](data);
    } catch (error) {
      throw this.logError((logContext ? `[${logContext}]` : "") + ` request fail ${method} URL: ${url}`), 
      this.logError((logContext ? `[${logContext}]` : "") + " data: ", JSON.stringify(data)), 
      this.logError(error_to_string(error)), error;
    }
  }
  async getAlbums() {
    return await this.getAlbumLoop();
  }
  async getAlbumLoop() {
    await this.onAuthReady();
    const url = protectedResources.listAllAlbums.endpoint.replace("$$userId$$", this.#userId);
    let list = [], found = 0;
    const getAlbum = async pageUrl => {
      this.log("Getting Album info chunks.");
      try {
        const response = await this.request("getAlbum", pageUrl, "get", null);
        if (Array.isArray(response.value)) {
          const arrayValue = response.value;
          this.logDebug("found album:"), this.logDebug("name\t\tid"), arrayValue.map(a => `${a.name}\t${a.id}`).forEach(s => this.logDebug(s)), 
          found += arrayValue.length, list = list.concat(arrayValue);
        }
        return response["@odata.nextLink"] ? (await sleep(500), await getAlbum(response["@odata.nextLink"])) : (this.logDebug("founded albums: ", found), 
        list);
      } catch (err) {
        throw this.logError(`Error in getAlbum() ${err.toString()}`), this.logError(err.toString()), 
        err;
      }
    };
    return await getAlbum(url);
  }
  async getAlbumThumbnail(album) {
    if (!album?.bundle?.album?.coverImageItemId) {
      return null;
    }
    try {
      const thumbnailUrl = protectedResources.getThumbnail.endpoint.replace("$$itemId$$", album.bundle.album.coverImageItemId), response2 = await this.request("getAlbumThumbnail", thumbnailUrl, "get", null);
      if (Array.isArray(response2.value) && response2.value.length > 0) {
        const thumbnail = response2.value[0], thumbnailUrl = thumbnail.mediumSquare?.url || thumbnail.medium?.url;
        return this.logDebug("thumbnail found: ", album.bundle.album.coverImageItemId, thumbnail.mediumSquare ? "mediumSquare" : thumbnail.medium ? "medium" : "<null>"), 
        thumbnailUrl;
      }
    } catch (err) {
      return this.logError("Error in getAlbumThumbnail(), ignore", err), null;
    }
  }
  async getEXIF(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return ExifReader.load(buffer);
    } catch (err) {
      return this.logError("getEXIF error:", err), {};
    }
  }
  async getImageFromAlbum(albumId, isValid = null, maxNum = 99999) {
    await this.onAuthReady();
    const url = protectedResources.getChildrenInAlbum.endpoint.replace("$$userId$$", this.#userId).replace("$$albumId$$", albumId);
    this.log("Indexing photos. album:", albumId);
    const list = [];
    let loopCycle = 0;
    return await (async startUrl => {
      let pageUrl = startUrl, done = !1;
      for (;!done; ) {
        this.log(`getImages loop cycle: ${loopCycle}`);
        const startTime = Date.now();
        try {
          const response = await this.request("getImages", pageUrl, "get");
          if (!Array.isArray(response.value)) {
            return this.logWarn(`${albumId}`, albumId), done = !0, list;
          }
          {
            const childrenItems = response.value;
            this.log(`Parsing ${childrenItems.length} items in ${albumId}`);
            let validCount = 0;
            for (const item of childrenItems) {
              const itemVal = {
                id: item.id,
                _albumId: albumId,
                mimeType: item.file?.mimeType || "",
                baseUrl: item["@microsoft.graph.downloadUrl"],
                baseUrlExpireDateTime: generateNewExpirationDate(),
                filename: item.name,
                mediaMetadata: {
                  dateTimeOriginal: item.photo?.takenDateTime || item.fileSystemInfo?.createdDateTime || item.fileSystemInfo?.lastModifiedDateTime
                },
                parentReference: item.parentReference
              };
              list.length < maxNum && (item.image && (itemVal.mediaMetadata.width = item.image.width, 
              itemVal.mediaMetadata.height = item.image.height), item.photo && (itemVal.mediaMetadata.photo = {
                cameraMake: item.photo.cameraMake,
                cameraModel: item.photo.cameraModel,
                focalLength: item.photo.focalLength,
                apertureFNumber: item.photo.fNumber,
                isoEquivalent: item.photo.iso,
                exposureTime: item.photo.exposureNumerator && item.photo.exposureDenominator && 0 !== item.photo.exposureDenominator ? (1 * item.photo.exposureNumerator / item.photo.exposureDenominator).toFixed(2) + "s" : null
              }), "function" == typeof isValid ? isValid(itemVal) && (list.push(itemVal), validCount++) : (list.push(itemVal), 
              validCount++));
            }
            this.logDebug(`Valid ${validCount} items in ${albumId}`);
            const endTime = Date.now();
            if (this.logDebug(`getImages loop cycle ${loopCycle} took ${endTime - startTime} ms`), 
            list.length >= maxNum) {
              return this.log("Indexing photos done, found: ", list.length), done = !0, list;
            }
            if (!response["@odata.nextLink"]) {
              return done = !0, list;
            }
            this.logDebug(`Got nextLink, continue to get more images from album: ${albumId}`), 
            pageUrl = response["@odata.nextLink"], loopCycle++, await sleep(500);
          }
        } catch (err) {
          throw this.logError(".getImageFromAlbum()", err.toString()), this.logError(err), 
          err;
        }
      }
    })(url);
  }
  async batchRequestRefresh(items) {
    if (items.length <= 0) {
      return [];
    }
    await this.onAuthReady(), this.log("received: ", items.length, " to refresh");
    const result = [], chunkGroups = (arr = items, size = 20, Array.from({
      length: Math.ceil(arr.length / size)
    }, (v, i) => arr.slice(i * size, i * size + size)));
    var arr, size;
    for (const grp of chunkGroups) {
      const requestsValue = grp.map((item, i) => {
        return {
          id: i,
          method: "GET",
          url: (url = protectedResources.getItem.endpoint.replace("$$userId$$", this.#userId).replace("$$itemId$$", item.id), 
          url.replace(`${GRAPH_ENDPOINT_HOST}v1.0`, ""))
        };
        var url;
      });
      if (requestsValue.length > 0) {
        const requestsPayload = {
          requests: requestsValue
        }, response = await this.request("batchRequestRefresh", protectedResources.$batch.endpoint, "post", requestsPayload);
        if (Array.isArray(response.responses)) {
          for (const r of response.responses) {
            if (r.status < 400) {
              const item = JSON.parse(JSON.stringify(grp[r.id]));
              item.baseUrl = r.body["@microsoft.graph.downloadUrl"], item.baseUrlExpireDateTime = generateNewExpirationDate(), 
              result.push(item);
            } else {
              console.error(r);
            }
          }
        }
      }
    }
    return this.log("Batch request refresh done, total: ", result.length), result;
  }
  async refreshItem(item) {
    if (!item) {
      return null;
    }
    await this.onAuthReady(), this.log("received: ", item.id, " to refresh");
    const url = protectedResources.getItem.endpoint.replace("$$userId$$", this.#userId).replace("$$itemId$$", item.id);
    try {
      const response = await this.request("refreshItem", url, "get");
      if (!response) {
        throw new Error("No response from OneDrive API " + url);
      }
      return this.log("Refresh done"), {
        baseUrl: response["@microsoft.graph.downloadUrl"],
        baseUrlExpireDateTime: generateNewExpirationDate()
      };
    } catch (err) {
      this.logError("Error in refreshItem", {
        id: item.id,
        filename: item.filename
      }), this.logError(error_to_string(err));
    }
  }
}

exports.OneDrivePhotos = OneDrivePhotos;
