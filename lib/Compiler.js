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
			initialize: new SyncHook(), // 初始化完成
			run: new SyncHook(), // 开始编译
			compile: new SyncHook(), // 开始编译模块
			buildModule: new SyncHook(["modulePath"]), // 编译单个模块
			emit: new SyncHook(), // 生成资源
			afterEmit: new SyncHook(), // 写入文件完成
			done: new SyncHook(), // 打包完成
		};
		this.modules = {};
		this.root = process.cwd(); // 确保 root 被正确设置

		this.extensions = this.options.resolve?.extensions || [".js", ".json"]; // 设置默认扩展名
		console.log("extensions", this.extensions);
		console.log(
			"simple-webpack ------------------> 实例化 Compiler",
			this.root,
		);
		this.hooks.initialize.call(); // 触发初始化钩子
	}
	run() {
		this.hooks.run.call();
		// 出发run钩子，执行对应挂载的函数
		let entry = this.options.entry;
		console.log("entry", entry);

		this.entryPath = "./" + path.relative(this.root, entry).replace(/\\/g, "/"); // 设置 entryPath 为相对路径

		this.hooks.compile.call(); // 触发 compile 钩子

		this.buildModule(entry, true);

		const outputPath = path.resolve(this.root, this.options.output.path);
		const filePath = path.resolve(outputPath, this.options.output.filename);
		this.mkdirP(outputPath, filePath);
	}

	buildModule(modulePath, isEntry) {
		// 统一处理为相对路径
		modulePath =
			"./" + path.relative(this.root, modulePath).replace(/\\/g, "/");
		// 补全文件名
		modulePath = this.resolveModulePath(modulePath);
		if (this.modules[modulePath]) {
			return; //解决循环依赖问题
		}

		this.hooks.buildModule.call(modulePath);
		const source = this.getSource(modulePath);

		const { sourceCode, dependencies } = this.parse(source, modulePath);
		this.modules[modulePath] = JSON.stringify(sourceCode);
		console.log(
			"simple-webpack ------------------> 解析模块",
			modulePath,
			dependencies,
		);

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
				const loopLoader = () => {
					// 使用箭头函数
					const { loader, options } = use[length--];
					let loaderFunc = require(loader); // loader是一个函数

					// 手动绑定 Loader 上下文
					const loaderContext = {
						resourcePath: modulePath, // 设置 resourcePath
						options: this.options, // 传递 Webpack 配置
					};

					// 调用 Loader，并绑定上下文
					content = loaderFunc.call(loaderContext, content, options);

					if (length >= 0) {
						loopLoader();
					}
				};
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

	mkdirP(outputPath, filePath) {
		console.log("simple-webpack ------------------> 文件输出");
		const { modules, entryPath } = this;
		//创建文件夹
		if (!fs.existsSync(outputPath)) {
			fs.mkdirSync(outputPath);
		}
		this.hooks.emit.call(); // 触发 emit 钩子
		ejs
			.renderFile(path.join(__dirname, "Template.ejs"), { modules, entryPath })
			.then((code) => {
				fs.writeFileSync(filePath, code);
				console.log("simple-webpack ------------------> 打包完成");
			});
	}

	resolveModulePath(modulePath) {
		if (fs.existsSync(modulePath)) {
			return modulePath;
		}
		for (const ext of this.extensions) {
			const filePath = modulePath + ext;
			if (fs.existsSync(filePath)) {
				return filePath;
			}
		}
		throw new Error(`Cannot resolve module ${modulePath}`);
	}
}

module.exports = Compiler;
