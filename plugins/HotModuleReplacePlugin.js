class HMRPlugin {
  apply(compiler) {
    // 注入热更新运行时代码
    compiler.hmrEnabled = true; // 添加此行
    compiler.hooks.emit.tap("HMRPlugin", () => {
      compiler.modules["hmr-runtime"] = JSON.stringify(this.getRuntimeCode());
    });

    // 监听编译完成事件
    compiler.hooks.afterCompile.tap("HMRPlugin", () => {
      // 可以在这里添加模块哈希计算逻辑
      // 为每个模块计算哈希
      compiler.moduleHashes = {};
      for (const moduleId in compiler.modules) {
        // 使用简单的哈希算法 (实际项目中可使用更复杂的算法如MD5)
        compiler.moduleHashes[moduleId] = this.calculateHash(
          compiler.modules[moduleId]
        );
      }
    });
  }

  getRuntimeCode() {
    return `
            (function() {
                const socket = new WebSocket('ws://localhost:8080/hmr');
                socket.onmessage = function(event) {
                    const update = JSON.parse(event.data);
                    if (update.type === 'update') {
                        console.log('Applying hot update...');
                        update.modules.forEach(module => {
                            __webpack_modules__[module.id] = module.factory;
                        });
                        // 触发模块更新回调
                        if (window.hotUpdateCallback) {
                            window.hotUpdateCallback();
                        }
                    }
                };
            })();
        `;
  }
  // 新增方法：计算模块哈希
  calculateHash(content) {
    // 简单的哈希计算实现
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }
}

module.exports = HMRPlugin;
