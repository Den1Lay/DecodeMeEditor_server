import {Router} from 'express'
import {v4} from 'uuid'
import {cyan, greenBright, redBright} from 'chalk'
import multer from 'multer'
import {writeFile} from '../utils'

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
    console.log('REQ_HEADERS:', req.headers)
    console.log(cyan('REQ_FILE:'), req.file);
    console.log(greenBright('REQ_BODY:'), req.file);
    res.send('http://localhost:4040/uploads/'+req.headers.newname)
  })

export default router
