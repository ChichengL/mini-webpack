const babel = require('@babel/core');

const loader = function(source,options) {
    let result = babel.transform(source,{
        presets:options.presets,
    })
    return result.code;
}

module.exports = loader;