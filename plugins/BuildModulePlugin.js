module.exports = class BuildModulePlugin {
	apply(compiler) {
		compiler.hooks.emit.tap("BuildModulePlugin", (compilation) => {
			console.log("BuildModulePlugin");
		});
	}
};
