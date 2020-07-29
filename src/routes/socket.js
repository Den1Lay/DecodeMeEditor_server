// фильтрация проектов которые улетают на клиент.
import createSS from 'socket.io';
import {greenBright, redBright, blueBright} from 'chalk'
import {verifyJWToken, readFile, writeFile} from '../utils'

export default class WSServer {
  constructor(server) {
    this.io = createSS(server, { origins: '*:*'})
    // .use((socket, next) => {
    //
    //   let midlToken = socket.handshake.query.token;
    //   console.log(redBright('MIDL_TOKEN: '), midlToken);
    //   verifyJWToken(midlToken).then((decoded) => {
    //     console.log(blueBright('DECODED_DATA:'), decoded);
    //     socket.handshake.tokenData = decoded;
    //     next();
    //   })
    //   .catch((err) => {
    //     socket.emit('FORBIDDEN');
    //   })
    //
    //
    // })

    .on('connection', socket => {
      console.log('NEW_SOCKET')
      if(process.env.DEV === '1') {
        socket.on('npmStop', () => {
          process.exit(0);
        });
      }
        const tokenErrorHandl = () => socket.emit('FORBIDDEN')
        // socket.on('npmStop', () => {
        //   process.exit(0);
        // })
        // INIT EVENT Will if will client get token or after refresh
        socket
        .use((packet, next) => {
          console.log(greenBright("PACKAGE: "), packet);
          let clientToken = packet[1].token ? packet[1].token : null;
          this.verifyUser(clientToken, ({superId: decodedSId}) => {
            socket.handshake.superId = decodedSId
            next();
          }, tokenErrorHandl)
        })
        .on('JOIN', ({token}) => {
          let {superId} = socket.handshake;
          console.log(blueBright('HANDSHAKE: '), superId)
          // join to projects rooms
          // join to persons... in future..

          // когда челик подключается к комнатам он должен уведомить всех, кто уже подключен к ней
          // те в ответ информируют о том какие версии, каких приложений сейчас заняты..

          readFile('users.json').then((data) => {
            //getting me from data
            let personInd = [];
            this.findInd(personInd, data, superId);
            let person = data[personInd[0]];
            //getting friends projects
            let friendsProjects = [...person.userData.friends]
              .map(id => {
                let lockInd = [];
                this.findInd(lockInd, data, id);
                return data[lockInd[0]].projects;
              }).flat();

              //TEST
              let myProjects = data[personInd].projects.slice().map(({superId}) => superId);
              //TEST
              //console.log(redBright("DEBUG:"), friendsProjects.flat())
              //connect to friends projects
              // так же коннект по своему адресу, что бы принимать эвенты от других микрославов
              let roomsArr = [...friendsProjects, superId].concat(myProjects)
            roomsArr.forEach(projectRoom => {
              socket.join(projectRoom)
            });
            console.log('SR_AFTER_JOIN:', socket.rooms)
          })

          // this.verifyUser(token, ({superId}) => {
          //
          // }, tokenErrorHandl);

        })
        // most working element
        .on('UPDATE_PROJECTS', ({pcd, workVersion, projectId, versionId, person}) => {
          let {superId} = socket.handshake;
          console.log('UPDATE_PROJECTS')
          // самый сложный блок....
          // обновление полного блока проекта

          // нельзя работать более 1 челику по версии. 2ой чел может только наблюдать.
          // Права редактора передаются..

          readFile('users.json').then((data) => {
            let cloneData = [...data];
            let personInd = []; // person
            this.findInd(personInd, cloneData, person);

            let projectInd;
            for(let i in cloneData[personInd[0]].projects) {
              if(projectId === cloneData[personInd[0]].projects[i].superId) {
                projectInd = i;
              }
            };

            let versionInd;
            for(let i in cloneData[personInd[0]].projects[projectInd].versions) {
              if(versionId === cloneData[personInd[0]].projects[projectInd].versions[i].superId) {
                versionInd = i;
              }
            };
            cloneData[personInd[0]].projects[projectInd].versions[versionInd].data = workVersion;

            let userInd = [];
            this.findInd(userInd, cloneData, superId)
            cloneData[personInd[0]].projectsCoordsData = pcd;

            console.log("REALS_ROOMS: ",socket.rooms)
            console.log("END_POINT_ADRESS:", projectId)
            this.io.to(projectId).emit('VERSION_UPDATE', {person, projectId, versionId, workVersion});

            writeFile('users.json', cloneData);
          })

          // this.verifyUser(token, ({superId}) => {
          //
          // }, tokenErrorHandl);

        })

        .on('NEW_PROJECT', ({project, pcd}) => {
          let {superId} = socket.handshake;
          // work with person room
          readFile('users.json').then(data => {
            let cloneData = [...data];
            let lockInd = [];
            this.findInd(lockInd, cloneData, superId);
            cloneData[lockInd[0]].projects = [project].concat(cloneData[lockInd[0]].projects);
            cloneData[lockInd[0]].projectsCoordsData = pcd;
            cloneData[lockInd[0]].lastProject = project.superId;

            writeFile('users.json', cloneData)
          })
          // this.verifyUser(token, ({superId}) => {
          //
          // }, tokenErrorHandl)
        })

        .on('PROVIDE_ACCESS', ({projectInd, userId, great}) => {
          let {superId} = socket.handshake;
          readFile('users.json').then(data => {
            let cloneData = [...data];
            let lockInd = [];
            this.findInd(lockInd, cloneData, superId);

            let param = great ? 'greatAccess' : 'access';
            cloneData[lockInd].projects[projectInd][param] = [...cloneData[lockInd].projects[projectInd][param], userId];
            this.io.to(userId).emit(`${great?'GREAT_':''}WELLCOME`, {name: cloneData[lockInd].userData.nickName, project: projectInd});

          })
        })

        .on('UPDATE_PCD', ({pcd, person}) => {
          let {superId} = socket.handshake;
          console.log('GET_UPDATE_PCD');
          //console.log(blueBright('HANDSHAKE: '), socket.handshake.query.token);
          readFile('users.json').then(data => {
            let cloneData = [...data];
            let lockInd = [];
            this.findInd(lockInd, cloneData, superId);

            cloneData[lockInd[0]].projectsCoordsData = pcd;
            cloneData[lockInd[0]].lastPerson = person;
            writeFile('users.json', cloneData)
          })
          // this.verifyUser(token, ({superId}) => {
          //
          // }, tokenErrorHandl)
        })

        .on('disconnect', (reason) => {
          console.log(redBright('disconnect '), socket.id)
          // в крайнем случае делаю объект с челами, где ключ это socket.id
          // ловлю события выхода и входа, с последующим переписыванием superId
          // можно организовать дополнительный JSON файл со всей датой
        })
        // socket.on("PROVIDE_GREAT_ACCESS", ({token, projectInd, userId}) => {
        //   this.verifyUser(token, ({superId}) => {
        //     readFile('users.json').then(data => {
        //       let cloneData = [...data];
        //       let lockInd = [];
        //       this.verifyUser(lockInd, cloneData, superId);

        //       cloneData[lockInd].projects[projectInd].greatAccess = [...cloneData[lockInd].projects[projectInd].greatAccess, userId];
        //       io.to(userId).emit('GREAT_WELLCOME', {name: cloneData[lockInd].userData.nickName, project: projectInd});
        //     })
        //   })
        // })

    })

  }

  verifyUser(token, func, forbFunc) {
    verifyJWToken(token)
    .then(decoded => {
      func(decoded)
      return
    })
    .catch(err => {
      //console.log(redBright('ERROR_VERIFY_TOKEN'), err);
      forbFunc()
      return
    })
  }

  findInd(personInd, data, id) {
    let i = 0;
    while(i < data.length) {
      if(id === data[i].userData.superId) {
        personInd[0] = i
      }
      i++;
    }
    }
}
