import {
  characteristics,
  containers,
  FilterManager,
} from 'renderer/functionsClasses/filters/filters';

export function getStorageFilterManager() {
  const ClassFilters = new FilterManager();
  Object.values(characteristics).forEach((filter) => {
    if (filter.label != 'Storage moveable') {
      ClassFilters.addFilter('Include', filter, true);
    }
  });
  Object.values(characteristics).forEach((filter) => {
    if (filter.label != 'Storage moveable') {
      ClassFilters.addFilter('Exclude', filter, false);
    }
  });
  Object.values(containers).forEach((filter) => {
    ClassFilters.addFilter('Containers', filter, true);
  });
  return ClassFilters;
}
