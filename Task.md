本任务仅做测试，所以无需复杂的代码。

编写一个webpage并部署到13014端口，里面有填用户名、密码、注册和登录的功能。登录进去什么也不用做。

我会让二级域名test.tinybot.cloud访问这个网页。请你用一个android apk封装它。

要求：华为手机访问这个apk，可以正常注册、输入用户名和密码、登录。

---

该测试背景如下：

我有一个web项目使用了以下技术栈，运行良好。但在进行android apk封装时，出现apk中输入、长按复制不正常的问题。因此需要你来编写一个最小场景，看能不能清晰地找出解决方案。

### 2.1 前端

- Next.js / React / TypeScript。
- Tailwind CSS。
- Zustand 或 React Context 管理当前 Session、当前路径、用户设置和生成状态。
- Markdown 渲染：`react-markdown`。
- 代码高亮：`rehype-highlight` 或同类库。
- 流式输出：Fetch ReadableStream 或 SSE。

### 2.2 后端

- Node.js / TypeScript。
- 可使用 Next.js Route Handlers、Fastify、NestJS 或 Express。
- PostgreSQL。
- ORM：Prisma 或 Drizzle。
- 身份认证：Auth.js / NextAuth、自建 JWT Session，或同等安全方案。

### 2.3 部署

- Linux 服务器。
- Docker Compose。
- Nginx / Caddy 反向代理。
- HTTPS：Certbot、Caddy 自动证书或 Cloudflare Tunnel。
