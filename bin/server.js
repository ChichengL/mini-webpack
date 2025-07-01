const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const path = require("path");
const Compiler = require("../lib/Compiler");
const config = require("../webpack.config");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 提供静态文件
app.use(express.static(path.join(__dirname, "../dist")));

// 初始化编译器
const compiler = new Compiler({ ...config, watch: true });
compiler.hooks.afterEmit.tap("DevServer", (modules) => {
  // 发送更新通知给客户端
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "update",
          modules: Object.entries(modules).map(([id, code]) => ({
            id,
            factory: `function(module, exports, __webpack_require__) { ${code} }`,
          })),
        })
      );
    }
  });
});

// 处理 WebSocket 连接
compiler.wsServer = wss;
wss.on("connection", (ws) => {
  console.log("Client connected for HMR");
  ws.on("close", () => {
    console.log("Client disconnected from HMR");
  });
});

// 启动编译和服务器

compiler.watch();
function startServer(port) {
  server
    .listen(port, () => {
      console.log("Development server running at http://localhost:8080");
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is in use, trying port ${port + 1}...`);
        startServer(port + 1); // 尝试下一个端口
      }
    });
}

startServer();
