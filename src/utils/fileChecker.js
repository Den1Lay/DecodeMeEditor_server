import fs from 'fs'
import path from 'path'

export default function (fileName) {
  return new Promise((resolve) => {
    fs.access(path.resolve(__dirname, '..', '..', ...fileName), fs.F_OK, (err) => {
      if (err) {
        //console.error(err);
        resolve(false);
        return false
      }
      //console.log('FILE_EXIST:', fileName[fileName.length-1]);
      resolve(true);
      return true
    })
  })

};
