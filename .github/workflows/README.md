# GitHub Actions 工作流说明

本项目使用 GitHub Actions 进行持续集成和持续部署（CI/CD）。

## 工作流列表

### 1. 代码质量检查 (`lint.yml`)

**触发条件:**

- 创建 Pull Request 到任何分支
- 推送到 `main` 或 `dev` 分支
- 手动触发

**执行内容:**

- ✅ Prettier 格式检查
- ✅ ESLint 代码规范检查
- ✅ TypeScript 类型检查

**本地运行:**

```bash
# 运行完整的代码检查
pnpm lint

# 分别运行各项检查
pnpm prettier:c  # Prettier 检查
pnpm eslint      # ESLint 检查
pnpm ts-check    # TypeScript 类型检查

# 自动修复格式问题
pnpm prettier:w
```

### 2. Electron 应用构建 (`build-electron.yml`)

**触发条件:**

- 创建 Pull Request 到 `main` 分支
- 手动触发

**执行内容:**

1. 代码质量检查（运行 `pnpm lint`）
2. 构建客户端
3. 打包 Electron 应用（针对 macOS、Windows、Linux）
4. 上传构建产物

**跳过构建:**
在 PR 标题中添加 `[skip build]` 可以跳过构建步骤。

### 3. 创建发布 (`create-release.yml`)

**触发条件:**

- 推送到 `main` 分支

**执行内容:**

1. 从 `package.json` 读取版本号
2. 创建版本标签（如 `v0.0.1`）
3. 创建发布分支（如 `release/v0.0.1`）
4. 触发 Electron 构建工作流

## 开发工作流

### 日常开发

1. **创建功能分支**

   ```bash
   git checkout -b feature/your-feature
   ```

2. **开发和提交**

   ```bash
   # 开发完成后，先本地检查代码质量
   pnpm lint

   # 如果有格式问题，自动修复
   pnpm prettier:w

   # 提交代码
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

3. **创建 Pull Request**
   - 创建 PR 到 `dev` 或 `main` 分支
   - CI 会自动运行代码检查
   - 如果检查失败，根据错误信息修复问题

### 发布流程

1. **更新版本号**
   - 修改 `package.json` 中的 `version` 字段
   - 提交到 `main` 分支

2. **自动发布**
   - 推送到 `main` 后自动创建标签和发布分支
   - 自动触发构建工作流
   - 构建产物会上传为 GitHub Artifacts

## 常见问题

### Q: 代码检查失败怎么办？

**A:** 根据错误类型处理：

1. **Prettier 格式错误**

   ```bash
   pnpm prettier:w  # 自动修复
   ```

2. **ESLint 错误**

   ```bash
   pnpm eslint      # 查看错误详情
   # 手动修复代码规范问题
   ```

3. **TypeScript 类型错误**
   ```bash
   pnpm ts-check    # 查看类型错误
   # 修复类型定义
   ```

### Q: 如何跳过某些检查？

**A:**

- 不建议跳过检查，保持代码质量很重要
- 如果确实需要，可以在 PR 标题添加 `[skip build]` 跳过构建（但不会跳过 lint）

### Q: 构建失败怎么办？

**A:**

1. 查看 GitHub Actions 的详细日志
2. 在本地运行相同的命令复现问题
3. 修复问题后重新推送

## 最佳实践

1. ✅ **提交前先本地检查**: 运行 `pnpm lint` 确保代码质量
2. ✅ **及时修复问题**: 不要让代码检查错误累积
3. ✅ **遵循规范**: 遵守 TypeScript 严格模式，不使用 `any` 类型
4. ✅ **保持一致**: 使用 Prettier 统一代码格式
5. ✅ **语义化版本**: 遵循语义化版本规范更新版本号
