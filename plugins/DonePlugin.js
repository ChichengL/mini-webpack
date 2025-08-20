module.exports = class DonePlugin {
  apply(compiler) {
    compiler.hooks.run.tap("DonePlugin", () => {
      console.log("DonePlugin");
    });
  }
};
