import {writeFile, fileChecker, consts} from '../utils'
import { blueBright, greenBright, redBright } from 'chalk'
import axios from 'axios'
import path from 'path'
import fs from 'fs'

export default (launchServer) => {
  const yandexDiskHeaders = { Authorization: process.env.DISK_TOKEN || '' },
  {BASE_ADDRESS} = consts

  axios.get(BASE_ADDRESS, {
    headers: yandexDiskHeaders
  })
  .then(({data: {_embedded: {items}}}) => {

    // Проверка на возможность скачивать и если картинки с выбранным именем нет то --->
    // Загрузка картинок на сервер, для последующей отдачи, как статических файлов.
    let imgPromise = new Promise((resolve, reject) => {
      if(items.some(({name}) => name === 'illustrations')) {

        axios.get(`${BASE_ADDRESS}illustrations%2F`, {headers: yandexDiskHeaders})
        .then(({data: {_embedded: {items}}}) => {
          //console.log('ILLUST_ITEMS:', items);
          for(let item of items) {
            //console.log("IMG_OBJ:", item)
            fileChecker(['uploads', item.name]).then(exist => {
              if(!exist) {
                //console.log(`IMG: ${item.name}, download: ${item.file}`);
                getPicture({url: item.file, name: item.name})
              } else {
                console.log('FILE_EXIST:', item.name)
              }
            })
            // if(!) {
            //   console.log(`DL for ${items.name}: ${items.file}`)
            // }
          }
          resolve(true)
          // place for resolve
        })
        .catch((err) => {console.error('ILLUSTRATIONS_ERR:', err), reject(err)})
      } else {
        const errMsg = 'NO_ILLUSTRATIONS.DIR_IN_DISK'
        reject(errMsg);
        // прибивание сервера.... и какая то сингализация об этом???
        console.log(redBright(errMsg))
      }
    })
    // аналогичные действия с users.json
    let usersPromise = new Promise((resolve, reject) => {
      if(items.some(({name}) => name === 'users.json')) {
        let fileind;
        for(let item of items) {
          if(item.name === 'users.json') {
            fileChecker(['data', 'users.json'])
              .then(exist => {

                if(!exist || exist) {
                  axios.get(item.file, {headers: yandexDiskHeaders})
                  .then(({data}) => {
                    writeFile('users.json', data).then(() =>{

                    })
                    .catch(er => {console.log(redBright('WRITE_USERS.JSON_ERR:'), er); reject(er)} )
                    console.log('USERS.JSON_FILE:', data) // can save this shit
                  })
                }
              })
          }
        };
        resolve(true)
        // place for resolve
        //console.log('DOWNLOAD_USERS.JSON:', items[fileind].file)
      } else {
        const errMsg = 'NO_USERS.JSON_ITEM_IN_DISK';
        reject(errMsg)
        // прибивание сервера.... и какая то сингализация об этом???
        console.log(redBright(errMsg))
      }
    })

    Promise.all([imgPromise, usersPromise]).then(() => {
      // запуск сервера.
      launchServer()
    })
    .catch(errors => console.log(redBright('DATA_LOADER_ERRORS:'), errors)) // прибивать ли процессы ноды?
  })

  function getPicture({url, name}) {
    return axios
      .get(url, {
        headers: yandexDiskHeaders,
        responseType: 'arraybuffer'
      })
      .then(response => {
        let res = Buffer.from(response.data, 'binary');
        writeFile([__dirname, '..', '..', 'uploads', name], res)
      })
  }
}
