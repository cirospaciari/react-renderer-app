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
exports.default = void 0;

var _app = _interopRequireDefault(require("./app"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = _app.default;
exports.default = _default;