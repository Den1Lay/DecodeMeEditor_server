import app from '../app';
import debugLib from 'debug';
import http from 'http';
import {socketServer} from '../routes'
import {modify} from '../utils'
import dataLoader from './dataLoader'
import updateDisk from './updateDisk'

var debug = debugLib('myapp:server');

modify()
/**
 * Get port from environment and store in Express.
 */
//console.log([[1, 2, 4, 5], 3, [[[[244, 245]]]]].flat())
var port = normalizePort(process.env.PORT ?? '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

// Пока что высокой необходимости в мапе нет.

dataLoader(() => {

  server.listen(port, () => {
    console.log(`Listen ${port} port`);
    updateDisk()
  });
  server.on('error', onError);
  server.on('listening', onListening);

  new socketServer(server);

})






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
