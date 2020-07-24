"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _routeWrapper = _interopRequireDefault(require("./routeWrapper"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const globalMods = typeof window === 'undefined' ? global : window;

const React = globalMods['react'] || require('react');

const {
  Component,
  Fragment
} = React;

const {
  BrowserRouter,
  StaticRouter,
  Route,
  Switch,
  withRouter
} = globalMods['react-router-dom'] || require('react-router-dom');

class App extends Component {
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
        entry: async entry => {
          this.state.entry = entry;

          if (this.state.entry_state.is_fetching) {
            if (this.is_server) {
              //server side dont fetch data here
              this.state.entry_state.is_fetching = false;
            } else {
              //tells client side do fetch data
              const {
                fetch,
                reply,
                executeDOMOperations
              } = this.getRequest();
              this.state.entry_state.promise = fetch(entry);

              const complete = (model, dontUseSetState) => {
                if (reply.status === 302) {
                  //force redirect outside route
                  document.location.href = reply.redirect_url;
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

    const request = (0, _helpers.getRequest)(additional);
    const domHandler = (0, _helpers.getDOMHandler)(dom_operations);
    const reply = (0, _helpers.getReply)(domHandler);

    const fetch = routeOrEntry => {
      if (!routeOrEntry) return new Promise(resolve => resolve(this.state.entry_state.model));
      const fetcher = routeOrEntry.fetch || (routeOrEntry.component || {}).fetch;
      if (typeof fetcher !== 'function') return new Promise(resolve => resolve(this.state.entry_state.model));
      return fetcher(request, reply);
    };

    return {
      request,
      reply,
      fetch,
      executeDOMOperations: domHandler.execute
    };
  }

  render() {
    const Router = this.state.is_server ? StaticRouter : BrowserRouter;
    const location = (this.state.request || {
      url: document.location.pathname
    }).url;
    const Wrapper = withRouter(_routeWrapper.default);

    if (this.state.error500) {
      //Error 500 pages do not include custom entry points to avoid crash loops
      return this.state.errorPages[500] ? /*#__PURE__*/React.createElement(StaticRouter, {
        location: location
      }, /*#__PURE__*/React.createElement(Wrapper, {
        route: this.state.errorPages[500],
        context: this.state.context,
        is_server: this.state.is_server,
        is_fetching: this.state.is_fetching,
        request: this.state.request,
        model: this.state.model,
        error: true,
        getRequest: this.getRequest,
        entry: this.state.entry_state.promise
      }), " ") : /*#__PURE__*/React.createElement("div", null, "500 Internal Error");
    }

    const EntryPoint = (this.state.entry ? this.state.entry.component : null) || (props => /*#__PURE__*/React.createElement(Fragment, null, props.children));

    return /*#__PURE__*/React.createElement(Router, {
      location: location,
      context: this.state.context
    }, /*#__PURE__*/React.createElement(EntryPoint, {
      context: this.state.context,
      is_server: this.state.is_server,
      is_fetching: this.state.entry_state.is_fetching,
      model: this.state.entry_state.model
    }, !this.state.entry_state.is_fetching && /*#__PURE__*/React.createElement(Switch, null, this.state.routes.filter(route => route.path).map(route => {
      return /*#__PURE__*/React.createElement(Route, {
        exact: true,
        path: route.path,
        key: `default-router-${route.path}`,
        component: () => /*#__PURE__*/React.createElement(Wrapper, {
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
    }), !!this.state.errorPages[404] && /*#__PURE__*/React.createElement(Route, {
      path: "*",
      status: 404,
      key: `default-router-404`,
      component: () => /*#__PURE__*/React.createElement(Wrapper, {
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