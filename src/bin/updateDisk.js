import {writeFile, fileChecker, readFile, consts} from '../utils'
import {blueBright, greenBright, redBright } from 'chalk'
import { format } from 'date-fns'
import {v4} from 'uuid'
import axios from 'axios'
import path from 'path'
import fs from 'fs'

export default () => {
  const {TRANSFER} = consts,
  yandexDiskHeaders = { Authorization: process.env.DISK_TOKEN || '' }

  console.log(greenBright('YANDEX_DATA:'), yandexDiskHeaders)
  // Допиши плиз..
  // transfer
  // readyData
  // saveUser.JSON
  //
  let oldJsonName = format(new Date(), 'dd/MM/yyyy__kk:mm_|_')+v4().substring(0, 7);
  console.log(blueBright(oldJsonName))
  axios.post(`${TRANSFER}${oldJsonName}.json`, {headers: yandexDiskHeaders})
    .then(() => {
      console.log('SUCCESS_TRANSFER');
      readFile('users.json').then(data => {
        axios.get('https://cloud-api.yandex.net:443/v1/disk/resources/upload?path=disk%3A%2Fusers.json&overwrite=true',
        {headers: yandexDiskHeaders}).then(({data: uploadData}) => {
          console.log('SUCCESS_GET_HREF');
          axios.put(uploadData.href, data, {headers: yandexDiskHeaders}).then(() => {

          }).catch(er => console.log(redBright('PUT_USERS.JSON_ERR:', er)))
        }).catch(er => console.log(redBright('GET_UPLOAD_HREF_ERROR:', er)))


      })
    }).catch(er => console.log(redBright('TRANSFER_ERROR', er)))


}
