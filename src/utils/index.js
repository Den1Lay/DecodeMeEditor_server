export {default as readFile} from './readFile';
export {default as writeFile} from './writeFile';
export {default as createJWToken} from './createJWToken';
export {default as verifyJWToken} from './verifyJWToken'
export {default as FastClone} from './fastClone'
export {default as fileChecker} from './fileChecker'

export const modify = () => {
  // Array.prototype.flat = function() {
  //   let clone = [...this]
  //   let res = [];
  //   while(clone.length) {
  //     let el = clone.pop();
  //     if(Array.isArray(el)) {
  //       clone.push(...el)
  //     } else {
  //       res.unshift(el)
  //     }
  //   }
  //   return res
  // }
}
