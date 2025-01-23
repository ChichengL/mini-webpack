// webpack.config.js
const path = require("path");
const RunPlugin = require("./plugins/RunPlugin");
const DonePlugin = require("./plugins/DonePlugin");
const BuildModulePlugin = require("./plugins/BuildModulePlugin");
module.exports = {
	context: process.cwd(), // 当前的根目录
	mode: "development", // 工作模式
	entry: path.join(__dirname, "src/index.js"), // 入口文件
	output: {
		// 出口文件
		filename: "bundle.js",
		path: path.join(__dirname, "./dist"),
	},
	// resolve: {
	// 	extensions: [".js", ".json"], // 支持的文件扩展名
	// },
	module: {
		// 要加载模块转化loader
		rules: [
			{
				test: /\.js$/,
				use: [
					{
						loader: path.join(__dirname, "./loaders/babel-loader.js"),
						options: {
							presets: ["@babel/preset-env"],
						},
					},
				],
			},
		],
	},
	plugins: [new RunPlugin(), new DonePlugin(), new BuildModulePlugin()], //插件
};
