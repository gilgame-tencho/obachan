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

// const CONF = Object.assign(
//     yaml.parse(fs.readFileSync(__dirname + '/conf/server_conf.yml', 'utf-8')),
//     yaml.parse(fs.readFileSync(__dirname + '/conf/apl_conf.yml', 'utf-8')),
// );

// const SERVER_NAME = CONF.SERVER_NAME;
// const FIELD_WIDTH = CONF.FIELD_WIDTH;
// const FIELD_HEIGHT = CONF.FIELD_HEIGHT;
// const FPS = CONF.FPS;
// const BLK = CONF.BLOCK;
// const DEAD_LINE = CONF.FIELD_HEIGHT + CONF.BLK * 1;
// const DEAD_END = CONF.FIELD_HEIGHT + CONF.BLK * 3;
// const MAX_HEIGHT = CONF.FIELD_HEIGHT / CONF.BLK - 1;
// const MAX_WIDTH = CONF.FIELD_WIDTH / CONF.BLK;
// CONF.DEAD_LINE = CONF.FIELD_HEIGHT + CONF.BLK * 1;
// CONF.DEAD_END = CONF.FIELD_HEIGHT + CONF.BLK * 3;
// CONF.MAX_HEIGHT = CONF.FIELD_HEIGHT / CONF.BLK - 1;
// CONF.MAX_WIDTH = CONF.FIELD_WIDTH / CONF.BLK;

const GM = require('./common/gameClass.js');
const CONF = GM.CONF;
// let tt = new GC.SAMPLE();
// const GM = new GC.GM();

const logger = STANDERD.logger({
    server_name: CONF.SERVER_NAME,
    log_level: CONF.loglevel,
    name: this.constructor.name,
});

// init block. -----------------------------
const ccdm = GM.ccdm;
const gameMtr = GM.gameMtr;

io.on('connection', function(socket) {
    let player = null;
    socket.on('game-start', (config) => {
        logger.log(`gameStart`);
        player = new GM.Player({
            socketId: socket.id,
            nickname: config.nickname,
            id: config.id,
            END_POINT: ccdm.stage.END_POINT,
            x: CONF.BLK * 2,
            y: CONF.FIELD_HEIGHT * 0.5,
        });
        ccdm.players[player.id] = player;
        io.sockets.emit('new-player', player);
        logger.log(`start plyaer: ${player.nickname}`);
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