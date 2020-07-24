

const globalMods = typeof window === 'undefined' ? global : window;

let lazy_callbacks = [];
//util for SSR
export function getLazyCallbacks() {
    return lazy_callbacks;
}
export function resetLazyCallbacks(){
    lazy_callbacks = [];
}
export default function lazy(callback, options){


    const lazy_state = {
        callback: ()=>{
            return callback().then((component)=> {
                lazy_state.component = component;
                return component;
            });
        },
        isEqual: (component)=> lazy_state.lazy_component === component,
        options
    };

    lazy_state.lazy_component = function LazyComponent(props){
        const React =  (globalMods['react'] || require('react'));
        const { useEffect, useState, Fragment } = React;
    
        const [state, setState] = useState({ loading: !lazy_state.component, component: lazy_state.component  })
        useEffect(()=>{
            if(state.loading){
                lazy_state.callback().then((component)=> setState({ loading: false, component}))    
            }
        });

        if(state.component){
            if(state.component.default){
                return <state.component.default {...props}/>
            }
            return <state.component {...props}/>;
        }else if(options.fallback){
            return <options.fallback {...props}/>;
        }else {
            return <Fragment></Fragment>
        }
    }
    lazy_callbacks.push(lazy_state);

    return lazy_state.lazy_component;
}
