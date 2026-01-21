export default {
  // Page titles
  title: 'Document Manager',
  desc: 'Personal knowledge base, create, edit and manage your documents',

  // Document list
  doc_list_title: 'My Documents',
  doc_list_empty: 'No documents yet',
  doc_list_empty_desc: 'Click the button below to create your first document',
  create_doc: 'New Document',
  create_from_template: 'Create from Template',
  sort_by_updated: 'Sort by Updated',
  sort_by_created: 'Sort by Created',
  sort_by_title: 'Sort by Title',

  // Document card
  doc_card_updated: 'Updated',
  doc_card_created: 'Created',
  doc_card_synced: 'Synced',
  doc_card_not_synced: 'Not synced',
  doc_card_delete: 'Delete',
  doc_card_edit: 'Edit',
  doc_card_sync: 'Sync to GitHub',
  doc_card_view: 'View',

  // Editor
  editor_title: 'Edit Document',
  editor_untitled: 'Untitled Document',
  editor_save: 'Save',
  editor_saving: 'Saving...',
  editor_saved: 'Saved',
  editor_save_failed: 'Save failed',
  editor_auto_save: 'Auto save',
  editor_placeholder: 'Start typing, or type / to invoke AI assistant...',
  editor_back: 'Back to list',

  // Editor toolbar
  toolbar_bold: 'Bold',
  toolbar_italic: 'Italic',
  toolbar_underline: 'Underline',
  toolbar_strike: 'Strikethrough',
  toolbar_code: 'Inline Code',
  toolbar_heading1: 'Heading 1',
  toolbar_heading2: 'Heading 2',
  toolbar_heading3: 'Heading 3',
  toolbar_bullet_list: 'Bullet List',
  toolbar_ordered_list: 'Ordered List',
  toolbar_task_list: 'Task List',
  toolbar_blockquote: 'Blockquote',
  toolbar_code_block: 'Code Block',
  toolbar_horizontal_rule: 'Horizontal Rule',
  toolbar_link: 'Link',
  toolbar_image: 'Image',
  toolbar_table: 'Table',
  toolbar_undo: 'Undo',
  toolbar_redo: 'Redo',

  // AI features
  ai_menu_title: 'AI Assistant',
  ai_polish: 'Polish Text',
  ai_polish_desc: 'Improve writing style and flow',
  ai_continue: 'Continue Writing',
  ai_continue_desc: 'Continue based on context',
  ai_summarize: 'Summarize',
  ai_summarize_desc: 'Extract key points from the document',
  ai_rewrite: 'Rewrite',
  ai_rewrite_desc: 'Express the same content differently',
  ai_expand: 'Expand',
  ai_expand_desc: 'Enrich and expand current content',
  ai_simplify: 'Simplify',
  ai_simplify_desc: 'Make content more concise',
  ai_translate: 'Translate',
  ai_translate_desc: 'Translate to other languages',
  ai_search_knowledge: 'Search Knowledge Base',
  ai_search_knowledge_desc: 'Find related content in existing documents',
  ai_processing: 'AI processing...',
  ai_no_content: 'Please select or enter content first',
  ai_error: 'AI processing failed',
  ai_insert: 'Insert',
  ai_replace: 'Replace',
  ai_copy: 'Copy',

  // Template management
  templates_title: 'Document Templates',
  templates_desc: 'Quickly create documents using templates',
  templates_builtin: 'Built-in Templates',
  templates_custom: 'Custom Templates',
  templates_create: 'Create Template',
  templates_edit: 'Edit Template',
  templates_delete: 'Delete Template',
  templates_use: 'Use Template',
  templates_empty: 'No custom templates',
  templates_empty_desc: 'You can create templates from existing documents',

  // Template form
  template_name: 'Template Name',
  template_name_placeholder: 'Enter template name',
  template_description: 'Template Description',
  template_description_placeholder: 'Briefly describe the template purpose',
  template_category: 'Category',
  template_content: 'Template Content',
  template_save: 'Save Template',

  // Template categories
  category_general: 'General',
  category_work: 'Work',
  category_study: 'Study',
  category_personal: 'Personal',

  // Preset template names
  template_blank: 'Blank Document',
  template_blank_desc: 'Start from scratch',
  template_weekly_report: 'Weekly Report',
  template_weekly_report_desc: 'Weekly work report format',
  template_project_doc: 'Project Document',
  template_project_doc_desc: 'Project documentation format',
  template_reading_notes: 'Reading Notes',
  template_reading_notes_desc: 'Reading notes format',

  // GitHub sync
  sync_title: 'GitHub Sync',
  sync_desc: 'Sync documents to GitHub repository',
  sync_config: 'Sync Configuration',
  sync_repo: 'Repository',
  sync_repo_placeholder: 'Select or enter repository name',
  sync_branch: 'Branch',
  sync_directory: 'Document Directory',
  sync_directory_placeholder: 'e.g., docs',
  sync_image_directory: 'Image Directory',
  sync_auto_sync: 'Auto Sync',
  sync_auto_sync_desc: 'Automatically sync when saving',
  sync_now: 'Sync Now',
  sync_syncing: 'Syncing...',
  sync_success: 'Sync successful',
  sync_failed: 'Sync failed',
  sync_create_repo: 'Create New Repository',
  sync_select_repo: 'Select Existing Repository',
  sync_no_token: 'Please configure GitHub Token in settings first',
  sync_pull: 'Pull from GitHub',
  sync_push: 'Push to GitHub',
  sync_conflict: 'Conflict detected',
  sync_conflict_desc:
    'Local and remote versions differ, please choose which to keep',
  sync_keep_local: 'Keep Local',
  sync_keep_remote: 'Use Remote',

  // Search
  search_title: 'Search Knowledge Base',
  search_placeholder: 'Enter keywords to search...',
  search_no_results: 'No documents found',
  search_results: 'Search Results',
  search_insert_reference: 'Insert Reference',

  // Confirmation dialogs
  delete_doc_title: 'Delete Document',
  delete_doc_desc:
    'Are you sure you want to delete "{{title}}"? This action cannot be undone.',
  delete_template_title: 'Delete Template',
  delete_template_desc: 'Are you sure you want to delete template "{{name}}"?',
  confirm_delete: 'Confirm Delete',
  cancel: 'Cancel',

  // Toast messages
  doc_created: 'Document created successfully',
  doc_updated: 'Document updated',
  doc_deleted: 'Document deleted',
  template_created: 'Template created successfully',
  template_deleted: 'Template deleted',
  copied_to_clipboard: 'Copied to clipboard',

  // Settings
  settings_title: 'Document Manager Settings',
  settings_default_provider: 'Default AI Provider',
  settings_default_provider_desc:
    'Default LLM provider for document AI features'
};
