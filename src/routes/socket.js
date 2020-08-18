// фильтрация проектов которые улетают на клиент.
import createSS from 'socket.io';
import {greenBright, redBright, blueBright} from 'chalk'
import axios from 'axios'
//import FastClone from 'fastest-clone'
import {verifyJWToken, readFile, writeFile, FastClone} from '../utils'

export default class WSServer {
  constructor(server) {
    this.io = createSS(server, { origins: '*:*',})
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
            socket.join(superId, () => {
              const saveSocksStorage = () => {
                // возможно странная ошибка вызванна тем, происходит одновременная работа двух ридеров и врайтеров...
                // можно ловить это и закидывать вызов функции в спец поле, которое будет вызываться при наличии там
                // аргумента. тем самым последовательность будет стопиться.. что так же не очень хорошо...
                  readFile('sockets.json').then(socks => {
                    let newSocketObj = {};
                    newSocketObj[socket.id] = superId;
                    socks = socks.concat(newSocketObj);
                    console.log('SR_AFTER_JOIN:', socket.rooms)
                    console.log(redBright("SOCKS_BEFORE_SAVE:"), socks)
                    writeFile('sockets.json', socks);
                  })
              }
              if(person.lastPerson !== superId) {
                socket.join(person.lastPerson, () => {
                  saveSocksStorage()
                })
              } else {
                saveSocksStorage()
              }

            })

            // let friendsProjects = [...person.userData.friends]
            //   .map(({superId}) => {
            //
            //     let lockInd = [];
            //     this.findInd(lockInd, data, superId);
            //     return data[lockInd[0]].projects;
            //   }).flat();

              //TEST
              // let myProjects = data[personInd].projects.slice().map(({superId}) => superId);
              //TEST
              //console.log(redBright("DEBUG:"), friendsProjects.flat())
              //connect to friends projects
              // так же коннект по своему адресу, что бы принимать эвенты от других микрославов
            //   let roomsArr = [...friendsProjects, superId].concat(myProjects);
            // roomsArr.forEach(projectRoom => {
            //   socket.join(projectRoom)
            // });
          })

          // this.verifyUser(token, ({superId}) => {
          //
          // }, tokenErrorHandl);

        })
        // most working element
        .on('UPDATE_PROJECTS', ({pcd, workVersion, projectId, versionId, person}) => {
          let {superId} = socket.handshake;
          // самый сложный блок....
          // обновление полного блока проекта

          // нельзя работать более 1 челику по версии. 2ой чел может только наблюдать.
          // Права редактора передаются..

          // В NEXT версиях код будет обновлятся точечно по ворк бренчу, а не всей версией....
          readFile('users.json').then((data) => {
            let personInd = []; // person
            this.findInd(personInd, data, person);

            let projectInd;
            for(let i in data[personInd[0]].projects) {
              if(projectId === data[personInd[0]].projects[i].superId) {
                projectInd = i;
              }
            };

            let versionInd;
            for(let i in data[personInd[0]].projects[projectInd].versions) {
              if(versionId === data[personInd[0]].projects[projectInd].versions[i].superId) {
                versionInd = i;
              }
            };
            // Обновление проектов (своих иди чужих)
            data[personInd[0]].projects[projectInd].versions[versionInd].data = workVersion;

            // Обновление СВОЕГО PCD!
            let userInd = [];
            this.findInd(userInd, data, superId)
            data[userInd[0]].projectsCoordsData = pcd;

            console.log("REALS_ROOMS: ",socket.rooms)
            console.log("END_POINT_ADRESS:", projectId)
            this.io.to(person).emit('VERSION_UPDATE', {person, projectId, versionId, workVersion});

            writeFile('users.json', data);
          })

          // this.verifyUser(token, ({superId}) => {
          //
          // }, tokenErrorHandl);

        })

        .on('NEW_PROJECT', ({project, pcd, myLastProject}) => {
          let {superId} = socket.handshake;
          // work with person room
          readFile('users.json').then(data => {
            let lockInd = [];
            this.findInd(lockInd, data, superId);
            data[lockInd[0]].projects = [project].concat(data[lockInd[0]].projects);
            data[lockInd[0]].projectsCoordsData = pcd;
            data[lockInd[0]].lastProject = project.superId;
            data[lockInd[0]].userData.myLastProject = myLastProject;

            // let friends = cloneData[lockInd[0]].userData.friends;
            // friends.forEach(address => {
            //   this.io.to(address).emit('NEW_FRIENDS_PROJECT')
            // })
            this.io.to(superId).emit('NEW_FRIEND_PROJECT', {project, sender:superId})
            // project.access.forEach(address => {
            //   this.io.to(address).emit('SHOW_ACCESS', {superId: project.superId, personId: superId})
            // });
            // project.superAccess.forEach(address => {
            //   this.io.to(address).emit('SUPER_ACCESS', {superId: project.superId, personId: superId})
            // });

            writeFile('users.json', data)
          })
          // this.verifyUser(token, ({superId}) => {
          //
          // }, tokenErrorHandl)
        })
        .on('SETUP_PROJECT', ({projectData, projectId, kicked, superKicked, newObservers, newEditord}) => {
          let {superId} = socket.handshake;
          // они получат свежайшие данные при прямом обращении...

          // точечне реквесты разлетаются по аддресам, если изменения прилетают на отправителя, значит это изменение isAll
          readFile('users.json').then(data => {
            let lockInd = [];
            this.findInd(lockInd, data, superId);
            let projectInd;
            for(let i in data[lockInd[0]].projects) {
              if(projectId === data[lockInd[0]].projects[i].superId) {
                projectInd = i;
              }
            };
            for(let key in projectData) {
              data[lockInd[0]].projects[projectInd][key] = projectData[key];
            };

            const sender = (addresses, event) => {
              addresses
              //.map(el => el === 'all' ? superId : el)
              .forEach(address => {
                let isAll = address === 'all';
                this.io.to(isAll ? superId : address).emit(event, {
                  projectId,
                  nickName: data[lockInd[0]].userData.nickName,
                  superId,
                  all: isAll });
                if(address === 'all') {}
              });
              // if(addresses.includes('all') {
              //   this.io.to(superId).emit() //событие которое обновляло бы all по проекту у всех, кто подключен
              // })
            };
            //sender.bind(this);
            sender(kicked, 'KICK');
            sender(superKicked, 'SUPER_KICK');
            sender(newObservers, 'NEW_ACCESS');
            sender(newEditord, 'NEW_SUPER_ACCESS');



            writeFile('users.json', data);
          })
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
        // обновление всех важных PCD дат происходит тут, а вызов прилетает каждый раз когда происходят хоть какие то
        .on('UPDATE_PCD', ({pcd, person, lastProject, myLastProject, friends}) => {
          let {superId} = socket.handshake;
          console.log('GET_UPDATE_PCD');
          //console.log(blueBright('HANDSHAKE: '), socket.handshake.query.token);
          readFile('users.json').then(data => {
            let cloneData = [...data];
            let lockInd = [];
            this.findInd(lockInd, cloneData, superId);

            cloneData[lockInd[0]].projectsCoordsData = pcd; // слава алаху
            cloneData[lockInd[0]].lastPerson = person;
            cloneData[lockInd[0]].lastProject = lastProject;
            cloneData[lockInd[0]].userData.myLastProject = myLastProject;
            cloneData[lockInd[0]].userData.friends = friends;
            writeFile('users.json', cloneData)
          })
          // this.verifyUser(token, ({superId}) => {
          //
          // }, tokenErrorHandl)
        })
        .on('NEW_VERSION', ({pcd, person, projectId, workVersion}) => {
          // НЕКСТ КВест это переход на точечное обновление.. а иначе через сокеты будут пролетать мегабайты строк..
          let {superId} = socket.handshake;
          readFile('users.json').then(data => {
            let personInd = [];
            this.findInd(personInd, data, person);

            let projectInd;
            for(let i in data[personInd[0]].projects) {
              if(data[personInd[0]].projects[i].superId === projectId) {
                projectInd = i;
              }
            }
            data[personInd[0]].projects[projectInd].versions.push(workVersion);

            let userInd = [];
            this.findInd(userInd, data, superId);
            data[userInd[0]].projectsCoordsData = pcd;

            this.io.to(person).emit('NEW_FRIEND_VERSION', {projectId, workVersion, person, sender: superId});
            writeFile('users.json', data)
          })
        })
        .on('GET_USERS', () => {
          let {superId} = socket.handshake
          readFile('users.json').then(data => {

            let users = data.map(({userData}) => {
              delete userData.password;
              return userData;
            }).filter(({superId: checkId}) => checkId !== superId)
            socket.emit('NEW_USERS', {users}); // test socket.emit()
          })
        })
        .on('GET_USERS_DETAIL', ({personId}) => {
          readFile('users.json').then(data => {
            let personInd = [];
            this.findInd(personInd, data, personId);
            let user = data[personInd[0]];
            // фильтрация того что показываю, а что нет на плечиках клиента
            // user.projects = user.projects.filter(({access}) => {
            //   return access.includes('all')
            // })
            delete user.userData.password;
            socket.emit('NEW_USERS_DETAIL', {user})
          })
        })
        .on('GET_COMRADE_DETAIL', () => {
          const {superId} = socket.handshake;
          readFile('users.json').then(data => {
            let meInd = [];
            this.findInd(meInd, data, superId);
            let comrades = [];
            data[meInd[0]].userData.applicantList.forEach(id => {
              data.forEach(({userData: {superId}}, i) => {
                if(superId === id) {
                  data[i].userData.projectsCount = data[i].projects.length;
                  delete data[i].userData.password;
                  comrades.push(data[i].userData);
                }
              });
            });

            socket.emit('NEW_COMRADE_DETAIL', {comrades})
          })
        })
        .on('FRIEND_REQUEST', ({person: {superId: personId}}) => {
          const {superId, nickName} = socket.handshake;
          readFile('users.json').then(data => {
            let personInd = [];
            this.findInd(personInd, data, personId);
            let meInd = [];
            this.findInd(meInd, data, superId);

            let me = data[meInd[0]];
            // let meClone;
            // try {
            //   let MeFactory = FastClone.factory(me);
            //   meClone = new MeFactory(me)
            // } catch (e) {
            //   console.log("THAT_ERROR:",e)
            // }
            data[personInd[0]].userData.applicantList.push(superId); // получаю свежие данные.. так что онли id
            writeFile('users.json', data).then(() => {
              me.userData.projectsCount = me.projects.length;
              me = me.userData;
              delete me.password;
              this.io.to(personId).emit('FRIEND_REQUEST', {user: me});
            })

            //meClone.userData.projectCount = meClone.projects.length;
            //meClone = meClone.userData;
            // delete meClone.password;




          })
        })
        .on('ACCEPT_REQUEST', ({personId}) => {
          const {superId} = socket.handshake;
          readFile('users.json').then(data => {
            let personInd = [];
            this.findInd(personInd, data, personId);
            let person = data[personInd[0]];

            let meInd = [];
            this.findInd(meInd, data, superId);
            let me = data[meInd[0]];
            //work with data
            person.userData.friends.push({superId, lastProject: null});
            me.userData.friends.push({superId: personId, lastProject: null})
            me.userData.applicantList = me.userData.applicantList.filter(el => el !== personId);

            writeFile('users.json', data).then(() => {
              delete person.userData.password;
              delete me.userData.password;
              socket.emit('ACCEPT_REQUEST', {user: person});
              this.io.to(personId).emit('NEW_FRIEND', {user: me});
            })


          })
        })
        .on('SUBSCRIBE_USER', ({personId}) => {
          let {superId} = socket.handshake;
          readFile('users.json').then(data => {
            // LEAVE MIDDLE не надо.. юзер может работать на другом акке.
            // for(let key in socket.rooms) {
            //   if(key !== superId) {
            //     socket.leave(key);
            //   }
            // }
            //
            socket.join(personId);
            let personInd = [];
            this.findInd(personInd, data, personId);
            socket.emit('NEW_SUBSCRIBE_USER', {friendObj: data[personInd[0]]});
            // socket.rooms.forEach((item, i) => {
            //
            // });

          })
        })
        .on('UNSUBSCRIBE_USER', ({personId}) => {
          const {superId} = socket.handshake;
          socket.leave(personId);
          //let picture = new Image();
          // for(let key in socket.rooms) {
          //   if(key !== superId) {
          //     socket.leave(key)
          //   }
          // }
        })
        .on('UPDATE_AVAILABLE', ({workPCD, person, payload}) => {
          const {superId} = socket.handshake;

          readFile('users.json').then(data => {
            let personInd = [];
            this.findInd(personInd, data, person);

            let projectInd;
            for(let i in data[personInd[0]].projects) {
              if(data[personInd[0]].projects[i].superId === workPCD.projectId) {
                projectInd = i;
              }
            }

            let versionInd;
            for(let i in data[personInd[0]].projects[projectInd].versions) {
              if(data[personInd[0]].projects[projectInd].versions[i].superId === workPCD.workVersion) {
                versionInd = i;
              }
            }
            data[personInd[0]].projects[projectInd].versions[versionInd].master = payload;

            writeFile('users.json', data).then(() => {
              this.io.to(person).emit('NEW_AVAILABLES', {person, workPCD, payload, sender: superId});
            })
          })
        })
        .on('SET_ILLUSTRATIONS', ({person, workPCD, newIllustration, action}) => {
          // обновление
          const {superId} = socket.handshake;
          readFile('users.json').then(data => {
            let personInd = [];
            this.findInd(personInd, data, person);

            let projectInd;
            for(let i in data[personInd[0]].projects) {
              if(data[personInd[0]].projects[i].superId === workPCD.projectId) {
                projectInd = i;
              }
            }

            let versionInd;
            for(let i in data[personInd[0]].projects[projectInd].versions) {
              if(data[personInd[0]].projects[projectInd].versions[i].superId === workPCD.workVersion) {
                versionInd = i;
              }
            }

            if(action === 'ADD') {
              data[personInd[0]].projects[projectInd].versions[versionInd].illustrations.push(newIllustration)
            } else {
              data[personInd[0]].projects[projectInd].versions[versionInd].illustrations = data[personInd[0]].projects[projectInd].versions[versionInd].illustrations.filter(({src}) => src !== newIllustration.src)
              // удаление файла на диске и в uploads
              let sintet = '25c6947e-0778-4fca-b3f3-ad6e6b25475c.jpg'
              console.log('newIllustration.name:',newIllustration.name);
              let end = newIllustration.src.split('/');
              end = end[end.length-1];
              console.log('end:', end)
              axios.delete(`https://cloud-api.yandex.net:443/v1/disk/resources?path=disk%3A%2Fillustrations%2F${end}`, { headers: { Authorization: process.env.DISK_TOKEN ?? '' }})
                .then(() => console.log('SUCCESS_DELETE') )
                .catch(er => console.log(redBright('DELETE_ERROR:'), er))

            }

            writeFile('users.json', data).then(() => {
                this.io.to(person).emit('NEW_ILLUSTRATIONS', {person, workPCD, newIllust: newIllustration, action, sender: superId});
            });

          })
        })
        .on('REQUEST_RIGHT', ({person}) => {
          const {superId} = socket.handshake;
          this.io.to(person).emit('REQUEST_RIGHT', {sender: superId})
        })
        .on('DELETE', ({workPCD, workPerson, target}) => {
          const {superId} = socket.handshake;

          readFile('users.json').then(data => {
            let personInd = [];
            this.findInd(personInd, data, workPerson);

            let projectInd
            for(let i in data[personInd[0]].projects) {
              if(data[personInd[0]].projects[i].superId === workPCD.projectId) {
                projectInd = i;
                break
              }
            }
            // обновление PCD у отправителя, 100 Мув.
            let pcdInd;
            for(let i in data[personInd[0]].projectsCoordsData) {
              if(data[personInd[0]].projectsCoordsData[i].projectId === workPCD.projectId) {
                pcdInd = i;
                break
              }
            }
            // поиск владельца всеми этими сокровищами и замена переменных)

            // пройтись с дебагером и проверить работоспособность delete

            let userPcdInd;
            // удалять проекты может только владец аккаунта, так что здесь без разницы, откуда дата.
            if (target === 'project') {
              data[personInd[0]].projects.splice(projectInd, 1);
              data[personInd[0]].projectsCoordsData.splice(pcdInd, 1)
            }

            if(target === 'version') { // здесь нужно удалить даты у обоих челов с проверкой естесена
              let versionInd;
              for(let i in data[personInd[0]].projects[projectInd[0]].versions) {
                if(data[personInd[0]].projects[projectInd[0]].versions[i].superId === workPCD.workVersion) {
                  versionInd = i;
                }
              };
              data[personInd[0]].projects[projectInd[0]].versions.splice(versionInd, 1);
              data[personInd[0]].projectsCoordsData.splice(pcdInd, 1)

                let userInd = [];
              if(superId !== workPerson) { // обработка случая удаления версии не владельцем. Повторное удаления pcd
                this.findInd(userInd, data, superId);
                let userPcdInd;

                for(let i in data[userInd[0]].projectsCoordsData) {
                  if(data[userInd[0]].projectsCoordsData[i].projectId === workPCD.projectId) {
                    userPcdInd = i;
                  }
                }
                data[userInd[0]].projectsCoordsData.splice(userPcdInd, 1)
              }
            }

              writeFile('users.json', data).then(() => {
                this.io.to(workPerson).emit('DELETE', {person: workPerson, workPCD, sender: superId, target});
              })
          })

        })
        .on('LOGOUT', () => {
          const {superId} = socket.handshake;

          readFile('sockets.json').then(data => {
            let personInd;
            for(let i in data) {
                if(Object.values(data[i])[0] === superId) {
                  personInd = i;
                }
            };

            data.splice(personInd, 1)

            for(let i in socket.rooms) {
              console.log("ROOM_I:",i)
              socket.leave(i);
            }
            writeFile('sockets.json', data)
          })
        })
        .on('disconnect', (reason) => {
// поиск последнего места, где был чел и если там остался след в виде его мастера, то он зануляется и на адрес чела
// улетает евент, освобождающий позицию.

//!!! Обработать исключение при котором у чела нет проектов или версий....

// Дисконект сильно устарел на фоне удалений и отстутсвующих проектов, длсишнуть.
          console.log(this.findInd)
          let context = this;
          const {superId} = socket.handshake;
          // организовать работу с available.
          console.log(redBright('disconnect '), socket.id);
          readFile('sockets.json').then(socks => {
            for(let i in socks) {
              if(Object.values(socks[i])[0] === superId) {
                //let newSuperId = socket.id
                let workId = superId;
                readFile('users.json').then(data => {
                  let personInd = [];
                  this.findInd(personInd, data, workId);
                  let workPersonInd = personInd.slice();

                  if(data[personInd[0]].lastPerson !== workId) {
                    this.findInd(workPersonInd, data, data[personInd[0]].lastPerson);
                  }
                  let pcdInd;
                  for(let i in data[personInd[0]].projectsCoordsData) {
                    if(data[personInd[0]].projectsCoordsData[i].projectId === data[personInd[0]].lastProject) {
                      pcdInd = i;
                    }
                  };
                  let workPCD = data[personInd[0]].projectsCoordsData[pcdInd];

                  let projectInd;
                  for(let i in data[workPersonInd[0]].projects) {
                    if(data[workPersonInd[0]].projects[i].superId === workPCD.projectId) {
                      projectInd = i;
                    }
                  }

                  let versionInd;
                  for(let i in data[workPersonInd[0]].projects[projectInd].versions) {
                    if(data[workPersonInd[0]].projects[projectInd].versions[i].superId === workPCD.workVersion) {
                      versionInd = i;
                    }
                  }

                  if(data[workPersonInd[0]].projects[projectInd].versions[versionInd].master === data[personInd[0]].userData.nickName) {
                    data[workPersonInd[0]].projects[projectInd].versions[versionInd].master = null
                  };
                  let workMaster = data[workPersonInd[0]].projects[projectInd].versions[versionInd].master;
                  writeFile('users.json', data).then(() => {
                    this.io.to(data[personInd[0]].lastPerson).emit('NEW_AVAILABLES', {
                      person: data[personInd[0]].lastPerson,
                      workPCD,
                      payload: workMaster,
                      sender: workId
                    })
                  })

                })
                // reduce here
                socks.splice(i, 1);
                writeFile('sockets.json', socks)

              }
            }
          });

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

  findInd(personInd, data, id) {
    let i = 0;
    while(i < data.length) {
      if(id === data[i].userData.superId) {
        personInd[0] = i
      }
      i++;
    }
  };

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


}
