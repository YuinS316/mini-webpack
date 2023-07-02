/**
 * 处理json
 *
 * @param {string} source
 */
export function jsonLoader(source) {
  return `export default ${source}`;
}
