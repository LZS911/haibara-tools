export default {
  // 页面标题和描述
  title: 'Git 项目管理',
  description: '管理本地 Git 仓库，自动生成提交信息和 PR，智能生成周报',

  // 仓库列表页
  no_repositories: '暂无仓库',
  no_repositories_desc: '点击下方按钮添加您的第一个 Git 仓库',
  add_repository: '添加仓库',
  repository_card_updated: '更新于 {{time}}',
  repository_card_path: '本地路径: {{path}}',
  repository_card_github: 'GitHub: {{owner}}/{{repo}}',

  // 添加仓库对话框
  add_repo_dialog_title: '添加 Git 仓库',
  add_repo_dialog_desc: '选择本地 Git 仓库文件夹并关联 GitHub 远程仓库',
  repo_name: '仓库名称',
  repo_name_placeholder: '请输入仓库名称',
  local_path: '本地路径',
  select_folder: '选择文件夹',
  github_owner: 'GitHub 用户名/组织',
  github_owner_placeholder: '例如: facebook',
  github_repo: 'GitHub 仓库名',
  github_repo_placeholder: '例如: react',
  default_branch: '默认分支',
  default_branch_placeholder: '例如: main',
  verifying_repo: '正在验证仓库...',
  add_repo_success: '仓库添加成功',
  add_repo_failed: '添加仓库失败',
  not_a_git_repo: '所选文件夹不是有效的 Git 仓库',

  // 项目详情页
  project_detail_title: '项目详情',
  back_to_list: '返回列表',

  // Tab 标签
  tab_changes: '变更与提交',
  tab_pr_records: 'PR 记录',

  // 文件变更
  file_changes: '文件变更',
  no_changes: '没有文件变更',
  no_changes_desc: '当前工作目录是干净的',
  changes_count: '共 {{count}} 个文件变更',
  file_status_added: '新增',
  file_status_modified: '修改',
  file_status_deleted: '删除',
  file_status_renamed: '重命名',

  // 提交信息编辑器
  change_description: '变更描述',
  change_description_placeholder: '请详细描述本次代码变更的内容和目的...',
  generate_commit_message: '生成 Commit Message',
  generating_commit_message: '正在生成...',
  commit_message: 'Commit Message',
  commit_message_placeholder: 'AI 生成的提交信息将显示在这里',
  edit_commit_message: '您可以编辑生成的提交信息',

  // 目标分支选择
  target_branch: '目标分支',
  current_branch: '当前分支: {{branch}}',
  select_target_branch: '选择目标分支',
  loading_branches: '加载分支列表...',

  // 提交并创建 PR
  commit_and_create_pr: '提交并创建 PR',
  committing: '正在提交...',
  commit_success: '提交成功',
  commit_failed: '提交失败',
  please_input_description: '请输入变更描述',
  please_generate_commit_message: '请先生成 Commit Message',
  please_select_target_branch: '请选择目标分支',

  // 确认对话框
  confirm_commit_title: '确认提交',
  confirm_commit_desc: '将执行以下 Git 操作:',
  confirm_commit_steps:
    '1. git add .\n2. git commit -m "{{message}}"\n3. git push origin {{branch}}\n4. 创建 Pull Request',
  confirm_commit_warning: '请确保您已检查文件变更并准备好推送到远程仓库',

  // PR 记录列表
  pr_records: 'PR 记录',
  no_pr_records: '暂无 PR 记录',
  no_pr_records_desc: '点击右上角的刷新按钮从 GitHub 同步 PR 记录',
  sync_pr_records: '同步 PR 记录',
  syncing_pr_records: '正在同步...',
  sync_success: '同步成功，共 {{count}} 条记录',
  sync_failed: '同步失败',

  // PR 卡片
  pr_state_open: '进行中',
  pr_state_closed: '已关闭',
  pr_state_merged: '已合并',
  pr_number: '#{{number}}',
  pr_author: '作者: {{author}}',
  pr_created_at: '创建于 {{time}}',
  pr_branches: '{{head}} → {{base}}',
  view_on_github: '在 GitHub 上查看',
  select_for_report: '选择用于周报',

  // 周报生成对话框
  generate_weekly_report: '生成周报',
  weekly_report_dialog_title: '生成周报',
  weekly_report_dialog_desc: '选择项目和时间范围，生成智能周报',
  select_repositories: '选择项目',
  select_repositories_placeholder: '选择一个或多个项目',
  time_range: '时间范围',
  last_week: '最近一周',
  last_month: '最近一月',
  custom_range: '自定义',
  start_time: '开始时间',
  end_time: '结束时间',
  selected_prs: '已选择 PR',
  no_prs_selected: '未选择任何 PR',
  select_all: '全选',
  deselect_all: '取消全选',
  generating_report: '正在生成周报...',
  generate_report: '生成周报',
  report_generated: '周报生成成功',
  copy_report: '复制周报',
  export_report: '导出为 Markdown',
  copy_success: '已复制到剪贴板',

  // 通用
  cancel: '取消',
  confirm: '确认',
  save: '保存',
  delete: '删除',
  edit: '编辑',
  refresh: '刷新',
  loading: '加载中...',
  error: '错误',
  success: '成功',

  // 错误信息
  github_token_not_configured: 'GitHub Token 未配置',
  github_token_not_configured_desc:
    '请前往设置页面配置 GitHub Personal Access Token',
  go_to_settings: '前往设置',
  llm_not_configured: 'LLM 未配置',
  llm_not_configured_desc: '请前往设置页面配置至少一个 LLM 提供商',
  operation_failed: '操作失败: {{error}}'
};
