"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLazyCallbacks = getLazyCallbacks;
exports.resetLazyCallbacks = resetLazyCallbacks;
exports.default = lazy;
const globalMods = typeof window === 'undefined' ? global : window;
let lazy_callbacks = []; //util for SSR

function getLazyCallbacks() {
  return lazy_callbacks;
}

function resetLazyCallbacks() {
  lazy_callbacks = [];
}

function lazy(callback, options) {
  const lazy_state = {
    callback: () => {
      return callback().then(component => {
        lazy_state.component = component;
        return component;
      });
    },
    isEqual: component => lazy_state.lazy_component === component,
    options
  };

  lazy_state.lazy_component = function LazyComponent(props) {
    const React = globalMods['react'] || require('react');

    const {
      useEffect,
      useState,
      Fragment
    } = React;
    const [state, setState] = useState({
      loading: !lazy_state.component,
      component: lazy_state.component
    });
    useEffect(() => {
      if (state.loading) {
        lazy_state.callback().then(component => setState({
          loading: false,
          component
        }));
      }
    });

    if (state.component) {
      if (state.component.default) {
        return /*#__PURE__*/React.createElement(state.component.default, props);
      }

      return /*#__PURE__*/React.createElement(state.component, props);
    } else if (options.fallback) {
      return /*#__PURE__*/React.createElement(options.fallback, props);
    } else {
      return /*#__PURE__*/React.createElement(Fragment, null);
    }
  };

  lazy_callbacks.push(lazy_state);
  return lazy_state.lazy_component;
}