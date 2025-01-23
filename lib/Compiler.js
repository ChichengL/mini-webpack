let { SyncHook } = require("tapable");
const path = require("path");
const fs = require("fs");
const babel = require("@babel/core");
const t = require("@babel/types");
const ejs = require("ejs");

class Compiler {
	constructor(options) {
		this.options = options;
		this.hooks = {
			run: new SyncHook(),
			done: new SyncHook(),
		};
		this.modules = {};
		this.root = process.cwd(); // 确保 root 被正确设置
	}
	run() {
		this.hooks.run.call();
		let entry = this.options.entry;
		console.log("entry", entry);
		this.entryPath = "./" + path.relative(this.root, entry).replace(/\\/g, "/"); // 设置 entryPath 为相对路径
		this.buildModule(entry, true);
		const outputPath = path.resolve(this.root, this.options.output.path);
		const filePath = path.resolve(outputPath, this.options.output.filename);
		this.mkdirP(outputPath, filePath);
	}
	mkdirP(outputPath, filePath) {
		console.log("simple-webpack ------------------> 文件输出");
		const { modules, entryPath } = this;
		//创建文件夹
		if (!fs.existsSync(outputPath)) {
			fs.mkdirSync(outputPath);
		}
		ejs
			.renderFile(path.join(__dirname, "Template.ejs"), { modules, entryPath })
			.then((code) => {
				fs.writeFileSync(filePath, code);
				console.log("simple-webpack ------------------> 打包完成");
			});
	}
	buildModule(modulePath, isEntry) {
		const source = this.getSource(modulePath);

		// 统一处理为相对路径
		modulePath =
			"./" + path.relative(this.root, modulePath).replace(/\\/g, "/");

		const { sourceCode, dependencies } = this.parse(source, modulePath);
		this.modules[modulePath] = JSON.stringify(sourceCode);

		dependencies.forEach((d) => {
			const dependencyPath = path.resolve(this.root, d);
			this.buildModule(dependencyPath, false); // 递归构建依赖
		});
	}
	getSource(modulePath) {
		let content = fs.readFileSync(modulePath, "utf-8");
		const rules = this.options.module.rules;

		for (const rule of rules) {
			const { test, use } = rule;
			if (test.test(modulePath)) {
				// 匹配上了
				let length = use.length - 1;
				function loopLoader() {
					const { loader, options } = use[length--];
					let loaderFunc = require(loader); // loader是一个函数

					content = loaderFunc(content, options);
					if (length >= 0) {
						loopLoader();
					}
				}
				if (length >= 0) {
					//启动
					loopLoader();
				}
			}
		}
		return content;
	}
	// 根据模块的源码进行解析
	parse(source, moduleName) {
		let dependencies = [];
		const dirname = path.dirname(moduleName);
		const requirePlugin = {
			visitor: {
				// 替换源码中的require为__webpack_require__
				CallExpression(p) {
					const node = p.node;
					if (node.callee.name === "require") {
						node.callee.name = "__webpack_require__";
						// 路径替换
						let modulePath = node.arguments[0].value;
						modulePath =
							"./" + path.join(dirname, modulePath).replace(/\\/g, "/");
						node.arguments = [t.stringLiteral(modulePath)];
						dependencies.push(modulePath);
					}
				},
			},
		};
		let result = babel.transform(source, {
			plugins: [requirePlugin],
		});
		return {
			sourceCode: result.code,
			dependencies,
		};
	}
}

module.exports = Compiler;
