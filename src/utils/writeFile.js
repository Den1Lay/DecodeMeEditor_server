import fs from 'fs';
import path from 'path';
import {redBright} from 'chalk'

export default (fileName, data) => {
  return new Promise((resolve, rejects) => {
    let jsonData;
    try {
      jsonData = typeof fileName === 'string' ? JSON.stringify(data) : data;
    } catch(err) {
      console.log(redBright('Error stringify file', err))
      rejects(false)
      return
    }
       fs.writeFile(typeof fileName === 'string'
        ? path.resolve(__dirname, '..','..', 'data', fileName)
        : path.resolve(...fileName), jsonData, (err, data) => { // ---> логика пути всегла строится из папки utils
        if(err) {
          console.log(redBright('Error write file', err))
          rejects(false)
          return
        }
        resolve(data);
        return
       })
    // fs.readFile(path.resolve(__dirname, '..', 'data', fileName), (err, data) => {
    //   if(err) {
    //     console.log(redBright('Error read file'))
    //     rejects(false)
    //     return
    //   }
    //   try {
    //     let readyData = JSON.parse(data);
    //     resolve(readyData)
    //     return
    //   } catch (err) {
    //     console.log(redBright('Error parse file'))
    //     rejects(false)
    //     return
    //   }
    // })
  })
}
