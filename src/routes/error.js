import {Router} from 'express'
import {redBright} from 'chalk'
import { format } from 'date-fns'
import {v4} from 'uuid'
import axios from 'axios'
var router = Router();
router
  .post('/', (req, res) => {
    //save some - where
    const yandexDiskHeaders = { Authorization: process.env.DISK_TOKEN || '' };
    const reportSender = req.person;
    const dataName = format(new Date(), 'dd:MM:yyyy__kk:mm_|_')+v4().substring(0, 7);
    const pass = {reportSender, data: req.body.data};
    
    axios.get(`${process.env.UPLOAD_PREV}ErrorReport%2F${dataName}.json`, { headers: yandexDiskHeaders})
      .then(({data}) => {
        axios.put(data.href, pass, { headers: yandexDiskHeaders})
        .then(() => res.send('success'))
        .catch(er => console.log(redBright('PUT_ERROR_REPORT_ERR:'), er))
      })
      .catch(er => console.log(redBright('GET_ERROR_REPORT_HREF_ERR:'), er))

  })

export default router
