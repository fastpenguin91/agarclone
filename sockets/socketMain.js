// Where all our main socket stuff will go
const io = require('../servers').io;

// ============== Classes ================
const Player = require('./classes/Player');
const PlayerData = require('./classes/PlayerData');
const PlayerConfig = require('./classes/PlayerConfig');
const Orb = require('./classes/Orb');
let orbs = [];
let players = [];
let settings = {
  defaultOrbs: 500,
  defaultSpeed: 6,
  defaultSize: 6,
  // as player gets bigger we need to zoom out
  defaultZoom: 1.5,
  worldWidth: 500,
  worldHeight: 500
}

initGame();

io.sockets.on('connect',(socket)=>{
  // a player has connected
  socket.on('init',(data)=>{

    // make a player config object
    let playerConfig = new PlayerConfig(settings);
    // make a playerData object
    let playerData = new PlayerData(data.playerName,settings);
    // make a master player objet to hold both
    let player = new Player(socket.id, playerConfig, playerData);
    socket.emit('initReturn',{
      orbs
    });
    players.push(playerData);
  });
});

// runat beginning of new game
function initGame(){
  console.log("helloooo in initgame");
  for (let i = 0; i < settings.defaultOrbs; i++){
    console.log("hi ", i);
    orbs.push(new Orb(settings));
  }
}

module.exports = io;
