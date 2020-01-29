// Where all our main socket stuff will go
const io = require('../servers').io;

const Orb = require('./classes/Orb');
let orbs = [];
let settings = {
  defaultObs: 500,
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
  // make a player config object
//  let playerConfig = new playerConfig();
  socket.emit('init',{
    orbs
  });
});

// runat beginning of new game
function initGame(){
  for (let i = 0; i < settings.defaultOrbs; i++){
    orbs.push(new Orb(settings));
  }
}

module.exports = io;
