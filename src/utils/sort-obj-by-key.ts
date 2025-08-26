/**
 * Sorts the keys of an object in ascending order and returns a new object with the sorted keys.
 *
 * @param object - The object whose keys are to be sorted.
 * @returns A new object with keys sorted in ascending order.
 */
export const sortObjDataByKey = function (object: any) {
  const orderedObject = Object.keys(object)
    .sort()
    .reduce((obj: any, key: string) => {
      obj[key] = object[key];
      return obj;
    }, {});
  return orderedObject;
};

/**
 * Deep sort object with optional array sorting
 * @param obj Object data
 * @param sortArrays Whether to sort arrays or maintain their order
 * @returns Sorted object data
 */
export const deepSortObj = <T extends { [key: string]: any }>(obj: T, sortArrays = false): T => {
  return Object.keys(obj)
    .sort()
    .reduce((acc: Record<string, any>, key: string) => {
      const value = obj[key];

      if (Array.isArray(value)) {
        if (sortArrays) {
          // Sort array elements
          acc[key] = value
            .map((item) => (typeof item === 'object' && item !== null ? deepSortObj(item, sortArrays) : item))
            .sort((a, b) => {
              // Sort primitive values
              if (typeof a !== 'object' && typeof b !== 'object') {
                return String(a).localeCompare(String(b));
              }
              // For objects, sort by JSON string representation
              return JSON.stringify(a).localeCompare(JSON.stringify(b));
            });
        } else {
          // Maintain array order, but sort objects within arrays
          acc[key] = value.map((item) =>
            typeof item === 'object' && item !== null ? deepSortObj(item, sortArrays) : item,
          );
        }
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = deepSortObj(value, sortArrays);
      } else {
        acc[key] = value;
      }

      return acc;
    }, {}) as T;
};
