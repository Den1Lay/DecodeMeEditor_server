import {verifyJWToken} from '../utils';

export default (req, res, next) => {
  let headersToken = req.headers.token || '';
  verifyJWToken(headersToken)
    .then((decoded) => {
      req.person = decoded;
      next()
    })
    .catch(er => res.json({status: 'forbidden', er}))
}