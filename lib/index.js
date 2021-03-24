"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "getRequest", {
  enumerable: true,
  get: function () {
    return _helpers.getRequest;
  }
});
Object.defineProperty(exports, "getReply", {
  enumerable: true,
  get: function () {
    return _helpers.getReply;
  }
});
Object.defineProperty(exports, "getDOMHandler", {
  enumerable: true,
  get: function () {
    return _helpers.getDOMHandler;
  }
});
Object.defineProperty(exports, "setCookie", {
  enumerable: true,
  get: function () {
    return _helpers.setCookie;
  }
});
Object.defineProperty(exports, "getCookies", {
  enumerable: true,
  get: function () {
    return _helpers.getCookies;
  }
});
Object.defineProperty(exports, "lazy", {
  enumerable: true,
  get: function () {
    return _lazy.default;
  }
});
Object.defineProperty(exports, "getLazyCallbacks", {
  enumerable: true,
  get: function () {
    return _lazy.getLazyCallbacks;
  }
});
Object.defineProperty(exports, "resetLazyCallbacks", {
  enumerable: true,
  get: function () {
    return _lazy.resetLazyCallbacks;
  }
});
Object.defineProperty(exports, "lazyCapture", {
  enumerable: true,
  get: function () {
    return _lazy.lazyCapture;
  }
});
exports.default = void 0;

var _app = _interopRequireDefault(require("./app"));

var _helpers = require("./helpers");

var _lazy = _interopRequireWildcard(require("./lazy"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = _app.default;
exports.default = _default;