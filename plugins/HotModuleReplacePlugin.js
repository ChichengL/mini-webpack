const WebSocketServer = require("ws");
const fs = require("fs");
const path = require("path");
class HMRPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    // 在编译开始前监听文件变化
    compiler.hooks.compile.tap("HMRPlugin", () => {
      this.watchFiles(compiler);
    });

    // 在生成资源后通知客户端更新
    compiler.hooks.afterEmit.tap("HMRPlugin", (compilation) => {
      this.notifyClients(compilation);
    });

    // 启动 WebSocket 服务器
    this.startWebSocketServer();
  }

  watchFiles(compiler) {
    const { context } = compiler.options;
    const watcher = fs.watch(
      context,
      { recursive: true },
      (eventType, filename) => {
        if (
          filename &&
          !path
            .resolve(context, filename)
            .startsWith(
              path.resolve(compiler.root, compiler.options.output.path)
            )
        ) {
          if (eventType === "change") {
            const filePath = path.join(context, filename);
            // 重新编译发生变化的模块
            compiler.buildModule(filePath, false);
            compiler.mkdirP(
              path.resolve(compiler.root, compiler.options.output.path),
              path.resolve(
                compiler.root,
                compiler.options.output.path,
                compiler.options.output.filename
              )
            );
          }
        }
      }
    );
  }

  notifyClients(compilation) {
    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocketServer.OPEN) {
          client.send(JSON.stringify({ type: "update" }));
        }
      });
    }
  }

  startWebSocketServer() {
    this.wss = new WebSocketServer.Server({ port: 8081 });
    this.wss.on("connection", (ws) => {
      console.log("Client connected to HMR server");
    });
  }
}

module.exports = HMRPlugin;
