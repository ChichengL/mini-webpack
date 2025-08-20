module.exports = function (source) {
  // 将CSS转换为JavaScript模块
  // 通过添加<style>标签将CSS插入到DOM中
  const script = `
    const style = document.createElement('style');
    style.innerHTML = ${JSON.stringify(source)};
    document.head.appendChild(style);
  `;

  // 返回可执行的JavaScript代码
  return script;
};

// 导出插件类
module.exports.plugin = class CssLoaderPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("CssLoaderPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "CssLoaderPlugin",
          stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          for (const filename in assets) {
            if (filename.endsWith(".css")) {
              const source = assets[filename].source();
              const js = this.loader(source);
              assets[filename.replace(".css", ".js")] = js;
            }
          }
        }
      );
    });
  }
};

// 导出加载器函数
module.exports.loader = function (source) {
  return source;
};
