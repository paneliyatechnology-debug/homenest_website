'use client';

import React, { useRef, useId } from 'react';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';

export type ExportFormat = 'xlsx' | 'pdf' | 'csv';

export interface ExportDropdownProps {
  onExport: (format: ExportFormat) => Promise<void> | void;
  isExporting?: boolean;
  exportingFormat?: ExportFormat | null;
  label?: string;
  className?: string;
  formats?: ExportFormat[];
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExport,
  isExporting = false,
  exportingFormat = null,
  label = 'Export Report',
  className = '',
  formats = ['xlsx', 'pdf'],
}) => {
  const menuRef = useRef<Menu>(null);
  const rawId = useId();
  const menuId = `export_menu_${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const formatConfig: Record<ExportFormat, { label: string; icon: string }> = {
    xlsx: {
      label: 'Excel (.xlsx)',
      icon: 'pi pi-file-excel',
    },
    pdf: {
      label: 'PDF Document (.pdf)',
      icon: 'pi pi-file-pdf',
    },
    csv: {
      label: 'CSV (.csv)',
      icon: 'pi pi-file',
    },
  };

  const menuItems: MenuItem[] = formats.map((fmt) => ({
    label: formatConfig[fmt]?.label || fmt.toUpperCase(),
    icon: formatConfig[fmt]?.icon || 'pi pi-file',
    command: () => {
      onExport(fmt);
    },
  }));

  return (
    <div className={`relative ${className.includes('w-full') ? 'w-full' : 'inline-block'} ${className}`}>
      {/* PrimeReact Popup Menu - consistent with project's global menu theme */}
      <Menu model={menuItems} popup ref={menuRef} id={menuId} />

      {/* Minimal, Clean Action Button matching Figma design */}
      <button
        type="button"
        onClick={(e) => menuRef.current?.toggle(e)}
        disabled={isExporting}
        aria-haspopup="true"
        aria-controls={menuId}
        className="w-full inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 h-10 sm:h-11 bg-[#175C46] hover:bg-[#124b38] active:bg-[#0e3b2c] active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
      >
        {isExporting ? (
          <>
            <i className="pi pi-spin pi-spinner text-xs" />
            <span>
              {exportingFormat ? `Exporting ${exportingFormat.toUpperCase()}...` : 'Exporting...'}
            </span>
          </>
        ) : (
          <>
            <span>{label}</span>
            <i className="pi pi-chevron-down text-xs ml-0.5 opacity-80" />
          </>
        )}
      </button>
    </div>
  );
};
