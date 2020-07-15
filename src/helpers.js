module.exports.setCookie = function(name, value, options) {

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

module.exports.getCookies = function() {
    return document.cookie.split('; ').reduce((prev, current) => {
        const [name, value] = current.split('=');
        prev[name] = value;
        return prev
    }, {})
    
}