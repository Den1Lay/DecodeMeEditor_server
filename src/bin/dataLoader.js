// Здесь происходит добыча картинок и users.json с Яндекс диска
// Осуществляется полный цикл поиска и скачивания данных. По резолву Promise.all запускается рекурсивка,
// Которая сейвит данные на диске, а так же сам сервер.


import {writeFile, fileChecker, readFile} from '../utils'
import { blueBright, greenBright, redBright } from 'chalk'
import axios from 'axios'
import { format } from 'date-fns'
import {v4} from 'uuid'


export default (launchServer) => {
  const yandexDiskHeaders = { Authorization: process.env.DISK_TOKEN || '' };


  function updater(){
    readFile('users.json').then(data => {
      let oldJsonName = format(new Date(), 'dd:MM:yyyy__kk:mm_|_')+v4().substring(0, 7);
      let testUrl = `https://cloud-api.yandex.net:443/v1/disk/resources/upload?path=disk%3A%2FUsersHistory%2F${oldJsonName}.json`;
      console.log('TEST_URL:',testUrl)
      axios.get(testUrl,
      {headers: yandexDiskHeaders}).then(({data: uploadData}) => {
        axios.put(uploadData.href, data, {headers: yandexDiskHeaders}).then(() => {
          console.log('SUCCESS_SUPER_SAVE');
        }).catch(er => console.log(redBright('PUT_USERS.JSON_TO_SAVES_ERR:', er)))
      }).catch(er => console.log(redBright('GET_URL_TO_SAVES_ERR:', er)))

      axios.get('https://cloud-api.yandex.net:443/v1/disk/resources/upload?path=disk%3A%2Fusers.json&overwrite=true',
      {headers: yandexDiskHeaders}).then(({data: uploadData}) => {
        console.log('SUCCESS_GET_HREF');
        axios.put(uploadData.href, data, {headers: yandexDiskHeaders}).then(() => {

        }).catch(er => console.log(redBright('PUT_USERS.JSON_ERR:', er)))
      }).catch(er => console.log(redBright('GET_UPLOAD_HREF_ERROR:', er)))
    })
    setTimeout(updater, 60000*60*12);
    // axios.post('https://cloud-api.yandex.net:443/v1/disk/resources/copy?from=disk%3A%2Fusers.json&path=disk%3A%2FUsersHistory%2F4dataPlusUU.json&force_async=true&overwrite=true',
    // // некоторые "рабочие" урлы просто дропают ошибку, например перемещение
    // // Причем никакой связи между 401 и происходящим нет.
    // // Самое удивительное, так это то, что запрос отлично рабает в postmane.. Я просто хз что это.
    // // Любые трансфер операции заканчиваются 401
    // {headers: yandexDiskHeaders})
    //   .then(() => {
    //     console.log('SUCCESS_TRANSFER');

    //   }).catch(er => console.log(redBright('TRANSFER_ERROR', er)))
  }

  axios.get(process.env.BASE_ADDRESS, {
    headers: yandexDiskHeaders
  })
  .then(({data: {_embedded: {items}}}) => {

    // Проверка на возможность скачивать и если картинки с выбранным именем нет то --->
    // Загрузка картинок на сервер, для последующей отдачи, как статических файлов.
    let imgPromise = new Promise((resolve, reject) => {
      if(items.some(({name}) => name === 'illustrations')) {

        axios.get(`${process.env.BASE_ADDRESS}illustrations%2F`, {headers: yandexDiskHeaders})
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

                if(!exist) {
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
      updater();
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
