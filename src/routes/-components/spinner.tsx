import clsx from 'clsx';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={clsx('inline-block animate-spin px-3', className)}>⍥</div>
  );
}
