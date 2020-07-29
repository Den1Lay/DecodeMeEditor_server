import fs from 'fs';
import path from 'path';
import {redBright} from 'chalk'

export default (fileName, data) => {
  return new Promise((resolve, rejects) => {
    let jsonData;
    try { 
      jsonData = JSON.stringify(data)
    } catch(err) {
      console.log(redBright('Error stringify file', err))
      rejects(false)
      return
    }
       fs.writeFile(path.resolve(__dirname, '..','..', 'data', fileName), jsonData, (err, data) => {
        if(err) {
          console.log(redBright('Error write file', err))
          rejects(false)
          return
        }
        console.log
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