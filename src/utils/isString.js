/**
 * Checks if a given value is a string using ES6 syntax.
 * @param {*} value - The value to be checked.
 * @returns {boolean} - Returns true if the value is a string, otherwise false.
 */
const isString = (value) => {
  if (!value) throw new Error('Missing `value` parameter in isString function');
  return typeof value === 'string' || value instanceof String;
};

export default isString;
