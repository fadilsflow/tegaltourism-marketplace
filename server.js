/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const next = require("next");
const { parse } = require("url");

process.env.NODE_ENV = "production"; // paksa mode production

const port = process.env.PORT || 3000;
const app = next({ dev: false }); // jangan pakai variable dev, langsung false
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Production server running at http://localhost:${port}`);
  });
});
