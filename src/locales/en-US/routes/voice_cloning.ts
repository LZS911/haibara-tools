export default {
  // Training page
  training_page_title: 'Voice Training',
  training_page_desc:
    'Extract voice from video and train your custom voice model',

  // Input section
  input_bv_placeholder: 'Enter BV ID or full URL',
  start_training_button: 'Start Training',
  downloading_audio: 'Downloading audio...',
  download_complete: 'Download complete',

  // Training form
  speaker_id_label: 'Speaker ID',
  speaker_id_placeholder: 'Set a unique ID for this voice',
  video_title_label: 'Video Title',

  // Speaker Management
  speaker_management_title: 'Speaker Management',
  add_speaker_button: 'Add Speaker',
  no_speakers_added: 'No speakers added yet.',
  added_on: 'Added on',
  add_speaker_title: 'Add New Speaker ID',
  add_speaker_desc: 'Enter the Speaker ID and a descriptive name.',
  speaker_name_label: 'Speaker Name',
  save_speaker_button: 'Save Speaker',
  select_speaker_placeholder: 'Select a speaker ID',
  speaker_status_list_title: 'Speaker Status List',
  no_speakers_to_display: 'No speakers to display.',

  // Training list
  training_list_title: 'Training List',
  training_list_empty: 'No training records',
  training_status_not_found: 'Not Found',
  training_status_training: 'Training',
  training_status_success: 'Completed',
  training_status_failed: 'Failed',
  training_status_active: 'Active',

  // Training actions
  check_status: 'Check Status',
  delete_training: 'Delete',
  use_for_synthesis: 'Use This Voice',
  confirm_delete_title: 'Confirm Delete',
  confirm_delete_desc: 'Are you sure you want to delete this training record?',
  delete_success: 'Deleted successfully',
  delete_failed: 'Failed to delete',
  confirm_delete_speaker_title: 'Confirm Delete Speaker',
  confirm_delete_speaker_desc:
    'Are you sure you want to delete this speaker ID? This action cannot be undone.',
  delete_speaker_success: 'Speaker deleted successfully',
  delete_speaker_failed: 'Failed to delete speaker',

  // Synthesis page
  synthesis_page_title: 'Speech Synthesis',
  synthesis_page_desc: 'Generate speech using trained voices',

  // Voice selection
  select_voice_label: 'Select Voice',
  select_voice_placeholder: 'Please select a trained voice',
  no_trained_voices: 'No available voices, please train a voice first',
  refresh_voice_list: 'Refresh List',

  // Text input
  text_input_label: 'Input Text',
  text_input_placeholder: 'Enter the text to convert...',
  text_input_help: 'Maximum 500 characters',

  // Synthesis control
  generate_button: 'Generate Audio',
  generating: 'Generating...',
  generate_success: 'Generated successfully!',
  generate_failed: 'Generation failed',

  // Audio player
  audio_player_title: 'Generated Audio',
  download_audio: 'Download Audio',
  play_audio: 'Play',
  pause_audio: 'Pause',

  // History
  history_title: 'Synthesis History',
  history_desc: 'View your previously generated audio.',
  no_history: 'No history yet.',
  delete_history_success: 'History item deleted successfully.',

  // Error messages
  error_download_failed: 'Download failed',
  error_training_failed: 'Training failed',
  error_synthesis_failed: 'Synthesis failed',
  error_no_speaker_id: 'Please select a speaker ID',
  error_no_text: 'Please enter text to synthesize',
  error_no_voice_selected: 'Please select a voice',
  error_speaker_id_name_required: 'Speaker ID and Name are required.',
  error_add_speaker_failed: 'Failed to add speaker',

  // Progress messages
  progress_downloading: 'Downloading audio',
  progress_converting: 'Converting format',
  progress_uploading: 'Uploading to engine',
  progress_training: 'Training',
  progress_completed: 'Completed',

  // Others
  reset: 'Reset',
  cancel: 'Cancel',
  confirm: 'Confirm',
  loading: 'Loading...',
  voice_label: 'Voice',
  play_history_tooltip: 'Play',
  download_history_tooltip: 'Download',
  open_folder_button: 'Open Containing Folder'
};
