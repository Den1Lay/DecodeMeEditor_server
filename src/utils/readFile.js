import fs from 'fs';
import path from 'path';
import {redBright} from 'chalk'

export default (fileName) => {
  return new Promise((resolve, rejects) => {
    fs.readFile(path.resolve(__dirname, '..', '..', 'data', fileName), (err, data) => {
      if(err) {
        console.log(redBright('Error read file', err))
        rejects(false)
        return
      }
      try {
        let readyData = JSON.parse(data);
        resolve(readyData)
        return
      } catch (err) {
        console.log(redBright('Error parse file', err))
        rejects(false)
        return
      }
    })
  })
}