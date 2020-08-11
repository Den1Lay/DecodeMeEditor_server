import fs from 'fs';
import path from 'path';
import {redBright} from 'chalk'

export default (fileName) => {
  return new Promise((resolve, rejects) => {
    fs.readFile(typeof fileName === 'string'
    ? path.resolve(__dirname, '..', '..', 'data', fileName) // для работы в директе даты достаточн просто назваия файла
    : path.resolve(...fileName), (err, data) => {
      if(err) {
        console.log(redBright('Error read file', err))
        rejects(false)
        return
      }
      try {
        let readyData = typeof fileName === 'string'
        ? JSON.parse(data)
        : data;
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
