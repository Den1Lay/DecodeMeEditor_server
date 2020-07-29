import express from 'express';
import {readFile} from '../utils'

var router = express.Router();

/* GET home page. */
router
  .post('/refresh', function(req, res, next) {
    // если ловит обновления со стороны сокетов, то реквест сюда за данными
    const person = req.person;
    console.log("PERSON:",person)
    readFile('users.json')
    res.json({personData: person})
  })
  .post('/me', (req, res) => {
    res.json({go: "AWAY!"})
  })


export default router;
