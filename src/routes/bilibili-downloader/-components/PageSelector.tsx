import { Checkbox } from '@/routes/-components/ui/checkbox';
import type { Page } from '../-types';

interface PageSelectorProps {
  pages: Page[];
  selectedPages: number[];
  onSelectionChange: (selected: number[]) => void;
}

export function PageSelector({
  pages,
  selectedPages,
  onSelectionChange
}: PageSelectorProps) {
  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(pages.map((p) => p.page));
    } else {
      onSelectionChange([]);
    }
  };

  const handleTogglePage = (page: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedPages, page]);
    } else {
      onSelectionChange(selectedPages.filter((p) => p !== page));
    }
  };

  const allSelected = selectedPages.length === pages.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all"
          checked={allSelected}
          onCheckedChange={handleToggleAll}
        />
        <label htmlFor="select-all" className="font-medium">
          全选
        </label>
      </div>
      <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-4">
        {pages.map((p) => (
          <div key={p.page} className="flex items-center gap-2">
            <Checkbox
              id={`page-${p.page}`}
              checked={selectedPages.includes(p.page)}
              onCheckedChange={(checked) =>
                handleTogglePage(p.page, checked as boolean)
              }
            />
            <label
              htmlFor={`page-${p.page}`}
              className="w-full cursor-pointer truncate rounded-md p-2 hover:bg-slate-50"
              title={p.title}
            >
              {`P${p.page} ${p.title}`}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
