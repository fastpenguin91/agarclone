// Where all our main socket stuff will go
const io = require('../servers').io;
const checkForOrbCollisions = require('./checkCollisions').checkForOrbCollisions;
const checkForPlayerCollisions = require('./checkCollisions').checkForPlayerCollisions;


// ============== Classes ================
const Player = require('./classes/Player');
const PlayerData = require('./classes/PlayerData');
const PlayerConfig = require('./classes/PlayerConfig');
const Orb = require('./classes/Orb');
let orbs = [];
let players = [];
let settings = {
  defaultOrbs: 5000,
  defaultSpeed: 6,
  defaultSize: 6,
  // as player gets bigger we need to zoom out
  defaultZoom: 1.5,
  worldWidth: 5000,
  worldHeight: 5000
}

initGame();

// issue a message to EVERY connected socket 30 fps
setInterval(()=> {
  if(players.length > 0) {
    io.to('game').emit('tock',{
      players,
    });
  }
},33); // there are 30 33s in 1000 milliseconds or 1/30th of a second or 1 of 30fps

io.sockets.on('connect',(socket)=>{
  let player = {};
  // a player has connected
  socket.on('init',(data)=>{
    // add player to game namespace
    socket.join('game');
    // make a player config object
    let playerConfig = new PlayerConfig(settings);
    // make a playerData object
    let playerData = new PlayerData(data.playerName,settings);
    // make a master player objet to hold both
    player = new Player(socket.id, playerConfig, playerData);
    // issue a message to THiS connected socket 30 fps
    setInterval(()=> {
      socket.emit('tickTock',{
        playerX: player.playerData.locX,
        playerY: player.playerData.locY,
      });
    },33); // there are 30 33s in 1000 milliseconds or 1/30th of a second or 1 of 30fps
    socket.emit('initReturn',{
      orbs
    });
    players.push(playerData);
  });
  // the client sent over a tick, that means we know what direction to move the socket/player
  socket.on('tick',(data)=>{
    speed = player.playerConfig.speed;
    // update player config object with ew direction in data
    // and at the same time create a local variable for this callback for readability
    xV = player.playerConfig.xVector = data.xVector;
    yV = player.playerConfig.yVector = data.yVector;

    if((player.playerData.locX < 5 && player.playerData.xVector < 0) || (player.playerData.locX > settings.worldWidth) && (xV > 0)){
      player.playerData.locY -= speed * yV;
    }else if((player.playerData.locY < 5 && yV > 0) || (player.playerData.locY > settings.worldHeight) && (yV < 0)){
      player.playerData.locX += speed * xV;
    }else{
      player.playerData.locX += speed * xV;
      player.playerData.locY -= speed * yV;
    }
    // ORB COLLISION
    let capturedOrb = checkForOrbCollisions(player.playerData,player.playerConfig, orbs, settings);
    capturedOrb.then((data)=>{
      // then runs if ... resolve runs a collision
      // emit to all sockets the orb to replace
      const orbData = {
        orbIndex: data,
        newOrb: orbs[data]
      };
      // every socket needs to know the leaderboard has changed
      io.sockets.emit('updateLeaderBoard', getLeaderBoard());
      io.sockets.emit('orbSwitch',orbData);
    }).catch(()=>{
      // catch if reject runs no collision
    });

    // Player collision
    let playerDeath = checkForPlayerCollisions(player.playerData, player.playerConfig,players,player.socketId);
    playerDeath.then((data)=>{
      // collision
      // every socket needs to know the leaderboard has changed
      io.sockets.emit('updateLeaderBoard', getLeaderBoard());
      // player was absored. let people know
      io.sockets.emit('playerDeath', data);
    }).catch(()=>{
      // no player collision


    });
    socket.on('disconnect', (data)=>{
      // console.log(data);
      // find out who just left
      // make sure player exists
      if(player.playerData){
        
        players.forEach((currPlayer,i)=>{
          // if they match...
          if(currPlayer.uid == player.playerData.uid){
            // star wars
            players.splice(i,1);
            io.sockets.emit('updateLeaderBoard', getLeaderBoard());
          }
        });
        const updateStats = `
UPDATE stats
SET highScore = CASE WHEN highScore < ? THEN ? ELSE highScore END,
mostOrbs = CASE WHEN mostOrbs < ? THEN ? ELSE mostOrbs END,
mostPlayers = CASE WHEN mostPlayers < ? THEN ? ELSE mostPlayers END
WHERE username = ?
`;
      }
    });
  });

  function getLeaderBoard(){
    // sort players in desc order
    players.sort((a,b)=>{
      return b.score - a.score;
    });
    let leaderBoard = players.map((curPlayer)=>{
      return {
        name: curPlayer.name,
        score: curPlayer.score
      };
    });
    return leaderBoard;
  }

// runat beginning of new game
function initGame(){
  for (let i = 0; i < settings.defaultOrbs; i++){
    orbs.push(new Orb(settings));
  }
}

module.exports = io;
