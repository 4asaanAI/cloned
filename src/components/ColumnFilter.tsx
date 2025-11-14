import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface ColumnFilterProps {
  column: string;
  values: string[];
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
  isDark?: boolean;
}

export function ColumnFilter({ column, values, selectedValues, onFilterChange, isDark }: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const uniqueValues = Array.from(new Set(values.filter(v => v && v !== 'N/A'))).sort();

  const filteredValues = uniqueValues.filter(value =>
    value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onFilterChange(selectedValues.filter(v => v !== value));
    } else {
      onFilterChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === uniqueValues.length) {
      onFilterChange([]);
    } else {
      onFilterChange([...uniqueValues]);
    }
  };

  const handleClearFilter = () => {
    onFilterChange([]);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-2 py-1 transition-colors ${
          selectedValues.length > 0 && selectedValues.length < uniqueValues.length
            ? 'text-blue-600 dark:text-blue-400'
            : ''
        }`}
        title={`Filter ${column}`}
      >
        <ChevronDown className="h-4 w-4" />
        {selectedValues.length > 0 && selectedValues.length < uniqueValues.length && (
          <span className="text-xs font-medium">({selectedValues.length})</span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg border z-50 ${
            isDark
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-sm rounded border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <div className="p-2">
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.length === uniqueValues.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select All
                </span>
              </label>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 p-2">
              {filteredValues.length === 0 ? (
                <div className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No matches found
                </div>
              ) : (
                filteredValues.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(value)}
                      onChange={() => handleToggleValue(value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {value}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 p-2 flex justify-between">
            <button
              onClick={handleClearFilter}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
              }}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
