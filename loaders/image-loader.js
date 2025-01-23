const path = require("path");
const fs = require("fs");

module.exports = function (content) {
	// 获取图片文件的绝对路径
	const imagePath = this.resourcePath;

	// 如果 imagePath 未定义，抛出错误
	if (!imagePath) {
		throw new Error("Loader context is missing resourcePath.");
	}

	// 获取文件大小（单位：字节）
	const fileSize = fs.statSync(imagePath).size;

	// 设置阈值（8KB）
	const limit = 8 * 1024; // 8KB

	if (fileSize < limit) {
		// 如果图片小于阈值，转换为 Base64
		const base64 = fs.readFileSync(imagePath, { encoding: "base64" });
		const mimeType = getMimeType(imagePath);
		return `module.exports = "data:${mimeType};base64,${base64}"`;
	} else {
		// 如果图片大于阈值，复制到输出目录并返回路径
		const outputPath = path.join(
			this.options.context, // Webpack 的 context 配置
			"dist", // 输出目录
			path.basename(imagePath), // 图片文件名
		);

		// 确保输出目录存在
		if (!fs.existsSync(path.dirname(outputPath))) {
			fs.mkdirSync(path.dirname(outputPath), { recursive: true });
		}

		// 复制图片到输出目录
		fs.copyFileSync(imagePath, outputPath);

		// 返回图片的相对路径
		return `module.exports = "${path.relative(
			this.options.context,
			outputPath,
		)}"`;
	}
};

// 获取文件的 MIME 类型
function getMimeType(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	switch (ext) {
		case ".png":
			return "image/png";
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		case ".gif":
			return "image/gif";
		case ".svg":
			return "image/svg+xml";
		default:
			return "application/octet-stream";
	}
}
