import React, { Component, Fragment } from 'react';
import { BrowserRouter, StaticRouter, Route, Switch } from 'react-router-dom';
import RouteWrapper from './routeWrapper';
import { setCookie, getCookies } from './helpers';
import ReactDOM from 'react-dom';

export default class App extends Component {

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
        this.state.entry_state = this.state.entry_state || { is_fetching: true, model: null };
        this.state.entry_state.promise = new Promise((resolve) => resolve(this.state.entry_state.model));
        this.state.routes = [];


        if (typeof this.props.routes === "function") {
            const router = {
                entry: (entry) => {
                    this.state.entry = entry;
                    if (this.state.entry_state.is_fetching) {
                        if (this.is_server) {
                            //server side dont fetch data here
                            this.state.entry_state.is_fetching = false;
                        } else {
                            //tells client side do fetch data
                            const { fetch, request, executeDOMOperations } = this.getRequest();
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
                                    this.setState({ entry_state: { ...this.state.entry_state, is_fetching: false, model } });
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
                add: (route) => {
                    this.state.routes.push(route);
                }
            }
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
        return { error500: true, model: { error: error + "" } };
    }
    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Unexpected Error", error)
    }

    getRequest(additional, dom_operations) {

        if (this.state.is_server) {
            return null;
        }
        additional = additional || {};
        const location = document.location;

        const request = {
            url: location.pathname,
            query: new URLSearchParams(location.search),
            search: location.search,
            host: location.host,
            hostname: location.hostname,
            protocol: location.protocol,
            origin: `${location.protocol}//${location.host}`,
            is_server: false,
            cookies: getCookies(),
            ...additional
        };
        dom_operations = dom_operations || [];
        const reply = {
            redirect: (url) => {
                request.status = 302;
                request.redirect_url = url;
            },
            setCookie,
            html: {
                insertBefore(selector, htmlStringOrComponent, limiter) {
                    const operation = { type: 'insert-before', selector, limiter };
                    if (typeof htmlStringOrComponent === 'string') {
                        operation.html = htmlStringOrComponent;
                    } else {
                        operation.component = htmlStringOrComponent;
                    }

                    dom_operations.push(operation);
                },
                insertAfter(selector, htmlStringOrComponent, limiter) {
                    const operation = { type: 'insert-after', selector, limiter };
                    if (typeof htmlStringOrComponent === 'string') {
                        operation.html = htmlStringOrComponent;
                    } else {
                        operation.component = htmlStringOrComponent;
                    }

                    dom_operations.push(operation);
                },
                append(selector, htmlStringOrComponent, limiter) {
                    const operation = { type: 'append', selector, limiter };
                    if (typeof htmlStringOrComponent === 'string') {
                        operation.html = htmlStringOrComponent;
                    } else {
                        operation.component = htmlStringOrComponent;
                    }

                    dom_operations.push(operation);
                },
                setAttribute(selector, attribute_name, value, limiter) {
                    dom_operations.push({ type: 'set-attributes', selector, attributes: { [attribute_name]: value }, limiter });
                },
                setAttributes(selector, attributes, limiter) {
                    dom_operations.push({ type: 'set-attributes', selector, attributes, limiter });
                },
                removeAttribute(selector, attribute_name, limiter) {
                    dom_operations.push({ type: 'remove-attributes', selector, attributes: [attribute_name], limiter });
                },
                removeAttributes(selector, attributes, limiter) {
                    dom_operations.push({ type: 'remove-attributes', selector, attributes, limiter });
                },
                remove(selector, limiter) {
                    dom_operations.push({ type: 'remove', selector, limiter });
                }
            }
        }
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
                                console.error('Invalid dom manipulation, limiter need to be first or last', { invalidLimiter: operation.limiter })
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
                            ReactDOM.render(<Component />, container, () => {
                                resolve(container.children[0]);
                            });
                        });
                    }
                    targets.forEach((target) => {

                        switch (operation.type) {

                            case 'remove':
                                if (!target)
                                    return;
                                target.remove();
                                break;
                            case 'remove-attributes':
                                if (!target)
                                    return;
                                if (operation.attributes instanceof Array) {
                                    operation.attributes.forEach((attribute) => {
                                        target.removeAttribute(attribute);
                                    });
                                } else if (typeof operation.attributes === 'string') {
                                    target.removeAttribute(operation.attributes);
                                } else {
                                    console.error('Invalid parameters in', 'reply.removeAttribute(string, string|Array)');
                                }
                                break;
                            case 'set-attributes':
                                if (!target)
                                    return;
                                if (typeof operation.attributes === 'object') {
                                    for (let i in operation.attributes) {
                                        target.setAttribute(i, operation.attributes[i] + "");
                                    }
                                } else {
                                    console.error('Invalid parameters in', 'reply.setAttribute(string, object)');
                                }
                                break;
                            case 'append':
                                if (!element || !target)
                                    return;
                                target.append(element);
                                break;
                            case 'insert-before':
                                if (!element || !target)
                                    return;
                                target.parentNode.insertBefore(element, target);
                                break;
                            case 'insert-after':
                                if (!element || !target)
                                    return;
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

        const fetch = (routeOrEntry) => {
            if (!routeOrEntry || typeof routeOrEntry.fetch !== 'function')
                return new Promise((resolve) => resolve(this.state.entry_state.model));
            return routeOrEntry.fetch(request, reply);
        }

        return { request, reply, fetch, executeDOMOperations };
    }

    render() {

        const Router = this.state.is_server ? StaticRouter : BrowserRouter;
        const location = (this.state.request || { url: document.location.pathname }).url;
        if (this.state.error500) {
            //Error 500 pages do not include custom entry points to avoid crash loops

            return this.state.errorPages[500] ? (
                <StaticRouter location={location}>
                    <RouteWrapper route={this.state.errorPages[500]}
                        context={this.state.context}
                        is_server={this.state.is_server}
                        is_fetching={this.state.is_fetching}
                        request={this.state.request}
                        model={this.state.model}
                        error={true}
                        getRequest={this.getRequest}
                        entry={this.state.entry_state.promise}
                    /> </StaticRouter>) : (<div>500 Internal Error</div>);
        }

        const EntryPoint = (this.state.entry ? this.state.entry.component : null) || ((props) => <Fragment>{props.children}</Fragment>);
        return (
            <Router location={location} context={this.state.context}>
                <EntryPoint context={this.state.context}
                    is_server={this.state.is_server}
                    is_fetching={this.state.entry_state.is_fetching}
                    model={this.state.entry_state.model}>
                    {/* Avoids multiple fetchs in Routes */}
                    {!this.state.entry_state.is_fetching && (
                        <Switch>
                            {this.state.routes.filter(route => route.path).map((route) => {
                                return (<Route exact path={route.path} key={`default-router-${route.path}`}
                                    component={() => (
                                        <RouteWrapper route={route}
                                            context={this.state.context}
                                            is_server={this.state.is_server}
                                            is_fetching={this.state.is_fetching}
                                            request={this.state.request}
                                            model={this.state.model}
                                            getRequest={this.getRequest}
                                            entry={this.state.entry_state.promise}
                                        />
                                    )}
                                />)
                            })}
                            {!!this.state.errorPages[404] && (<Route path="*" status={404} key={`default-router-404`}
                                component={() => (
                                    <RouteWrapper route={this.state.errorPages[404]}
                                        context={this.state.context}
                                        is_server={this.state.is_server}
                                        is_fetching={this.state.is_fetching}
                                        request={this.state.request}
                                        model={this.state.model}
                                        error={true}
                                        getRequest={this.getRequest}
                                        entry={this.state.entry_state.promise}
                                    />
                                )}
                            />)}
                        </Switch>
                    )}

                </EntryPoint>
            </Router>);
    }
}