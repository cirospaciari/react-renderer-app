"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _reactRouterDom = require("react-router-dom");

var _reactDom = _interopRequireDefault(require("react-dom"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

class RouteWrapper extends _react.Component {
  constructor(props, context) {
    super(props, context);
    const route = this.props.route;
    this.state = {
      is_fetching: false,
      model: this.props.model,
      is_server: !!this.props.is_server,
      request: this.props.request
    };

    if (this.props.context) {
      this.props.context.route = this.props.route;

      if (this.props.route.error) {
        this.props.context.status = this.props.route.error;
      }
    }

    if (!this.props.is_server && !this.props.error) {
      const {
        params
      } = this.props.match;
      const {
        request,
        fetch,
        executeDOMOperations
      } = this.props.getRequest({
        entry: this.props.entry,
        params,
        route: route.path || route.error
      }); //url changed

      if (!this.state.request || this.state.request.url !== request.url || this.state.request.search !== request.search) {
        this.state.is_fetching = true;
        this.state.request = request;
        const result = fetch(route);

        const complete = (model, dontUseSetState) => {
          if (request.status === 302) {
            if (dontUseSetState) {
              this.state.redirect = request.redirect_url;
              this.state.is_fetching = false;
            } else {
              this.setState({
                redirect: request.redirect_url,
                is_fetching: false
              });
            }

            return;
          }

          const Helmet = route.helmet || (() => /*#__PURE__*/_react.default.createElement(_react.Fragment, null));

          const container = document.createElement('head');

          _reactDom.default.render( /*#__PURE__*/_react.default.createElement(Helmet, {
            model: model,
            is_server: false,
            is_fetching: false
          }), container, () => {
            const headElement = document.querySelector('head'); //remove old helmet elements

            Array.prototype.slice.apply(headElement.childNodes).forEach(child => {
              if (child.getAttribute('data-helmet') === "true") {
                child.remove();
              }
            });
            const titleElement = container.querySelector('title');

            if (titleElement) {
              document.title = titleElement.innerText;
            } //add new helmet elements


            container.childNodes.forEach(element => {
              element.setAttribute('data-helmet', 'true');
              headElement.appendChild(element);
            });

            if (dontUseSetState) {
              this.state.model = model;
              this.state.is_fetching = false;
            } else {
              this.setState({
                model: model,
                is_fetching: false
              });
            }

            if (typeof setImmediate === 'function') {
              setImmediate(() => executeDOMOperations());
            } else {
              setTimeout(() => executeDOMOperations(), 0);
            }
          });
        };

        if (result instanceof Promise) {
          result.then(complete);
        } else {
          complete(result, true);
        }
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.is_fetching && nextState.is_fetching) return false;
    return true;
  }

  render() {
    const route = this.props.route;

    const Component = route.component || (() => /*#__PURE__*/_react.default.createElement(_react.Fragment, null));

    if (this.state.redirect) {
      return /*#__PURE__*/_react.default.createElement(_reactRouterDom.Redirect, {
        to: this.state.redirect
      });
    }

    return /*#__PURE__*/_react.default.createElement(Component, {
      is_fetching: this.state.is_fetching,
      model: this.state.model,
      is_server: this.state.is_server
    });
  }

}

var _default = (0, _reactRouterDom.withRouter)(RouteWrapper);

exports.default = _default;