import {sign} from 'jsonwebtoken'

export default (payloadObj) => {
  try {
    return sign(
      payloadObj,
      process.env.JWT_SECRET || '',
      {
        algorithm: 'HS256' // make drop errors
      }
    )

  } catch (err) {
    console.log("Error create token", err)
  }
  return 
}