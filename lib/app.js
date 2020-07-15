"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _reactRouterDom = require("react-router-dom");

var _routeWrapper = _interopRequireDefault(require("./routeWrapper"));

var _helpers = require("./helpers");

var _reactDom = _interopRequireDefault(require("react-dom"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class App extends _react.Component {
  constructor(props, context) {
    super(props, context);
    this.getRequest = this.getRequest.bind(this);

    if (typeof window === 'undefined') {
      this.state = {
        is_fetching: false,
        model: this.props.model,
        is_server: true,
        request: this.props.request,
        error500: !!this.props.error500,
        entry_state: this.props.entry_state,
        entry: this.props.entry
      };
    } else {
      this.state = window.__PRELOADED_STATE__ || {
        is_fetching: false,
        model: null,
        is_server: false,
        request: null,
        error500: false
      };
      delete window.__PRELOADED_STATE__;
    }

    this.state.context = this.props.context || {};
    this.state.entry_state = this.state.entry_state || {
      is_fetching: true,
      model: null
    };
    this.state.entry_state.promise = new Promise(resolve => resolve(this.state.entry_state.model));
    this.state.routes = [];

    if (typeof this.props.routes === "function") {
      const router = {
        entry: entry => {
          this.state.entry = entry;

          if (this.state.entry_state.is_fetching) {
            if (this.is_server) {
              //server side dont fetch data here
              this.state.entry_state.is_fetching = false;
            } else {
              //tells client side do fetch data
              const {
                fetch,
                request,
                executeDOMOperations
              } = this.getRequest();
              this.state.entry_state.promise = fetch(entry);

              const complete = (model, dontUseSetState) => {
                if (request.status === 302) {
                  //force redirect outside route
                  document.location.href = request.redirect_url;
                  return;
                }

                if (dontUseSetState) {
                  this.state.entry_state.is_fetching = false;
                  this.state.entry_state.model = model;
                } else {
                  this.setState({
                    entry_state: _objectSpread(_objectSpread({}, this.state.entry_state), {}, {
                      is_fetching: false,
                      model
                    })
                  });
                }

                if (typeof setImmediate === 'function') {
                  setImmediate(() => executeDOMOperations());
                } else {
                  setInterval(() => executeDOMOperations(), 0);
                }
              };

              if (this.state.entry_state.promise instanceof Promise) {
                this.state.entry_state.promise.then(complete);
              } else {
                complete(this.state.entry_state.promise, true);
              }
            }
          }
        },
        add: route => {
          this.state.routes.push(route);
        }
      };
      this.props.routes(router);
    } else {
      this.state.routes = this.props.routes;
    }

    this.state.errorPages = {};
    this.state.routes.filter(route => route.error).forEach(route => {
      this.state.errorPages[route.error] = route;
    });
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return {
      error500: true,
      model: {
        error: error + ""
      }
    };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Unexpected Error", error);
  }

  getRequest(additional, dom_operations) {
    if (this.state.is_server) {
      return null;
    }

    additional = additional || {};
    const location = document.location;

    const request = _objectSpread({
      url: location.pathname,
      query: new URLSearchParams(location.search),
      search: location.search,
      host: location.host,
      hostname: location.hostname,
      protocol: location.protocol,
      origin: `${location.protocol}//${location.host}`,
      is_server: false,
      cookies: (0, _helpers.getCookies)()
    }, additional);

    dom_operations = dom_operations || [];
    const reply = {
      redirect: url => {
        request.status = 302;
        request.redirect_url = url;
      },
      setCookie: _helpers.setCookie,
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

      }
    };

    const executeDOMOperations = async () => {
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
              _reactDom.default.render( /*#__PURE__*/_react.default.createElement(Component, null), container, () => {
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
    };

    const fetch = routeOrEntry => {
      if (!routeOrEntry || typeof routeOrEntry.fetch !== 'function') return new Promise(resolve => resolve(this.state.entry_state.model));
      return routeOrEntry.fetch(request, reply);
    };

    return {
      request,
      reply,
      fetch,
      executeDOMOperations
    };
  }

  render() {
    const Router = this.state.is_server ? _reactRouterDom.StaticRouter : _reactRouterDom.BrowserRouter;
    const location = (this.state.request || {
      url: document.location.pathname
    }).url;

    if (this.state.error500) {
      //Error 500 pages do not include custom entry points to avoid crash loops
      return this.state.errorPages[500] ? /*#__PURE__*/_react.default.createElement(_reactRouterDom.StaticRouter, {
        location: location
      }, /*#__PURE__*/_react.default.createElement(_routeWrapper.default, {
        route: this.state.errorPages[500],
        context: this.state.context,
        is_server: this.state.is_server,
        is_fetching: this.state.is_fetching,
        request: this.state.request,
        model: this.state.model,
        error: true,
        getRequest: this.getRequest,
        entry: this.state.entry_state.promise
      }), " ") : /*#__PURE__*/_react.default.createElement("div", null, "500 Internal Error");
    }

    const EntryPoint = (this.state.entry ? this.state.entry.component : null) || (props => /*#__PURE__*/_react.default.createElement(_react.Fragment, null, props.children));

    return /*#__PURE__*/_react.default.createElement(Router, {
      location: location,
      context: this.state.context
    }, /*#__PURE__*/_react.default.createElement(EntryPoint, {
      context: this.state.context,
      is_server: this.state.is_server,
      is_fetching: this.state.entry_state.is_fetching,
      model: this.state.entry_state.model
    }, !this.state.entry_state.is_fetching && /*#__PURE__*/_react.default.createElement(_reactRouterDom.Switch, null, this.state.routes.filter(route => route.path).map(route => {
      return /*#__PURE__*/_react.default.createElement(_reactRouterDom.Route, {
        exact: true,
        path: route.path,
        key: `default-router-${route.path}`,
        component: () => /*#__PURE__*/_react.default.createElement(_routeWrapper.default, {
          route: route,
          context: this.state.context,
          is_server: this.state.is_server,
          is_fetching: this.state.is_fetching,
          request: this.state.request,
          model: this.state.model,
          getRequest: this.getRequest,
          entry: this.state.entry_state.promise
        })
      });
    }), !!this.state.errorPages[404] && /*#__PURE__*/_react.default.createElement(_reactRouterDom.Route, {
      path: "*",
      status: 404,
      key: `default-router-404`,
      component: () => /*#__PURE__*/_react.default.createElement(_routeWrapper.default, {
        route: this.state.errorPages[404],
        context: this.state.context,
        is_server: this.state.is_server,
        is_fetching: this.state.is_fetching,
        request: this.state.request,
        model: this.state.model,
        error: true,
        getRequest: this.getRequest,
        entry: this.state.entry_state.promise
      })
    }))));
  }

}

exports.default = App;