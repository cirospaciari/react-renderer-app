const globalMods = typeof window === 'undefined' ? global : window;
const React = (globalMods['react'] || require('react'));
const { Component, Fragment } = React;
const { Redirect } = globalMods['react-router-dom'] || require('react-router-dom');

import ReactDOM from 'react-dom';

class RouteWrapper extends Component {

    constructor(props, context) {
        super(props, context);
        const route = this.props.route;
        this.updateHelmet = this.updateHelmet.bind(this);
        this.completeFetch = this.completeFetch.bind(this);
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
        this.state.component = route.component || (() => <Fragment />);

        if (!this.props.is_server && !this.props.error) {
            const { params } = this.props.match;
            const { request, fetch } = this.props.getRequest({ entry: this.props.entry, params, route: route.path || route.error });

            if (!this.state.request || this.state.request.url !== request.url || this.state.request.search !== request.search) {
                this.state.is_fetching = true;
                this.state.request = request;
                const result = fetch(route);
                if (result instanceof Promise) {
                    result.then(this.completeFetch);
                } else {
                    this.completeFetch(result, true);
                }
            }
        }
    }
    completeFetch(model, dontUseSetState) {
        const route = this.props.route;
        const { params } = this.props.match;

        const { reply, executeDOMOperations } = this.props.getRequest({ entry: this.props.entry, params, route: route.path || route.error });


        if (reply.status === 302) {
            if (dontUseSetState) {
                this.state.redirect = reply.redirect_url;
                this.state.is_fetching = false;
            } else {
                this.setState({ redirect: reply.redirect_url, is_fetching: false });
            }
            return;
        }

        this.updateHelmet(model).then(() => {
            if (dontUseSetState) {
                this.state.model = model;
                this.state.is_fetching = false;
            } else {
                this.setState({ model: model, is_fetching: false });
            }
            if (typeof setImmediate === 'function') {
                setImmediate(() => executeDOMOperations());
            } else {
                setTimeout(() => executeDOMOperations(), 0);
            }
        });
    }

    componentDidUpdate() {
        if (!this.props.is_server && !this.props.error) {
            const route = this.props.route;

            const { params } = this.props.match;
            const { request, fetch } = this.props.getRequest({ entry: this.props.entry, params, route: route.path || route.error });

            //url changed
            if (!this.state.request || this.state.request.url !== request.url || this.state.request.search !== request.search) {
                this.state.is_fetching = true;
                this.state.request = request;
                const result = fetch(route);
                if (result instanceof Promise) {
                    result.then(this.completeFetch);
                } else {
                    this.completeFetch(result);
                }
            }
        }
    }

    updateHelmet(model) {
        const route = this.props.route;
        const getHelmetFromComponent = () => {
            return new Promise((resolve) => {
                if (route.helmet)
                    return resolve(route.helmet);

                if (this.state.component.__force_preload) {
                    return this.state.component.__force_preload().then((component) => {
                        resolve(component.helmet || (component.default || {}).helmet || <Fragment />);
                    });
                }
                return resolve((this.state.component || {}).helmet || <Fragment />);
            });
        }
        return new Promise(resolve => {


            getHelmetFromComponent().then((Helmet) => {

                const container = document.createElement('head');
                ReactDOM.render(<Helmet model={model} is_server={false} is_fetching={false} />, container, () => {
                    const headElement = document.querySelector('head');
                    //remove old helmet elements
                    Array.prototype.slice.apply(headElement.childNodes).forEach(child => {
                        if (child && child.getAttribute && child.getAttribute('data-helmet') === "true") {
                            child.remove();
                        }
                    });
                    const titleElement = container.querySelector('title');
                    if (titleElement) {
                        document.title = titleElement.innerText;
                    }

                    //add new helmet elements
                    container.childNodes.forEach(element => {
                        element.setAttribute('data-helmet', 'true');
                        headElement.appendChild(element);
                    });

                    resolve();
                });

            });
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.is_fetching && nextState.is_fetching)
            return false;
        return true;
    }

    render() {

        if (this.state.redirect) {
            return (<Redirect to={this.state.redirect} />);
        }
        const Component = this.state.component;
        return (<Component is_fetching={this.state.is_fetching}
            model={this.state.model}
            is_server={this.state.is_server}
            updateHelmet={this.updateHelmet} />);
    }
}

export default RouteWrapper;