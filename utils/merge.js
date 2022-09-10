/**
 * 深度合并对象
 * @param  {...any} args
 * @returns
 */
function deepAssign(...args) {
  let returnObj = args[0];
  const returnObjToString = Object.prototype.toString.call(returnObj);
  for (let i = 1; i < args.length; i++) {
    const other = args[i];
    const otherToString = Object.prototype.toString.call(other);

    if (otherToString === "[object Object]") {
      if (returnObjToString !== "[object Object]") {
        returnObj = {};
      }
      for (let [key, val] of Object.entries(other)) {
        const valToString = Object.prototype.toString.call(val);

        if (valToString == "[object Object]") {
          returnObj[key] = deepAssign(returnObj[key], val);
        } else {
          returnObj[key] = val;
        }
      }
    }
  }
  return returnObj;
}
exports.deepAssign = deepAssign;
// console.log(
//   deepAssign(
//     {},
//     { a: 1 },
//     { b: 2, d: { c1: 1, c2: 1 } },
//     { c: 3, a: 3, d: { c1: 3, c3: [1, 2, 3] } },
//     1
//   )
// );
