# AGENTS.md

本文件用于约束和指导参与 StillNote（https://github.com/CottonChou/stillnote）项目的 AI 代理与协作者。

## 项目概述与技术架构

- **项目定位**：StillNote 是一款轻量、优雅、支持多端同步与端侧/云端混合 AI 能力的个人知识与笔记系统。
- **架构与技术栈**：
  - **Monorepo 管理**：使用 Bun 作为包管理器与脚本运行时。
  - **Web 端** (`apps/web`)：React 19、Vite、Tailwind CSS、shadcn/ui。
  - **服务端 / API** (`apps/api`)：基于 Hono 框架构建，生产环境运行于 Cloudflare Workers，使用 D1 (SQLite) 数据库、R2 (`stillnote-resources`) 对象存储以及 KV。
  - **移动端**：
    - Android 客户端：位于 `apps/mobile`，基于 Expo / React Native 构建。
    - iOS 客户端：位于 `apps/ios`，基于 Swift / SwiftUI 原生开发。
  - **桌面端** (`apps/desktop`)：基于 Electron 构建，打包 Web 端应用，支持跨平台本地数据缓存与桌面原生特性。
  - **官网与展示站** (`apps/site`)：基于 Astro 框架构建。
  - **共享包** (`packages/*`)：公共业务逻辑、类型定义及数据转换工具库。

## 开发与验证规范

- **本地启动**：默认 `bun run dev`（同时启动 Web 与 API 本地开发环境）；纯前端使用 `bun run dev:web`；远程实例联调使用 `STILLNOTE_INSTANCE=<实例名> bun run dev:remote`。
- **质量验证**：代码提交前必须执行并通过基础类型检查与构建验证：
  - `bun run typecheck`（主项目类型检查）
  - `bun run typecheck:mobile`（移动端类型检查）
  - `bun run build:web`（Web 端编译构建）
- **面向所有用户生效**：解决问题或新增功能时，必须把实现写进仓库的产品代码，让后续版本里的所有用户生效；不得只处理维护者本机的配置、进程或临时状态。
- **组件与依赖规范**：严禁重复实现已有成熟方案；优先采用维护活跃、广泛验证的开源依赖，并优先复用 `shadcn/ui`；复杂或重复模块封装为独立组件。
- **产品体验原则**：UI 和交互的核心原则是——产品始终表现得**可靠、可预测、确定、被接住**。
- **悬停与聚焦提示**：所有悬停或聚焦提示严禁使用 HTML 原生 `title` 属性；Web 端统一使用 shadcn/ui 的 `Tooltip` 组件，并确保键盘聚焦时同样可见。

## 环境、数据与架构约束

- **AI 模型 API 优先客户端直连**：所有平台、所有功能的 AI 模型 API 请求优先由客户端直接调用模型服务；Web 端遇到浏览器网络或 CORS 限制时，允许通过 StillNote 后端兜底。桌面端及原生移动端保持直连；已有 HTTP 响应或开始接收流式结果后，不得因错误自动切换到后端重复调用。
- **Cloudflare 部署**：按 `docs/agent-deploy-cloudflare.md` 执行，生产环境统一绑定 D1 (`stillnote`) 与 R2 (`stillnote-resources`)。
- **跨运行时解耦架构**：保持业务逻辑与 Cloudflare 解耦，预留 Docker / 本地自托管扩展支持，Cloudflare 与 Docker 共用同一套核心业务代码。
- **数据库 Migration**：数据库变更必须在 `migrations/` 下新增递增编号的 SQL 文件，严禁修改已执行的历史 Migration。
- **数据库读取预算**：分页、同步和备份避免无限制的全量扫描与轮询，保护数据库读取额度。

## 文档与协作规范

- **技术文档参考**：优先参考根目录 `README.md` 与各子目录 README。
- **多语言文档同步**：修改中文文档时同步更新对应的英文文档。
- **GitHub 沟通对等**：回复 Issue、PR 时使用对方的主要语言：英文用英文，中文用中文。
- **基于 Issue 提交**：功能或 Bug 修复提交 commit 时关联对应的 GitHub Issue。
- **代码合并同步**：代理将 PR 或分支合并进 `main` 后，在工作区干净的状态下执行 `git fetch` 并快进到 `origin/main`。

## 品牌视觉规范 / Brand Identity

- **品牌名称**：StillNote
- **品牌色调**：复用现有的 UI 黑灰配色，Logo 图形色 `#07130B`。
- **图标同步**：修改 Logo 或品牌资产后，执行 `bun run prepare:brand:icons` 同步各端平台资源。
