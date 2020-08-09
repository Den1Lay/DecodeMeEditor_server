import express from 'express';
import cors from 'cors'
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv'

import {auth, main, image} from './routes';
import {checkAuth, updateLastSeen} from './middlewares'
//import unsecured from './routes/unsecured';
//import main from './routes/main';


dotenv.config();

// const superData = {
//   redux: 'included',
//   iphone: 'fack',
// }
// (() => {
//   console.time();
//   let test = Array(10000).fill("").map((el, i) => ({
//   data: "Yes",
//   dateCreation: Date.now(),
//   indx: i
//   }));


//   let serhInd = null;
//   test.forEach((el, i) => {
//    if(i ===9999) {
//   serhInd = el

//   }
//   })
//   console.timeEnd()
//   console.log(serhInd)

//   })()

var app = express();
app
  .use(cors())
  .use(logger('dev'))
  .use(express.json())
  .use(express.urlencoded())
  .use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))
  .use('/auth', auth)
    .use(checkAuth)
  //.get('*',express.static(path.resolve(__dirname, '..', '..', 'client', 'build')))
  .use('/image', image)

  .use('/', main)
  .use(updateLastSeen)


export default app;
