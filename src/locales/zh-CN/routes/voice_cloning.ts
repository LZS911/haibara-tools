export default {
  // 训练页面
  training_page_title: '音色训练',
  training_page_desc: '从视频中提取音色，训练您的专属语音模型',

  // 输入部分
  input_bv_placeholder: '输入 BV 号或完整 URL',
  start_training_button: '开始训练',
  downloading_audio: '正在下载音频...',
  download_complete: '下载完成',

  // 训练表单
  speaker_id_label: '音色 ID',
  speaker_id_placeholder: '为这个音色设置一个唯一 ID',
  video_title_label: '视频标题',

  // 音色管理
  speaker_management_title: '音色管理',
  add_speaker_button: '添加音色',
  no_speakers_added: '暂未添加任何音色',
  added_on: '添加于',
  add_speaker_title: '添加新音色 ID',
  add_speaker_desc: '输入音色 ID 和一个描述性名称。',
  speaker_name_label: '音色名称',
  save_speaker_button: '保存音色',
  select_speaker_placeholder: '选择一个音色 ID',
  speaker_status_list_title: '音色状态列表',
  no_speakers_to_display: '暂无音色可显示',

  // 训练列表
  training_list_title: '训练列表',
  training_list_empty: '暂无训练记录',
  training_status_not_found: '未找到',
  training_status_training: '训练中',
  training_status_success: '训练完成',
  training_status_failed: '训练失败',
  training_status_active: '已激活',
  training_status_uploading: '上传音频中',

  // 训练操作
  check_status: '查询状态',
  delete_training: '删除',
  use_for_synthesis: '使用此音色',
  confirm_delete_title: '确认删除',
  confirm_delete_desc: '确定要删除这个训练记录吗？',
  delete_success: '删除成功',
  delete_failed: '删除失败',
  status_updated: '状态已更新',
  confirm_delete_speaker_title: '确认删除音色',
  confirm_delete_speaker_desc: '确定要删除这个音色 ID 吗？此操作无法撤销。',
  delete_speaker_success: '音色删除成功',
  delete_speaker_failed: '删除音色失败',

  // 合成页面
  synthesis_page_title: '语音合成',
  synthesis_page_desc: '使用训练好的音色生成语音',

  // 音色选择
  select_voice_label: '选择音色',
  select_voice_placeholder: '请选择一个训练好的音色',
  no_trained_voices: '暂无可用音色，请先训练音色',
  refresh_voice_list: '刷新列表',

  // 文本输入
  text_input_label: '输入文本',
  text_input_placeholder: '请输入要转换的文本内容...',
  text_input_help: '最多支持 500 个字符',

  // 合成控制
  generate_button: '生成语音',
  generating: '生成中...',
  generate_success: '生成成功！',
  generate_failed: '生成失败',

  // 音频播放器
  audio_player_title: '生成的音频',
  download_audio: '下载音频',
  play_audio: '播放',
  pause_audio: '暂停',

  // History
  history_title: '合成历史',
  history_desc: '查看您之前生成的音频。',
  no_history: '暂无历史记录。',
  delete_history_success: '历史记录删除成功。',

  // 错误消息
  error_download_failed: '下载失败',
  error_training_failed: '训练失败',
  error_synthesis_failed: '合成失败',
  error_no_bv_id: '请输入 BV 号或完整 URL',
  error_no_speaker_id: '请选择一个音色 ID',
  error_no_text: '请输入要合成的文本',
  error_no_voice_selected: '请选择音色',
  error_speaker_id_name_required: '音色 ID 和名称不能为空。',
  error_add_speaker_failed: '添加音色失败',

  // 进度消息
  progress_downloading: '正在下载音频',
  progress_converting: '正在转换格式',
  progress_uploading: '正在上传到引擎',
  progress_training: '训练中',
  progress_completed: '完成',

  // 其他
  reset: '重置',
  cancel: '取消',
  confirm: '确认',
  loading: '加载中...',
  voice_label: '音色',
  play_history_tooltip: '播放',
  download_history_tooltip: '下载',
  open_folder_button: '打开所在目录'
};
