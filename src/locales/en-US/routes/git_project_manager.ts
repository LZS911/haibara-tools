export default {
  // Page titles and descriptions
  title: 'Git Project Manager',
  description:
    'Manage local Git repositories, auto-generate commit messages and PRs, intelligently create weekly reports',

  // Repository list page
  no_repositories: 'No Repositories',
  no_repositories_desc:
    'Click the button below to add your first Git repository',
  add_repository: 'Add Repository',
  repository_card_updated: 'Updated {{time}}',
  repository_card_path: 'Local Path: {{path}}',
  repository_card_github: 'GitHub: {{owner}}/{{repo}}',

  // Add repository dialog
  add_repo_dialog_title: 'Add Git Repository',
  add_repo_dialog_desc:
    'Select a local Git repository folder and link it to a GitHub remote repository',
  repo_name: 'Repository Name',
  repo_name_placeholder: 'Enter repository name',
  local_path: 'Local Path',
  select_folder: 'Select Folder',
  github_owner: 'GitHub Owner/Organization',
  github_owner_placeholder: 'e.g., facebook',
  github_repo: 'GitHub Repository',
  github_repo_placeholder: 'e.g., react',
  default_branch: 'Default Branch',
  default_branch_placeholder: 'e.g., main',
  verifying_repo: 'Verifying repository...',
  add_repo_success: 'Repository added successfully',
  add_repo_failed: 'Failed to add repository',
  not_a_git_repo: 'Selected folder is not a valid Git repository',
  // Auto detection
  auto_detecting_remote: 'Auto-detecting remote and default branch…',
  remote_not_found: 'No remote (origin) detected.',
  unsupported_remote_host: 'Unable to parse remote URL or unsupported host.',
  only_github_fully_supported:
    'Only GitHub repositories are fully supported at the moment. Please fill in fields manually.',
  default_branch_detect_failed:
    'Failed to detect default branch, falling back to {{fallback}}',

  // Project detail page
  project_detail_title: 'Project Details',
  back_to_list: 'Back to List',

  // Tab labels
  tab_changes: 'Changes & Commit',
  tab_pr_records: 'PR Records',

  // File changes
  file_changes: 'File Changes',
  no_changes: 'No File Changes',
  no_changes_desc: 'Working directory is clean',
  changes_count: '{{count}} file(s) changed',
  file_status_added: 'Added',
  file_status_modified: 'Modified',
  file_status_deleted: 'Deleted',
  file_status_renamed: 'Renamed',

  // Commit message editor
  change_description: 'Change Description',
  change_description_placeholder:
    'Please describe the content and purpose of this code change in detail...',
  generate_commit_message: 'Generate Commit Message',
  generating_commit_message: 'Generating...',
  commit_message: 'Commit Message',
  commit_message_placeholder: 'AI-generated commit message will appear here',
  edit_commit_message: 'You can edit the generated commit message',

  // Target branch selection
  target_branch: 'Target Branch',
  current_branch: 'Current Branch: {{branch}}',
  select_target_branch: 'Select Target Branch',
  loading_branches: 'Loading branches...',
  filter_branches_placeholder: 'Filter branches...',
  no_branch_found: 'No branch found.',

  // Commit and create PR
  create_github_pr: 'Create GitHub PR',
  commit_and_create_pr: 'Commit & Create PR',
  commit_and_push: 'Commit & Push',
  committing: 'Committing...',
  commit_success: 'Commit successful',
  commit_failed: 'Commit failed',
  please_input_description: 'Please enter change description',
  please_generate_commit_message: 'Please generate commit message first',
  please_select_target_branch: 'Please select target branch',

  pr_title: 'PR Title',
  pr_title_placeholder: 'Optional, defaults to Commit Message',

  adding_files: 'Adding files...',
  committing_changes: 'Committing changes...',
  pushing_changes: 'Pushing changes...',
  creating_pr: 'Creating PR...',
  syncing_prs: 'Syncing PR records...',

  // Confirmation dialog
  confirm_commit_title: 'Confirm Commit & Create PR',
  confirm_commit_push_title: 'Confirm Commit & Push',
  confirm_commit_desc:
    'This will commit, push, and create a pull request. The following Git operations will be executed:',
  confirm_commit_push_desc:
    'This will commit and push the changes. The following Git operations will be executed:',
  confirm_commit_steps:
    '1. git add .\n2. git commit -m "{{message}}"\n3. git push origin {{branch}}\n4. Create Pull Request',
  confirm_commit_push_steps:
    '1. git add .\n2. git commit -m "{{message}}"\n3. git push origin {{branch}}',
  confirm_commit_warning:
    'Please ensure you have reviewed the file changes and are ready to push to the remote repository',

  // PR records list
  pr_records: 'PR Records',
  no_pr_records: 'No PR Records',
  no_pr_records_desc:
    'Click the refresh button in the top right to sync PR records from GitHub',
  sync_pr_records: 'Sync PR Records',
  syncing_pr_records: 'Syncing...',
  sync_success: 'Synced successfully, {{count}} record(s)',
  sync_failed: 'Sync failed',

  // PR card
  pr_state_open: 'Open',
  pr_state_closed: 'Closed',
  pr_state_merged: 'Merged',
  pr_number: '#{{number}}',
  pr_author: 'Author: {{author}}',
  pr_created_at: 'Created {{time}}',
  pr_branches: '{{head}} → {{base}}',
  view_on_github: 'View on GitHub',
  select_for_report: 'Select for Report',

  // Weekly report dialog
  generate_weekly_report: 'Generate Weekly Report',
  weekly_report_dialog_title: 'Generate Weekly Report',
  weekly_report_dialog_desc:
    'Select projects and time range to generate intelligent weekly report',

  // Weekly report page
  weekly_report_title: 'Weekly Report',
  weekly_report_description:
    'Select projects and time range to generate intelligent weekly reports based on PR records',
  back: 'Back',
  report_configuration: 'Report Configuration',
  select_repositories_first: 'Please select repositories first',
  select_time_range_first: 'Please select time range first',
  loading_repositories: 'Loading repositories...',
  no_repositories_available: 'No repositories available',
  search_prs: 'Search PRs',
  searching: 'Searching...',
  pr_list: 'PR List',
  no_prs_found: 'No PR records found',
  prs_loaded: 'Loaded {{count}} PR record(s)',
  weekly_report: 'Weekly Report',
  select_prs_to_generate: 'Please select PRs to generate report',
  click_generate_report: 'Click generate report button to start',
  select_repositories: 'Select Projects',
  select_repositories_placeholder: 'Select one or more projects',
  time_range: 'Time Range',
  last_week: 'Last Week',
  last_month: 'Last Month',
  custom_range: 'Custom',
  start_time: 'Start Time',
  end_time: 'End Time',
  selected_prs: 'Selected PRs',
  no_prs_selected: 'No PRs selected',
  select_all: 'Select All',
  deselect_all: 'Deselect All',
  generating_report: 'Generating report...',
  generate_report: 'Generate Report',
  report_generated: 'Report generated successfully',
  copy_report: 'Copy Report',
  export_report: 'Export as Markdown',
  copy_success: 'Copied to clipboard',

  // Common
  cancel: 'Cancel',
  confirm: 'Confirm',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  refresh: 'Refresh',
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',

  delete_repository_confirm:
    'Are you sure you want to delete the repository "{{name}}"? This will also delete related PR records.',
  delete_repository_success: 'Repository deleted successfully',
  delete_repository_failed: 'Failed to delete repository',

  // Repository not found
  repository_not_found: 'Repository not found',
  repository_not_found_desc:
    'Please check if the repository exists or return to the list page',

  // Error messages
  github_token_not_configured: 'GitHub Token Not Configured',
  github_token_not_configured_desc:
    'Please go to settings to configure your GitHub Personal Access Token',
  go_to_settings: 'Go to Settings',
  llm_not_configured: 'LLM Not Configured',
  llm_not_configured_desc:
    'Please go to settings to configure at least one LLM provider',
  operation_failed: 'Operation failed: {{error}}'
};
