// simple-css-loader.js
module.exports = function (source) {
  // 1. 转义CSS中的特殊字符（如引号、换行），避免破坏JS语法
  const escapedCss = JSON.stringify(source);

  // 2. 生成JS代码：创建style标签并插入CSS内容
  const jsCode = `
    // 创建style标签
    const style = document.createElement('style');
    // 设置CSS内容
    style.innerHTML = ${escapedCss};
    // 插入到head中
    document.head.appendChild(style);
    // 导出空对象（满足Webpack模块规范）
    module.exports = {};
  `;

  // 3. 返回处理后的JS代码
  return jsCode;
};
