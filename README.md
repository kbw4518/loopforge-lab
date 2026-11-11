# ForgeBoard

React + TypeScript + Vite / FastAPI / SQLite 任务看板。支持新增、编辑、确认删除、三列状态按钮切换、标题搜索、优先级筛选及全量统计。无登录、上传、通知或第三方集成。

## 本地启动

需要 Python 3.10+、Node.js 18+。

```sh
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
.venv/bin/uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

另一个终端：
```sh
cd frontend
npm ci
npm run dev
```

打开 http://localhost:5173 。Vite 将 /api 代理至 127.0.0.1:8000。API 文档：http://localhost:8000/docs 。

SQLite 默认保存在后端启动目录的 forgeboard.db；用环境变量 FORGEBOARD_DB 指定已有可写目录中的文件路径。每次写入自动提交，重启后保留；无需迁移或外部数据库。数据库和依赖目录由 .gitignore 排除。

## 测试与构建

```sh
.venv/bin/python -m pytest backend -q
cd frontend
npm ci
npm run build
```

构建产物为 frontend/dist。生产部署时用同源反向代理将 /api 转发给 FastAPI，其余请求提供 dist 静态资源；不要直接用 file:// 打开。

## API

- GET /api/tasks：返回全部任务，按 id 倒序。
- POST /api/tasks：创建，返回 201 和完整任务。
- PUT /api/tasks/{id}：更新完整任务，返回 200。
- DELETE /api/tasks/{id}：删除，返回 204。
- 更新或删除不存在的 id 返回 404，非法输入返回 422。

```sh
curl -X POST http://localhost:8000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"准备发布","description":"检查验收项","priority":"high","status":"todo"}'
curl http://localhost:8000/api/tasks
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"准备发布","description":"检查验收项","priority":"high","status":"done"}'
curl -X DELETE http://localhost:8000/api/tasks/1
```

标题去除首尾空格后为 1～100 个 Unicode 码点；描述默认为空字符串。priority 为 low / medium / high（默认 medium），status 为 todo / in_progress / done（默认 todo）。搜索及筛选在客户端执行；顶部统计始终表示全部任务数量，列内数量表示筛选后的数量。

## 验证范围

pytest 覆盖 CRUD、标题边界、输入校验、404 和重新建立客户端后的磁盘持久化；前端构建包含 TypeScript 类型检查。浏览器端真实交互、移动设备及进程级重启验证需另行检查，不能仅凭构建成功视为通过。该最小版本不提供认证，请在可信本地环境使用。
