/*! *****************************************************************************
  mmm-onedrive
  Version 1.9.0

  MagicMirror² module to display your photos from OneDrive.
  Please submit bugs at https://github.com/hermanho/MMM-OneDrive/issues

  (c) hermanho
  Licence: MIT

  This file is auto-generated. Do not edit.
***************************************************************************** */

"use strict";

var node_events = require("node:events"), crypto = require("node:crypto"), crypto$1 = require("crypto"), require$$0 = require("buffer"), require$$3 = require("stream"), require$$5 = require("util"), http = require("http"), fs = require("fs");

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

/*! @azure/msal-node v5.2.2 2026-05-19 */ class Serializer {
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
        userAssertionHash: atEntity.userAssertionHash,
        resource: atEntity.resource
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

/*! @azure/msal-common v16.6.2 2026-05-19 */ const IMDS_ENDPOINT = "http://169.254.169.254/metadata/instance/compute/location", KNOWN_PUBLIC_CLOUDS = [ "login.microsoftonline.com", "login.windows.net", "login.microsoft.com", "sts.windows.net" ], OIDC_DEFAULT_SCOPES = [ "openid", "profile", "offline_access" ], OIDC_SCOPES = [ ...OIDC_DEFAULT_SCOPES, "email" ], HeaderNames_CONTENT_TYPE = "Content-Type", HeaderNames_CONTENT_LENGTH = "Content-Length", HeaderNames_RETRY_AFTER = "Retry-After", HeaderNames_CCS_HEADER = "X-AnchorMailbox", HeaderNames_X_MS_REQUEST_ID = "x-ms-request-id", HeaderNames_X_MS_HTTP_VERSION = "x-ms-httpver", AADAuthority_COMMON = "common", AADAuthority_ORGANIZATIONS = "organizations", AADAuthority_CONSUMERS = "consumers", ClaimsRequestKeys_ACCESS_TOKEN = "access_token", ClaimsRequestKeys_XMS_CC = "xms_cc", PromptValue_SELECT_ACCOUNT = "select_account", PromptValue_NONE = "none", CodeChallengeMethodValues_S256 = "S256", OAuthResponseType_CODE = "code", OAuthResponseType_IDTOKEN_TOKEN = "id_token token", ResponseMode_QUERY = "query", GrantType_AUTHORIZATION_CODE_GRANT = "authorization_code", GrantType_RESOURCE_OWNER_PASSWORD_GRANT = "password", GrantType_REFRESH_TOKEN_GRANT = "refresh_token", GrantType_DEVICE_CODE_GRANT = "device_code", CredentialType = {
  ID_TOKEN: "IdToken",
  ACCESS_TOKEN: "AccessToken",
  ACCESS_TOKEN_WITH_AUTH_SCHEME: "AccessToken_With_AuthScheme",
  REFRESH_TOKEN: "RefreshToken"
}, AuthorityMetadataSource_CONFIG = "config", AuthorityMetadataSource_CACHE = "cache", AuthorityMetadataSource_NETWORK = "network", AuthorityMetadataSource_HARDCODED_VALUES = "hardcoded_values", SERVER_TELEM_SCHEMA_VERSION = 5, AuthenticationScheme = {
  BEARER: "Bearer",
  POP: "pop",
  SSH: "ssh-cert"
}, PasswordGrantConstants_username = "username", PasswordGrantConstants_password = "password", RegionDiscoverySources_FAILED_AUTO_DETECTION = "1", RegionDiscoverySources_ENVIRONMENT_VARIABLE = "3", RegionDiscoverySources_IMDS = "4", RegionDiscoveryOutcomes_CONFIGURED_NO_AUTO_DETECTION = "2", RegionDiscoveryOutcomes_AUTO_DETECTION_REQUESTED_SUCCESSFUL = "4", RegionDiscoveryOutcomes_AUTO_DETECTION_REQUESTED_FAILED = "5", CacheOutcome_NOT_APPLICABLE = "0", CacheOutcome_FORCE_REFRESH_OR_CLAIMS = "1", CacheOutcome_NO_CACHED_ACCESS_TOKEN = "2", CacheOutcome_CACHED_ACCESS_TOKEN_EXPIRED = "3", CacheOutcome_PROACTIVELY_REFRESHED = "4", EncodingTypes_BASE64 = "base64", EncodingTypes_HEX = "hex", RETURN_SPA_CODE = "return_spa_code", X_CLIENT_EXTRA_SKU = "x-client-xtra-sku";

/*! @azure/msal-common v16.6.2 2026-05-19 */
function getDefaultErrorMessage(code) {
  return `See https://aka.ms/msal.js.errors#${code} for details`;
}

class AuthError extends Error {
  constructor(errorCode, errorMessage, suberror) {
    const message = errorMessage || (errorCode ? getDefaultErrorMessage(errorCode) : "");
    super(message ? `${errorCode}: ${message}` : errorCode), Object.setPrototypeOf(this, AuthError.prototype), 
    this.errorCode = errorCode || "", this.errorMessage = message || "", this.subError = suberror || "", 
    this.name = "AuthError";
  }
  setCorrelationId(correlationId) {
    this.correlationId = correlationId;
  }
}

function createAuthError(code, additionalMessage) {
  return new AuthError(code, additionalMessage || getDefaultErrorMessage(code));
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class ClientConfigurationError extends AuthError {
  constructor(errorCode) {
    super(errorCode), this.name = "ClientConfigurationError", Object.setPrototypeOf(this, ClientConfigurationError.prototype);
  }
}

function createClientConfigurationError(errorCode) {
  return new ClientConfigurationError(errorCode);
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class StringUtils {
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
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class ClientAuthError extends AuthError {
  constructor(errorCode, additionalMessage) {
    super(errorCode, additionalMessage), this.name = "ClientAuthError", Object.setPrototypeOf(this, ClientAuthError.prototype);
  }
}

function createClientAuthError(errorCode, additionalMessage) {
  return new ClientAuthError(errorCode, additionalMessage);
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ const methodNotImplemented = "method_not_implemented";

/*! @azure/msal-common v16.6.2 2026-05-19 */
class ScopeSet {
  constructor(inputScopes) {
    const scopeArr = inputScopes ? StringUtils.trimArrayEntries([ ...inputScopes ]) : [], filteredInput = scopeArr ? StringUtils.removeEmptyStringsFromArray(scopeArr) : [];
    if (!filteredInput || !filteredInput.length) {
      throw createClientConfigurationError("empty_input_scopes_error");
    }
    this.scopes = new Set, filteredInput.forEach(scope => this.scopes.add(scope));
  }
  static fromString(inputScopeString) {
    const inputScopes = (inputScopeString || "").split(" ");
    return new ScopeSet(inputScopes);
  }
  static createSearchScopes(inputScopeString) {
    const scopesToUse = inputScopeString && inputScopeString.length > 0 ? inputScopeString : [ ...OIDC_DEFAULT_SCOPES ], scopeSet = new ScopeSet(scopesToUse);
    return scopeSet.containsOnlyOIDCScopes() ? scopeSet.removeScope("offline_access") : scopeSet.removeOIDCScopes(), 
    scopeSet;
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
    return "";
  }
  printScopesLowerCase() {
    return this.printScopes().toLowerCase();
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ function instrumentBrokerParams(parameters, correlationId, performanceClient) {
  if (!correlationId) {
    return;
  }
  const clientId = parameters.get("client_id");
  clientId && parameters.has("brk_client_id") && performanceClient?.addFields({
    embeddedClientId: clientId,
    embeddedRedirectUri: parameters.get("redirect_uri")
  }, correlationId);
}

function addResponseType(parameters, responseType) {
  parameters.set("response_type", responseType);
}

function addScopes(parameters, scopes, addOidcScopes = !0, defaultScopes = OIDC_DEFAULT_SCOPES) {
  !addOidcScopes || defaultScopes.includes("openid") || scopes.includes("openid") || defaultScopes.push("openid");
  const requestScopes = addOidcScopes ? [ ...scopes || [], ...defaultScopes ] : scopes || [], scopeSet = new ScopeSet(requestScopes);
  parameters.set("scope", scopeSet.printScopes());
}

function addClientId(parameters, clientId) {
  parameters.set("client_id", clientId);
}

function addRedirectUri(parameters, redirectUri) {
  parameters.set("redirect_uri", redirectUri);
}

function addLoginHint(parameters, loginHint) {
  parameters.set("login_hint", loginHint);
}

function addCcsUpn(parameters, loginHint) {
  parameters.set(HeaderNames_CCS_HEADER, `UPN:${loginHint}`);
}

function addCcsOid(parameters, clientInfo) {
  parameters.set(HeaderNames_CCS_HEADER, `Oid:${clientInfo.uid}@${clientInfo.utid}`);
}

function addSid(parameters, sid) {
  parameters.set("sid", sid);
}

function addClaims(parameters, claims, clientCapabilities, skipBrokerClaims) {
  const configClaims = skipBrokerClaims && parameters.has("brk_client_id") ? void 0 : clientCapabilities;
  if (!StringUtils.isEmptyObj(claims) || configClaims && configClaims.length > 0) {
    const mergedClaims = function(claims, clientCapabilities) {
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
      clientCapabilities && clientCapabilities.length > 0 && (mergedClaims.hasOwnProperty(ClaimsRequestKeys_ACCESS_TOKEN) || (mergedClaims[ClaimsRequestKeys_ACCESS_TOKEN] = {}), 
      mergedClaims[ClaimsRequestKeys_ACCESS_TOKEN][ClaimsRequestKeys_XMS_CC] = {
        values: clientCapabilities
      });
      return JSON.stringify(mergedClaims);
    }(claims, configClaims);
    try {
      JSON.parse(mergedClaims);
    } catch (e) {
      throw createClientConfigurationError("invalid_claims");
    }
    parameters.set("claims", mergedClaims);
  }
}

function addCorrelationId(parameters, correlationId) {
  parameters.set("client-request-id", correlationId);
}

function addLibraryInfo(parameters, libraryInfo) {
  parameters.set("x-client-SKU", libraryInfo.sku), parameters.set("x-client-VER", libraryInfo.version), 
  libraryInfo.os && parameters.set("x-client-OS", libraryInfo.os), libraryInfo.cpu && parameters.set("x-client-CPU", libraryInfo.cpu);
}

function addApplicationTelemetry(parameters, appTelemetry) {
  appTelemetry?.appName && parameters.set("x-app-name", appTelemetry.appName), appTelemetry?.appVersion && parameters.set("x-app-ver", appTelemetry.appVersion);
}

function addState(parameters, state) {
  state && parameters.set("state", state);
}

function addClientSecret(parameters, clientSecret) {
  parameters.set("client_secret", clientSecret);
}

function addClientAssertion(parameters, clientAssertion) {
  clientAssertion && parameters.set("client_assertion", clientAssertion);
}

function addClientAssertionType(parameters, clientAssertionType) {
  clientAssertionType && parameters.set("client_assertion_type", clientAssertionType);
}

function addGrantType(parameters, grantType) {
  parameters.set("grant_type", grantType);
}

function addClientInfo(parameters) {
  parameters.set("client_info", "1");
}

function addInstanceAware(parameters) {
  parameters.has("instance_aware") || parameters.set("instance_aware", "true");
}

function addExtraParameters(parameters, extraParams) {
  Object.entries(extraParams).forEach(([key, value]) => {
    !parameters.has(key) && value && parameters.set(key, value);
  });
}

function addPopToken(parameters, cnfString) {
  cnfString && (parameters.set("token_type", AuthenticationScheme.POP), parameters.set("req_cnf", cnfString));
}

function addSshJwk(parameters, sshJwkString) {
  sshJwkString && (parameters.set("token_type", AuthenticationScheme.SSH), parameters.set("req_cnf", sshJwkString));
}

function addServerTelemetry(parameters, serverTelemetryManager) {
  parameters.set("x-client-current-telemetry", serverTelemetryManager.generateCurrentRequestHeaderValue()), 
  parameters.set("x-client-last-telemetry", serverTelemetryManager.generateLastRequestHeaderValue());
}

function addThrottling(parameters) {
  parameters.set("x-ms-lib-capability", "retry-after, h429");
}

function addBrokerParameters(parameters, brokerClientId, brokerRedirectUri) {
  parameters.has("brk_client_id") || parameters.set("brk_client_id", brokerClientId), 
  parameters.has("brk_redirect_uri") || parameters.set("brk_redirect_uri", brokerRedirectUri);
}

function addResource(parameters, resource) {
  resource && parameters.set("resource", resource);
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ function mapToQueryString(parameters) {
  const queryParameterArray = new Array;
  return parameters.forEach((value, key) => {
    queryParameterArray.push(`${key}=${encodeURIComponent(value)}`);
  }), queryParameterArray.join("&");
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ const DEFAULT_CRYPTO_IMPLEMENTATION = {
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

/*! @azure/msal-common v16.6.2 2026-05-19 */ var LogLevel;

!function(LogLevel) {
  LogLevel[LogLevel.Error = 0] = "Error", LogLevel[LogLevel.Warning = 1] = "Warning", 
  LogLevel[LogLevel.Info = 2] = "Info", LogLevel[LogLevel.Verbose = 3] = "Verbose", 
  LogLevel[LogLevel.Trace = 4] = "Trace";
}(LogLevel || (LogLevel = {}));

const correlationCache = new Map;

function addLogToCache(correlationId, loggedMessage) {
  const currentTime = Date.now();
  let data = correlationCache.get(correlationId);
  if (data) {
    !function(correlationId, data) {
      correlationCache.delete(correlationId), correlationCache.set(correlationId, data);
    }(correlationId, data);
  } else if (data = {
    logs: [],
    firstEventTime: currentTime
  }, correlationCache.set(correlationId, data), correlationCache.size > 50) {
    const firstKey = correlationCache.keys().next().value;
    firstKey && correlationCache.delete(firstKey);
  }
  data.logs.push({
    ...loggedMessage,
    milliseconds: currentTime - data.firstEventTime
  }), data.logs.length > 500 && data.logs.shift();
}

class Logger {
  constructor(loggerOptions, packageName, packageVersion) {
    this.level = LogLevel.Info;
    const setLoggerOptions = loggerOptions || Logger.createDefaultLoggerOptions();
    this.localCallback = setLoggerOptions.loggerCallback || (() => {}), this.piiLoggingEnabled = setLoggerOptions.piiLoggingEnabled || !1, 
    this.level = "number" == typeof setLoggerOptions.logLevel ? setLoggerOptions.logLevel : LogLevel.Info, 
    this.packageName = packageName || "", this.packageVersion = packageVersion || "";
  }
  static createDefaultLoggerOptions() {
    return {
      loggerCallback: () => {},
      piiLoggingEnabled: !1,
      logLevel: LogLevel.Info
    };
  }
  clone(packageName, packageVersion) {
    return new Logger({
      loggerCallback: this.localCallback,
      piiLoggingEnabled: this.piiLoggingEnabled,
      logLevel: this.level
    }, packageName, packageVersion);
  }
  logMessage(logMessage, options) {
    const correlationId = options.correlationId;
    if (function(str) {
      if (6 !== str.length) {
        return !1;
      }
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (!(char >= "a" && char <= "z" || char >= "A" && char <= "Z" || char >= "0" && char <= "9")) {
          return !1;
        }
      }
      return !0;
    }(logMessage)) {
      addLogToCache(correlationId, {
        hash: logMessage,
        level: options.logLevel,
        containsPii: options.containsPii || !1,
        milliseconds: 0
      });
    }
    if (options.logLevel > this.level || !this.piiLoggingEnabled && options.containsPii) {
      return;
    }
    const log = `${`[${(new Date).toUTCString()}] : [${correlationId}]`} : ${this.packageName}@${this.packageVersion} : ${LogLevel[options.logLevel]} - ${logMessage}`;
    this.executeCallback(options.logLevel, log, options.containsPii || !1);
  }
  executeCallback(level, message, containsPii) {
    this.localCallback && this.localCallback(level, message, containsPii);
  }
  error(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Error,
      containsPii: !1,
      correlationId: correlationId
    });
  }
  errorPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Error,
      containsPii: !0,
      correlationId: correlationId
    });
  }
  warning(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Warning,
      containsPii: !1,
      correlationId: correlationId
    });
  }
  warningPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Warning,
      containsPii: !0,
      correlationId: correlationId
    });
  }
  info(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Info,
      containsPii: !1,
      correlationId: correlationId
    });
  }
  infoPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Info,
      containsPii: !0,
      correlationId: correlationId
    });
  }
  verbose(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Verbose,
      containsPii: !1,
      correlationId: correlationId
    });
  }
  verbosePii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Verbose,
      containsPii: !0,
      correlationId: correlationId
    });
  }
  trace(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Trace,
      containsPii: !1,
      correlationId: correlationId
    });
  }
  tracePii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Trace,
      containsPii: !0,
      correlationId: correlationId
    });
  }
  isPiiLoggingEnabled() {
    return this.piiLoggingEnabled || !1;
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ const name$1 = "@azure/msal-common", AzureCloudInstance_None = "none";

/*! @azure/msal-common v16.6.2 2026-05-19 */
function tenantIdMatchesHomeTenant(tenantId, homeAccountId) {
  return !!tenantId && !!homeAccountId && tenantId === homeAccountId.split(".")[1];
}

function buildTenantProfile(homeAccountId, localAccountId, tenantId, idTokenClaims) {
  if (idTokenClaims) {
    const {oid: oid, sub: sub, tid: tid, name: name, tfp: tfp, acr: acr, preferred_username: preferred_username, upn: upn, login_hint: login_hint} = idTokenClaims, tenantId = tid || tfp || acr || "";
    return {
      tenantId: tenantId,
      localAccountId: oid || sub || "",
      name: name,
      username: preferred_username || upn || "",
      loginHint: login_hint,
      isHomeTenant: tenantIdMatchesHomeTenant(tenantId, homeAccountId),
      upn: upn
    };
  }
  return {
    tenantId: tenantId,
    localAccountId: localAccountId,
    username: "",
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

/*! @azure/msal-common v16.6.2 2026-05-19 */ function extractTokenClaims(encodedToken, base64Decode) {
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

/*! @azure/msal-common v16.6.2 2026-05-19 */ class UrlString {
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
    return !tenantId || 0 === pathArray.length || pathArray[0] !== AADAuthority_COMMON && pathArray[0] !== AADAuthority_ORGANIZATIONS || (pathArray[0] = tenantId), 
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
    if ("/" === relativeUrl[0]) {
      const baseComponents = new UrlString(baseUrl).getUrlComponents();
      return baseComponents.Protocol + "//" + baseComponents.HostNameAndPort + relativeUrl;
    }
    return relativeUrl;
  }
  static constructAuthorityUriFromObject(urlObject) {
    return new UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + urlObject.PathSegments.join("/"));
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ const rawMetdataJSON = {
  endpointMetadata: [ {
    host: "login.microsoftonline.com"
  }, {
    host: "login.chinacloudapi.cn",
    issuerHost: "login.partner.microsoftonline.cn"
  }, {
    host: "login.microsoftonline.us"
  }, {
    host: "login.sovcloud-identity.fr"
  }, {
    host: "login.sovcloud-identity.de"
  }, {
    host: "login.sovcloud-identity.sg"
  } ].reduce((acc, {host: host, issuerHost: issuerHost}) => (acc[host] = function(host, issuerHost) {
    return {
      token_endpoint: `https://${host}/{tenantid}/oauth2/v2.0/token`,
      jwks_uri: `https://${host}/{tenantid}/discovery/v2.0/keys`,
      issuer: `https://${issuerHost}/{tenantid}/v2.0`,
      authorization_endpoint: `https://${host}/{tenantid}/oauth2/v2.0/authorize`,
      end_session_endpoint: `https://${host}/{tenantid}/oauth2/v2.0/logout`
    };
  }(host, issuerHost || host), acc), {}),
  instanceDiscoveryMetadata: {
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
    }, {
      preferred_network: "login.sovcloud-identity.fr",
      preferred_cache: "login.sovcloud-identity.fr",
      aliases: [ "login.sovcloud-identity.fr" ]
    }, {
      preferred_network: "login.sovcloud-identity.de",
      preferred_cache: "login.sovcloud-identity.de",
      aliases: [ "login.sovcloud-identity.de" ]
    }, {
      preferred_network: "login.sovcloud-identity.sg",
      preferred_cache: "login.sovcloud-identity.sg",
      aliases: [ "login.sovcloud-identity.sg" ]
    }, {
      preferred_network: "login.windows-ppe.net",
      preferred_cache: "login.windows-ppe.net",
      aliases: [ "login.windows-ppe.net", "sts.windows-ppe.net", "login.microsoft-ppe.com" ]
    } ]
  }
}, EndpointMetadata = rawMetdataJSON.endpointMetadata, InstanceDiscoveryMetadata = rawMetdataJSON.instanceDiscoveryMetadata, InstanceDiscoveryMetadataAliases = new Set;

function getAliasesFromMetadata(logger, correlationId, authorityHost, cloudDiscoveryMetadata, source) {
  if (logger.trace(`getAliasesFromMetadata called with source: '${source}'`, correlationId), 
  authorityHost && cloudDiscoveryMetadata) {
    const metadata = getCloudDiscoveryMetadataFromNetworkResponse(cloudDiscoveryMetadata, authorityHost);
    if (metadata) {
      return logger.trace(`getAliasesFromMetadata: found cloud discovery metadata in '${source}', returning aliases`, correlationId), 
      metadata.aliases;
    }
    logger.trace(`getAliasesFromMetadata: did not find cloud discovery metadata in '${source}'`, correlationId);
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

/*! @azure/msal-common v16.6.2 2026-05-19 */ InstanceDiscoveryMetadata.metadata.forEach(metadataEntry => {
  metadataEntry.aliases.forEach(alias => {
    InstanceDiscoveryMetadataAliases.add(alias);
  });
});

/*! @azure/msal-common v16.6.2 2026-05-19 */
class CacheError extends Error {
  constructor(errorCode, errorMessage) {
    const message = errorMessage || getDefaultErrorMessage(errorCode);
    super(message), Object.setPrototypeOf(this, CacheError.prototype), this.name = "CacheError", 
    this.errorCode = errorCode, this.errorMessage = message;
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */
function buildClientInfo(rawClientInfo, base64Decode) {
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
  const clientInfoParts = homeAccountId.split(".", 2);
  return {
    uid: clientInfoParts[0],
    utid: clientInfoParts.length < 2 ? "" : clientInfoParts[1]
  };
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ const AuthorityType_Default = 0, AuthorityType_Adfs = 1, AuthorityType_Dsts = 2, AuthorityType_Ciam = 3;

/*! @azure/msal-common v16.6.2 2026-05-19 */ function getTenantIdFromIdTokenClaims(idTokenClaims) {
  if (idTokenClaims) {
    return idTokenClaims.tid || idTokenClaims.tfp || idTokenClaims.acr || null;
  }
  return null;
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ const ProtocolMode_AAD = "AAD", ProtocolMode_OIDC = "OIDC";

/*! @azure/msal-common v16.6.2 2026-05-19 */ function getAccountInfo(accountEntity) {
  const tenantProfiles = accountEntity.tenantProfiles || [];
  return 0 === tenantProfiles.length && accountEntity.realm && accountEntity.localAccountId && tenantProfiles.push(buildTenantProfile(accountEntity.homeAccountId, accountEntity.localAccountId, accountEntity.realm)), 
  {
    homeAccountId: accountEntity.homeAccountId,
    environment: accountEntity.environment,
    tenantId: accountEntity.realm,
    username: accountEntity.username,
    localAccountId: accountEntity.localAccountId,
    loginHint: accountEntity.loginHint,
    name: accountEntity.name,
    nativeAccountId: accountEntity.nativeAccountId,
    authorityType: accountEntity.authorityType,
    tenantProfiles: new Map(tenantProfiles.map(tenantProfile => [ tenantProfile.tenantId, tenantProfile ])),
    dataBoundary: accountEntity.dataBoundary
  };
}

function isAccountEntity(entity) {
  return !!entity && (entity.hasOwnProperty("homeAccountId") && entity.hasOwnProperty("environment") && entity.hasOwnProperty("realm") && entity.hasOwnProperty("localAccountId") && entity.hasOwnProperty("username") && entity.hasOwnProperty("authorityType"));
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class CacheManager {
  constructor(clientId, cryptoImpl, logger, performanceClient, staticAuthorityOptions) {
    this.clientId = clientId, this.cryptoImpl = cryptoImpl, this.commonLogger = logger.clone(name$1, "16.6.2"), 
    this.staticAuthorityOptions = staticAuthorityOptions, this.performanceClient = performanceClient;
  }
  getAllAccounts(accountFilter = {}, correlationId) {
    return this.buildTenantProfiles(this.getAccountsFilteredBy(accountFilter, correlationId), correlationId, accountFilter);
  }
  getAccountInfoFilteredBy(accountFilter, correlationId) {
    if (0 === Object.keys(accountFilter).length || Object.values(accountFilter).every(value => null == value || "" === value)) {
      return this.commonLogger.warning("getAccountInfoFilteredBy: Account filter is empty or invalid, returning null", correlationId), 
      null;
    }
    const allAccounts = this.getAllAccounts(accountFilter, correlationId);
    if (allAccounts.length > 1) {
      return allAccounts.sort((a, b) => {
        const aHasClaims = a.idTokenClaims ? 1 : 0;
        return (b.idTokenClaims ? 1 : 0) - aHasClaims;
      })[0];
    }
    return 1 === allAccounts.length ? allAccounts[0] : null;
  }
  getBaseAccountInfo(accountFilter, correlationId) {
    const accountEntities = this.getAccountsFilteredBy(accountFilter, correlationId);
    return accountEntities.length > 0 ? getAccountInfo(accountEntities[0]) : null;
  }
  buildTenantProfiles(cachedAccounts, correlationId, accountFilter) {
    return cachedAccounts.flatMap(accountEntity => this.getTenantProfilesFromAccountEntity(accountEntity, correlationId, accountFilter?.tenantId, accountFilter));
  }
  getTenantedAccountInfoByFilter(accountInfo, tokenKeys, tenantProfile, correlationId, tenantProfileFilter) {
    let idTokenClaims, tenantedAccountInfo = null;
    if (tenantProfileFilter && !this.tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter)) {
      return null;
    }
    const idToken = this.getIdToken(accountInfo, correlationId, tokenKeys, tenantProfile.tenantId);
    return idToken && (idTokenClaims = extractTokenClaims(idToken.secret, this.cryptoImpl.base64Decode), 
    !this.idTokenClaimsMatchTenantProfileFilter(idTokenClaims, tenantProfileFilter)) ? null : (tenantedAccountInfo = updateAccountTenantProfileData(accountInfo, tenantProfile, idTokenClaims, idToken?.secret), 
    tenantedAccountInfo);
  }
  getTenantProfilesFromAccountEntity(accountEntity, correlationId, targetTenantId, tenantProfileFilter) {
    const accountInfo = getAccountInfo(accountEntity);
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
      const tenantedAccountInfo = this.getTenantedAccountInfoByFilter(accountInfo, tokenKeys, tenantProfile, correlationId, tenantProfileFilter);
      tenantedAccountInfo && matchingTenantProfiles.push(tenantedAccountInfo);
    }), matchingTenantProfiles;
  }
  tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter) {
    return !(tenantProfileFilter.localAccountId && !this.matchLocalAccountIdFromTenantProfile(tenantProfile, tenantProfileFilter.localAccountId)) && ((!tenantProfileFilter.name || tenantProfile.name === tenantProfileFilter.name) && ((void 0 === tenantProfileFilter.isHomeTenant || tenantProfile.isHomeTenant === tenantProfileFilter.isHomeTenant) && (!(tenantProfileFilter.username && !this.matchUsername(tenantProfile.username, tenantProfileFilter.username) && this.matchUsername(tenantProfile.upn, tenantProfileFilter.username)) && (!(tenantProfileFilter.loginHint && !this.matchLoginHintWithTenantProfile(tenantProfile, tenantProfileFilter.loginHint)) && (!tenantProfileFilter.upn || tenantProfile.upn === tenantProfileFilter.upn)))));
  }
  idTokenClaimsMatchTenantProfileFilter(idTokenClaims, tenantProfileFilter) {
    if (tenantProfileFilter) {
      if (tenantProfileFilter.localAccountId && !this.matchLocalAccountIdFromTokenClaims(idTokenClaims, tenantProfileFilter.localAccountId)) {
        return !1;
      }
      if (tenantProfileFilter.loginHint && !this.matchLoginHintFromTokenClaims(idTokenClaims, tenantProfileFilter.loginHint)) {
        return !1;
      }
      if (tenantProfileFilter.username && !this.matchUsername(idTokenClaims.preferred_username, tenantProfileFilter.username) && !this.matchUsername(idTokenClaims.upn, tenantProfileFilter.username)) {
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
  async saveCacheRecord(cacheRecord, correlationId, kmsi, apiId, storeInCache) {
    if (!cacheRecord) {
      throw createClientAuthError("invalid_cache_record");
    }
    try {
      cacheRecord.account && await this.setAccount(cacheRecord.account, correlationId, kmsi, apiId), 
      cacheRecord.idToken && !1 !== storeInCache?.idToken && await this.setIdTokenCredential(cacheRecord.idToken, correlationId, kmsi), 
      cacheRecord.accessToken && !1 !== storeInCache?.accessToken && await this.saveAccessToken(cacheRecord.accessToken, correlationId, kmsi), 
      cacheRecord.refreshToken && !1 !== storeInCache?.refreshToken && await this.setRefreshTokenCredential(cacheRecord.refreshToken, correlationId, kmsi), 
      cacheRecord.appMetadata && this.setAppMetadata(cacheRecord.appMetadata, correlationId);
    } catch (e) {
      throw this.commonLogger?.error("CacheManager.saveCacheRecord: failed", correlationId), 
      e instanceof AuthError ? e : function(e) {
        return e instanceof Error ? "QuotaExceededError" === e.name || "NS_ERROR_DOM_QUOTA_REACHED" === e.name || e.message.includes("exceeded the quota") ? new CacheError("cache_quota_exceeded") : new CacheError(e.name, e.message) : new CacheError("cache_error_unknown");
      }(e);
    }
  }
  async saveAccessToken(credential, correlationId, kmsi) {
    const accessTokenFilter = {
      clientId: credential.clientId,
      credentialType: credential.credentialType,
      environment: credential.environment,
      homeAccountId: credential.homeAccountId,
      realm: credential.realm,
      tokenType: credential.tokenType
    }, tokenKeys = this.getTokenKeys(), currentScopes = ScopeSet.fromString(credential.target);
    tokenKeys.accessToken.forEach(key => {
      if (!this.accessTokenKeyMatchesFilter(key, accessTokenFilter, !1)) {
        return;
      }
      const tokenEntity = this.getAccessTokenCredential(key, correlationId);
      if (tokenEntity && this.credentialMatchesFilter(tokenEntity, accessTokenFilter, correlationId)) {
        ScopeSet.fromString(tokenEntity.target).intersectingScopeSets(currentScopes) && this.removeAccessToken(key, correlationId);
      }
    }), await this.setAccessTokenCredential(credential, correlationId, kmsi);
  }
  getAccountsFilteredBy(accountFilter, correlationId) {
    const allAccountKeys = this.getAccountKeys(), matchingAccounts = [];
    return allAccountKeys.forEach(cacheKey => {
      const entity = this.getAccount(cacheKey, correlationId);
      if (!entity) {
        return;
      }
      if (accountFilter.homeAccountId && !this.matchHomeAccountId(entity, accountFilter.homeAccountId)) {
        return;
      }
      if (accountFilter.environment && !this.matchEnvironment(entity, accountFilter.environment, correlationId)) {
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
        name: accountFilter?.name,
        username: accountFilter?.username,
        loginHint: accountFilter?.loginHint,
        upn: accountFilter?.upn
      }, matchingTenantProfiles = entity.tenantProfiles?.filter(tenantProfile => this.tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter));
      matchingTenantProfiles && 0 === matchingTenantProfiles.length || matchingAccounts.push(entity);
    }), matchingAccounts;
  }
  credentialMatchesFilter(entity, filter, correlationId) {
    if (filter.clientId && !this.matchClientId(entity, filter.clientId)) {
      return !1;
    }
    if (filter.userAssertionHash && !this.matchUserAssertionHash(entity, filter.userAssertionHash)) {
      return !1;
    }
    if ("string" == typeof filter.homeAccountId && !this.matchHomeAccountId(entity, filter.homeAccountId)) {
      return !1;
    }
    if (filter.environment && !this.matchEnvironment(entity, filter.environment, correlationId)) {
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
  getAppMetadataFilteredBy(filter, correlationId) {
    const allCacheKeys = this.getKeys(), matchingAppMetadata = {};
    return allCacheKeys.forEach(cacheKey => {
      if (!this.isAppMetadata(cacheKey)) {
        return;
      }
      const entity = this.getAppMetadata(cacheKey, correlationId);
      entity && (filter.environment && !this.matchEnvironment(entity, filter.environment, correlationId) || filter.clientId && !this.matchClientId(entity, filter.clientId) || (matchingAppMetadata[cacheKey] = entity));
    }), matchingAppMetadata;
  }
  getAuthorityMetadataByAlias(host, correlationId) {
    const allCacheKeys = this.getAuthorityMetadataKeys();
    let matchedEntity = null;
    return allCacheKeys.forEach(cacheKey => {
      if (!this.isAuthorityMetadata(cacheKey) || -1 === cacheKey.indexOf(this.clientId)) {
        return;
      }
      const entity = this.getAuthorityMetadata(cacheKey, correlationId);
      entity && -1 !== entity.aliases.indexOf(host) && (matchedEntity = entity);
    }), matchedEntity;
  }
  removeAllAccounts(correlationId) {
    this.getAllAccounts({}, correlationId).forEach(account => {
      this.removeAccount(account, correlationId);
    });
  }
  removeAccount(account, correlationId) {
    this.removeAccountContext(account, correlationId);
    this.getAccountKeys().filter(key => key.includes(account.homeAccountId) && key.includes(account.environment)).forEach(key => {
      this.removeItem(key, correlationId), this.performanceClient.incrementFields({
        accountsRemoved: 1
      }, correlationId);
    });
  }
  removeAccountContext(account, correlationId) {
    const allTokenKeys = this.getTokenKeys(), keyFilter = key => key.includes(account.homeAccountId) && key.includes(account.environment);
    allTokenKeys.idToken.filter(keyFilter).forEach(key => {
      this.removeIdToken(key, correlationId);
    }), allTokenKeys.accessToken.filter(keyFilter).forEach(key => {
      this.removeAccessToken(key, correlationId);
    }), allTokenKeys.refreshToken.filter(keyFilter).forEach(key => {
      this.removeRefreshToken(key, correlationId);
    });
  }
  removeAccessToken(key, correlationId) {
    const credential = this.getAccessTokenCredential(key, correlationId);
    if (credential && (this.removeItem(key, correlationId), this.performanceClient.incrementFields({
      accessTokensRemoved: 1
    }, correlationId), credential.credentialType.toLowerCase() === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase() && credential.tokenType === AuthenticationScheme.POP)) {
      const kid = credential.keyId;
      kid && this.cryptoImpl.removeTokenBindingKey(kid, correlationId).catch(() => {
        this.commonLogger.error(`Failed to remove token binding key '${kid}'`, correlationId), 
        this.performanceClient?.incrementFields({
          removeTokenBindingKeyFailure: 1
        }, correlationId);
      });
    }
  }
  removeAppMetadata(correlationId) {
    return this.getKeys().forEach(cacheKey => {
      this.isAppMetadata(cacheKey) && this.removeItem(cacheKey, correlationId);
    }), !0;
  }
  getIdToken(account, correlationId, tokenKeys, targetRealm) {
    this.commonLogger.trace("CacheManager - getIdToken called", correlationId);
    const idTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: CredentialType.ID_TOKEN,
      clientId: this.clientId,
      realm: targetRealm
    }, idTokenMap = this.getIdTokensByFilter(idTokenFilter, correlationId, tokenKeys), numIdTokens = idTokenMap.size;
    if (numIdTokens < 1) {
      return this.commonLogger.info("CacheManager:getIdToken - No token found", correlationId), 
      null;
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
          return this.commonLogger.info("CacheManager:getIdToken - Multiple ID tokens found for account but none match account entity tenant id, returning first result", correlationId), 
          idTokenMap.values().next().value ?? null;
        }
        if (1 === numHomeIdTokens) {
          return this.commonLogger.info("CacheManager:getIdToken - Multiple ID tokens found for account, defaulting to home tenant profile", correlationId), 
          homeIdTokenMap.values().next().value ?? null;
        }
        tokensToBeRemoved = homeIdTokenMap;
      }
      return this.commonLogger.info("CacheManager:getIdToken - Multiple matching ID tokens found, clearing them", correlationId), 
      tokensToBeRemoved.forEach((idToken, key) => {
        this.removeIdToken(key, correlationId);
      }), this.performanceClient.addFields({
        multiMatchedID: idTokenMap.size
      }, correlationId), null;
    }
    return this.commonLogger.info("CacheManager:getIdToken - Returning ID token", correlationId), 
    idTokenMap.values().next().value ?? null;
  }
  getIdTokensByFilter(filter, correlationId, tokenKeys) {
    const idTokenKeys = tokenKeys && tokenKeys.idToken || this.getTokenKeys().idToken, idTokens = new Map;
    return idTokenKeys.forEach(key => {
      if (!this.idTokenKeyMatchesFilter(key, {
        clientId: this.clientId,
        ...filter
      })) {
        return;
      }
      const idToken = this.getIdTokenCredential(key, correlationId);
      idToken && this.credentialMatchesFilter(idToken, filter, correlationId) && idTokens.set(key, idToken);
    }), idTokens;
  }
  idTokenKeyMatchesFilter(inputKey, filter) {
    const key = inputKey.toLowerCase();
    return (!filter.clientId || -1 !== key.indexOf(filter.clientId.toLowerCase())) && (!filter.homeAccountId || -1 !== key.indexOf(filter.homeAccountId.toLowerCase()));
  }
  removeIdToken(key, correlationId) {
    this.removeItem(key, correlationId);
  }
  removeRefreshToken(key, correlationId) {
    this.removeItem(key, correlationId);
  }
  getAccessToken(account, request, tokenKeys, targetRealm) {
    const correlationId = request.correlationId;
    this.commonLogger.trace("CacheManager - getAccessToken called", correlationId);
    const scopes = ScopeSet.createSearchScopes(request.scopes), authScheme = request.authenticationScheme || AuthenticationScheme.BEARER, credentialType = authScheme.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase() ? CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME : CredentialType.ACCESS_TOKEN, accessTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: credentialType,
      clientId: this.clientId,
      realm: targetRealm || account.tenantId,
      target: scopes,
      tokenType: authScheme,
      keyId: request.sshKid
    }, accessTokenKeys = tokenKeys && tokenKeys.accessToken || this.getTokenKeys().accessToken, accessTokens = [];
    accessTokenKeys.forEach(key => {
      if (this.accessTokenKeyMatchesFilter(key, accessTokenFilter, !0)) {
        const accessToken = this.getAccessTokenCredential(key, correlationId);
        accessToken && this.credentialMatchesFilter(accessToken, accessTokenFilter, correlationId) && accessTokens.push(accessToken);
      }
    });
    const numAccessTokens = accessTokens.length;
    return numAccessTokens < 1 ? (this.commonLogger.info("CacheManager:getAccessToken - No token found", correlationId), 
    null) : numAccessTokens > 1 ? (this.commonLogger.info("CacheManager:getAccessToken - Multiple access tokens found, clearing them", correlationId), 
    accessTokens.forEach(accessToken => {
      this.removeAccessToken(this.generateCredentialKey(accessToken), correlationId);
    }), this.performanceClient.addFields({
      multiMatchedAT: accessTokens.length
    }, correlationId), null) : (this.commonLogger.info("CacheManager:getAccessToken - Returning access token", correlationId), 
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
  getAccessTokensByFilter(filter, correlationId) {
    const tokenKeys = this.getTokenKeys(), accessTokens = [];
    return tokenKeys.accessToken.forEach(key => {
      if (!this.accessTokenKeyMatchesFilter(key, filter, !0)) {
        return;
      }
      const accessToken = this.getAccessTokenCredential(key, correlationId);
      accessToken && this.credentialMatchesFilter(accessToken, filter, correlationId) && accessTokens.push(accessToken);
    }), accessTokens;
  }
  getRefreshToken(account, familyRT, correlationId, tokenKeys) {
    this.commonLogger.trace("CacheManager - getRefreshToken called", correlationId);
    const id = familyRT ? "1" : void 0, refreshTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: CredentialType.REFRESH_TOKEN,
      clientId: this.clientId,
      familyId: id
    }, refreshTokenKeys = tokenKeys && tokenKeys.refreshToken || this.getTokenKeys().refreshToken, refreshTokens = [];
    refreshTokenKeys.forEach(key => {
      if (this.refreshTokenKeyMatchesFilter(key, refreshTokenFilter)) {
        const refreshToken = this.getRefreshTokenCredential(key, correlationId);
        refreshToken && this.credentialMatchesFilter(refreshToken, refreshTokenFilter, correlationId) && refreshTokens.push(refreshToken);
      }
    });
    const numRefreshTokens = refreshTokens.length;
    return numRefreshTokens < 1 ? (this.commonLogger.info("CacheManager:getRefreshToken - No refresh token found.", correlationId), 
    null) : (numRefreshTokens > 1 && this.performanceClient.addFields({
      multiMatchedRT: numRefreshTokens
    }, correlationId), this.commonLogger.info("CacheManager:getRefreshToken - returning refresh token", correlationId), 
    refreshTokens[0]);
  }
  refreshTokenKeyMatchesFilter(inputKey, filter) {
    const key = inputKey.toLowerCase();
    return (!filter.familyId || -1 !== key.indexOf(filter.familyId.toLowerCase())) && (!(!filter.familyId && filter.clientId && -1 === key.indexOf(filter.clientId.toLowerCase())) && (!filter.homeAccountId || -1 !== key.indexOf(filter.homeAccountId.toLowerCase())));
  }
  readAppMetadataFromCache(environment, correlationId) {
    const appMetadataFilter = {
      environment: environment,
      clientId: this.clientId
    }, appMetadata = this.getAppMetadataFilteredBy(appMetadataFilter, correlationId), appMetadataEntries = Object.keys(appMetadata).map(key => appMetadata[key]), numAppMetadata = appMetadataEntries.length;
    if (numAppMetadata < 1) {
      return null;
    }
    if (numAppMetadata > 1) {
      throw createClientAuthError("multiple_matching_appMetadata");
    }
    return appMetadataEntries[0];
  }
  isAppMetadataFOCI(environment, correlationId) {
    const appMetadata = this.readAppMetadataFromCache(environment, correlationId);
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
  matchLoginHintWithTenantProfile(tenantProfile, loginHintFilter) {
    return tenantProfile.loginHint === loginHintFilter || tenantProfile.username === loginHintFilter || tenantProfile.upn === loginHintFilter;
  }
  matchUserAssertionHash(entity, userAssertionHash) {
    return !(!entity.userAssertionHash || userAssertionHash !== entity.userAssertionHash);
  }
  matchEnvironment(entity, environment, correlationId) {
    if (this.staticAuthorityOptions) {
      const staticAliases = function(staticAuthorityOptions, logger, correlationId) {
        let staticAliases;
        const canonicalAuthority = staticAuthorityOptions.canonicalAuthority;
        if (canonicalAuthority) {
          const authorityHost = new UrlString(canonicalAuthority).getUrlComponents().HostNameAndPort;
          staticAliases = getAliasesFromMetadata(logger, correlationId, authorityHost, staticAuthorityOptions.cloudDiscoveryMetadata?.metadata, AuthorityMetadataSource_CONFIG) || getAliasesFromMetadata(logger, correlationId, authorityHost, InstanceDiscoveryMetadata.metadata, AuthorityMetadataSource_HARDCODED_VALUES) || staticAuthorityOptions.knownAuthorities;
        }
        return staticAliases || [];
      }(this.staticAuthorityOptions, this.commonLogger, correlationId);
      if (staticAliases.includes(environment) && staticAliases.includes(entity.environment)) {
        return !0;
      }
    }
    const cloudMetadata = this.getAuthorityMetadataByAlias(environment, correlationId);
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
    return tokenClaims.login_hint === loginHint || (tokenClaims.preferred_username === loginHint || (tokenClaims.upn === loginHint || !(!tokenClaims.emails || !tokenClaims.emails.includes(loginHint))));
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
    return -1 !== key.indexOf("authority-metadata");
  }
  generateAuthorityMetadataCacheKey(authority) {
    return `authority-metadata-${this.clientId}-${authority}`;
  }
  static toObject(obj, json) {
    for (const propertyName in json) {
      obj[propertyName] = json[propertyName];
    }
    return obj;
  }
}

class DefaultStorageClass extends CacheManager {
  async setAccount() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAccount() {
    throw createClientAuthError(methodNotImplemented);
  }
  async setIdTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  getIdTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  async setAccessTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAccessTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  async setRefreshTokenCredential() {
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
  generateCredentialKey() {
    throw createClientAuthError(methodNotImplemented);
  }
  generateAccountKey() {
    throw createClientAuthError(methodNotImplemented);
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ const PerformanceEventStatus_InProgress = 1;

/*! @azure/msal-common v16.6.2 2026-05-19 */ class StubPerformanceClient {
  generateId() {
    return "callback-id";
  }
  startMeasurement(measureName, correlationId) {
    return {
      end: () => null,
      discard: () => {},
      add: () => {},
      increment: () => {},
      event: {
        eventId: this.generateId(),
        status: PerformanceEventStatus_InProgress,
        authority: "",
        libraryName: "",
        libraryVersion: "",
        clientId: "",
        name: measureName,
        startTimeMs: Date.now(),
        correlationId: correlationId || ""
      }
    };
  }
  endMeasurement() {
    return null;
  }
  discardMeasurements() {}
  removePerformanceCallback() {
    return !0;
  }
  addPerformanceCallback() {
    return "";
  }
  emitEvents() {}
  addFields() {}
  incrementFields() {}
  cacheEventByCorrelationId() {}
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ const DEFAULT_SYSTEM_OPTIONS$1 = {
  tokenRenewalOffsetSeconds: 300,
  preventCorsPreflight: !1
}, DEFAULT_LOGGER_IMPLEMENTATION = {
  loggerCallback: () => {},
  piiLoggingEnabled: !1,
  logLevel: LogLevel.Info,
  correlationId: ""
}, DEFAULT_NETWORK_IMPLEMENTATION = {
  async sendGetRequestAsync() {
    throw createClientAuthError(methodNotImplemented);
  },
  async sendPostRequestAsync() {
    throw createClientAuthError(methodNotImplemented);
  }
}, DEFAULT_LIBRARY_INFO = {
  sku: "msal.js.common",
  version: "16.6.2",
  cpu: "",
  os: ""
}, DEFAULT_CLIENT_CREDENTIALS = {
  clientSecret: "",
  clientAssertion: void 0
}, DEFAULT_AZURE_CLOUD_OPTIONS = {
  azureCloudInstance: AzureCloudInstance_None,
  tenant: "common"
}, DEFAULT_TELEMETRY_OPTIONS$1 = {
  application: {
    appName: "",
    appVersion: ""
  }
};

function buildClientConfiguration({authOptions: userAuthOptions, systemOptions: userSystemOptions, loggerOptions: userLoggerOption, storageInterface: storageImplementation, networkInterface: networkImplementation, cryptoInterface: cryptoImplementation, clientCredentials: clientCredentials, libraryInfo: libraryInfo, telemetry: telemetry, serverTelemetryManager: serverTelemetryManager, persistencePlugin: persistencePlugin, serializableCache: serializableCache}) {
  const loggerOptions = {
    ...DEFAULT_LOGGER_IMPLEMENTATION,
    ...userLoggerOption
  };
  return {
    authOptions: (authOptions = userAuthOptions, {
      clientCapabilities: [],
      azureCloudOptions: DEFAULT_AZURE_CLOUD_OPTIONS,
      instanceAware: !1,
      isMcp: !1,
      ...authOptions
    }),
    systemOptions: {
      ...DEFAULT_SYSTEM_OPTIONS$1,
      ...userSystemOptions
    },
    loggerOptions: loggerOptions,
    storageInterface: storageImplementation || new DefaultStorageClass(userAuthOptions.clientId, DEFAULT_CRYPTO_IMPLEMENTATION, new Logger(loggerOptions), new StubPerformanceClient),
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
}

function isOidcProtocolMode(config) {
  return config.authOptions.authority.options.protocolMode === ProtocolMode_OIDC;
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class TokenCacheContext {
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

/*! @azure/msal-common v16.6.2 2026-05-19 */ function nowSeconds() {
  return Math.round((new Date).getTime() / 1e3);
}

function toDateFromSeconds(seconds) {
  return seconds ? new Date(1e3 * Number(seconds)) : new Date;
}

function isTokenExpired(expiresOn, offset) {
  const expirationSec = Number(expiresOn) || 0;
  return nowSeconds() + offset > expirationSec;
}

function delay(t, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), t));
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ function isCredentialEntity(entity) {
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

function isAppMetadataEntity(key, entity) {
  return !!entity && (0 === key.indexOf("appmetadata") && entity.hasOwnProperty("clientId") && entity.hasOwnProperty("environment"));
}

function generateAuthorityMetadataExpiresAt() {
  return nowSeconds() + 86400;
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

/*! @azure/msal-common v16.6.2 2026-05-19 */ const invokeAsync = (callback, eventName, logger, telemetryClient, correlationId) => (...args) => {
  logger.trace(`Executing function '${eventName}'`, correlationId);
  const inProgressEvent = telemetryClient.startMeasurement(eventName, correlationId);
  return correlationId && telemetryClient.incrementFields({
    [`ext.${eventName}CallCount`]: 1
  }, correlationId), callback(...args).then(response => (logger.trace(`Returning result from '${eventName}'`, correlationId), 
  inProgressEvent.end({
    success: !0
  }), response)).catch(e => {
    logger.trace(`Error occurred in '${eventName}'`, correlationId);
    try {
      logger.trace(JSON.stringify(e), correlationId);
    } catch (e) {
      logger.trace("Unable to print error message.", correlationId);
    }
    throw inProgressEvent.end({
      success: !1
    }, e), e;
  });
}, KeyLocation_SW = "sw";

class PopTokenGenerator {
  constructor(cryptoUtils, performanceClient) {
    this.cryptoUtils = cryptoUtils, this.performanceClient = performanceClient;
  }
  async generateCnf(request, logger) {
    const reqCnf = await invokeAsync(this.generateKid.bind(this), "popTokenGenerateCnf", logger, this.performanceClient, request.correlationId)(request), reqCnfString = this.cryptoUtils.base64UrlEncode(JSON.stringify(reqCnf));
    return {
      kid: reqCnf.kid,
      reqCnfString: reqCnfString
    };
  }
  async generateKid(request) {
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

/*! @azure/msal-common v16.6.2 2026-05-19 */ const InteractionRequiredServerErrorMessage = [ "interaction_required", "consent_required", "login_required", "bad_token", "ux_not_allowed", "interrupted_user" ], InteractionRequiredAuthSubErrorMessage = [ "message_only", "additional_action", "basic_action", "user_password_expired", "consent_required", "bad_token", "ux_not_allowed", "interrupted_user" ];

class InteractionRequiredAuthError extends AuthError {
  constructor(errorCode, errorMessage, subError, timestamp, traceId, correlationId, claims, errorNo) {
    super(errorCode, errorMessage, subError), Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype), 
    this.timestamp = timestamp || "", this.traceId = traceId || "", this.correlationId = correlationId || "", 
    this.claims = claims || "", this.name = "InteractionRequiredAuthError", this.errorNo = errorNo;
  }
}

function createInteractionRequiredAuthError(errorCode, errorMessage) {
  return new InteractionRequiredAuthError(errorCode, errorMessage);
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class ServerError extends AuthError {
  constructor(errorCode, errorMessage, subError, errorNo, status) {
    super(errorCode, errorMessage, subError), this.name = "ServerError", this.errorNo = errorNo, 
    this.status = status, Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */
/*! @azure/msal-common v16.6.2 2026-05-19 */
class ResponseHandler {
  constructor(clientId, cacheStorage, cryptoObj, logger, performanceClient, serializableCache, persistencePlugin) {
    this.clientId = clientId, this.cacheStorage = cacheStorage, this.cryptoObj = cryptoObj, 
    this.logger = logger, this.performanceClient = performanceClient, this.serializableCache = serializableCache, 
    this.persistencePlugin = persistencePlugin;
  }
  validateTokenResponse(serverResponse, correlationId, refreshAccessToken) {
    if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
      const errString = `Error(s): ${serverResponse.error_codes || "Not Available"} - Timestamp: ${serverResponse.timestamp || "Not Available"} - Description: ${serverResponse.error_description || "Not Available"} - Correlation ID: ${serverResponse.correlation_id || "Not Available"} - Trace ID: ${serverResponse.trace_id || "Not Available"}`, serverErrorNo = serverResponse.error_codes?.length ? serverResponse.error_codes[0] : void 0, serverError = new ServerError(serverResponse.error, errString, serverResponse.suberror, serverErrorNo, serverResponse.status);
      if (refreshAccessToken && serverResponse.status && serverResponse.status >= 500 && serverResponse.status <= 599) {
        return void this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently unavailable and the access token is unable to be refreshed.\n${serverError}`, correlationId);
      }
      if (refreshAccessToken && serverResponse.status && serverResponse.status >= 400 && serverResponse.status <= 499) {
        return void this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently available but is unable to refresh the access token.\n${serverError}`, correlationId);
      }
      if (function(errorCode, errorString, subError) {
        const isInteractionRequiredErrorCode = !!errorCode && InteractionRequiredServerErrorMessage.indexOf(errorCode) > -1, isInteractionRequiredSubError = !!subError && InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1, isInteractionRequiredErrorDesc = !!errorString && InteractionRequiredServerErrorMessage.some(irErrorCode => errorString.indexOf(irErrorCode) > -1);
        return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc || isInteractionRequiredSubError;
      }(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
        throw new InteractionRequiredAuthError(serverResponse.error, serverResponse.error_description, serverResponse.suberror, serverResponse.timestamp || "", serverResponse.trace_id || "", serverResponse.correlation_id || "", serverResponse.claims || "", serverErrorNo);
      }
      throw serverError;
    }
  }
  async handleServerTokenResponse(serverTokenResponse, authority, reqTimestamp, request, apiId, authCodePayload, userAssertionHash, handlingRefreshTokenResponse, forceCacheRefreshTokenResponse, serverRequestId) {
    let idTokenClaims, requestStateObj;
    if (serverTokenResponse.id_token) {
      if (idTokenClaims = extractTokenClaims(serverTokenResponse.id_token || "", this.cryptoObj.base64Decode), 
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
    this.homeAccountIdentifier = function(serverClientInfo, authType, logger, cryptoObj, correlationId, idTokenClaims) {
      if (authType !== AuthorityType_Adfs && authType !== AuthorityType_Dsts) {
        if (serverClientInfo) {
          try {
            const clientInfo = buildClientInfo(serverClientInfo, cryptoObj.base64Decode);
            if (clientInfo.uid && clientInfo.utid) {
              return `${clientInfo.uid}.${clientInfo.utid}`;
            }
          } catch (e) {}
        }
        logger.warning("No client info in response", correlationId);
      }
      return idTokenClaims?.sub || "";
    }(serverTokenResponse.client_info || "", authority.authorityType, this.logger, this.cryptoObj, request.correlationId, idTokenClaims), 
    authCodePayload && authCodePayload.state && (requestStateObj = function(base64Decode, state) {
      if (!base64Decode) {
        throw createClientAuthError("no_crypto_object");
      }
      if (!state) {
        throw createClientAuthError("invalid_state");
      }
      try {
        const splitState = state.split("|"), libraryState = splitState[0], userState = splitState.length > 1 ? splitState.slice(1).join("|") : "", libraryStateString = base64Decode(libraryState);
        return {
          userRequestState: userState || "",
          libraryState: JSON.parse(libraryStateString)
        };
      } catch (e) {
        throw createClientAuthError("invalid_state");
      }
    }(this.cryptoObj.base64Decode, authCodePayload.state)), serverTokenResponse.key_id = serverTokenResponse.key_id || request.sshKid || void 0;
    const cacheRecord = this.generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload);
    let cacheContext;
    try {
      if (this.persistencePlugin && this.serializableCache && (this.logger.verbose("Persistence enabled, calling beforeCacheAccess", request.correlationId), 
      cacheContext = new TokenCacheContext(this.serializableCache, !0), await this.persistencePlugin.beforeCacheAccess(cacheContext)), 
      handlingRefreshTokenResponse && !forceCacheRefreshTokenResponse && cacheRecord.account) {
        if (this.cacheStorage.getAllAccounts({
          homeAccountId: cacheRecord.account.homeAccountId,
          environment: cacheRecord.account.environment
        }, request.correlationId).length < 1) {
          return this.logger.warning("Account used to refresh tokens not in persistence, refreshed tokens will not be stored in the cache", request.correlationId), 
          this.performanceClient?.addFields({
            acntLoggedOut: !0
          }, request.correlationId), await ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, !1, request, this.performanceClient, idTokenClaims, requestStateObj, void 0, serverRequestId);
        }
      }
      await this.cacheStorage.saveCacheRecord(cacheRecord, request.correlationId, function(idTokenClaims) {
        if (!idTokenClaims.signin_state) {
          return !1;
        }
        const kmsiClaims = [ "kmsi", "dvc_dmjd" ];
        return idTokenClaims.signin_state.some(value => kmsiClaims.includes(value.trim().toLowerCase()));
      }(idTokenClaims || {}), apiId, request.storeInCache);
    } finally {
      this.persistencePlugin && this.serializableCache && cacheContext && (this.logger.verbose("Persistence enabled, calling afterCacheAccess", request.correlationId), 
      await this.persistencePlugin.afterCacheAccess(cacheContext));
    }
    return ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, !1, request, this.performanceClient, idTokenClaims, requestStateObj, serverTokenResponse, serverRequestId);
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
      realm: tenantId,
      lastUpdatedAt: Date.now().toString()
    }, cachedAccount = function(cacheStorage, authority, homeAccountId, base64Decode, correlationId, idTokenClaims, clientInfo, environment, claimsTenantId, authCodePayload, nativeAccountId, logger, performanceClient) {
      logger?.verbose("setCachedAccount called", correlationId);
      const accountEnvironment = environment || authority.getPreferredCache(), matchedAccounts = cacheStorage.getAccountsFilteredBy({
        homeAccountId: homeAccountId,
        environment: accountEnvironment
      }, correlationId);
      performanceClient?.addFields({
        cacheMatchedAccounts: matchedAccounts.length
      }, correlationId), matchedAccounts.length > 1 && logger?.warning("Multiple base accounts matched homeAccountId. Ignoring cached account and creating a new base account.", correlationId);
      const cachedAccount = 1 === matchedAccounts.length ? matchedAccounts[0] : null, baseAccount = cachedAccount || function(accountDetails, authority, base64Decode) {
        let authorityType, clientInfo, dataBoundary;
        authorityType = authority.authorityType === AuthorityType_Adfs ? "ADFS" : authority.protocolMode === ProtocolMode_OIDC ? "Generic" : "MSSTS", 
        accountDetails.clientInfo && base64Decode && (clientInfo = buildClientInfo(accountDetails.clientInfo, base64Decode), 
        clientInfo.xms_tdbr && (dataBoundary = "EU" === clientInfo.xms_tdbr ? "EU" : "None"));
        const env = accountDetails.environment || authority && authority.getPreferredCache();
        if (!env) {
          throw createClientAuthError("invalid_cache_environment");
        }
        const preferredUsername = accountDetails.idTokenClaims?.preferred_username || accountDetails.idTokenClaims?.upn, email = accountDetails.idTokenClaims?.emails ? accountDetails.idTokenClaims.emails[0] : null, username = preferredUsername || email || "", loginHint = accountDetails.idTokenClaims?.login_hint, realm = clientInfo?.utid || getTenantIdFromIdTokenClaims(accountDetails.idTokenClaims) || "", localAccountId = clientInfo?.uid || accountDetails.idTokenClaims?.oid || accountDetails.idTokenClaims?.sub || "";
        let tenantProfiles;
        tenantProfiles = accountDetails.tenantProfiles ? accountDetails.tenantProfiles : [ buildTenantProfile(accountDetails.homeAccountId, localAccountId, realm, accountDetails.idTokenClaims) ];
        return {
          homeAccountId: accountDetails.homeAccountId,
          environment: env,
          realm: realm,
          localAccountId: localAccountId,
          username: username,
          authorityType: authorityType,
          loginHint: loginHint,
          clientInfo: accountDetails.clientInfo,
          name: accountDetails.idTokenClaims?.name || "",
          lastModificationTime: void 0,
          lastModificationApp: void 0,
          cloudGraphHostName: accountDetails.cloudGraphHostName,
          msGraphHost: accountDetails.msGraphHost,
          nativeAccountId: accountDetails.nativeAccountId,
          tenantProfiles: tenantProfiles,
          dataBoundary: dataBoundary
        };
      }({
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
    /*! @azure/msal-common v16.6.2 2026-05-19 */ (this.cacheStorage, authority, this.homeAccountIdentifier, this.cryptoObj.base64Decode, request.correlationId, idTokenClaims, serverTokenResponse.client_info, env, claimsTenantId, authCodePayload, void 0, this.logger, this.performanceClient));
    let cachedAccessToken = null;
    if (serverTokenResponse.access_token) {
      const responseScopes = serverTokenResponse.scope ? ScopeSet.fromString(serverTokenResponse.scope) : new ScopeSet(request.scopes || []), expiresIn = ("string" == typeof serverTokenResponse.expires_in ? parseInt(serverTokenResponse.expires_in, 10) : serverTokenResponse.expires_in) || 0, extExpiresIn = ("string" == typeof serverTokenResponse.ext_expires_in ? parseInt(serverTokenResponse.ext_expires_in, 10) : serverTokenResponse.ext_expires_in) || 0, refreshIn = ("string" == typeof serverTokenResponse.refresh_in ? parseInt(serverTokenResponse.refresh_in, 10) : serverTokenResponse.refresh_in) || void 0, tokenExpirationSeconds = reqTimestamp + expiresIn, extendedTokenExpirationSeconds = tokenExpirationSeconds + extExpiresIn, refreshOnSeconds = refreshIn && refreshIn > 0 ? reqTimestamp + refreshIn : void 0;
      cachedAccessToken = function(homeAccountId, environment, accessToken, clientId, tenantId, scopes, expiresOn, extExpiresOn, base64Decode, refreshOn, tokenType, userAssertionHash, keyId) {
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
          tokenType: tokenType || AuthenticationScheme.BEARER,
          lastUpdatedAt: Date.now().toString()
        };
        if (userAssertionHash && (atEntity.userAssertionHash = userAssertionHash), refreshOn && (atEntity.refreshOn = refreshOn.toString()), 
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
      }(this.homeAccountIdentifier, env, serverTokenResponse.access_token, this.clientId, claimsTenantId || authority.tenant || "", responseScopes.printScopes(), tokenExpirationSeconds, extendedTokenExpirationSeconds, this.cryptoObj.base64Decode, refreshOnSeconds, serverTokenResponse.token_type, userAssertionHash, serverTokenResponse.key_id);
      const resource = request.resource || null;
      resource && (cachedAccessToken.resource = resource);
    }
    let cachedRefreshToken = null;
    if (serverTokenResponse.refresh_token) {
      let rtExpiresOn;
      if (serverTokenResponse.refresh_token_expires_in) {
        rtExpiresOn = reqTimestamp + ("string" == typeof serverTokenResponse.refresh_token_expires_in ? parseInt(serverTokenResponse.refresh_token_expires_in, 10) : serverTokenResponse.refresh_token_expires_in), 
        this.performanceClient?.addFields({
          ntwkRtExpiresOnSeconds: rtExpiresOn
        }, request.correlationId);
      }
      cachedRefreshToken = function(homeAccountId, environment, refreshToken, clientId, familyId, userAssertionHash, expiresOn) {
        const rtEntity = {
          credentialType: CredentialType.REFRESH_TOKEN,
          homeAccountId: homeAccountId,
          environment: environment,
          clientId: clientId,
          secret: refreshToken,
          lastUpdatedAt: Date.now().toString()
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
  static async generateAuthenticationResult(cryptoObj, authority, cacheRecord, fromTokenCache, request, performanceClient, idTokenClaims, requestState, serverTokenResponse, requestId) {
    let extExpiresOn, refreshOn, accessToken = "", responseScopes = [], expiresOn = null, familyId = "";
    if (cacheRecord.accessToken) {
      if (cacheRecord.accessToken.tokenType !== AuthenticationScheme.POP || request.popKid) {
        accessToken = cacheRecord.accessToken.secret;
      } else {
        const popTokenGenerator = new PopTokenGenerator(cryptoObj, performanceClient), {secret: secret, keyId: keyId} = cacheRecord.accessToken;
        if (!keyId) {
          throw createClientAuthError("key_id_missing");
        }
        accessToken = await popTokenGenerator.signPopToken(secret, keyId, request);
      }
      responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target).asArray(), 
      expiresOn = toDateFromSeconds(cacheRecord.accessToken.expiresOn), extExpiresOn = toDateFromSeconds(cacheRecord.accessToken.extendedExpiresOn), 
      cacheRecord.accessToken.refreshOn && (refreshOn = toDateFromSeconds(cacheRecord.accessToken.refreshOn));
    }
    cacheRecord.appMetadata && (familyId = "1" === cacheRecord.appMetadata.familyId ? "1" : "");
    const uid = idTokenClaims?.oid || idTokenClaims?.sub || "", tid = idTokenClaims?.tid || "";
    serverTokenResponse?.spa_accountid && cacheRecord.account && (cacheRecord.account.nativeAccountId = serverTokenResponse?.spa_accountid);
    const accountInfo = cacheRecord.account ? updateAccountTenantProfileData(getAccountInfo(cacheRecord.account), void 0, idTokenClaims, cacheRecord.idToken?.secret) : null;
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
      requestId: requestId || "",
      familyId: familyId,
      tokenType: cacheRecord.accessToken?.tokenType || "",
      state: requestState ? requestState.userRequestState : "",
      cloudGraphHostName: cacheRecord.account?.cloudGraphHostName || "",
      msGraphHost: cacheRecord.account?.msGraphHost || "",
      code: serverTokenResponse?.spa_code,
      fromPlatformBroker: !1
    };
  }
}

const CcsCredentialType_HOME_ACCOUNT_ID = "home_account_id", CcsCredentialType_UPN = "UPN";

/*! @azure/msal-common v16.6.2 2026-05-19 */ async function getClientAssertion(clientAssertion, clientId, tokenEndpoint) {
  if ("string" == typeof clientAssertion) {
    return clientAssertion;
  }
  return clientAssertion({
    clientId: clientId,
    tokenEndpoint: tokenEndpoint
  });
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ function getRequestThumbprint(clientId, request, homeAccountId) {
  return {
    clientId: clientId,
    authority: request.authority,
    scopes: request.scopes,
    homeAccountIdentifier: homeAccountId,
    claims: request.claims,
    authenticationScheme: request.authenticationScheme,
    resourceRequestMethod: request.resourceRequestMethod,
    resourceRequestUri: request.resourceRequestUri,
    shrClaims: request.shrClaims,
    sshKid: request.sshKid,
    embeddedClientId: request.embeddedClientId || request.extraParameters?.clientId
  };
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class ThrottlingUtils {
  static generateThrottlingStorageKey(thumbprint) {
    return `throttling.${JSON.stringify(thumbprint)}`;
  }
  static preProcess(cacheManager, thumbprint, correlationId) {
    const key = ThrottlingUtils.generateThrottlingStorageKey(thumbprint), value = cacheManager.getThrottlingCache(key, correlationId);
    if (value) {
      if (value.throttleTime < Date.now()) {
        return void cacheManager.removeItem(key, correlationId);
      }
      throw new ServerError(value.errorCodes?.join(" ") || "", value.errorMessage, value.subError);
    }
  }
  static postProcess(cacheManager, thumbprint, response, correlationId) {
    if (ThrottlingUtils.checkResponseStatus(response) || ThrottlingUtils.checkResponseForRetryAfter(response)) {
      const thumbprintValue = {
        throttleTime: ThrottlingUtils.calculateThrottleTime(parseInt(response.headers[HeaderNames_RETRY_AFTER])),
        error: response.body.error,
        errorCodes: response.body.error_codes,
        errorMessage: response.body.error_description,
        subError: response.body.suberror
      };
      cacheManager.setThrottlingCache(ThrottlingUtils.generateThrottlingStorageKey(thumbprint), thumbprintValue, correlationId);
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
    return Math.floor(1e3 * Math.min(currentSeconds + (time || 60), currentSeconds + 3600));
  }
  static removeThrottle(cacheManager, clientId, request, homeAccountIdentifier) {
    const thumbprint = getRequestThumbprint(clientId, request, homeAccountIdentifier), key = this.generateThrottlingStorageKey(thumbprint);
    cacheManager.removeItem(key, request.correlationId);
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class NetworkError extends AuthError {
  constructor(error, httpStatus, responseHeaders) {
    super(error.errorCode, error.errorMessage, error.subError), Object.setPrototypeOf(this, NetworkError.prototype), 
    this.name = "NetworkError", this.error = error, this.httpStatus = httpStatus, this.responseHeaders = responseHeaders;
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */
function createTokenRequestHeaders(logger, preventCorsPreflight, ccsCred) {
  const headers = {};
  if (headers[HeaderNames_CONTENT_TYPE] = "application/x-www-form-urlencoded;charset=utf-8", 
  !preventCorsPreflight && ccsCred) {
    switch (ccsCred.type) {
     case CcsCredentialType_HOME_ACCOUNT_ID:
      try {
        const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
        headers[HeaderNames_CCS_HEADER] = `Oid:${clientInfo.uid}@${clientInfo.utid}`;
      } catch (e) {
        logger.verbose(`Could not parse home account ID for CCS Header: '${e}'`, "");
      }
      break;

     case CcsCredentialType_UPN:
      headers[HeaderNames_CCS_HEADER] = `UPN: ${ccsCred.credential}`;
    }
  }
  return headers;
}

function createTokenQueryParameters(request, clientId, redirectUri, performanceClient) {
  const parameters = new Map;
  return request.embeddedClientId && addBrokerParameters(parameters, clientId, redirectUri), 
  request.extraQueryParameters && addExtraParameters(parameters, request.extraQueryParameters), 
  addCorrelationId(parameters, request.correlationId), instrumentBrokerParams(parameters, request.correlationId, performanceClient), 
  mapToQueryString(parameters);
}

async function executePostToTokenEndpoint(tokenEndpoint, queryString, headers, thumbprint, correlationId, cacheManager, networkClient, logger, performanceClient, serverTelemetryManager) {
  const response = await sendPostRequest(thumbprint, tokenEndpoint, {
    body: queryString,
    headers: headers
  }, correlationId, cacheManager, networkClient, logger, performanceClient);
  return serverTelemetryManager && response.status < 500 && 429 !== response.status && serverTelemetryManager.clearTelemetryCache(), 
  response;
}

async function sendPostRequest(thumbprint, tokenEndpoint, options, correlationId, cacheManager, networkClient, logger, performanceClient) {
  let response;
  ThrottlingUtils.preProcess(cacheManager, thumbprint, correlationId);
  try {
    response = await invokeAsync(networkClient.sendPostRequestAsync.bind(networkClient), "networkClientSendPostRequestAsync", logger, performanceClient, correlationId)(tokenEndpoint, options);
    const responseHeaders = response.headers || {};
    performanceClient?.addFields({
      refreshTokenSize: response.body.refresh_token?.length || 0,
      httpVerToken: responseHeaders[HeaderNames_X_MS_HTTP_VERSION] || "",
      requestId: responseHeaders[HeaderNames_X_MS_REQUEST_ID] || ""
    }, correlationId);
  } catch (e) {
    if (e instanceof NetworkError) {
      const responseHeaders = e.responseHeaders;
      throw responseHeaders && performanceClient?.addFields({
        httpVerToken: responseHeaders[HeaderNames_X_MS_HTTP_VERSION] || "",
        requestId: responseHeaders[HeaderNames_X_MS_REQUEST_ID] || "",
        contentTypeHeader: responseHeaders[HeaderNames_CONTENT_TYPE] || void 0,
        contentLengthHeader: responseHeaders[HeaderNames_CONTENT_LENGTH] || void 0,
        httpStatus: e.httpStatus
      }, correlationId), e.error;
    }
    throw e instanceof AuthError ? e : createClientAuthError("network_error");
  }
  return ThrottlingUtils.postProcess(cacheManager, thumbprint, response, correlationId), 
  response;
}

/*! @azure/msal-common v16.6.2 2026-05-19 */
/*! @azure/msal-common v16.6.2 2026-05-19 */
class RegionDiscovery {
  constructor(networkInterface, logger, performanceClient, correlationId) {
    this.networkInterface = networkInterface, this.logger = logger, this.performanceClient = performanceClient, 
    this.correlationId = correlationId;
  }
  async detectRegion(environmentRegion, regionDiscoveryMetadata) {
    let autodetectedRegionName = environmentRegion;
    if (autodetectedRegionName) {
      regionDiscoveryMetadata.region_source = RegionDiscoverySources_ENVIRONMENT_VARIABLE;
    } else {
      const options = RegionDiscovery.IMDS_OPTIONS;
      try {
        const localIMDSVersionResponse = await invokeAsync(this.getRegionFromIMDS.bind(this), "regionDiscoveryGetRegionFromIMDS", this.logger, this.performanceClient, this.correlationId)("2020-06-01", options);
        if (200 === localIMDSVersionResponse.status && (autodetectedRegionName = localIMDSVersionResponse.body, 
        regionDiscoveryMetadata.region_source = RegionDiscoverySources_IMDS), 400 === localIMDSVersionResponse.status) {
          const currentIMDSVersion = await invokeAsync(this.getCurrentVersion.bind(this), "regionDiscoveryGetCurrentVersion", this.logger, this.performanceClient, this.correlationId)(options);
          if (!currentIMDSVersion) {
            return regionDiscoveryMetadata.region_source = RegionDiscoverySources_FAILED_AUTO_DETECTION, 
            null;
          }
          const currentIMDSVersionResponse = await invokeAsync(this.getRegionFromIMDS.bind(this), "regionDiscoveryGetRegionFromIMDS", this.logger, this.performanceClient, this.correlationId)(currentIMDSVersion, options);
          200 === currentIMDSVersionResponse.status && (autodetectedRegionName = currentIMDSVersionResponse.body, 
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
    return this.networkInterface.sendGetRequestAsync(`${IMDS_ENDPOINT}?api-version=${version}&format=text`, options, 2e3);
  }
  async getCurrentVersion(options) {
    try {
      const response = await this.networkInterface.sendGetRequestAsync(`${IMDS_ENDPOINT}?format=json`, options);
      return 400 === response.status && response.body && response.body["newest-versions"] && response.body["newest-versions"].length > 0 ? response.body["newest-versions"][0] : null;
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

/*! @azure/msal-common v16.6.2 2026-05-19 */
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
    if (authorityUri.HostNameAndPort.endsWith(".ciamlogin.com")) {
      return AuthorityType_Ciam;
    }
    const pathSegments = authorityUri.PathSegments;
    if (pathSegments.length) {
      switch (pathSegments[0].toLowerCase()) {
       case "adfs":
        return AuthorityType_Adfs;

       case "dstsv2":
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
    return 1 === authorityUri.PathSegments.length && !Authority.reservedTenantDomains.has(authorityUri.PathSegments[0]) && this.getAuthorityType(authorityUri) === AuthorityType_Default && this.protocolMode !== ProtocolMode_OIDC;
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
        cachedPart !== tenantId && (this.logger.verbose(`Replacing tenant domain name '${cachedPart}' with id '${tenantId}'`, this.correlationId), 
        cachedPart = tenantId);
      }
      currentPart !== cachedPart && (endpoint = endpoint.replace(`/${cachedPart}/`, `/${currentPart}/`));
    }), this.replaceTenant(endpoint);
  }
  get defaultOpenIdConfigurationEndpoint() {
    const canonicalAuthorityHost = this.hostnameAndPort;
    return this.canonicalAuthority.endsWith("v2.0/") || this.authorityType === AuthorityType_Adfs || this.protocolMode === ProtocolMode_OIDC && !this.isAliasOfKnownMicrosoftAuthority(canonicalAuthorityHost) ? `${this.canonicalAuthority}.well-known/openid-configuration` : `${this.canonicalAuthority}v2.0/.well-known/openid-configuration`;
  }
  discoveryComplete() {
    return !!this.metadata;
  }
  async resolveEndpointsAsync() {
    const metadataEntity = this.getCurrentMetadataEntity(), cloudDiscoverySource = await invokeAsync(this.updateCloudDiscoveryMetadata.bind(this), "authorityUpdateCloudDiscoveryMetadata", this.logger, this.performanceClient, this.correlationId)(metadataEntity);
    this.canonicalAuthority = this.canonicalAuthority.replace(this.hostnameAndPort, metadataEntity.preferred_network);
    const endpointSource = await invokeAsync(this.updateEndpointMetadata.bind(this), "authorityUpdateEndpointMetadata", this.logger, this.performanceClient, this.correlationId)(metadataEntity);
    this.updateCachedMetadata(metadataEntity, cloudDiscoverySource, {
      source: endpointSource
    }), this.performanceClient?.addFields({
      cloudDiscoverySource: cloudDiscoverySource,
      authorityEndpointSource: endpointSource
    }, this.correlationId);
  }
  getCurrentMetadataEntity() {
    let metadataEntity = this.cacheManager.getAuthorityMetadataByAlias(this.hostnameAndPort, this.correlationId);
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
    const cacheKey = this.cacheManager.generateAuthorityMetadataCacheKey(metadataEntity.preferred_cache, this.correlationId);
    this.cacheManager.setAuthorityMetadata(cacheKey, metadataEntity, this.correlationId), 
    this.metadata = metadataEntity;
  }
  async updateEndpointMetadata(metadataEntity) {
    const localMetadata = this.updateEndpointMetadataFromLocalSources(metadataEntity);
    if (localMetadata) {
      if (localMetadata.source === AuthorityMetadataSource_HARDCODED_VALUES && this.authorityOptions.azureRegionConfiguration?.azureRegion && localMetadata.metadata) {
        updateAuthorityEndpointMetadata(metadataEntity, await invokeAsync(this.updateMetadataWithRegionalInformation.bind(this), "authorityUpdateMetadataWithRegionalInformation", this.logger, this.performanceClient, this.correlationId)(localMetadata.metadata), !1), 
        metadataEntity.canonical_authority = this.canonicalAuthority;
      }
      return localMetadata.source;
    }
    let metadata = await invokeAsync(this.getEndpointMetadataFromNetwork.bind(this), "authorityGetEndpointMetadataFromNetwork", this.logger, this.performanceClient, this.correlationId)();
    if (metadata) {
      return this.validateIssuer(metadata.issuer), this.authorityOptions.azureRegionConfiguration?.azureRegion && (metadata = await invokeAsync(this.updateMetadataWithRegionalInformation.bind(this), "authorityUpdateMetadataWithRegionalInformation", this.logger, this.performanceClient, this.correlationId)(metadata)), 
      updateAuthorityEndpointMetadata(metadataEntity, metadata, !0), AuthorityMetadataSource_NETWORK;
    }
    throw createClientAuthError("openid_config_error", this.defaultOpenIdConfigurationEndpoint);
  }
  updateEndpointMetadataFromLocalSources(metadataEntity) {
    this.logger.verbose("Attempting to get endpoint metadata from authority configuration", this.correlationId);
    const configMetadata = this.getEndpointMetadataFromConfig();
    if (configMetadata) {
      return this.logger.verbose("Found endpoint metadata in authority configuration", this.correlationId), 
      updateAuthorityEndpointMetadata(metadataEntity, configMetadata, !1), {
        source: AuthorityMetadataSource_CONFIG
      };
    }
    this.logger.verbose("Did not find endpoint metadata in the config... Attempting to get endpoint metadata from the hardcoded values.", this.correlationId);
    const hardcodedMetadata = this.getEndpointMetadataFromHardcodedValues();
    if (hardcodedMetadata) {
      return updateAuthorityEndpointMetadata(metadataEntity, hardcodedMetadata, !1), {
        source: AuthorityMetadataSource_HARDCODED_VALUES,
        metadata: hardcodedMetadata
      };
    }
    this.logger.verbose("Did not find endpoint metadata in hardcoded values... Attempting to get endpoint metadata from the network metadata cache.", this.correlationId);
    const metadataEntityExpired = isAuthorityMetadataExpired(metadataEntity);
    return this.isAuthoritySameType(metadataEntity) && metadataEntity.endpointsFromNetwork && !metadataEntityExpired ? (this.logger.verbose("Found endpoint metadata in the cache.", ""), 
    {
      source: AuthorityMetadataSource_CACHE
    }) : (metadataEntityExpired && this.logger.verbose("The metadata entity is expired.", ""), 
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
    const options = {}, openIdConfigurationEndpoint = this.defaultOpenIdConfigurationEndpoint;
    this.logger.verbose(`Authority.getEndpointMetadataFromNetwork: attempting to retrieve OAuth endpoints from '${openIdConfigurationEndpoint}'`, this.correlationId);
    try {
      const response = await this.networkInterface.sendGetRequestAsync(openIdConfigurationEndpoint, options), isValidResponse = function(response) {
        return response.hasOwnProperty("authorization_endpoint") && response.hasOwnProperty("token_endpoint") && response.hasOwnProperty("issuer") && response.hasOwnProperty("jwks_uri");
      }
      /*! @azure/msal-common v16.6.2 2026-05-19 */ (response.body);
      return isValidResponse ? response.body : (this.logger.verbose("Authority.getEndpointMetadataFromNetwork: could not parse response as OpenID configuration", this.correlationId), 
      null);
    } catch (e) {
      return this.logger.verbose(`Authority.getEndpointMetadataFromNetwork: '${e}'`, this.correlationId), 
      null;
    }
  }
  getEndpointMetadataFromHardcodedValues() {
    return this.hostnameAndPort in EndpointMetadata ? EndpointMetadata[this.hostnameAndPort] : null;
  }
  async updateMetadataWithRegionalInformation(metadata) {
    const userConfiguredAzureRegion = this.authorityOptions.azureRegionConfiguration?.azureRegion;
    if (userConfiguredAzureRegion) {
      if ("TryAutoDetect" !== userConfiguredAzureRegion) {
        return this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes_CONFIGURED_NO_AUTO_DETECTION, 
        this.regionDiscoveryMetadata.region_used = userConfiguredAzureRegion, Authority.replaceWithRegionalInformation(metadata, userConfiguredAzureRegion);
      }
      const autodetectedRegionName = await invokeAsync(this.regionDiscovery.detectRegion.bind(this.regionDiscovery), "regionDiscoveryDetectRegion", this.logger, this.performanceClient, this.correlationId)(this.authorityOptions.azureRegionConfiguration?.environmentRegion, this.regionDiscoveryMetadata);
      if (autodetectedRegionName) {
        return this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes_AUTO_DETECTION_REQUESTED_SUCCESSFUL, 
        this.regionDiscoveryMetadata.region_used = autodetectedRegionName, Authority.replaceWithRegionalInformation(metadata, autodetectedRegionName);
      }
      this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes_AUTO_DETECTION_REQUESTED_FAILED;
    }
    return metadata;
  }
  async updateCloudDiscoveryMetadata(metadataEntity) {
    const localMetadataSource = this.updateCloudDiscoveryMetadataFromLocalSources(metadataEntity);
    if (localMetadataSource) {
      return localMetadataSource;
    }
    const metadata = await invokeAsync(this.getCloudDiscoveryMetadataFromNetwork.bind(this), "authorityGetCloudDiscoveryMetadataFromNetwork", this.logger, this.performanceClient, this.correlationId)();
    if (metadata) {
      return updateCloudDiscoveryMetadata(metadataEntity, metadata, !0), AuthorityMetadataSource_NETWORK;
    }
    throw createClientConfigurationError("untrusted_authority");
  }
  updateCloudDiscoveryMetadataFromLocalSources(metadataEntity) {
    this.logger.verbose("Attempting to get cloud discovery metadata from authority configuration", this.correlationId), 
    this.logger.verbosePii(`Known Authorities: '${this.authorityOptions.knownAuthorities || "N/A"}'`, this.correlationId), 
    this.logger.verbosePii(`Authority Metadata: '${this.authorityOptions.authorityMetadata || "N/A"}'`, this.correlationId), 
    this.logger.verbosePii(`Canonical Authority: '${metadataEntity.canonical_authority || "N/A"}'`, this.correlationId);
    const metadata = this.getCloudDiscoveryMetadataFromConfig();
    if (metadata) {
      return this.logger.verbose("Found cloud discovery metadata in authority configuration", this.correlationId), 
      updateCloudDiscoveryMetadata(metadataEntity, metadata, !1), AuthorityMetadataSource_CONFIG;
    }
    this.logger.verbose("Did not find cloud discovery metadata in the config... Attempting to get cloud discovery metadata from the hardcoded values.", this.correlationId);
    const hardcodedMetadata = (authorityHost = this.hostnameAndPort, getCloudDiscoveryMetadataFromNetworkResponse(InstanceDiscoveryMetadata.metadata, authorityHost));
    var authorityHost;
    if (hardcodedMetadata) {
      return this.logger.verbose("Found cloud discovery metadata from hardcoded values.", this.correlationId), 
      updateCloudDiscoveryMetadata(metadataEntity, hardcodedMetadata, !1), AuthorityMetadataSource_HARDCODED_VALUES;
    }
    this.logger.verbose("Did not find cloud discovery metadata in hardcoded values... Attempting to get cloud discovery metadata from the network metadata cache.", this.correlationId);
    const metadataEntityExpired = isAuthorityMetadataExpired(metadataEntity);
    return this.isAuthoritySameType(metadataEntity) && metadataEntity.aliasesFromNetwork && !metadataEntityExpired ? (this.logger.verbose("Found cloud discovery metadata in the cache.", ""), 
    AuthorityMetadataSource_CACHE) : (metadataEntityExpired && this.logger.verbose("The metadata entity is expired.", ""), 
    null);
  }
  getCloudDiscoveryMetadataFromConfig() {
    if (this.authorityType === AuthorityType_Ciam) {
      return this.logger.verbose("CIAM authorities do not support cloud discovery metadata, generate the aliases from authority host.", this.correlationId), 
      Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
    }
    if (this.authorityOptions.cloudDiscoveryMetadata) {
      this.logger.verbose("The cloud discovery metadata has been provided as a network response, in the config.", this.correlationId);
      try {
        this.logger.verbose("Attempting to parse the cloud discovery metadata.", this.correlationId);
        const metadata = getCloudDiscoveryMetadataFromNetworkResponse(JSON.parse(this.authorityOptions.cloudDiscoveryMetadata).metadata, this.hostnameAndPort);
        if (this.logger.verbose("Parsed the cloud discovery metadata.", ""), metadata) {
          return this.logger.verbose("There is returnable metadata attached to the parsed cloud discovery metadata.", this.correlationId), 
          metadata;
        }
        this.logger.verbose("There is no metadata attached to the parsed cloud discovery metadata.", this.correlationId);
      } catch (e) {
        throw this.logger.verbose("Unable to parse the cloud discovery metadata. Throwing Invalid Cloud Discovery Metadata Error.", this.correlationId), 
        createClientConfigurationError("invalid_cloud_discovery_metadata");
      }
    }
    return this.isInKnownAuthorities() ? (this.logger.verbose("The host is included in knownAuthorities. Creating new cloud discovery metadata from the host.", this.correlationId), 
    Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort)) : null;
  }
  async getCloudDiscoveryMetadataFromNetwork() {
    const instanceDiscoveryEndpoint = `https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=${this.canonicalAuthority}oauth2/v2.0/authorize`, options = {};
    let match = null;
    try {
      const response = await this.networkInterface.sendGetRequestAsync(instanceDiscoveryEndpoint, options);
      let typedResponseBody, metadata;
      if (function(response) {
        return response.hasOwnProperty("tenant_discovery_endpoint") && response.hasOwnProperty("metadata");
      }
      /*! @azure/msal-common v16.6.2 2026-05-19 */ (response.body)) {
        typedResponseBody = response.body, metadata = typedResponseBody.metadata, this.logger.verbosePii(`tenant_discovery_endpoint is: '${typedResponseBody.tenant_discovery_endpoint}'`, this.correlationId);
      } else {
        if (!function(response) {
          return response.hasOwnProperty("error") && response.hasOwnProperty("error_description");
        }(response.body)) {
          return this.logger.error("AAD did not return a CloudInstanceDiscoveryResponse or CloudInstanceDiscoveryErrorResponse", this.correlationId), 
          null;
        }
        if (this.logger.warning(`A CloudInstanceDiscoveryErrorResponse was returned. The cloud instance discovery network request's status code is: '${response.status}'`, this.correlationId), 
        typedResponseBody = response.body, "invalid_instance" === typedResponseBody.error) {
          return this.logger.error("The CloudInstanceDiscoveryErrorResponse error is invalid_instance.", this.correlationId), 
          null;
        }
        this.logger.warning(`The CloudInstanceDiscoveryErrorResponse error is '${typedResponseBody.error}'`, this.correlationId), 
        this.logger.warning(`The CloudInstanceDiscoveryErrorResponse error description is '${typedResponseBody.error_description}'`, this.correlationId), 
        this.logger.warning("Setting the value of the CloudInstanceDiscoveryMetadata (returned from the network, correlationId) to []", this.correlationId), 
        metadata = [];
      }
      this.logger.verbose("Attempting to find a match between the developer's authority and the CloudInstanceDiscoveryMetadata returned from the network request.", this.correlationId), 
      match = getCloudDiscoveryMetadataFromNetworkResponse(metadata, this.hostnameAndPort);
    } catch (error) {
      if (error instanceof AuthError) {
        this.logger.error(`There was a network error while attempting to get the cloud discovery instance metadata.\nError: '${error.errorCode}'\nError Description: '${error.errorMessage}'`, this.correlationId);
      } else {
        const typedError = error;
        this.logger.error(`A non-MSALJS error was thrown while attempting to get the cloud instance discovery metadata.\nError: '${typedError.name}'\nError Description: '${typedError.message}'`, this.correlationId);
      }
      return null;
    }
    return match || (this.logger.warning("The developer's authority was not found within the CloudInstanceDiscoveryMetadata returned from the network request.", this.correlationId), 
    this.logger.verbose("Creating custom Authority for custom domain scenario.", this.correlationId), 
    match = Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort)), match;
  }
  isInKnownAuthorities() {
    return this.authorityOptions.knownAuthorities.filter(authority => authority && UrlString.getDomainFromUrl(authority).toLowerCase() === this.hostnameAndPort).length > 0;
  }
  static generateAuthority(authorityString, azureCloudOptions) {
    let authorityAzureCloudInstance;
    if (azureCloudOptions && azureCloudOptions.azureCloudInstance !== AzureCloudInstance_None) {
      const tenant = azureCloudOptions.tenant ? azureCloudOptions.tenant : "common";
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
      return "login.microsoftonline.com";
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
  validateIssuer(issuer) {
    if (!issuer) {
      throw createClientConfigurationError("issuer_validation_failed");
    }
    let issuerUrl;
    try {
      issuerUrl = new URL(issuer);
    } catch {
      throw createClientConfigurationError("issuer_validation_failed");
    }
    const issuerScheme = issuerUrl.protocol, issuerHost = issuerUrl.host, authorityScheme = (this.canonicalAuthorityUrlComponents.Protocol || "").toLowerCase(), authorityHost = (this.canonicalAuthorityUrlComponents.HostNameAndPort || "").toLowerCase(), matchesAuthorityOrigin = this.matchesAuthorityOrigin(issuerScheme, issuerHost, authorityScheme, authorityHost), matchesKnownMicrosoftHost = "https:" === issuerScheme && this.isAliasOfKnownMicrosoftAuthority(issuerHost), matchesRegionalMicrosoftHost = "https:" === issuerScheme && this.matchesRegionalMicrosoftHost(issuerHost), matchesCiamTenantPattern = this.matchesCiamTenantPattern(issuerUrl, authorityHost, this.canonicalAuthorityUrlComponents.PathSegments);
    if (!(matchesAuthorityOrigin || matchesKnownMicrosoftHost || matchesRegionalMicrosoftHost || matchesCiamTenantPattern)) {
      throw createClientConfigurationError("issuer_validation_failed");
    }
  }
  matchesAuthorityOrigin(issuerScheme, issuerHost, authorityScheme, authorityHost) {
    return issuerScheme === authorityScheme && issuerHost === authorityHost;
  }
  matchesRegionalMicrosoftHost(issuerHost) {
    const firstDot = issuerHost.indexOf(".");
    if (firstDot > 0 && firstDot < issuerHost.length - 1) {
      const hostWithoutRegion = issuerHost.substring(firstDot + 1);
      return this.isAliasOfKnownMicrosoftAuthority(hostWithoutRegion);
    }
    return !1;
  }
  matchesCiamTenantPattern(issuerUrl, authorityHost, authorityPathSegments) {
    const pathSegment = authorityPathSegments[0], tenantName = pathSegment ? pathSegment.endsWith(".onmicrosoft.com") ? pathSegment.slice(0, -16) : pathSegment : authorityHost.split(".")[0];
    if (!tenantName) {
      return !1;
    }
    const ciamBaseURL = `https://${tenantName}.ciamlogin.com`, validCiamPatterns = [ ciamBaseURL, `${ciamBaseURL}/${tenantName}`, `${ciamBaseURL}/${tenantName}/v2.0`, `${ciamBaseURL}/${tenantName}.onmicrosoft.com`, `${ciamBaseURL}/${tenantName}.onmicrosoft.com/v2.0` ], issuerPath = issuerUrl.pathname.replace(/\/+$/, ""), normalizedIssuer = `${issuerUrl.protocol}//${issuerUrl.host}${issuerPath}`;
    return validCiamPatterns.some(pattern => pattern === normalizedIssuer);
  }
  static isPublicCloudAuthority(host) {
    return KNOWN_PUBLIC_CLOUDS.indexOf(host) >= 0;
  }
  static buildRegionalAuthorityString(host, region, queryString) {
    const authorityUrlInstance = new UrlString(host);
    authorityUrlInstance.validateAsUri();
    const authorityUrlParts = authorityUrlInstance.getUrlComponents();
    let hostNameAndPort = `${region}.${authorityUrlParts.HostNameAndPort}`;
    this.isPublicCloudAuthority(authorityUrlParts.HostNameAndPort) && (hostNameAndPort = `${region}.login.microsoft.com`);
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
    if (0 === authorityUrlComponents.PathSegments.length && authorityUrlComponents.HostNameAndPort.endsWith(".ciamlogin.com")) {
      ciamAuthority = `${ciamAuthority}${authorityUrlComponents.HostNameAndPort.split(".")[0]}.onmicrosoft.com`;
    }
    return ciamAuthority;
  }
}

function formatAuthorityUri(authorityUri) {
  return authorityUri.endsWith("/") ? authorityUri : `${authorityUri}/`;
}

/*! @azure/msal-common v16.6.2 2026-05-19 */
async function createDiscoveredInstance(authorityUri, networkClient, cacheManager, authorityOptions, logger, correlationId, performanceClient) {
  const authorityUriFinal = Authority.transformCIAMAuthority(formatAuthorityUri(authorityUri)), acquireTokenAuthority = new Authority(authorityUriFinal, networkClient, cacheManager, authorityOptions, logger, correlationId, performanceClient);
  try {
    return await invokeAsync(acquireTokenAuthority.resolveEndpointsAsync.bind(acquireTokenAuthority), "authorityResolveEndpointsAsync", logger, performanceClient, correlationId)(), 
    acquireTokenAuthority;
  } catch (e) {
    throw createClientAuthError("endpoints_resolution_error");
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ Authority.reservedTenantDomains = new Set([ "{tenant}", "{tenantid}", AADAuthority_COMMON, AADAuthority_CONSUMERS, AADAuthority_ORGANIZATIONS ]);

class AuthorizationCodeClient {
  constructor(configuration, performanceClient) {
    this.includeRedirectUri = !0, this.config = buildClientConfiguration(configuration), 
    this.logger = new Logger(this.config.loggerOptions, name$1, "16.6.2"), this.cryptoUtils = this.config.cryptoInterface, 
    this.cacheManager = this.config.storageInterface, this.networkClient = this.config.networkInterface, 
    this.serverTelemetryManager = this.config.serverTelemetryManager, this.authority = this.config.authOptions.authority, 
    this.performanceClient = performanceClient, this.oidcDefaultScopes = this.config.authOptions.authority.options.OIDCOptions?.defaultScopes;
  }
  async acquireToken(request, apiId, authCodePayload) {
    if (!request.code) {
      throw createClientAuthError("request_cannot_be_made");
    }
    authCodePayload && authCodePayload.cloud_instance_host_name && await invokeAsync(this.updateTokenEndpointAuthority.bind(this), "updateTokenEndpointAuthority", this.logger, this.performanceClient, request.correlationId)(authCodePayload.cloud_instance_host_name, request.correlationId);
    const reqTimestamp = nowSeconds(), response = await invokeAsync(this.executeTokenRequest.bind(this), "authClientExecuteTokenRequest", this.logger, this.performanceClient, request.correlationId)(this.authority, request, this.serverTelemetryManager), requestId = response.headers?.[HeaderNames_X_MS_REQUEST_ID], responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin);
    return responseHandler.validateTokenResponse(response.body, request.correlationId), 
    invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), "handleServerTokenResponse", this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, apiId, authCodePayload, void 0, void 0, void 0, requestId);
  }
  getLogoutUri(logoutRequest) {
    if (!logoutRequest) {
      throw createClientConfigurationError("logout_request_empty");
    }
    const queryString = this.createLogoutUrlQueryString(logoutRequest);
    return UrlString.appendQueryString(this.authority.endSessionEndpoint, queryString);
  }
  async executeTokenRequest(authority, request, serverTelemetryManager) {
    const queryParametersString = createTokenQueryParameters(request, this.config.authOptions.clientId, this.config.authOptions.redirectUri, this.performanceClient), endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString), requestBody = await invokeAsync(this.createTokenRequestBody.bind(this), "authClientCreateTokenRequestBody", this.logger, this.performanceClient, request.correlationId)(request);
    let ccsCredential;
    if (request.clientInfo) {
      try {
        const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
        ccsCredential = {
          credential: `${clientInfo.uid}.${clientInfo.utid}`,
          type: CcsCredentialType_HOME_ACCOUNT_ID
        };
      } catch (e) {
        this.logger.verbose(`Could not parse client info for CCS Header: '${e}'`, request.correlationId);
      }
    }
    const headers = createTokenRequestHeaders(this.logger, this.config.systemOptions.preventCorsPreflight, ccsCredential || request.ccsCredential), thumbprint = getRequestThumbprint(this.config.authOptions.clientId, request);
    return invokeAsync(executePostToTokenEndpoint, "authorizationCodeClientExecutePostToTokenEndpoint", this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody, headers, thumbprint, request.correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient, serverTelemetryManager);
  }
  async createTokenRequestBody(request) {
    const parameters = new Map;
    if (addClientId(parameters, request.embeddedClientId || request.extraParameters?.client_id || this.config.authOptions.clientId), 
    this.includeRedirectUri) {
      addRedirectUri(parameters, request.redirectUri);
    } else if (!request.redirectUri) {
      throw createClientConfigurationError("redirect_uri_empty");
    }
    if (addScopes(parameters, request.scopes, !0, this.oidcDefaultScopes), addResource(parameters, request.resource), 
    function(parameters, code) {
      parameters.set("code", code);
    }(parameters, request.code), addLibraryInfo(parameters, this.config.libraryInfo), 
    addApplicationTelemetry(parameters, this.config.telemetry.application), addThrottling(parameters), 
    this.serverTelemetryManager && !isOidcProtocolMode(this.config) && addServerTelemetry(parameters, this.serverTelemetryManager), 
    request.codeVerifier && function(parameters, codeVerifier) {
      parameters.set("code_verifier", codeVerifier);
    }(parameters, request.codeVerifier), this.config.clientCredentials.clientSecret && addClientSecret(parameters, this.config.clientCredentials.clientSecret), 
    this.config.clientCredentials.clientAssertion) {
      const clientAssertion = this.config.clientCredentials.clientAssertion;
      addClientAssertion(parameters, await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri)), 
      addClientAssertionType(parameters, clientAssertion.assertionType);
    }
    if (addGrantType(parameters, GrantType_AUTHORIZATION_CODE_GRANT), addClientInfo(parameters), 
    request.authenticationScheme === AuthenticationScheme.POP) {
      const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.performanceClient);
      let reqCnfData;
      if (request.popKid) {
        reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
      } else {
        reqCnfData = (await invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), "popTokenGenerateCnf", this.logger, this.performanceClient, request.correlationId)(request, this.logger)).reqCnfString;
      }
      addPopToken(parameters, reqCnfData);
    } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
      if (!request.sshJwk) {
        throw createClientConfigurationError("missing_ssh_jwk");
      }
      addSshJwk(parameters, request.sshJwk);
    }
    let ccsCred;
    if (request.clientInfo) {
      try {
        const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
        ccsCred = {
          credential: `${clientInfo.uid}.${clientInfo.utid}`,
          type: CcsCredentialType_HOME_ACCOUNT_ID
        };
      } catch (e) {
        this.logger.verbose(`Could not parse client info for CCS Header: '${e}'`, request.correlationId);
      }
    } else {
      ccsCred = request.ccsCredential;
    }
    if (this.config.systemOptions.preventCorsPreflight && ccsCred) {
      switch (ccsCred.type) {
       case CcsCredentialType_HOME_ACCOUNT_ID:
        try {
          addCcsOid(parameters, buildClientInfoFromHomeAccountId(ccsCred.credential));
        } catch (e) {
          this.logger.verbose(`Could not parse home account ID for CCS Header: '${e}'`, request.correlationId);
        }
        break;

       case CcsCredentialType_UPN:
        addCcsUpn(parameters, ccsCred.credential);
      }
    }
    return request.embeddedClientId && addBrokerParameters(parameters, this.config.authOptions.clientId, this.config.authOptions.redirectUri), 
    request.extraParameters && addExtraParameters(parameters, request.extraParameters), 
    !request.enableSpaAuthorizationCode || request.extraParameters && request.extraParameters.return_spa_code || addExtraParameters(parameters, {
      [RETURN_SPA_CODE]: "1"
    }), instrumentBrokerParams(parameters, request.correlationId, this.performanceClient), 
    addClaims(parameters, request.claims, this.config.authOptions.clientCapabilities, request.skipBrokerClaims), 
    mapToQueryString(parameters);
  }
  createLogoutUrlQueryString(request) {
    const parameters = new Map;
    return request.postLogoutRedirectUri && function(parameters, redirectUri) {
      parameters.set("post_logout_redirect_uri", redirectUri);
    }(parameters, request.postLogoutRedirectUri), request.correlationId && addCorrelationId(parameters, request.correlationId), 
    request.idTokenHint && function(parameters, idTokenHint) {
      parameters.set("id_token_hint", idTokenHint);
    }(parameters, request.idTokenHint), request.state && addState(parameters, request.state), 
    request.logoutHint && function(parameters, logoutHint) {
      parameters.set("logout_hint", logoutHint);
    }(parameters, request.logoutHint), request.extraQueryParameters && addExtraParameters(parameters, request.extraQueryParameters), 
    this.config.authOptions.instanceAware && addInstanceAware(parameters), mapToQueryString(parameters);
  }
  async updateTokenEndpointAuthority(cloudInstanceHostName, correlationId) {
    const cloudInstanceAuthorityUri = `https://${cloudInstanceHostName}/${this.authority.tenant}/`, cloudInstanceAuthority = await createDiscoveredInstance(cloudInstanceAuthorityUri, this.networkClient, this.cacheManager, this.authority.options, this.logger, correlationId, this.performanceClient);
    this.authority = cloudInstanceAuthority;
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class RefreshTokenClient {
  constructor(configuration, performanceClient) {
    this.config = buildClientConfiguration(configuration), this.logger = new Logger(this.config.loggerOptions, name$1, "16.6.2"), 
    this.cryptoUtils = this.config.cryptoInterface, this.cacheManager = this.config.storageInterface, 
    this.networkClient = this.config.networkInterface, this.serverTelemetryManager = this.config.serverTelemetryManager, 
    this.authority = this.config.authOptions.authority, this.performanceClient = performanceClient;
  }
  async acquireToken(request, apiId) {
    const reqTimestamp = nowSeconds(), response = await invokeAsync(this.executeTokenRequest.bind(this), "refreshTokenClientExecuteTokenRequest", this.logger, this.performanceClient, request.correlationId)(request, this.authority), requestId = response.headers?.[HeaderNames_X_MS_REQUEST_ID], responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin);
    return responseHandler.validateTokenResponse(response.body, request.correlationId), 
    invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), "handleServerTokenResponse", this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, apiId, void 0, void 0, !0, request.forceCache, requestId);
  }
  async acquireTokenByRefreshToken(request, apiId) {
    if (!request) {
      throw createClientConfigurationError("token_request_empty");
    }
    if (!request.account) {
      throw createClientAuthError("no_account_in_silent_request");
    }
    if (this.cacheManager.isAppMetadataFOCI(request.account.environment, request.correlationId)) {
      try {
        return await invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), "refreshTokenClientAcquireTokenWithCachedRefreshToken", this.logger, this.performanceClient, request.correlationId)(request, !0, apiId);
      } catch (e) {
        const noFamilyRTInCache = e instanceof InteractionRequiredAuthError && "no_tokens_found" === e.errorCode, clientMismatchErrorWithFamilyRT = e instanceof ServerError && "invalid_grant" === e.errorCode && "client_mismatch" === e.subError;
        if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
          return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), "refreshTokenClientAcquireTokenWithCachedRefreshToken", this.logger, this.performanceClient, request.correlationId)(request, !1, apiId);
        }
        throw e;
      }
    }
    return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), "refreshTokenClientAcquireTokenWithCachedRefreshToken", this.logger, this.performanceClient, request.correlationId)(request, !1, apiId);
  }
  async acquireTokenWithCachedRefreshToken(request, foci, apiId) {
    const refreshToken = (callback = this.cacheManager.getRefreshToken.bind(this.cacheManager), 
    eventName = "cacheManagerGetRefreshToken", logger = this.logger, telemetryClient = this.performanceClient, 
    correlationId = request.correlationId, (...args) => {
      logger.trace(`Executing function '${eventName}'`, correlationId);
      const inProgressEvent = telemetryClient.startMeasurement(eventName, correlationId);
      correlationId && telemetryClient.incrementFields({
        [`ext.${eventName}CallCount`]: 1
      }, correlationId);
      try {
        const result = callback(...args);
        return inProgressEvent.end({
          success: !0
        }), logger.trace(`Returning result from '${eventName}'`, correlationId), result;
      } catch (e) {
        logger.trace(`Error occurred in '${eventName}'`, correlationId);
        try {
          logger.trace(JSON.stringify(e), correlationId);
        } catch (e) {
          logger.trace("Unable to print error message.", correlationId);
        }
        throw inProgressEvent.end({
          success: !1
        }, e), e;
      }
    })(request.account, foci, request.correlationId, void 0);
    var callback, eventName, logger, telemetryClient, correlationId;
    if (!refreshToken) {
      throw createInteractionRequiredAuthError("no_tokens_found");
    }
    if (refreshToken.expiresOn) {
      const offset = request.refreshTokenExpirationOffsetSeconds || 300;
      if (this.performanceClient?.addFields({
        cacheRtExpiresOnSeconds: Number(refreshToken.expiresOn),
        rtOffsetSeconds: offset
      }, request.correlationId), isTokenExpired(refreshToken.expiresOn, offset)) {
        throw createInteractionRequiredAuthError("refresh_token_expired");
      }
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
      return await invokeAsync(this.acquireToken.bind(this), "refreshTokenClientAcquireToken", this.logger, this.performanceClient, request.correlationId)(refreshTokenRequest, apiId);
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError && "bad_token" === e.subError) {
        this.logger.verbose("acquireTokenWithRefreshToken: bad refresh token, removing from cache", request.correlationId);
        const badRefreshTokenKey = this.cacheManager.generateCredentialKey(refreshToken);
        this.cacheManager.removeRefreshToken(badRefreshTokenKey, request.correlationId);
      }
      throw e;
    }
  }
  async executeTokenRequest(request, authority) {
    const queryParametersString = createTokenQueryParameters(request, this.config.authOptions.clientId, this.config.authOptions.redirectUri, this.performanceClient), endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString), requestBody = await invokeAsync(this.createTokenRequestBody.bind(this), "refreshTokenClientCreateTokenRequestBody", this.logger, this.performanceClient, request.correlationId)(request), headers = createTokenRequestHeaders(this.logger, this.config.systemOptions.preventCorsPreflight, request.ccsCredential), thumbprint = getRequestThumbprint(this.config.authOptions.clientId, request);
    return invokeAsync(executePostToTokenEndpoint, "refreshTokenClientExecutePostToTokenEndpoint", this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody, headers, thumbprint, request.correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient, this.serverTelemetryManager);
  }
  async createTokenRequestBody(request) {
    const parameters = new Map;
    if (addClientId(parameters, request.embeddedClientId || request.extraParameters?.client_id || this.config.authOptions.clientId), 
    request.redirectUri && addRedirectUri(parameters, request.redirectUri), addScopes(parameters, request.scopes, !0, this.config.authOptions.authority.options.OIDCOptions?.defaultScopes), 
    addGrantType(parameters, GrantType_REFRESH_TOKEN_GRANT), addClientInfo(parameters), 
    addLibraryInfo(parameters, this.config.libraryInfo), addApplicationTelemetry(parameters, this.config.telemetry.application), 
    addThrottling(parameters), this.serverTelemetryManager && !isOidcProtocolMode(this.config) && addServerTelemetry(parameters, this.serverTelemetryManager), 
    function(parameters, refreshToken) {
      parameters.set("refresh_token", refreshToken);
    }(parameters, request.refreshToken), this.config.clientCredentials.clientSecret && addClientSecret(parameters, this.config.clientCredentials.clientSecret), 
    this.config.clientCredentials.clientAssertion) {
      const clientAssertion = this.config.clientCredentials.clientAssertion;
      addClientAssertion(parameters, await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri)), 
      addClientAssertionType(parameters, clientAssertion.assertionType);
    }
    if (request.authenticationScheme === AuthenticationScheme.POP) {
      const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.performanceClient);
      let reqCnfData;
      if (request.popKid) {
        reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
      } else {
        reqCnfData = (await invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), "popTokenGenerateCnf", this.logger, this.performanceClient, request.correlationId)(request, this.logger)).reqCnfString;
      }
      addPopToken(parameters, reqCnfData);
    } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
      if (!request.sshJwk) {
        throw createClientConfigurationError("missing_ssh_jwk");
      }
      addSshJwk(parameters, request.sshJwk);
    }
    if (this.config.systemOptions.preventCorsPreflight && request.ccsCredential) {
      switch (request.ccsCredential.type) {
       case CcsCredentialType_HOME_ACCOUNT_ID:
        try {
          addCcsOid(parameters, buildClientInfoFromHomeAccountId(request.ccsCredential.credential));
        } catch (e) {
          this.logger.verbose(`Could not parse home account ID for CCS Header: '${e}'`, request.correlationId);
        }
        break;

       case CcsCredentialType_UPN:
        addCcsUpn(parameters, request.ccsCredential.credential);
      }
    }
    return request.embeddedClientId && addBrokerParameters(parameters, this.config.authOptions.clientId, this.config.authOptions.redirectUri), 
    request.extraParameters && addExtraParameters(parameters, {
      ...request.extraParameters
    }), instrumentBrokerParams(parameters, request.correlationId, this.performanceClient), 
    addClaims(parameters, request.claims, this.config.authOptions.clientCapabilities, request.skipBrokerClaims), 
    mapToQueryString(parameters);
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ class SilentFlowClient {
  constructor(configuration, performanceClient) {
    this.config = buildClientConfiguration(configuration), this.logger = new Logger(this.config.loggerOptions, name$1, "16.6.2"), 
    this.cryptoUtils = this.config.cryptoInterface, this.cacheManager = this.config.storageInterface, 
    this.networkClient = this.config.networkInterface, this.serverTelemetryManager = this.config.serverTelemetryManager, 
    this.authority = this.config.authOptions.authority, this.performanceClient = performanceClient;
  }
  async acquireCachedToken(request) {
    let lastCacheOutcome = CacheOutcome_NOT_APPLICABLE;
    if (request.forceRefresh || !StringUtils.isEmptyObj(request.claims)) {
      throw this.setCacheOutcome(CacheOutcome_FORCE_REFRESH_OR_CLAIMS, request.correlationId), 
      createClientAuthError("token_refresh_required");
    }
    if (!request.account) {
      throw createClientAuthError("no_account_in_silent_request");
    }
    const requestTenantId = request.account.tenantId || function(authority) {
      const authorityUrlComponents = new UrlString(authority).getUrlComponents(), tenantId = authorityUrlComponents.PathSegments.slice(-1)[0]?.toLowerCase();
      switch (tenantId) {
       case AADAuthority_COMMON:
       case AADAuthority_ORGANIZATIONS:
       case AADAuthority_CONSUMERS:
        return;

       default:
        return tenantId;
      }
    }(request.authority), tokenKeys = this.cacheManager.getTokenKeys(), cachedAccessToken = this.cacheManager.getAccessToken(request.account, request, tokenKeys, requestTenantId);
    if (!cachedAccessToken) {
      throw this.setCacheOutcome(CacheOutcome_NO_CACHED_ACCESS_TOKEN, request.correlationId), 
      createClientAuthError("token_refresh_required");
    }
    if (cachedAt = cachedAccessToken.cachedAt, Number(cachedAt) > nowSeconds() || isTokenExpired(cachedAccessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
      throw this.setCacheOutcome(CacheOutcome_CACHED_ACCESS_TOKEN_EXPIRED, request.correlationId), 
      createClientAuthError("token_refresh_required");
    }
    if (request.resource) {
      if (cachedAccessToken.resource !== request.resource) {
        throw this.setCacheOutcome(CacheOutcome_NO_CACHED_ACCESS_TOKEN, request.correlationId), 
        createClientAuthError("token_refresh_required");
      }
    } else {
      cachedAccessToken.refreshOn && isTokenExpired(cachedAccessToken.refreshOn, 0) && (lastCacheOutcome = CacheOutcome_PROACTIVELY_REFRESHED);
    }
    var cachedAt;
    const environment = request.authority || this.authority.getPreferredCache(), cacheRecord = {
      account: this.cacheManager.getAccount(this.cacheManager.generateAccountKey(request.account), request.correlationId),
      accessToken: cachedAccessToken,
      idToken: this.cacheManager.getIdToken(request.account, request.correlationId, tokenKeys, requestTenantId),
      refreshToken: null,
      appMetadata: this.cacheManager.readAppMetadataFromCache(environment, request.correlationId)
    };
    return this.setCacheOutcome(lastCacheOutcome, request.correlationId), this.config.serverTelemetryManager && this.config.serverTelemetryManager.incrementCacheHits(), 
    [ await invokeAsync(this.generateResultFromCacheRecord.bind(this), "silentFlowClientGenerateResultFromCacheRecord", this.logger, this.performanceClient, request.correlationId)(cacheRecord, request), lastCacheOutcome ];
  }
  setCacheOutcome(cacheOutcome, correlationId) {
    this.serverTelemetryManager?.setCacheOutcome(cacheOutcome), this.performanceClient?.addFields({
      cacheOutcome: cacheOutcome
    }, correlationId), cacheOutcome !== CacheOutcome_NOT_APPLICABLE && this.logger.info(`Token refresh is required due to cache outcome: '${cacheOutcome}'`, correlationId);
  }
  async generateResultFromCacheRecord(cacheRecord, request) {
    let idTokenClaims;
    if (cacheRecord.idToken && (idTokenClaims = extractTokenClaims(cacheRecord.idToken.secret, this.config.cryptoInterface.base64Decode)), 
    request.maxAge || 0 === request.maxAge) {
      const authTime = idTokenClaims?.auth_time;
      if (!authTime) {
        throw createClientAuthError("auth_time_not_found");
      }
      checkMaxAge(authTime, request.maxAge);
    }
    return ResponseHandler.generateAuthenticationResult(this.cryptoUtils, this.authority, cacheRecord, !0, request, this.performanceClient, idTokenClaims);
  }
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ function getStandardAuthorizeRequestParameters(authOptions, request, logger, performanceClient) {
  const correlationId = request.correlationId, parameters = new Map;
  addClientId(parameters, request.embeddedClientId || request.extraQueryParameters?.client_id || authOptions.clientId);
  if (addScopes(parameters, [ ...request.scopes || [], ...request.extraScopesToConsent || [] ], !0, authOptions.authority.options.OIDCOptions?.defaultScopes), 
  addResource(parameters, request.resource), addRedirectUri(parameters, request.redirectUri), 
  addCorrelationId(parameters, correlationId), function(parameters, responseMode) {
    parameters.set("response_mode", responseMode || ResponseMode_QUERY);
  }(parameters, request.responseMode), addClientInfo(parameters), function(parameters) {
    parameters.set("clidata", "1");
  }(parameters), request.prompt && function(parameters, prompt) {
    parameters.set("prompt", prompt);
  }(parameters, request.prompt), request.domainHint && function(parameters, domainHint) {
    parameters.set("domain_hint", domainHint);
  }(parameters, request.domainHint), request.prompt !== PromptValue_SELECT_ACCOUNT) {
    if (request.sid && request.prompt === PromptValue_NONE) {
      logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from request", request.correlationId), 
      addSid(parameters, request.sid);
    } else if (request.account) {
      const accountSid = (account = request.account, account.idTokenClaims?.sid || null);
      let accountLoginHintClaim = function(account) {
        return account.loginHint || account.idTokenClaims?.login_hint || null;
      }
      /*! @azure/msal-common v16.6.2 2026-05-19 */ (request.account);
      if (accountLoginHintClaim && request.domainHint && (logger.warning('AuthorizationCodeClient.createAuthCodeUrlQueryString: "domainHint" param is set, skipping opaque "login_hint" claim. Please consider not passing domainHint', request.correlationId), 
      accountLoginHintClaim = null), accountLoginHintClaim) {
        logger.verbose("createAuthCodeUrlQueryString: login_hint claim present on account", request.correlationId), 
        addLoginHint(parameters, accountLoginHintClaim);
        try {
          addCcsOid(parameters, buildClientInfoFromHomeAccountId(request.account.homeAccountId));
        } catch (e) {
          logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header", request.correlationId);
        }
      } else if (accountSid && request.prompt === PromptValue_NONE) {
        logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from account", request.correlationId), 
        addSid(parameters, accountSid);
        try {
          addCcsOid(parameters, buildClientInfoFromHomeAccountId(request.account.homeAccountId));
        } catch (e) {
          logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header", request.correlationId);
        }
      } else if (request.loginHint) {
        logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from request", request.correlationId), 
        addLoginHint(parameters, request.loginHint), addCcsUpn(parameters, request.loginHint);
      } else if (request.account.username) {
        logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from account", request.correlationId), 
        addLoginHint(parameters, request.account.username);
        try {
          addCcsOid(parameters, buildClientInfoFromHomeAccountId(request.account.homeAccountId));
        } catch (e) {
          logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header", request.correlationId);
        }
      }
    } else {
      request.loginHint && (logger.verbose("createAuthCodeUrlQueryString: No account, adding login_hint from request", request.correlationId), 
      addLoginHint(parameters, request.loginHint), addCcsUpn(parameters, request.loginHint));
    }
  } else {
    logger.verbose("createAuthCodeUrlQueryString: Prompt is select_account, ignoring account hints", request.correlationId);
  }
  var account;
  return request.nonce && function(parameters, nonce) {
    parameters.set("nonce", nonce);
  }(parameters, request.nonce), request.state && addState(parameters, request.state), 
  request.embeddedClientId && addBrokerParameters(parameters, authOptions.clientId, authOptions.redirectUri), 
  addClaims(parameters, request.claims, authOptions.clientCapabilities, request.skipBrokerClaims), 
  !authOptions.instanceAware || request.extraQueryParameters && Object.keys(request.extraQueryParameters).includes("instance_aware") || addInstanceAware(parameters), 
  parameters;
}

function enforceResourceParameter(isMcp, request) {
  if (isMcp) {
    if (request.resource && (containsResourceParam(request.extraParameters) || containsResourceParam(request.extraQueryParameters))) {
      throw createClientAuthError("misplaced_resource_parameter");
    }
    if (!request.resource) {
      throw createClientAuthError("resource_parameter_required");
    }
  }
}

function containsResourceParam(params) {
  return !!params && Object.prototype.hasOwnProperty.call(params, "resource");
}

/*! @azure/msal-common v16.6.2 2026-05-19 */ function makeExtraSkuString(params) {
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
    this.wrapperSKU = telemetryRequest.wrapperSKU || "", this.wrapperVer = telemetryRequest.wrapperVer || "", 
    this.telemetryCacheKey = "server-telemetry-" + telemetryRequest.clientId;
  }
  generateCurrentRequestHeaderValue() {
    const request = `${this.apiId},${this.cacheOutcome}`, platformFieldsArr = [ this.wrapperSKU, this.wrapperVer ], nativeBrokerErrorCode = this.getNativeBrokerErrorCode();
    nativeBrokerErrorCode?.length && platformFieldsArr.push(`broker_error=${nativeBrokerErrorCode}`);
    const platformFields = platformFieldsArr.join(","), requestWithRegionDiscoveryFields = [ request, this.getRegionDiscoveryFields() ].join(",");
    return [ SERVER_TELEM_SCHEMA_VERSION, requestWithRegionDiscoveryFields, platformFields ].join("|");
  }
  generateLastRequestHeaderValue() {
    const lastRequests = this.getLastRequests(), maxErrors = ServerTelemetryManager.maxErrorsToSend(lastRequests), failedRequests = lastRequests.failedRequests.slice(0, 2 * maxErrors).join(","), errors = lastRequests.errors.slice(0, maxErrors).join(","), errorCount = lastRequests.errors.length, platformFields = [ errorCount, maxErrors < errorCount ? "1" : "0" ].join(",");
    return [ SERVER_TELEM_SCHEMA_VERSION, lastRequests.cacheHits, failedRequests, errors, platformFields ].join("|");
  }
  cacheFailedRequest(error) {
    const lastRequests = this.getLastRequests();
    lastRequests.errors.length >= 50 && (lastRequests.failedRequests.shift(), lastRequests.failedRequests.shift(), 
    lastRequests.errors.shift()), lastRequests.failedRequests.push(this.apiId, this.correlationId), 
    error instanceof Error && error && error.toString() ? error instanceof AuthError ? error.subError ? lastRequests.errors.push(error.subError) : error.errorCode ? lastRequests.errors.push(error.errorCode) : lastRequests.errors.push(error.toString()) : lastRequests.errors.push(error.toString()) : lastRequests.errors.push("unknown_error"), 
    this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
  }
  incrementCacheHits() {
    const lastRequests = this.getLastRequests();
    return lastRequests.cacheHits += 1, this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId), 
    lastRequests.cacheHits;
  }
  getLastRequests() {
    return this.cacheManager.getServerTelemetry(this.telemetryCacheKey, this.correlationId) || {
      failedRequests: [],
      errors: [],
      cacheHits: 0
    };
  }
  clearTelemetryCache() {
    const lastRequests = this.getLastRequests(), numErrorsFlushed = ServerTelemetryManager.maxErrorsToSend(lastRequests);
    if (numErrorsFlushed === lastRequests.errors.length) {
      this.cacheManager.removeItem(this.telemetryCacheKey, this.correlationId);
    } else {
      const serverTelemEntity = {
        failedRequests: lastRequests.failedRequests.slice(2 * numErrorsFlushed),
        errors: lastRequests.errors.slice(numErrorsFlushed),
        cacheHits: 0
      };
      this.cacheManager.setServerTelemetry(this.telemetryCacheKey, serverTelemEntity, this.correlationId);
    }
  }
  static maxErrorsToSend(serverTelemetryEntity) {
    let i, maxErrors = 0, dataSize = 0;
    const errorCount = serverTelemetryEntity.errors.length;
    for (i = 0; i < errorCount; i++) {
      const apiId = serverTelemetryEntity.failedRequests[2 * i] || "", correlationId = serverTelemetryEntity.failedRequests[2 * i + 1] || "", errorCode = serverTelemetryEntity.errors[i] || "";
      if (dataSize += apiId.toString().length + correlationId.toString().length + errorCode.length + 3, 
      !(dataSize < 330)) {
        break;
      }
      maxErrors += 1;
    }
    return maxErrors;
  }
  getRegionDiscoveryFields() {
    const regionDiscoveryFields = [];
    return regionDiscoveryFields.push(this.regionUsed || ""), regionDiscoveryFields.push(this.regionSource || ""), 
    regionDiscoveryFields.push(this.regionOutcome || ""), regionDiscoveryFields.join(",");
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
    lastRequests.nativeBrokerErrorCode = errorCode, this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
  }
  getNativeBrokerErrorCode() {
    return this.getLastRequests().nativeBrokerErrorCode;
  }
  clearNativeBrokerErrorCode() {
    const lastRequests = this.getLastRequests();
    delete lastRequests.nativeBrokerErrorCode, this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
  }
  static makeExtraSkuString(params) {
    return makeExtraSkuString(params);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class Deserializer {
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
        tenantProfiles: serializedAcc.tenantProfiles?.map(serializedTenantProfile => JSON.parse(serializedTenantProfile)),
        lastUpdatedAt: Date.now().toString()
      }, account = {};
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
        realm: serializedIdT.realm,
        lastUpdatedAt: Date.now().toString()
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
        userAssertionHash: serializedAT.userAssertionHash,
        resource: serializedAT.resource,
        lastUpdatedAt: Date.now().toString()
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
        realm: serializedRT.realm,
        lastUpdatedAt: Date.now().toString()
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

/*! @azure/msal-node v5.2.2 2026-05-19 */ const HttpMethod_GET = "GET", HttpMethod_POST = "POST", Hash_SHA256 = "sha256", CharSet_CV_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", CACHE_KEY_SEPARATOR$0 = "-", Constants_MSAL_SKU = "msal.js.node", Constants_JWT_BEARER_ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer", Constants_HTTP_PROTOCOL = "http://", Constants_LOCALHOST = "localhost", ApiId_acquireTokenSilent = 62, ApiId_acquireTokenByUsernamePassword = 371, ApiId_acquireTokenByDeviceCode = 671, ApiId_acquireTokenByCode = 871, ApiId_acquireTokenByRefreshToken = 872, JwtConstants_RSA_256 = "RS256", JwtConstants_PSS_256 = "PS256", JwtConstants_X5T_256 = "x5t#S256", JwtConstants_X5T = "x5t", JwtConstants_X5C = "x5c", JwtConstants_AUDIENCE = "aud", JwtConstants_EXPIRATION_TIME = "exp", JwtConstants_ISSUER = "iss", JwtConstants_SUBJECT = "sub", JwtConstants_NOT_BEFORE = "nbf", JwtConstants_JWT_ID = "jti", LOOPBACK_SERVER_CONSTANTS_INTERVAL_MS = 100, LOOPBACK_SERVER_CONSTANTS_TIMEOUT_MS = 5e3;

/*! @azure/msal-node v5.2.2 2026-05-19 */
class HttpClient {
  async sendGetRequestAsync(url, options, timeout) {
    return this.sendRequest(url, HttpMethod_GET, options, timeout);
  }
  async sendPostRequestAsync(url, options) {
    return this.sendRequest(url, HttpMethod_POST, options);
  }
  async sendRequest(url, method, options, timeout) {
    const controller = new AbortController;
    let timeoutId;
    timeout && (timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout));
    const fetchOptions = {
      method: method,
      headers: getFetchHeaders(options),
      signal: controller.signal
    };
    let response;
    method === HttpMethod_POST && (fetchOptions.body = options?.body || "");
    try {
      response = await fetch(url, fetchOptions);
    } catch (error) {
      if (timeoutId && clearTimeout(timeoutId), error instanceof Error && "AbortError" === error.name) {
        throw createAuthError("network_error", "Request timeout");
      }
      throw function(error, httpStatus, responseHeaders, additionalError) {
        return error.errorMessage = `${error.errorMessage}, additionalErrorInfo: error.name:${additionalError?.name}, error.message:${additionalError?.message}`, 
        new NetworkError(error, httpStatus, responseHeaders);
      }(createAuthError("network_error", `Network request failed: ${error instanceof Error ? error.message : "unknown"}`), void 0, void 0, error instanceof Error ? error : void 0);
    }
    timeoutId && clearTimeout(timeoutId);
    try {
      return {
        headers: getHeaderDict(response.headers),
        body: await response.json(),
        status: response.status
      };
    } catch (error) {
      throw createAuthError("token_parsing_error", `Failed to parse response: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }
}

function getHeaderDict(headers) {
  const headerDict = {};
  return headers.forEach((value, key) => {
    headerDict[key] = value;
  }), headerDict;
}

function getFetchHeaders(options) {
  const headers = new Headers;
  return options && options.headers ? (Object.entries(options.headers).forEach(([key, value]) => {
    headers.append(key, value);
  }), headers) : headers;
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ const NodeAuthErrorMessage_invalidLoopbackAddressType = {
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
}, NodeAuthErrorMessage_redirectUriNotSupported = {
  code: "redirect_uri_not_supported",
  desc: "RedirectUri is not supported in this scenario. Please remove redirectUri from the request."
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
  static createRedirectUriNotSupportedError() {
    return new NodeAuthError(NodeAuthErrorMessage_redirectUriNotSupported.code, NodeAuthErrorMessage_redirectUriNotSupported.desc);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ const DEFAULT_AUTH_OPTIONS = {
  clientId: "",
  authority: "https://login.microsoftonline.com/common/",
  clientSecret: "",
  clientAssertion: "",
  clientCertificate: {
    thumbprint: "",
    thumbprintSha256: "",
    privateKey: "",
    x5c: ""
  },
  knownAuthorities: [],
  cloudDiscoveryMetadata: "",
  authorityMetadata: "",
  clientCapabilities: [],
  azureCloudOptions: {
    azureCloudInstance: AzureCloudInstance_None,
    tenant: ""
  },
  isMcp: !1
}, DEFAULT_LOGGER_OPTIONS = {
  loggerCallback: () => {},
  piiLoggingEnabled: !1,
  logLevel: LogLevel.Info
}, DEFAULT_SYSTEM_OPTIONS = {
  loggerOptions: DEFAULT_LOGGER_OPTIONS,
  networkClient: new HttpClient,
  disableInternalRetries: !1,
  protocolMode: ProtocolMode_AAD
}, DEFAULT_TELEMETRY_OPTIONS = {
  application: {
    appName: "",
    appVersion: ""
  }
};

/*! @azure/msal-node v5.2.2 2026-05-19 */
class GuidGenerator {
  generateGuid() {
    return crypto.randomUUID();
  }
  isGuid(guid) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(guid);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class EncodingUtils {
  static base64Encode(str, encoding) {
    return Buffer.from(str, encoding).toString(EncodingTypes_BASE64);
  }
  static base64EncodeUrl(str, encoding) {
    return EncodingUtils.base64Encode(str, encoding).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }
  static base64Decode(base64Str) {
    return Buffer.from(base64Str, EncodingTypes_BASE64).toString("utf8");
  }
  static base64DecodeUrl(base64Str) {
    let str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    for (;str.length % 4; ) {
      str += "=";
    }
    return EncodingUtils.base64Decode(str);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class HashUtils {
  sha256(buffer) {
    return crypto$1.createHash(Hash_SHA256).update(buffer).digest();
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class PkceGenerator {
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
    const verifier = charArr.join("");
    return EncodingUtils.base64EncodeUrl(verifier);
  }
  generateCodeChallengeFromVerifier(codeVerifier) {
    return EncodingUtils.base64EncodeUrl(this.hashUtils.sha256(codeVerifier).toString(EncodingTypes_BASE64), EncodingTypes_BASE64);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class CryptoProvider {
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
    return EncodingUtils.base64EncodeUrl(this.hashUtils.sha256(plainText).toString(EncodingTypes_BASE64), EncodingTypes_BASE64);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */
/*! @azure/msal-node v5.2.2 2026-05-19 */
class NodeStorage extends CacheManager {
  constructor(logger, clientId, cryptoImpl, staticAuthorityOptions) {
    super(clientId, cryptoImpl, logger, new StubPerformanceClient, staticAuthorityOptions), 
    this.cache = {}, this.changeEmitters = [], this.logger = logger;
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
        if (isAccountEntity(value)) {
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
    this.logger.trace("Getting in-memory cache", "");
    return this.cacheToInMemoryCache(this.getCache());
  }
  setInMemoryCache(inMemoryCache) {
    this.logger.trace("Setting in-memory cache", "");
    const cache = this.inMemoryCacheToCache(inMemoryCache);
    this.setCache(cache), this.emitChange();
  }
  getCache() {
    return this.logger.trace("Getting cache key-value store", ""), this.cache;
  }
  setCache(cache) {
    this.logger.trace("Setting cache key value store", ""), this.cache = cache, this.emitChange();
  }
  getItem(key) {
    this.logger.tracePii(`Item key: ${key}`, "");
    return this.getCache()[key];
  }
  setItem(key, value) {
    this.logger.tracePii(`Item key: ${key}`, "");
    const cache = this.getCache();
    cache[key] = value, this.setCache(cache);
  }
  generateCredentialKey(credential) {
    return function(credential) {
      const familyId = credential.credentialType === CredentialType.REFRESH_TOKEN && credential.familyId || credential.clientId, scheme = credential.tokenType && credential.tokenType.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase() ? credential.tokenType.toLowerCase() : "";
      return [ credential.homeAccountId, credential.environment, credential.credentialType, familyId, credential.realm || "", credential.target || "", scheme ].join(CACHE_KEY_SEPARATOR$0).toLowerCase();
    }(credential);
  }
  generateAccountKey(account) {
    return function(account) {
      const homeTenantId = account.homeAccountId.split(".")[1];
      return [ account.homeAccountId, account.environment, homeTenantId || account.tenantId || "" ].join(CACHE_KEY_SEPARATOR$0).toLowerCase();
    }(account);
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
    const cachedAccount = this.getItem(accountKey);
    return cachedAccount && "object" == typeof cachedAccount ? {
      ...cachedAccount
    } : null;
  }
  async setAccount(account) {
    const accountKey = this.generateAccountKey(getAccountInfo(account));
    this.setItem(accountKey, account);
  }
  getIdTokenCredential(idTokenKey) {
    const idToken = this.getItem(idTokenKey);
    return isIdTokenEntity(idToken) ? idToken : null;
  }
  async setIdTokenCredential(idToken) {
    const idTokenKey = this.generateCredentialKey(idToken);
    this.setItem(idTokenKey, idToken);
  }
  getAccessTokenCredential(accessTokenKey) {
    const accessToken = this.getItem(accessTokenKey);
    return isAccessTokenEntity(accessToken) ? accessToken : null;
  }
  async setAccessTokenCredential(accessToken) {
    const accessTokenKey = this.generateCredentialKey(accessToken);
    this.setItem(accessTokenKey, accessToken);
  }
  getRefreshTokenCredential(refreshTokenKey) {
    const refreshToken = this.getItem(refreshTokenKey);
    return isRefreshTokenEntity(refreshToken) ? refreshToken : null;
  }
  async setRefreshTokenCredential(refreshToken) {
    const refreshTokenKey = this.generateCredentialKey(refreshToken);
    this.setItem(refreshTokenKey, refreshToken);
  }
  getAppMetadata(appMetadataKey) {
    const appMetadata = this.getItem(appMetadataKey);
    return isAppMetadataEntity(appMetadataKey, appMetadata) ? appMetadata : null;
  }
  setAppMetadata(appMetadata) {
    const appMetadataKey = function({environment: environment, clientId: clientId}) {
      return [ "appmetadata", environment, clientId ].join("-").toLowerCase();
    }(appMetadata);
    this.setItem(appMetadataKey, appMetadata);
  }
  getServerTelemetry(serverTelemetrykey) {
    const serverTelemetryEntity = this.getItem(serverTelemetrykey);
    return serverTelemetryEntity && function(key, entity) {
      const validateKey = 0 === key.indexOf("server-telemetry");
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
      return !!entity && 0 === key.indexOf("authority-metadata") && entity.hasOwnProperty("aliases") && entity.hasOwnProperty("preferred_cache") && entity.hasOwnProperty("preferred_network") && entity.hasOwnProperty("canonical_authority") && entity.hasOwnProperty("authorization_endpoint") && entity.hasOwnProperty("token_endpoint") && entity.hasOwnProperty("issuer") && entity.hasOwnProperty("aliasesFromNetwork") && entity.hasOwnProperty("endpointsFromNetwork") && entity.hasOwnProperty("expiresAt") && entity.hasOwnProperty("jwks_uri");
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
      key && (validateKey = 0 === key.indexOf("throttling"));
      let validateEntity = !0;
      return entity && (validateEntity = entity.hasOwnProperty("throttleTime")), validateKey && validateEntity;
    }(throttlingCacheKey, throttlingCache) ? throttlingCache : null;
  }
  setThrottlingCache(throttlingCacheKey, throttlingCache) {
    this.setItem(throttlingCacheKey, throttlingCache);
  }
  removeItem(key) {
    this.logger.tracePii(`Item key: ${key}`, "");
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
    this.logger.trace("Retrieving all cache keys", "");
    const cache = this.getCache();
    return [ ...Object.keys(cache) ];
  }
  clear() {
    this.logger.trace("Clearing cache entries created by MSAL", "");
    this.getKeys().forEach(key => {
      this.isAuthorityMetadata(key) || this.removeItem(key);
    }), this.emitChange();
  }
  static generateInMemoryCache(cache) {
    return Deserializer.deserializeAllCache(Deserializer.deserializeJSONBlob(cache));
  }
  static generateJsonCache(inMemoryCache) {
    return Serializer.serializeAllCache(inMemoryCache);
  }
  updateCredentialCacheKey(currentCacheKey, credential) {
    const updatedCacheKey = this.generateCredentialKey(credential);
    if (currentCacheKey !== updatedCacheKey) {
      const cacheItem = this.getItem(currentCacheKey);
      if (cacheItem) {
        return this.removeItem(currentCacheKey), this.setItem(updatedCacheKey, cacheItem), 
        this.logger.verbose(`Updated an outdated ${credential.credentialType} cache key`, ""), 
        updatedCacheKey;
      }
      this.logger.error(`Attempted to update an outdated ${credential.credentialType} cache key but no item matching the outdated key was found in storage`, "");
    }
    return currentCacheKey;
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ const defaultSerializedCache_Account = {}, defaultSerializedCache_IdToken = {}, defaultSerializedCache_AccessToken = {}, defaultSerializedCache_RefreshToken = {}, defaultSerializedCache_AppMetadata = {};

class TokenCache {
  constructor(storage, logger, cachePlugin) {
    this.cacheHasChanged = !1, this.storage = storage, this.storage.registerChangeEmitter(this.handleChangeEvent.bind(this)), 
    cachePlugin && (this.persistence = cachePlugin), this.logger = logger;
  }
  hasChanged() {
    return this.cacheHasChanged;
  }
  serialize() {
    this.logger.trace("Serializing in-memory cache", "");
    let finalState = Serializer.serializeAllCache(this.storage.getInMemoryCache());
    return this.cacheSnapshot ? (this.logger.trace("Reading cache snapshot from disk", ""), 
    finalState = this.mergeState(JSON.parse(this.cacheSnapshot), finalState)) : this.logger.trace("No cache snapshot to merge", ""), 
    this.cacheHasChanged = !1, JSON.stringify(finalState);
  }
  deserialize(cache) {
    if (this.logger.trace("Deserializing JSON to in-memory cache", ""), this.cacheSnapshot = cache, 
    this.cacheSnapshot) {
      this.logger.trace("Reading cache snapshot from disk", "");
      const deserializedCache = Deserializer.deserializeAllCache(this.overlayDefaults(JSON.parse(this.cacheSnapshot)));
      this.storage.setInMemoryCache(deserializedCache);
    } else {
      this.logger.trace("No cache snapshot to deserialize", "");
    }
  }
  getKVStore() {
    return this.storage.getCache();
  }
  getCacheSnapshot() {
    const deserializedPersistentStorage = NodeStorage.generateInMemoryCache(this.cacheSnapshot);
    return this.storage.inMemoryCacheToCache(deserializedPersistentStorage);
  }
  async getAllAccounts(correlationId = (new CryptoProvider).createNewGuid()) {
    let cacheContext;
    this.logger.trace("getAllAccounts called", correlationId);
    try {
      return this.persistence && (cacheContext = new TokenCacheContext(this, !1), await this.persistence.beforeCacheAccess(cacheContext)), 
      this.storage.getAllAccounts({}, correlationId);
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
  async removeAccount(account, correlationId) {
    let cacheContext;
    this.logger.trace("removeAccount called", correlationId || "");
    try {
      this.persistence && (cacheContext = new TokenCacheContext(this, !0), await this.persistence.beforeCacheAccess(cacheContext)), 
      this.storage.removeAccount(account, correlationId || (new GuidGenerator).generateGuid());
    } finally {
      this.persistence && cacheContext && await this.persistence.afterCacheAccess(cacheContext);
    }
  }
  async overwriteCache() {
    if (!this.persistence) {
      return void this.logger.info("No persistence layer specified, cache cannot be overwritten", "");
    }
    this.logger.info("Overwriting in-memory cache with persistent cache", ""), this.storage.clear();
    const cacheContext = new TokenCacheContext(this, !1);
    await this.persistence.beforeCacheAccess(cacheContext);
    const cacheSnapshot = this.getCacheSnapshot();
    this.storage.setCache(cacheSnapshot), await this.persistence.afterCacheAccess(cacheContext);
  }
  handleChangeEvent() {
    this.cacheHasChanged = !0;
  }
  mergeState(oldState, currentState) {
    this.logger.trace("Merging in-memory cache with cache snapshot", "");
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
    this.logger.trace("Remove updated entries in cache", "");
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
    return this.logger.trace("Overlaying input cache with the default cache", ""), {
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

var hasRequiredSafeBuffer, dataStream, hasRequiredDataStream, paramBytesForAlg_1, hasRequiredParamBytesForAlg, ecdsaSigFormatter, hasRequiredEcdsaSigFormatter, bufferEqualConstantTime, hasRequiredBufferEqualConstantTime, jwa, hasRequiredJwa, tostring, hasRequiredTostring, signStream, hasRequiredSignStream, verifyStream, hasRequiredVerifyStream, hasRequiredJws, decode, hasRequiredDecode, JsonWebTokenError_1, hasRequiredJsonWebTokenError, NotBeforeError_1, hasRequiredNotBeforeError, TokenExpiredError_1, hasRequiredTokenExpiredError, ms, hasRequiredMs, timespan, hasRequiredTimespan, jws = {}, safeBuffer = {
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
  var bufferEqual, Buffer = requireSafeBuffer().Buffer, crypto = crypto$1, formatEcdsa = requireEcdsaSigFormatter(), util = require$$5, MSG_INVALID_SECRET = "secret must be a string or buffer", MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer", supportsKeyObjects = "function" == typeof crypto.createPublicKey;
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
  supportsKeyObjects && (MSG_INVALID_VERIFIER_KEY += " or a KeyObject", MSG_INVALID_SECRET += "or a KeyObject");
  var timingSafeEqual = "timingSafeEqual" in crypto ? function(a, b) {
    return a.byteLength === b.byteLength && crypto.timingSafeEqual(a, b);
  } : function(a, b) {
    return bufferEqual || (bufferEqual = function() {
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
    }()), bufferEqual(a, b);
  };
  function createHmacVerifier(bits) {
    return function(thing, signature, secret) {
      var computedSig = createHmacSigner(bits)(thing, secret);
      return timingSafeEqual(Buffer.from(signature), Buffer.from(computedSig));
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
  return jwa = function(algorithm) {
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
    }, match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
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
    var secret = opts.secret;
    if (secret = null == (secret = null == secret ? opts.privateKey : secret) ? opts.key : secret, 
    !0 === /^hs/i.test(opts.header.alg) && null == secret) {
      throw new TypeError("secret must be a string or buffer or a KeyObject");
    }
    var secretStream = new DataStream(secret);
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
    var secretOrKey = (opts = opts || {}).secret;
    if (secretOrKey = null == (secretOrKey = null == secretOrKey ? opts.publicKey : secretOrKey) ? opts.key : secretOrKey, 
    !0 === /^hs/i.test(opts.algorithm) && null == secretOrKey) {
      throw new TypeError("secret must be a string or buffer or a KeyObject");
    }
    var secretStream = new DataStream(secretOrKey);
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
    return decode;
  }
  hasRequiredDecode = 1;
  var jws = requireJws();
  return decode = function(jwt, options) {
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
  }, decode;
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

var constants, hasRequiredConstants, debug_1, hasRequiredDebug, hasRequiredRe, parseOptions_1, hasRequiredParseOptions, identifiers, hasRequiredIdentifiers, semver$1, hasRequiredSemver$1, parse_1, hasRequiredParse, valid_1, hasRequiredValid$1, clean_1, hasRequiredClean, inc_1, hasRequiredInc, diff_1, hasRequiredDiff, major_1, hasRequiredMajor, minor_1, hasRequiredMinor, patch_1, hasRequiredPatch, prerelease_1, hasRequiredPrerelease, compare_1, hasRequiredCompare, rcompare_1, hasRequiredRcompare, compareLoose_1, hasRequiredCompareLoose, compareBuild_1, hasRequiredCompareBuild, sort_1, hasRequiredSort, rsort_1, hasRequiredRsort, gt_1, hasRequiredGt, lt_1, hasRequiredLt, eq_1, hasRequiredEq, neq_1, hasRequiredNeq, gte_1, hasRequiredGte, lte_1, hasRequiredLte, cmp_1, hasRequiredCmp, coerce_1, hasRequiredCoerce, truncate_1, hasRequiredTruncate, lrucache, hasRequiredLrucache, range, hasRequiredRange, comparator, hasRequiredComparator, satisfies_1, hasRequiredSatisfies, toComparators_1, hasRequiredToComparators, maxSatisfying_1, hasRequiredMaxSatisfying, minSatisfying_1, hasRequiredMinSatisfying, minVersion_1, hasRequiredMinVersion, valid, hasRequiredValid, outside_1, hasRequiredOutside, gtr_1, hasRequiredGtr, ltr_1, hasRequiredLtr, intersects_1, hasRequiredIntersects, simplify, hasRequiredSimplify, subset_1, hasRequiredSubset, semver, hasRequiredSemver, asymmetricKeyDetailsSupported, hasRequiredAsymmetricKeyDetailsSupported, rsaPssKeyDetailsSupported, hasRequiredRsaPssKeyDetailsSupported, validateAsymmetricKey, hasRequiredValidateAsymmetricKey, psSupported, hasRequiredPsSupported, verify, hasRequiredVerify, lodash_includes, hasRequiredLodash_includes, lodash_isboolean, hasRequiredLodash_isboolean, lodash_isinteger, hasRequiredLodash_isinteger, lodash_isnumber, hasRequiredLodash_isnumber, lodash_isplainobject, hasRequiredLodash_isplainobject, lodash_isstring, hasRequiredLodash_isstring, lodash_once, hasRequiredLodash_once, sign, hasRequiredSign, jsonwebtoken, hasRequiredJsonwebtoken, re = {
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
    if ("number" == typeof a && "number" == typeof b) {
      return a === b ? 0 : a < b ? -1 : 1;
    }
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
      return other instanceof SemVer || (other = new SemVer(other, this.options)), this.major < other.major ? -1 : this.major > other.major ? 1 : this.minor < other.minor ? -1 : this.minor > other.minor ? 1 : this.patch < other.patch ? -1 : this.patch > other.patch ? 1 : 0;
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
  }, parseComparator = (comp, options) => (comp = comp.replace(re[t.BUILD], ""), debug("comp", comp, options), 
  comp = replaceCarets(comp, options), debug("caret", comp), comp = replaceTildes(comp, options), 
  debug("tildes", comp), comp = replaceXRanges(comp, options), debug("xrange", comp), 
  comp = replaceStars(comp, options), debug("stars", comp), comp), isX = id => !id || "x" === id.toLowerCase() || "*" === id, replaceTildes = (comp, options) => comp.trim().split(/\s+/).map(c => replaceTilde(c, options)).join(" "), replaceTilde = (comp, options) => {
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
  }(), truncate = function() {
    if (hasRequiredTruncate) {
      return truncate_1;
    }
    hasRequiredTruncate = 1;
    const parse = requireParse(), constants = requireConstants(), SemVer = requireSemver$1(), cloneInputVersion = (version, options) => {
      const versionStringToParse = version instanceof SemVer ? version.version : version;
      return parse(versionStringToParse, options);
    }, doTruncation = (version, truncation) => {
      if (isPrerelease(truncation)) {
        return version.version;
      }
      switch (version.prerelease = [], truncation) {
       case "major":
        version.minor = 0, version.patch = 0;
        break;

       case "minor":
        version.patch = 0;
      }
      return version.format();
    }, isPrerelease = type => type.startsWith("pre");
    return truncate_1 = (version, truncation, options) => {
      if (!constants.RELEASE_TYPES.includes(truncation)) {
        return null;
      }
      const clonedVersion = cloneInputVersion(version, options);
      return clonedVersion && doTruncation(clonedVersion, truncation);
    }, truncate_1;
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
    truncate: truncate,
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

/*! @azure/msal-node v5.2.2 2026-05-19 */
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
      [thumbprintHeader]: EncodingUtils.base64EncodeUrl(this.thumbprint, EncodingTypes_HEX)
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
      certs.push(matches[1].replace(/\r*\n/g, ""));
    }
    return certs;
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ const name = "@azure/msal-node";

/*! @azure/msal-node v5.2.2 2026-05-19 */
class BaseClient {
  constructor(configuration) {
    this.config = buildClientConfiguration(configuration), this.logger = new Logger(this.config.loggerOptions, name, "5.2.2"), 
    this.cryptoUtils = this.config.cryptoInterface, this.cacheManager = this.config.storageInterface, 
    this.networkClient = this.config.networkInterface, this.serverTelemetryManager = this.config.serverTelemetryManager, 
    this.authority = this.config.authOptions.authority, this.performanceClient = new StubPerformanceClient;
  }
  createTokenRequestHeaders(ccsCred) {
    return createTokenRequestHeaders(this.logger, !1, ccsCred);
  }
  async executePostToTokenEndpoint(tokenEndpoint, queryString, headers, thumbprint, correlationId) {
    return executePostToTokenEndpoint(tokenEndpoint, queryString, headers, thumbprint, correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient, this.serverTelemetryManager);
  }
  async sendPostRequest(thumbprint, tokenEndpoint, options, correlationId) {
    return sendPostRequest(thumbprint, tokenEndpoint, options, correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient);
  }
  createTokenQueryParameters(request) {
    return createTokenQueryParameters(request, this.config.authOptions.clientId, this.config.authOptions.redirectUri, this.performanceClient);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class UsernamePasswordClient extends BaseClient {
  constructor(configuration) {
    super(configuration);
  }
  async acquireToken(request) {
    this.logger.info("in acquireToken call in username-password client", request.correlationId);
    const reqTimestamp = nowSeconds(), response = await this.executeTokenRequest(this.authority, request), responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin);
    responseHandler.validateTokenResponse(response.body, request.correlationId);
    return responseHandler.handleServerTokenResponse(response.body, this.authority, reqTimestamp, request, ApiId_acquireTokenByUsernamePassword);
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
    const parameters = new Map;
    addClientId(parameters, this.config.authOptions.clientId), function(parameters, username) {
      parameters.set(PasswordGrantConstants_username, username);
    }(parameters, request.username), function(parameters, password) {
      parameters.set(PasswordGrantConstants_password, password);
    }(parameters, request.password), addScopes(parameters, request.scopes), addResponseType(parameters, OAuthResponseType_IDTOKEN_TOKEN), 
    addGrantType(parameters, GrantType_RESOURCE_OWNER_PASSWORD_GRANT), addClientInfo(parameters), 
    addLibraryInfo(parameters, this.config.libraryInfo), addApplicationTelemetry(parameters, this.config.telemetry.application), 
    addThrottling(parameters), this.serverTelemetryManager && addServerTelemetry(parameters, this.serverTelemetryManager);
    addCorrelationId(parameters, request.correlationId || this.config.cryptoInterface.createNewGuid()), 
    this.config.clientCredentials.clientSecret && addClientSecret(parameters, this.config.clientCredentials.clientSecret);
    const clientAssertion = this.config.clientCredentials.clientAssertion;
    return clientAssertion && (addClientAssertion(parameters, await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri)), 
    addClientAssertionType(parameters, clientAssertion.assertionType)), (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) && addClaims(parameters, request.claims, this.config.authOptions.clientCapabilities), 
    this.config.systemOptions.preventCorsPreflight && request.username && addCcsUpn(parameters, request.username), 
    mapToQueryString(parameters);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ function getAuthCodeRequestUrl(config, authority, request, logger) {
  const parameters = getStandardAuthorizeRequestParameters({
    ...config.auth,
    authority: authority,
    redirectUri: request.redirectUri || ""
  }, request, logger);
  return addLibraryInfo(parameters, {
    sku: Constants_MSAL_SKU,
    version: "5.2.2",
    cpu: process.arch || "",
    os: process.platform || ""
  }), config.system.protocolMode !== ProtocolMode_OIDC && addApplicationTelemetry(parameters, config.telemetry.application), 
  addResponseType(parameters, OAuthResponseType_CODE), request.codeChallenge && request.codeChallengeMethod && function(parameters, codeChallenge, codeChallengeMethod) {
    if (!codeChallenge || !codeChallengeMethod) {
      throw createClientConfigurationError("pkce_params_missing");
    }
    parameters.set("code_challenge", codeChallenge), parameters.set("code_challenge_method", codeChallengeMethod);
  }(parameters, request.codeChallenge, request.codeChallengeMethod), addExtraParameters(parameters, request.extraQueryParameters || {}), 
  function(authority, requestParameters) {
    const queryString = mapToQueryString(requestParameters);
    return UrlString.appendQueryString(authority.authorizationEndpoint, queryString);
  }(authority, parameters);
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class ClientApplication {
  constructor(configuration) {
    this.config = function({auth: auth, broker: broker, cache: cache, system: system, telemetry: telemetry}) {
      const systemOptions = {
        ...DEFAULT_SYSTEM_OPTIONS,
        networkClient: new HttpClient,
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
    }(configuration), this.cryptoProvider = new CryptoProvider, this.logger = new Logger(this.config.system.loggerOptions, name, "5.2.2"), 
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
    this.logger.info("getAuthCodeUrl called", request.correlationId || "");
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      responseMode: request.responseMode || ResponseMode_QUERY,
      authenticationScheme: AuthenticationScheme.BEARER,
      state: request.state || "",
      nonce: request.nonce || ""
    }, discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions);
    return getAuthCodeRequestUrl(this.config, discoveredAuthority, validRequest, this.logger);
  }
  async acquireTokenByCode(request, authCodePayLoad) {
    this.logger.info("acquireTokenByCode called", request.correlationId || ""), request.state && authCodePayLoad && (this.logger.info("acquireTokenByCode - validating state", request.correlationId || ""), 
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
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions), authClientConfig = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, validRequest.redirectUri, serverTelemetryManager), authorizationCodeClient = new AuthorizationCodeClient(authClientConfig, new StubPerformanceClient);
      return this.logger.verbose("Auth code client created", validRequest.correlationId), 
      await authorizationCodeClient.acquireToken(validRequest, ApiId_acquireTokenByCode, authCodePayLoad);
    } catch (e) {
      throw e instanceof AuthError && e.setCorrelationId(validRequest.correlationId), 
      serverTelemetryManager.cacheFailedRequest(e), e;
    }
  }
  async acquireTokenByRefreshToken(request) {
    this.logger.info("acquireTokenByRefreshToken called", request.correlationId || "");
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request),
      authenticationScheme: AuthenticationScheme.BEARER
    }, serverTelemetryManager = this.initializeServerTelemetryManager(ApiId_acquireTokenByRefreshToken, validRequest.correlationId);
    try {
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions), refreshTokenClientConfig = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, validRequest.redirectUri || "", serverTelemetryManager), refreshTokenClient = new RefreshTokenClient(refreshTokenClientConfig, new StubPerformanceClient);
      return this.logger.verbose("Refresh token client created", validRequest.correlationId), 
      await refreshTokenClient.acquireToken(validRequest, ApiId_acquireTokenByRefreshToken);
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
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions), clientConfiguration = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, validRequest.redirectUri || "", serverTelemetryManager), silentFlowClient = new SilentFlowClient(clientConfiguration, new StubPerformanceClient);
      this.logger.verbose("Silent flow client created", validRequest.correlationId);
      try {
        return await this.tokenCache.overwriteCache(), await this.acquireCachedTokenSilent(validRequest, silentFlowClient, clientConfiguration);
      } catch (error) {
        if (error instanceof ClientAuthError && "token_refresh_required" === error.errorCode) {
          return new RefreshTokenClient(clientConfiguration, new StubPerformanceClient).acquireTokenByRefreshToken(validRequest, ApiId_acquireTokenSilent);
        }
        throw error;
      }
    } catch (error) {
      throw error instanceof AuthError && error.setCorrelationId(validRequest.correlationId), 
      serverTelemetryManager.cacheFailedRequest(error), error;
    }
  }
  async acquireCachedTokenSilent(validRequest, silentFlowClient, clientConfiguration) {
    const [authResponse, cacheOutcome] = await silentFlowClient.acquireCachedToken({
      ...validRequest,
      scopes: validRequest.scopes?.length ? validRequest.scopes : [ ...OIDC_DEFAULT_SCOPES ]
    });
    if (cacheOutcome === CacheOutcome_PROACTIVELY_REFRESHED) {
      this.logger.info("ClientApplication:acquireCachedTokenSilent - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed.", validRequest.correlationId);
      const refreshTokenClient = new RefreshTokenClient(clientConfiguration, new StubPerformanceClient);
      try {
        await refreshTokenClient.acquireTokenByRefreshToken(validRequest, ApiId_acquireTokenSilent);
      } catch {}
    }
    return authResponse;
  }
  async acquireTokenByUsernamePassword(request) {
    this.logger.info("acquireTokenByUsernamePassword called", request.correlationId || "");
    const validRequest = {
      ...request,
      ...await this.initializeBaseRequest(request)
    }, serverTelemetryManager = this.initializeServerTelemetryManager(ApiId_acquireTokenByUsernamePassword, validRequest.correlationId);
    try {
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions), usernamePasswordClientConfig = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, "", serverTelemetryManager), usernamePasswordClient = new UsernamePasswordClient(usernamePasswordClientConfig);
      return this.logger.verbose("Username password client created", validRequest.correlationId), 
      await usernamePasswordClient.acquireToken(validRequest);
    } catch (e) {
      throw e instanceof AuthError && e.setCorrelationId(validRequest.correlationId), 
      serverTelemetryManager.cacheFailedRequest(e), e;
    }
  }
  getTokenCache() {
    return this.logger.info("getTokenCache called", ""), this.tokenCache;
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
  async buildOauthClientConfiguration(discoveredAuthority, requestCorrelationId, redirectUri, serverTelemetryManager) {
    this.logger.verbose("buildOauthClientConfiguration called", requestCorrelationId), 
    this.logger.info(`Building oauth client configuration with the following authority: ${discoveredAuthority.tokenEndpoint}.`, requestCorrelationId), 
    serverTelemetryManager?.updateRegionDiscoveryMetadata(discoveredAuthority.regionDiscoveryMetadata);
    return {
      authOptions: {
        clientId: this.config.auth.clientId,
        authority: discoveredAuthority,
        clientCapabilities: this.config.auth.clientCapabilities,
        redirectUri: redirectUri,
        isMcp: this.config.auth.isMcp
      },
      loggerOptions: {
        logLevel: this.config.system.loggerOptions.logLevel,
        loggerCallback: this.config.system.loggerOptions.loggerCallback,
        piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled,
        correlationId: requestCorrelationId
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
        sku: Constants_MSAL_SKU,
        version: "5.2.2",
        cpu: process.arch || "",
        os: process.platform || ""
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
      assertionType: Constants_JWT_BEARER_ASSERTION_TYPE
    };
  }
  async initializeBaseRequest(authRequest) {
    const correlationId = authRequest.correlationId || this.cryptoProvider.createNewGuid();
    return this.logger.verbose("initializeRequestScopes called", correlationId), authRequest.authenticationScheme && authRequest.authenticationScheme === AuthenticationScheme.POP && this.logger.verbose("Authentication Scheme 'pop' is not supported yet, setting Authentication Scheme to 'Bearer' for request", correlationId), 
    authRequest.authenticationScheme = AuthenticationScheme.BEARER, {
      ...authRequest,
      scopes: [ ...authRequest && authRequest.scopes || [], ...OIDC_DEFAULT_SCOPES ],
      correlationId: correlationId,
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
    const authorityUrl = Authority.generateAuthority(authorityString, azureCloudOptions || this.config.auth.azureCloudOptions), authorityOptions = {
      protocolMode: this.config.system.protocolMode,
      knownAuthorities: this.config.auth.knownAuthorities,
      cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
      authorityMetadata: this.config.auth.authorityMetadata,
      azureRegionConfiguration: azureRegionConfiguration
    };
    return createDiscoveredInstance(authorityUrl, this.config.system.networkClient, this.storage, authorityOptions, this.logger, requestCorrelationId, new StubPerformanceClient);
  }
  clearCache() {
    this.storage.clear();
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class LoopbackClient {
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
        if ("/" === url) {
          return void res.end(successTemplate || "Auth code was successfully acquired. You can close this window now.");
        }
        const redirectUri = this.getRedirectUri(), authCodeResponse = function(responseString) {
          if (!responseString || responseString.indexOf("=") < 0) {
            return null;
          }
          try {
            const normalizedResponse = function(responseString) {
              return responseString.startsWith("#/") ? responseString.substring(2) : responseString.startsWith("#") || responseString.startsWith("?") ? responseString.substring(1) : responseString;
            }(responseString), deserializedHash = Object.fromEntries(new URLSearchParams(normalizedResponse));
            if (deserializedHash.code || deserializedHash.ear_jwe || deserializedHash.error || deserializedHash.error_description || deserializedHash.state) {
              return deserializedHash;
            }
          } catch (e) {
            throw createClientAuthError("hash_not_deserialized");
          }
          return null;
        }(new URL(url, redirectUri).search) || {};
        authCodeResponse.code && (res.writeHead(302, {
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
    return `${Constants_HTTP_PROTOCOL}${Constants_LOCALHOST}:${port}`;
  }
  closeServer() {
    this.server && (this.server.close(), "function" == typeof this.server.closeAllConnections && this.server.closeAllConnections(), 
    this.server.unref(), this.server = void 0);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class DeviceCodeClient extends BaseClient {
  constructor(configuration) {
    super(configuration);
  }
  async acquireToken(request) {
    const deviceCodeResponse = await this.getDeviceCode(request);
    request.deviceCodeCallback(deviceCodeResponse);
    const reqTimestamp = nowSeconds(), response = await this.acquireTokenWithDeviceCode(request, deviceCodeResponse), responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin);
    return responseHandler.validateTokenResponse(response, request.correlationId), responseHandler.handleServerTokenResponse(response, this.authority, reqTimestamp, request, ApiId_acquireTokenByDeviceCode);
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
    const parameters = new Map;
    return request.extraQueryParameters && addExtraParameters(parameters, request.extraQueryParameters), 
    mapToQueryString(parameters);
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
    const parameters = new Map;
    return addScopes(parameters, request.scopes), addClientId(parameters, this.config.authOptions.clientId), 
    request.extraQueryParameters && addExtraParameters(parameters, request.extraQueryParameters), 
    (request.claims || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) && addClaims(parameters, request.claims, this.config.authOptions.clientCapabilities), 
    mapToQueryString(parameters);
  }
  continuePolling(deviceCodeExpirationTime, userSpecifiedTimeout, userSpecifiedCancelFlag) {
    if (userSpecifiedCancelFlag) {
      throw this.logger.error("Token request cancelled by setting DeviceCodeRequest.cancel = true", ""), 
      createClientAuthError("device_code_polling_cancelled");
    }
    if (userSpecifiedTimeout && userSpecifiedTimeout < deviceCodeExpirationTime && nowSeconds() > userSpecifiedTimeout) {
      throw this.logger.error(`User defined timeout for device code polling reached. The timeout was set for ${userSpecifiedTimeout}`, ""), 
      createClientAuthError("user_timeout_reached");
    }
    if (nowSeconds() > deviceCodeExpirationTime) {
      throw userSpecifiedTimeout && this.logger.verbose(`User specified timeout ignored as the device code has expired before the timeout elapsed. The user specified timeout was set for ${userSpecifiedTimeout}`, ""), 
      this.logger.error(`Device code expired. Expiration time of device code was ${deviceCodeExpirationTime}`, ""), 
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
        return this.logger.verbose("Authorization completed successfully. Polling stopped.", request.correlationId), 
        response.body;
      }
      if ("authorization_pending" !== response.body.error) {
        throw this.logger.info("Unexpected error in polling from the server", request.correlationId), 
        createAuthError("post_request_failed", response.body.error);
      }
      this.logger.info("Authorization pending. Continue polling.", request.correlationId), 
      await delay(pollingIntervalMilli);
    }
    throw this.logger.error("Polling stopped for unknown reasons.", request.correlationId), 
    createClientAuthError("device_code_unknown_error");
  }
  createTokenRequestBody(request, deviceCodeResponse) {
    const parameters = new Map;
    addScopes(parameters, request.scopes), addClientId(parameters, this.config.authOptions.clientId), 
    addGrantType(parameters, GrantType_DEVICE_CODE_GRANT), function(parameters, code) {
      parameters.set("device_code", code);
    }(parameters, deviceCodeResponse.deviceCode);
    return addCorrelationId(parameters, request.correlationId || this.config.cryptoInterface.createNewGuid()), 
    addClientInfo(parameters), addLibraryInfo(parameters, this.config.libraryInfo), 
    addApplicationTelemetry(parameters, this.config.telemetry.application), addThrottling(parameters), 
    this.serverTelemetryManager && addServerTelemetry(parameters, this.serverTelemetryManager), 
    (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) && addClaims(parameters, request.claims, this.config.authOptions.clientCapabilities), 
    mapToQueryString(parameters);
  }
}

/*! @azure/msal-node v5.2.2 2026-05-19 */ class PublicClientApplication extends ClientApplication {
  constructor(configuration) {
    super(configuration), this.config.broker.nativeBrokerPlugin && (this.config.broker.nativeBrokerPlugin.isBrokerAvailable ? (this.nativeBrokerPlugin = this.config.broker.nativeBrokerPlugin, 
    this.nativeBrokerPlugin.setLogger(this.config.system.loggerOptions)) : this.logger.warning("NativeBroker implementation was provided but the broker is unavailable.", "")), 
    this.skus = ServerTelemetryManager.makeExtraSkuString({
      libraryName: Constants_MSAL_SKU,
      libraryVersion: "5.2.2"
    });
  }
  async acquireTokenByDeviceCode(request) {
    this.logger.info("acquireTokenByDeviceCode called", request.correlationId || ""), 
    enforceResourceParameter(this.config.auth.isMcp, request);
    const validRequest = Object.assign(request, await this.initializeBaseRequest(request)), serverTelemetryManager = this.initializeServerTelemetryManager(ApiId_acquireTokenByDeviceCode, validRequest.correlationId);
    try {
      const discoveredAuthority = await this.createAuthority(validRequest.authority, validRequest.correlationId, void 0, request.azureCloudOptions), deviceCodeConfig = await this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, "", serverTelemetryManager), deviceCodeClient = new DeviceCodeClient(deviceCodeConfig);
      return this.logger.verbose("Device code client created", validRequest.correlationId), 
      await deviceCodeClient.acquireToken(validRequest);
    } catch (e) {
      throw e instanceof AuthError && e.setCorrelationId(validRequest.correlationId), 
      serverTelemetryManager.cacheFailedRequest(e), e;
    }
  }
  async acquireTokenInteractive(request) {
    const correlationId = request.correlationId || this.cryptoProvider.createNewGuid();
    this.logger.trace("acquireTokenInteractive called", correlationId), enforceResourceParameter(this.config.auth.isMcp, request);
    const {openBrowser: openBrowser, successTemplate: successTemplate, errorTemplate: errorTemplate, windowHandle: windowHandle, loopbackClient: customLoopbackClient, ...remainingProperties} = request;
    if (this.nativeBrokerPlugin) {
      const brokerRequest = {
        ...remainingProperties,
        clientId: this.config.auth.clientId,
        scopes: request.scopes || OIDC_DEFAULT_SCOPES,
        redirectUri: request.redirectUri || "",
        authority: request.authority || this.config.auth.authority,
        correlationId: correlationId,
        extraParameters: {
          ...remainingProperties.extraQueryParameters,
          ...remainingProperties.extraParameters,
          [X_CLIENT_EXTRA_SKU]: this.skus
        },
        accountId: remainingProperties.account?.nativeAccountId
      };
      return this.nativeBrokerPlugin.acquireTokenInteractive(brokerRequest, windowHandle);
    }
    if (request.redirectUri) {
      if (!this.config.broker.nativeBrokerPlugin) {
        throw NodeAuthError.createRedirectUriNotSupportedError();
      }
      request.redirectUri = "";
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
        responseMode: ResponseMode_QUERY,
        codeChallenge: challenge,
        codeChallengeMethod: CodeChallengeMethodValues_S256
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
        clientInfo: clientInfo || "",
        ...validRequest
      };
      return await this.acquireTokenByCode(tokenRequest);
    } finally {
      loopbackClient.closeServer();
    }
  }
  async acquireTokenSilent(request) {
    const correlationId = request.correlationId || this.cryptoProvider.createNewGuid();
    if (this.logger.trace("acquireTokenSilent called", correlationId), enforceResourceParameter(this.config.auth.isMcp, request), 
    this.nativeBrokerPlugin) {
      const brokerRequest = {
        ...request,
        clientId: this.config.auth.clientId,
        scopes: request.scopes || OIDC_DEFAULT_SCOPES,
        redirectUri: request.redirectUri || "",
        authority: request.authority || this.config.auth.authority,
        correlationId: correlationId,
        extraParameters: {
          ...request.extraQueryParameters,
          ...request.extraParameters,
          [X_CLIENT_EXTRA_SKU]: this.skus
        },
        accountId: request.account.nativeAccountId,
        forceRefresh: request.forceRefresh || !1
      };
      return this.nativeBrokerPlugin.acquireTokenSilent(brokerRequest);
    }
    if (request.redirectUri) {
      if (!this.config.broker.nativeBrokerPlugin) {
        throw NodeAuthError.createRedirectUriNotSupportedError();
      }
      request.redirectUri = "";
    }
    return super.acquireTokenSilent(request);
  }
  async acquireTokenByCode(request, authCodePayLoad) {
    return enforceResourceParameter(this.config.auth.isMcp, request), super.acquireTokenByCode(request, authCodePayLoad);
  }
  async acquireTokenByRefreshToken(request) {
    return enforceResourceParameter(this.config.auth.isMcp, request), super.acquireTokenByRefreshToken(request);
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
    await this.getTokenCache().removeAccount(request.account, request.correlationId);
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

/*! @azure/msal-node v5.2.2 2026-05-19 */ process.env.ProgramData, process.env.ProgramFiles;

const error_to_string = error => {
  const logMessage = [];
  return error?.response ? logMessage.push("response.data:", JSON.stringify(error?.response?.data), "response.status:", JSON.stringify(error?.response?.status), "headers:", JSON.stringify(error?.response?.headers)) : error?.request ? logMessage.push("request:", JSON.stringify(error?.request)) : (logMessage.push(error?.message ?? "Unknown error"), 
  logMessage.push("stack:", error?.stack ?? "")), error?.config && logMessage.push("config:", JSON.stringify(error?.config)), 
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
  async getToken(request, deviceCodeCallback = null) {
    let authResponse = null;
    const account = this.account || await this.getAccount();
    if (account) {
      const tokenRequest = {
        ...request,
        account: account
      };
      authResponse = await this.getTokenSilent(tokenRequest);
    }
    if (!authResponse) {
      this.logWarn("Failed to call getTokenSilent");
      try {
        authResponse = await this.getTokenDeviceCode(request, deviceCodeCallback);
      } catch (error) {
        throw this.logError("Failed to getTokenDeviceCode. ", error), error;
      }
    }
    return authResponse && authResponse.account ? (this.account = authResponse.account, 
    this.logInfo("getToken done")) : this.logError("Failed to acquire token, no authResponse returned."), 
    authResponse;
  }
  async getTokenSilent(tokenRequest, maxRetries = 3) {
    let attempt = 0;
    for (;attempt < maxRetries; ) {
      try {
        return await this.clientApplication.acquireTokenSilent({
          ...tokenRequest
        });
      } catch (error) {
        this.logError(error), error instanceof InteractionRequiredAuthError && this.logError("Silent token acquisition failed"), 
        error instanceof ServerError && "invalid_grant" === error.errorCode && this.logError("Silent token acquisition failed"), 
        error instanceof ClientAuthError && "network_error" === error.errorCode && (this.logWarn("Network error occurred, waiting 60 seconds before retrying..."), 
        await sleep(6e4)), attempt++, this.logWarn(`getTokenSilent failed, attempt ${attempt}/${maxRetries}.`), 
        await sleep(2e3);
      }
    }
    return null;
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
    return authResponse?.account && (this.account = authResponse.account), this.logInfo("getTokenDeviceCode done"), 
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

const internetStatusListener = new node_events.EventEmitter, isOnline = async (timeout = 25e3) => {
  const testUrls = [ "http://connectivity-check.ubuntu.com/", "https://captive.apple.com/", "http://connectivitycheck.android.com/generate_204", "http://detectportal.firefox.com" ], controller = new AbortController, signal = controller.signal, timer = setTimeout(() => controller.abort(), timeout);
  try {
    const attempts = testUrls.map(url => fetch(url, {
      method: "GET",
      signal: signal
    }).then(response => !!response.ok || Promise.reject(new Error(`status ${response.status}`)), () => Promise.reject(new Error("offline"))));
    return await Promise.any(attempts), !0;
  } catch {
    return checkInternetIsBack(), !1;
  } finally {
    clearTimeout(timer);
  }
}, checkInternetIsBack = async () => {
  await isOnline() ? internetStatusListener.emit("online") : setTimeout(checkInternetIsBack, 3e4);
}, generateNewExpirationDate = () => new Date(Date.now() + 33e5).toISOString();

class OneDrivePhotos extends node_events.EventEmitter {
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
                  console.debug("[MMM-OneDrive] [AuthProvider cachePlugin] Cache file found, loading cache.");
                  const data = await fs.promises.readFile(CACHE_LOCATION, "utf-8");
                  cacheContext.tokenCache.deserialize(data);
                } else {
                  console.info("[MMM-OneDrive] [AuthProvider cachePlugin] Cache file not found, creating new cache file."), 
                  await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
                }
              } catch {
                console.warn("[MMM-OneDrive] [AuthProvider cachePlugin] Error reading cache file, creating new cache file."), 
                await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize());
              }
            },
            afterCacheAccess: async cacheContext => {
              cacheContext.cacheHasChanged && (console.info("[MMM-OneDrive] [AuthProvider cachePlugin] Cache file has changed, updating cache file."), 
              await fs.promises.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize()));
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
  async createGraphClient() {
    let attempt = 0;
    for (;attempt < 3; ) {
      const tokenRequest = {
        scopes: protectedResources.graphMe.scopes,
        correlationId: crypto.randomUUID()
      };
      try {
        const tokenResponse = await this.getAuthProvider().getToken(tokenRequest, r => this.deviceCodeCallback(r));
        if (!tokenResponse?.accessToken) {
          throw new Error("No access token returned from AuthProvider");
        }
        return Client.init({
          authProvider: done => {
            done(null, tokenResponse.accessToken);
          }
        });
      } catch (err) {
        this.logError("onAuthReady error", err);
        const errorCode = err.code ?? err.errorCode ?? "";
        if (![ "UnknownError", "TypeError", "InvalidAuthenticationToken", "device_code_expired" ].includes(errorCode)) {
          throw this.logError("Not retrying onAuthReady due to unknown error"), err;
        }
        this.logWarn(`Retrying onAuthReady, retry count: ${attempt}`), attempt++, await sleep(2e3), 
        this.logWarn("Retrying onAuthReady");
      }
    }
    throw this.logError("Failed to wait onAuthReady after 3 attempts."), new Error("Failed to wait onAuthReady after 3 attempts.");
  }
  async ensureGraphClient() {
    if (this.#userId) {
      return;
    }
    const graphClient = await this.createGraphClient(), graphResponse = await graphClient.api(protectedResources.graphMe.endpoint).get();
    if (!graphResponse?.id) {
      throw new Error("No user id returned from Graph API /me endpoint");
    }
    this.#userId = graphResponse.id;
  }
  async request(logContext, url, method = "get", data = null) {
    this.logDebug((logContext ? `[${logContext}]` : "") + ` request ${method} URL: ${url}`);
    const graphClient = await this.createGraphClient();
    try {
      return await graphClient.api(url)[method](data);
    } catch (error) {
      throw this.logError((logContext ? `[${logContext}]` : "") + ` request fail ${method} URL: ${url}`), 
      this.logError((logContext ? `[${logContext}]` : "") + " data: ", JSON.stringify(data)), 
      this.logError(error_to_string(error)), error;
    }
  }
  async getAlbums() {
    if (!await isOnline()) {
      return this.logError("Device is offline, skip getAlbums"), [];
    }
    return await this.getAlbumLoop();
  }
  async getAlbumLoop() {
    await this.ensureGraphClient();
    const url = protectedResources.listAllAlbums.endpoint.replace("$$userId$$", this.#userId);
    let list = [], found = 0;
    const getAlbum = async pageUrl => {
      this.log("Getting Album info chunks.");
      try {
        const response = await this.request("getAlbum", pageUrl, "get", null);
        if (Array.isArray(response.value)) {
          const arrayValue = response.value;
          this.logDebug("found album:"), this.logDebug("name\t\tid"), arrayValue.map(album => `${album.name}\t${album.id}`).forEach(line => this.logDebug(line)), 
          found += arrayValue.length, list = list.concat(arrayValue);
        }
        return response["@odata.nextLink"] ? (await sleep(500), await getAlbum(response["@odata.nextLink"])) : (this.logDebug("founded albums: ", found), 
        list);
      } catch (err) {
        throw this.logError(`Error in getAlbum() ${String(err)}`), this.logError(String(err)), 
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
        const thumbnail = response2.value[0], imageUrl = thumbnail.mediumSquare?.url || thumbnail.medium?.url;
        return this.logDebug("thumbnail found: ", album.bundle.album.coverImageItemId, thumbnail.mediumSquare ? "mediumSquare" : thumbnail.medium ? "medium" : "<null>"), 
        imageUrl;
      }
    } catch (err) {
      return this.logError("Error in getAlbumThumbnail(), ignore", err), null;
    }
  }
  async getImageFromAlbum(albumId, isValid = null, maxNum = 99999) {
    const url = protectedResources.getChildrenInAlbum.endpoint.replace("$$userId$$", this.#userId).replace("$$albumId$$", albumId);
    this.log("Indexing photos. album:", albumId);
    return await (async startUrl => {
      let pageUrl = startUrl, done = !1;
      const list = [];
      let loopCycle = 0;
      for (;!done; ) {
        this.log(`getImages loop cycle: ${loopCycle}`);
        const startTime = Date.now();
        try {
          const response = await this.request("getImages", pageUrl, "get");
          if (!Array.isArray(response.value)) {
            return this.logWarn(albumId, albumId), done = !0, list;
          }
          {
            const childrenItems = response.value;
            this.log(`Parsing ${childrenItems.length} items in ${albumId}`);
            let validCount = 0;
            for (const item of childrenItems) {
              if (!item["@microsoft.graph.downloadUrl"]) {
                this.logWarn(`Item ${item.id} in album ${albumId} does not have downloadUrl, skipped`);
                continue;
              }
              const itemVal = {
                id: item.id,
                _albumId: albumId,
                mimeType: item.file?.mimeType || "",
                baseUrl: item["@microsoft.graph.downloadUrl"],
                baseUrlExpireDateTime: generateNewExpirationDate(),
                filename: item.name,
                mediaMetadata: {
                  dateTimeOriginal: item.photo?.takenDateTime || item.fileSystemInfo?.createdDateTime || item.fileSystemInfo?.lastModifiedDateTime || null
                },
                parentReference: item.parentReference ? {
                  driveId: item.parentReference.driveId || null,
                  driveType: item.parentReference.driveType || null,
                  id: item.parentReference.id || null,
                  name: item.parentReference.name || null,
                  path: item.parentReference.path || null
                } : null
              };
              list.length < maxNum && (item.image && (itemVal.mediaMetadata.width = item.image.width, 
              itemVal.mediaMetadata.height = item.image.height), item.photo && (itemVal.mediaMetadata.photo = {
                cameraMake: item.photo.cameraMake,
                cameraModel: item.photo.cameraModel,
                focalLength: item.photo.focalLength,
                apertureFNumber: item.photo.fNumber,
                isoEquivalent: item.photo.iso,
                exposureTime: item.photo.exposureNumerator && item.photo.exposureDenominator && 0 !== item.photo.exposureDenominator ? (1 * item.photo.exposureNumerator / item.photo.exposureDenominator).toFixed(2) + "s" : null
              }), isValid ? isValid(itemVal) && (list.push(itemVal), validCount++) : (list.push(itemVal), 
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
          throw this.logError(".getImageFromAlbum()", String(err)), this.logError(err), err;
        }
      }
      return list;
    })(url);
  }
  async refreshItem(item) {
    if (!await isOnline()) {
      return this.logError("Device is offline, skip refreshItem for ", item.id, item.filename), 
      null;
    }
    this.log("received: ", item.id, " to refresh");
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
