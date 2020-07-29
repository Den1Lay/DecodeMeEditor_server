import {readFile, writeFile} from '../utils';

export default (req, res, next) => {
  let person = req.person;
  next()
}