export default {
  web_title: 'Haibara Tools',
  web_desc:
    'A collection of useful tools to help you with everyday tasks. Simple, fast, and reliable.',

  home: 'Home',

  tool_file_converter_title: 'File Converter',
  tool_file_converter_desc:
    'Convert text, video, and audio files between different formats with ease.',
  tool_file_converter_btn: 'Open Converter',
  tool_coming_soon_title: 'Coming Soon',
  tool_coming_soon_desc: 'More tools are being developed. Stay tuned!',
  tool_coming_soon_btn: 'Coming Soon',

  convert_title: 'File Converter',
  convert_desc:
    'Convert your files between different formats quickly and easily',
  upload_title: 'Upload File',
  upload_desc: 'Drag and drop your file here or click to browse',
  upload_drop: 'Drop your file here',
  upload_or: 'or',
  upload_btn: 'Choose File',

  tab_text: 'Text',
  tab_image: 'Image',
  tab_audio: 'Audio',
  tab_video: 'Video',
  ai_convert_title: 'AI Media to Docs',
  ai_convert_desc: 'Enter a Bilibili video BV ID, and AI will generate summaries, articles, notes, and other document formats for you.',

  select_convert_type: 'Select a conversion type',
  select_convert_type_desc:
    'Pick a pair to start converting. You can also use the upload area above.',
  pair_from_to: '{{from}} → {{to}}',
  accept_types: 'Accept: {{types}}',

  status_idle: 'Ready',
  status_uploading: 'Uploading...', 
  status_processing: 'Processing...', 
  status_done: 'Done',
  status_error: 'Failed',
  download_result: 'Download',
  clear: 'Clear',

  section_text_title: 'Text Files',
  section_text_desc: 'Convert between Markdown, DOC, DOCX, PDF, and more',
  section_video_title: 'Video Files',
  section_video_desc: 'Convert between MP4, AVI, MOV, MKV, and more',
  section_audio_title: 'Audio Files',
  section_audio_desc: 'Convert between MP3, WAV, FLAC, AAC, and more',
  section_image_title: 'Image Files',
  section_image_desc: 'Convert between JPG, PNG, GIF, WebP, and more',

  convert_btn: 'Convert',

  txt_to_docx: 'TXT → DOCX',
  docx_to_pdf: 'DOCX → PDF',
  pdf_to_txt: 'PDF → TXT',
  mp4_to_avi: 'MP4 → AVI',
  mov_to_mp4: 'MOV → MP4',
  mkv_to_mp4: 'MKV → MP4',
  mp3_to_wav: 'MP3 → WAV',
  wav_to_flac: 'WAV → FLAC',
  aac_to_mp3: 'AAC → MP3',
  jpg_to_png: 'JPG → PNG',
  png_to_webp: 'PNG → WebP',
  gif_to_webp: 'GIF → WebP',

  // Steps
  step_select_type: 'Select Conversion Type',
  step_upload_file: 'Upload File',
  step_converting: 'Converting',
  step_completed: 'Completed',
  step1_select_type: 'Step 1: Select Conversion Type',
  step2_upload_file: 'Step 2: Upload File',
  step3_converting: 'Step 3: Converting',
  step4_completed: 'Conversion Completed!',

  // Step descriptions
  select_convert_type_format:
    'Choose the file conversion type and format you need',
  drag_upload_file_desc:
    'Drag the {{type}} file to the area below or click to select',
  processing_file_please_wait: 'Processing your file, please wait...', 
  file_ready_download: 'File converted successfully, ready to download',

  // PairList component
  no_convert_types_available: 'No conversion types available',
  please_select_other_category: 'Please select another file category',
  selected_conversion: '✨ Selected conversion',
  select_source_format: 'Select source file format',
  select_target_format: 'Select target format',
  convert_from_format: 'Convert from {{format}} format',
  no_target_formats_available: 'No target formats available for this format',
  conversion_ready: 'Conversion ready',
  continue_to_upload: 'Continue to upload',

  // UploadDropzone component
  drop_file_to_convert: '🎯 Drop file to start conversion',
  release_file_here: 'Release file here',
  file_type_not_supported: '❌ File type not supported',
  please_select_file_types: 'Please select {{types}} format files',
  please_select_convert_type_first: '⏳ Please select conversion type first',
  select_convert_type_above: 'Select the file conversion type above',
  upload_file_type: '📁 Upload {{type}} file',
  drag_file_or_click_select: 'Drag {{type}} file here or click to select',
  file_will_convert_to: 'File will be converted to {{type}} format',
  supported_formats_label: 'Supported formats',
  drop_file_to_start_convert: 'Drop file to start conversion',

  // Action buttons
  back_to_select_type: '← Back to select type',
  download_converted_file: '📥 Download converted file',
  start_new_conversion: '🔄 Start new conversion',

  // Status and results
  conversion_success: 'Conversion successful!',
  file_converted_from_to:
    'Your file has been successfully converted from {{from}} to {{to}}',
  conversion_failed: 'Conversion failed',

  // ProgressBar component
  progress_uploading_file: 'Uploading file...', 
  progress_converting_file: 'Converting file...', 
  progress_conversion_completed: 'Conversion completed!',
  progress_conversion_failed: 'Conversion failed',
  progress_preparing: 'Preparing...', 
  progress_processing_file: 'Processing file',
  progress_percent_complete: '{{progress}}% complete',
  progress_label: 'Progress',
  progress_create_task: 'Create task',
  progress_upload_file: 'Upload file',
  progress_start_conversion: 'Start conversion',
  progress_conversion_complete: 'Conversion complete',
  progress_animation_effect: 'Animation effect',
  progress_stage_indicator: 'Progress stage indicator',
  progress_loading_animation: 'Loading animation (shown during processing)',

  // Settings page
  settings: 'Settings',
  settings_title: 'Application Settings',
  settings_desc: 'Configure API Keys and app settings',
  settings_save: 'Save Configuration',
  settings_saving: 'Saving...', 
  settings_save_success: 'Configuration saved successfully!',
  settings_save_failed: 'Failed to save configuration: {{error}}',
  settings_save_fail_base: 'Failed to save configuration',
  settings_load_fail: 'Failed to load configuration',
  settings_config_location: 'Configuration file location',
  settings_app_version: 'App version: {{appVersion}}',
  settings_llm_section: 'LLM Provider Configuration',
  settings_provider_configured: 'Configured',
  settings_back_to_providers: '← Back to provider list',
  settings_api_key_placeholder: 'Enter API Key',
  settings_default_model: 'Default: {{model}}',
  settings_volc_asr_section: 'Volcano Engine ASR Configuration',
  settings_volc_asr_title: 'Speech Recognition Service',
  settings_volc_asr_desc:
    'Used for speech recognition in the video to document feature',
  settings_app_id_placeholder: 'Enter App ID',
  settings_access_token_placeholder: 'Enter Access Token',

  // LLM Providers
  settings_openai: 'OpenAI',
  settings_openai_desc: 'GPT-4, GPT-3.5, and other models',
  settings_deepseek: 'DeepSeek',
  settings_deepseek_desc: 'Chinese optimized, cost-effective',
  settings_gemini: 'Google Gemini',
  settings_gemini_desc: 'Free tier available, great for development',
  settings_claude: 'Anthropic Claude',
  settings_claude_desc: 'Long context, high-quality output',
  settings_openrouter: 'OpenRouter',
  settings_openrouter_desc: 'Unified access to multiple models',
  settings_groq: 'Groq',
  settings_groq_desc: 'Ultra-fast inference speed',
  settings_cohere: 'Cohere',
  settings_cohere_desc: 'Enterprise-grade AI',
  settings_volc_asr: 'Volcano Engine ASR',

  // Update notifications
  update_available: 'Update Available',
  update_version_available: 'Version {{version}} is now available',
  update_download: 'Download Update',
  update_downloading: 'Downloading...', 
  update_download_progress: '{{progress}}% complete',
  update_downloaded: 'Update Downloaded',
  update_install: 'Restart and Install',
  update_install_desc: 'Restart the app to install version {{version}}',
  update_error: 'Update failed, please try again later',
  update_check: 'Check for Updates',

  // Sidebar navigation
  nav_home: 'Home',
  nav_convert: 'File Converter',
  nav_media_to_docs: 'AI Media to Docs',
  nav_settings: 'Settings',
  nav_cache_management: 'Cache Management',
  sidebar_tools: 'Tools',
  sidebar_manage: 'Manage',
  sidebar_system: 'System',
  sidebar_dashboard: 'Dashboard',

  // Cache Management Page
  cache_management_title: 'Cache Management',
  cache_management_desc:
    'Manage cached data for video downloads and transcriptions',
  cache_management_refreshing: 'Refreshing...', 
  cache_management_refresh: 'Refresh',
  cache_management_clearing: 'Clearing...', 
  cache_management_clear_expired: 'Clear Expired',
  cache_management_total_count: 'Total Caches',
  cache_management_transcribed_count: 'Transcribed',
  cache_management_total_size: 'Total Size',
  cache_management_list_title: 'Cache List',
  cache_management_loading: 'Loading...', 
  cache_management_no_data: 'No cached data found',
  cache_management_no_data_desc:
    'Cache will be stored here after downloading videos',
  cache_management_go_to_media_to_docs: 'Go to AI Media to Docs',
  cache_management_transcribed: 'Transcribed',
  cache_management_deleting: 'Deleting...', 
  cache_management_delete: 'Delete',
  cache_management_delete_confirm:
    'Are you sure you want to delete the cache for {{bvId}}?',
  cache_management_delete_success: 'Cache deleted successfully',
  cache_management_delete_fail: 'Failed to delete cache: {{error}}',
  cache_management_clear_expired_confirm:
    'Are you sure you want to clear caches older than 7 days?',
  cache_management_clear_expired_success:
    'Successfully cleared {{count}} expired caches',
  cache_management_clear_expired_fail:
    'Failed to clear expired caches: {{error}}',

  // Style Selector
  style_xiaohongshu: 'Xiaohongshu Style',
  style_wechat: 'WeChat Style',
  style_notes: 'Knowledge Notes',
  style_mindmap: 'Mind Map',
  style_summary: 'Content Summary',

  // Dashboard
  dashboard_welcome: 'Welcome to Haibara Tools',
  dashboard_electron_mode: 'Electron Mode',
  dashboard_quick_actions: 'Quick Actions',
  dashboard_stats: 'Statistics',
  dashboard_recent_activity: 'Recent Activity',
  dashboard_no_recent_activity: 'No recent activity',
  dashboard_config_tip_title: 'Configuration Tip',
  dashboard_config_tip_desc:
    'First time user? Please go to the settings page to configure your API Keys to use AI-related features.',
  dashboard_go_to_settings: 'Go to Settings',
  dashboard_quick_action_convert_desc: 'Convert file formats quickly',
  dashboard_quick_action_media_to_docs_desc:
    'Smart video to document conversion',
  dashboard_stat_today: "Today's Conversions",
  dashboard_stat_week: "This Week's Conversions",
  dashboard_stat_total: 'Total Conversions',

  // AI Media to Docs Page
  timeline_view: 'Timeline',
  document_view: 'Document',
  download_failed_check_bv: 'Download failed, please check if the BV ID is correct',
  generated_content_title: 'AI Generated Content'
};
