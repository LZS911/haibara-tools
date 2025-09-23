export type ConvertStep =
  | 'select-type'
  | 'upload-file'
  | 'converting'
  | 'completed';

export type ConvertStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';
