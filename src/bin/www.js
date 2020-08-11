import app from '../app';
import debugLib from 'debug';
import http from 'http';
import {socketServer} from '../routes'
import {modify, writeFile, fileChecker} from '../utils'
import { blueBright, greenBright, redBright } from 'chalk'
import axios from 'axios'
import path from 'path'
import fs from 'fs'

var debug = debugLib('myapp:server');

modify()
/**
 * Get port from environment and store in Express.
 */
//console.log([[1, 2, 4, 5], 3, [[[[244, 245]]]]].flat())
var port = normalizePort(process.env.DEV_PORT ?? '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

// Пока что высокой необходимости в мапе нет.
const yandexDiskHeaders = { Authorization: process.env.DISK_TOKEN ?? '' };


axios.get(process.env.BASE_ADDRESS, {
  headers: yandexDiskHeaders
})
.then(({data: {_embedded: {items}}}) => {

  // Проверка на возможность скачивать и если картинки с выбранным именем нет то --->
  // Загрузка картинок на сервер, для последующей отдачи, как статических файлов.
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
    })
    .catch((err) => console.error('ILLUSTRATIONS_ERR:', err))
  } else {
    // прибивание сервера.... и какая то сингализация об этом???
    console.log(redBright('NO_ILLUSTRATIONS.DIR_IN_DISK'))
  }
  // аналогичные действия с users.json
  if(items.some(({name}) => name === 'users.json')) {
    let fileind;
    for(let item of items) {
      if(item.name === 'users.json') {
        fileChecker(['data', 'users.json'])
          .then(exist => {

            if(!exist || exist) {
              axios.get(item.file, {headers: yandexDiskHeaders})
              .then(({data}) => {
                console.log('USERS.JSON_FILE:', data) // can save this shit 
              })
            }
          })
      }
    };

    //console.log('DOWNLOAD_USERS.JSON:', items[fileind].file)
  } else {
    // прибивание сервера.... и какая то сингализация об этом???
    console.log(redBright('NO_USERS.JSON_ITEM_IN_DISK'))
  }
})


server.listen(port, () => console.log(`Listen ${port} port`));
server.on('error', onError);
server.on('listening', onListening);

new socketServer(server);



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

// fileChecker(['data', 'map.json']).then((exist) => {
//   if(!exist) {
//     //make request and writeFile(users.json)
//     console.log(process.env.DISK_TOKEN);
//     console.log(greenBright("BASE_ADDRESS:"),process.env.BASE_ADDRESS);
//   }
// });



//fileChecker(['data', 'map.json'])




//getBase64('https://unsplash.com/photos/N5GoPPHyq_A/download?force=true')



// .then((data) => {
//   //console.log('PICTURE_DATA:', data);
//   console.log('KEYS:', Object.keys(data));
//   console.log('CONFIG:', data.config)
//   let bufferData = new Buffer(data.data, 'base64')
//   console.log('BUFFER:', bufferData);
//   writeFile([__dirname, '..', '..', 'uploads', 'Горы.jpg'], bufferData).then(() => {
//       console.timeEnd()
//   })
//
// })
// .catch((err) => console.log('BAD_PICTURE_REQUEST:', err))



console.log(blueBright('START_EVENT'))

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
