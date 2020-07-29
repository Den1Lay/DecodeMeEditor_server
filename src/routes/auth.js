import {Router} from 'express'
import {v4} from 'uuid'
import {createJWToken, verifyJWToken} from '../utils'
import {cyan} from 'chalk'

import {readFile, writeFile} from '../utils'
var router = Router();

/* GET users listing. */
router
  .post('/register', ({body}, res) => {
    const {nickName, password} = body;
    readFile('users.json')
      .then((data) => {
        if(!data.some(({userData: {nickName: exNickName}}) => exNickName === nickName)) {
          let newUserSuperId = v4();
          let newUser = {
            userData: {
              nickName,
              password,
              friends: [],
              superId: newUserSuperId,
            },
            projects: [],
            projectsCoordData: [],
            lastProject: null,
            lastPerson: newUserSuperId,
          };
          let newData = [...data, newUser];

          writeFile('users.json', newData).then(() => {
            let token = createJWToken({nickName, superId: newUser.userData.superId}) // real test data, make it better
            res.json({status: "success", data: newData, token})
          })
        } else {
          res.json({status: "error", msg: "Make another nickname..."})
        }
      })
  })
  .post('/login', ({body}, res) => {
    const {nickName, password} = body;
    console.log(cyan("DEBUG:"), body)
    readFile('users.json')
      .then((data) => {
        let workInd = null;
        data.forEach(({userData: {nickName: exNickName}}, i) => {
          if(exNickName === nickName) {
            workInd = i;
          }
        });
        if(workInd !== null) {
          if(data[workInd].userData.password === password) {
            console.log(cyan(nickName))
            let token = createJWToken({nickName, superId: data[workInd].userData.superId})
            let personObj = data[workInd];
            delete personObj.userData.password;

            const personFriends = personObj.userData.friends;
            let friends = data.slice().filter(({userData: {superId}}, i) => {
              return personFriends.includes(superId)
            });
            friends = friends.map((el) => {
              return {
                ...el,
                projects: el.projects.filter(({access}) => access.includes(data[workInd].userData.superId))
              }
            });
            res.json({
              status: 'success',
              msg: "You are logged in",
              token,
              data: {personObj, friends}})
          } else {
            res.json({status: 'error', msg: "Try another password.."})
          }
        } else {
          res.json({status: 'error', msg: "Free place)"})
        }
      })
  })


export default router;
