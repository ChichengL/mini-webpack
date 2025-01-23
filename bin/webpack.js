const Compiler = require('../lib/Compiler');

const config  = require('../webpack.config')

const createCompiler = () => {
    const compiler = new Compiler(config);

    if(Array.isArray(config.plugins)){
        for (const plugin of config.plugins) {
            plugin.apply(compiler);
          }
    }
    return compiler;
}
const compiler = createCompiler();
compiler.run();