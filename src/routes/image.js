import {Router} from 'express'
import path from 'path'
import {v4} from 'uuid'
import {cyan, greenBright, redBright} from 'chalk'
import multer from 'multer'
import {writeFile, readFile, fileChecker} from '../utils'
import axios from 'axios'

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
    console.log(redBright('STORAGE_REQ_H:'), req.headers.newname)
    let fullName = req.headers.newname;
        cb(null, fullName);
    }
});

const upload = multer({storage:storageConfig})
var router = Router();

router
  .post('/', upload.single('picture'), (req, res) => {

    // Красиво или правильно, вот в чем вопрос) Нельзя быть уверенным в том, что сохранение прошло успешно, но
    // в тоже время картинка, которая появляется сразу же важней)


    const yandexDiskHeaders = { Authorization: process.env.DISK_TOKEN ?? '' };

    readFile([__dirname, '..', '..', 'uploads', req.headers.newname]).then((data) => {
      //console.log('PICTURE_DATA:', data);
      res.send('http://localhost:4040/uploads/'+req.headers.newname);
      axios.get(`${process.env.UPLOAD_PREV}illustrations%2F${req.headers.newname}`, { headers: yandexDiskHeaders})
        .then(({data: uploadData}) => {
          //console.log('IMAGE_UPLOAD_DATA:', uploadData);

          axios.put(uploadData.href, data, { headers: yandexDiskHeaders })
            .then((data) => {
              if(data.status !== 201) {
                console.log(redBright('ERROR_SAVE_IMAGE_IN_DISK:', data.status))
              }
            })
            .catch(err => {
              console.log(redBright('ERROR_SAVE_IMAGE_IN_DISK:', err))
            })
        });

    })

  })

export default router
