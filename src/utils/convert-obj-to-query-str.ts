import { sortObjDataByKey } from './sort-obj-by-key';

const convertObjToQueryStr = function (object: any) {
  return Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .map((key) => {
      let value = object[key];
      // Sort nested object
      if (value && Array.isArray(value)) {
        value = JSON.stringify(value.map((val: any) => sortObjDataByKey(val)));
      }
      // Set empty string if null
      if ([null, undefined, 'undefined', 'null'].includes(value)) {
        value = '';
      }

      return `${key}=${value}`;
    })
    .join('&');
};

export default convertObjToQueryStr;
