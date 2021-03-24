"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRequest = getRequest;
exports.getReply = getReply;
exports.getDOMHandler = getDOMHandler;
exports.setCookie = setCookie;
exports.getCookies = getCookies;

var _reactDom = _interopRequireDefault(require("react-dom"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function getCookies() {
  return document.cookie.split('; ').reduce((prev, current) => {
    const [name, value] = current.split('=');
    prev[name] = value;
    return prev;
  }, {});
}

function setCookie(name, value, options) {
  let cookie = name + '=' + value;
  options = options || {};

  if (options.expires) {
    cookie += ';expires=' + new Date(options.expires).toUTCString();
  }

  if (options.domain) {
    cookie += ';domain=' + options.domain;
  }

  cookie += ';path=' + options.path || '/';
  document.cookie = cookie;
}

function getRequest(additional) {
  additional = additional || {};
  const location = document.location;
  return _objectSpread({
    url: location.pathname,
    query: new URLSearchParams(location.search),
    search: location.search,
    host: location.host,
    hostname: location.hostname,
    protocol: location.protocol,
    origin: `${location.protocol}//${location.host}`,
    is_server: false,
    cookies: getCookies()
  }, additional);
}

function getReply(domHandler) {
  const reply = {
    status: code => {
      reply.status = code;
    },
    redirect: url => {
      reply.status = 302;
      reply.redirect_url = url;
    },
    setCookie,
    html: (domHandler || {}).html
  };
  return reply;
}

function getDOMHandler(dom_operations) {
  dom_operations = dom_operations || [];
  return {
    html: {
      insertBefore(selector, htmlStringOrComponent, limiter) {
        const operation = {
          type: 'insert-before',
          selector,
          limiter
        };

        if (typeof htmlStringOrComponent === 'string') {
          operation.html = htmlStringOrComponent;
        } else {
          operation.component = htmlStringOrComponent;
        }

        dom_operations.push(operation);
      },

      insertAfter(selector, htmlStringOrComponent, limiter) {
        const operation = {
          type: 'insert-after',
          selector,
          limiter
        };

        if (typeof htmlStringOrComponent === 'string') {
          operation.html = htmlStringOrComponent;
        } else {
          operation.component = htmlStringOrComponent;
        }

        dom_operations.push(operation);
      },

      append(selector, htmlStringOrComponent, limiter) {
        const operation = {
          type: 'append',
          selector,
          limiter
        };

        if (typeof htmlStringOrComponent === 'string') {
          operation.html = htmlStringOrComponent;
        } else {
          operation.component = htmlStringOrComponent;
        }

        dom_operations.push(operation);
      },

      setAttribute(selector, attribute_name, value, limiter) {
        dom_operations.push({
          type: 'set-attributes',
          selector,
          attributes: {
            [attribute_name]: value
          },
          limiter
        });
      },

      setAttributes(selector, attributes, limiter) {
        dom_operations.push({
          type: 'set-attributes',
          selector,
          attributes,
          limiter
        });
      },

      removeAttribute(selector, attribute_name, limiter) {
        dom_operations.push({
          type: 'remove-attributes',
          selector,
          attributes: [attribute_name],
          limiter
        });
      },

      removeAttributes(selector, attributes, limiter) {
        dom_operations.push({
          type: 'remove-attributes',
          selector,
          attributes,
          limiter
        });
      },

      remove(selector, limiter) {
        dom_operations.push({
          type: 'remove',
          selector,
          limiter
        });
      }

    },
    execute: async () => {
      try {
        for (let i = 0; i < dom_operations.length; i++) {
          const operation = dom_operations[i];
          let targets = Array.prototype.slice.apply(document.querySelectorAll(operation.selector));

          if (operation.limiter) {
            switch (operation.limiter) {
              case 'first':
                targets = [targets[0]].filter(el => el);
                break;

              case 'last':
                targets = [targets[targets.length - 1]].filter(el => el);
                break;

              default:
                console.error('Invalid dom manipulation, limiter need to be first or last', {
                  invalidLimiter: operation.limiter
                });
                break;
            }
          }

          let element = null;

          if (operation.html) {
            const container = document.createElement('div');
            container.innerHTML = operation.html;
            element = container.children[0];
          } else if (operation.component) {
            const Component = operation.component;
            const container = document.createElement('div');
            element = await new Promise(resolve => {
              _reactDom.default.render( /*#__PURE__*/React.createElement(Component, null), container, () => {
                resolve(container.children[0]);
              });
            });
          }

          targets.forEach(target => {
            switch (operation.type) {
              case 'remove':
                if (!target) return;
                target.remove();
                break;

              case 'remove-attributes':
                if (!target) return;

                if (operation.attributes instanceof Array) {
                  operation.attributes.forEach(attribute => {
                    target.removeAttribute(attribute);
                  });
                } else if (typeof operation.attributes === 'string') {
                  target.removeAttribute(operation.attributes);
                } else {
                  console.error('Invalid parameters in', 'reply.removeAttribute(string, string|Array)');
                }

                break;

              case 'set-attributes':
                if (!target) return;

                if (typeof operation.attributes === 'object') {
                  for (let i in operation.attributes) {
                    target.setAttribute(i, operation.attributes[i] + "");
                  }
                } else {
                  console.error('Invalid parameters in', 'reply.setAttribute(string, object)');
                }

                break;

              case 'append':
                if (!element || !target) return;
                target.append(element);
                break;

              case 'insert-before':
                if (!element || !target) return;
                target.parentNode.insertBefore(element, target);
                break;

              case 'insert-after':
                if (!element || !target) return;
                target.parentNode.insertBefore(element, target.nextSibling);
                break;

              default:
                break;
            }
          });
        }
      } catch (ex) {
        console.error('Fail to execute DOM operation in SSR', ex);
      }
    }
  };
}