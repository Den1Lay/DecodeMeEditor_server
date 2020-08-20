export default function mineInd(source, etalon, key, mod) {
  for(let i in source) {
    const natSource = i => {
        key = Array.isArray(key) ? key : [key]
        let base = source[i];
        let keyPath = key.slice();
        while(keyPath.length) {
          base = base[keyPath.shift()];
        }
        return base;
    }
    if(natSource(i) === etalon) {
      mod[0] = i
    }
  }
};
