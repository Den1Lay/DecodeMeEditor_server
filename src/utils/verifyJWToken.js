import {verify} from 'jsonwebtoken'

export default (tokenStr) => {
  return new Promise((resolve, reject) => {
    verify(
      tokenStr, 
      process.env.JWT_SECRET || '', 
      (err, decoded) => {
        if(err) {
          reject(err)
          return
        }
        resolve(decoded)
      }
      )
  })
}