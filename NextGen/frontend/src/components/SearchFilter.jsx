/**
 * Search and Filter component
 */
import { useState, useEffect } from 'react';
import { Input, Select, Button } from './ui';

const SearchFilter = ({
  onSearch,
  onFilterChange,
  filters = [],
  searchPlaceholder = 'Search...',
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});

  useEffect(() => {
    // Initialize filter values
    const initialFilters = {};
    filters.forEach(filter => {
      initialFilters[filter.name] = '';
    });
    setFilterValues(initialFilters);
  }, [filters]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filterValues, [name]: value };
    setFilterValues(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    const clearedFilters = {};
    filters.forEach(filter => {
      clearedFilters[filter.name] = '';
    });
    setFilterValues(clearedFilters);

    if (onSearch) {
      onSearch('');
    }
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  const hasActiveFilters = searchTerm || Object.values(filterValues).some(val => val);

  return (
    <div className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filter Selects */}
        {filters.map((filter) => (
          <div key={filter.name} className="min-w-[200px]">
            <Select
              placeholder={filter.placeholder || `Select ${filter.label}`}
              options={filter.options}
              value={filterValues[filter.name] || ''}
              onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            />
          </div>
        ))}

        {/* Clear Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClear}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
