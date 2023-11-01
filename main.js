'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
app.set('view engine', 'ejs');
const server = http.Server(app);
const io = socketIO(server);
const fs = require('fs');
const yaml = require('yaml');

const STANDERD = require('./game_modules/standerd_modules.js');
// const DB = require('./game_modules/database_modules.js');

const GM = require('./common/gameClass.js');
const CONF = GM.CONF;

const logger = STANDERD.logger({
    server_name: CONF.SERVER_NAME,
    log_level: CONF.loglevel,
    name: this.constructor.name,
});

// init block. -----------------------------
const ccdm = GM.ccdm;
// const gameMtr = GM.gameMtr;

io.on('connection', function(socket) {
    let player = null;
    socket.on('game-start', (config) => {
        logger.log(`gameStart`);
        player = new GM.Player({
            socketId: socket.id,
            nickname: config.nickname,
            id: config.id,
            END_POINT: ccdm.stage.END_POINT,    //??
            x: CONF.BLK * 2,
            y: CONF.FIELD_HEIGHT * 0.2,
        });
        ccdm.players[player.id] = player;
        io.sockets.emit('new-player', player);
        logger.log(`start plyaer: ${player.nickname}`);
    });
    socket.on('state', (config) => {
        if(!player){return;}
        let send_player = config;
        if(send_player.dead_flg){
            logger.log(`player is dead: ${send_player.id} ${send_player.nickname}`);
            delete ccdm.players[player.id];
            player = null;
            io.sockets.emit('dead');
        }
    });
    socket.on('disconnect', () => {
        if(!player){return;}
        delete ccdm.players[player.id];
        player = null;
    });
});

// Server config. -----------
app.use('/static', express.static(__dirname + '/static'));

const app_param = {
    FIELD_HEIGHT: CONF.FIELD_HEIGHT,
    FIELD_WIDTH: CONF.FIELD_WIDTH,
}
app.get('/', (request, response) => {
    app_param.name = request.param('name');
    app_param.title = 'obachan';
    app_param.conf = CONF;
    response.render(path.join(__dirname, '/static/index.ejs'), app_param);
});

server.listen(CONF.port, function() {
  logger.info(`Starting server on port ${CONF.port}`);
  logger.info(`Server conf`);
  console.log(CONF);
});