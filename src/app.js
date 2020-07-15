import React, { Component, Fragment } from 'react';
import RouteWrapper from './routeWrapper';
import { getRequest, getDOMHandler, getReply } from './helpers';

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
                            const { fetch, reply, executeDOMOperations } = this.getRequest();
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
        
        const request = getRequest(additional);
        const domHandler = getDOMHandler(dom_operations);
        const reply = getReply(domHandler);
        
        const fetch = (routeOrEntry) => {
            if (!routeOrEntry)
                return new Promise((resolve) => resolve(this.state.entry_state.model));

            const fetcher = routeOrEntry.fetch || (routeOrEntry.component || {}).fetch;
            if(typeof fetcher !== 'function')
                return new Promise((resolve) => resolve(this.state.entry_state.model));

            return fetcher(request, reply);
        }

        return { request, reply, fetch, executeDOMOperations: domHandler.execute };
    }

    render() {
        const { BrowserRouter, StaticRouter, Route, Switch, withRouter } = this.props.react_router_instance || require('react-router-dom');
        const Router = this.state.is_server ? StaticRouter : BrowserRouter;
        const location = (this.state.request || { url: document.location.pathname }).url;
        const Wrapper = withRouter(RouteWrapper);
        if (this.state.error500) {
            //Error 500 pages do not include custom entry points to avoid crash loops

            return this.state.errorPages[500] ? (
                <StaticRouter location={location}>
                    <Wrapper route={this.state.errorPages[500]}
                        context={this.state.context}
                        is_server={this.state.is_server}
                        is_fetching={this.state.is_fetching}
                        request={this.state.request}
                        model={this.state.model}
                        error={true}
                        getRequest={this.getRequest}
                        entry={this.state.entry_state.promise}
                        react_router_instance={this.props.react_router_instance}
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
                                        <Wrapper route={route}
                                            context={this.state.context}
                                            is_server={this.state.is_server}
                                            is_fetching={this.state.is_fetching}
                                            request={this.state.request}
                                            model={this.state.model}
                                            getRequest={this.getRequest}
                                            entry={this.state.entry_state.promise}
                                            react_router_instance={this.props.react_router_instance}
                                            />
                                    )}
                                />)
                            })}
                            {!!this.state.errorPages[404] && (<Route path="*" status={404} key={`default-router-404`}
                                component={() => (
                                    <Wrapper route={this.state.errorPages[404]}
                                        context={this.state.context}
                                        is_server={this.state.is_server}
                                        is_fetching={this.state.is_fetching}
                                        request={this.state.request}
                                        model={this.state.model}
                                        error={true}
                                        getRequest={this.getRequest}
                                        entry={this.state.entry_state.promise}
                                        react_router_instance={this.props.react_router_instance}
                                        />
                                )}
                            />)}
                        </Switch>
                    )}

                </EntryPoint>
            </Router>);
    }
}