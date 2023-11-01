'use strict';

const socket = io();
const canvFT = $('#canvas-front')[0];
const cotxFT = canvFT.getContext('2d');
const canvMD = $('#canvas-middle')[0];
const cotxMD = canvMD.getContext('2d');
const canvBK = $('#canvas-back')[0];
const cotxBK = canvBK.getContext('2d');

let timer = 0;

const images = {};
images.player = {
    r: $('#img-chara-wizard_r')[0],
    l: $('#img-chara-wizard_l')[0],
}
images.map = {
    standard: $('#img-map-standard')[0],
}
images.piece = {
    normal: $('#img-block-normal')[0],
    hard: $('#img-block-hard')[0],
    ichigo: $('#img-block-ichigo')[0],
}

let my_player;
let movement = {};

const MY_USER_ID = Math.floor(Math.random()*1000000000);

function drawImage(ctt, img, px, py=null, pw=null, ph=null){
    let x; let y; let w; let h;
    if(py == null){
        x = px.x; y = px.y;
        w = px.width; h = px.height;
    }else if(ph == null){
        x = px; y = py;
        w = pw.width; h = pw.height;
    }else{
        x = px; y = py;
        w = pw; h = ph;
    }
    ctt.drawImage(
        img,
        0, 0, img.width, img.height,
        x, y, w, h
    );
}

function view_reset_front(){
    cotxFT.clearRect(0, 0, canvFT.width, canvFT.height);
    cotxFT.lineWidth = 1;
    cotxFT.beginPath();
    cotxFT.rect(0, 0, canvFT.width, canvFT.height);
    cotxFT.stroke();
}
function view_reset_middle(){
    cotxMD.clearRect(0, 0, canvMD.width, canvMD.height);
}
function view_reset_background(){
    cotxBK.clearRect(0, 0, canvBK.width, canvBK.height);
    drawImage(cotxBK, images.map.standard, 0, 0, canvBK.width, canvBK.height);
}
function view_reset_all(){
    view_reset_front();
    view_reset_middle();
    view_reset_background();
}
function debug_show_object_line(cotx, obj){
    cotx.save();
    cotx.lineWidth = 1;
    cotx.strokeStyle = "#00aa00";
    cotx.beginPath();
    cotx.rect(obj.x, obj.y, obj.width, obj.height);
    cotx.stroke();
    cotx.restore();
}

function is_draw(obj, margin, field_width){
    return (-margin < obj.x && obj.x < field_width + margin)
}

// init -----
view_reset_all();

// -- server action --------
socket.on('back-frame', function() {
    view_reset_background();
});

socket.on('menu-frame', function() {
});

const menu_frame = () => {
    view_reset_front();
    if(!my_player){ return }

    const mymenu = my_player.menu;
    cotxFT.save();
    cotxFT.lineWidth = 3;
    cotxFT.strokeStyle = "#000000";
    cotxFT.font = "8px Bold 'ＭＳ ゴシック'";
    cotxFT.fillText(mymenu.name.v, mymenu.name.x, mymenu.name.y);
    cotxFT.fillText(`SCORE ${mymenu.score.v}`, mymenu.score.x, mymenu.score.y);
    //cotxFT.fillText(`C x 0${mymenu.coin.v}`, mymenu.coin.x, mymenu.coin.y);
    cotxFT.fillText(mymenu.stage_name.v, mymenu.stage_name.x, mymenu.stage_name.y);
    cotxFT.fillText(mymenu.stage_no.v, mymenu.stage_no.x, mymenu.stage_no.y);
    cotxFT.fillText(mymenu.time_title.v, mymenu.time_title.x, mymenu.time_title.y);
    cotxFT.fillText(mymenu.time.v, mymenu.time.x, mymenu.time.y);
    cotxFT.restore();
}

// socket.on('state', function(ccdm) {
const draw_view = function(){
    view_reset_middle();
    const MARGIN = CONF.BLK * 3;
    let VIEW_X = 0;
    if(my_player){
        VIEW_X = my_player.view_x;
    }

    let pieces = {};
    Object.assign(pieces, ccdm.blocks);
    // Object.assign(pieces, ccdm.items);
    // Object.assign(pieces, ccdm.enemys);

    Object.values(pieces).forEach((piece) => {
        let param = {
            x: piece.x - VIEW_X,
            y: piece.y,
            width: piece.width,
            height: piece.height,
        }
        if(is_draw(param, MARGIN, CONF.FIELD_WIDTH)){
            drawImage(cotxMD, images.piece[piece.type], param);
        }
    });
    Object.values(ccdm.players).forEach((player) => {
        let img = images.player[player.direction];
        let param = {
            x: player.x - VIEW_X,
            y: player.y,
            width: player.width,
            height: player.height,
        }
        if(is_draw(param, MARGIN, CONF.FIELD_WIDTH)){
            drawImage(cotxMD, img, param);
            // debug_show_object_line(cotxMD, player);

            if(player.socketId === socket.id){
                cotxMD.save();
                cotxMD.font = '8px Bold Arial';
                cotxMD.fillText('You', param.x + 2, param.y - 5);
                cotxMD.restore();
            }
        }
    });
}

let front_view_x = CONF.FIELD_WIDTH;

const main_frame = () => {
    // ### chain block ####
    Object.values(ccdm.players).forEach((player) => {
        // frame
        player.frame();

        if(front_view_x < player.view_x + CONF.FIELD_WIDTH){
            front_view_x = player.view_x + CONF.FIELD_WIDTH;
        }
    });
    // console.log(`debug: my_player[ view_x, x, y ]: [${my_player.view_x}\t${my_player.x}\t${my_player.y}]`);
    // console.log(`debug: front_view_x: ${front_view_x}`);
}

let start_flg = false;
let game_timer = null;
let server_reqest_frame = Math.round(CONF.ServerReqFPS / CONF.FPS);
let frame_counter = 0;

const interval_game = () => {
    start_flg = true;
    main_frame();
    draw_view();
    menu_frame();
    if(frame_counter % server_reqest_frame == 0){
        socket.emit('state', my_player);
        frame_counter = 0;
    }else{
        frame_counter += 1;
    }
}

function gameStart(){
    console.log(`gameStart`);
    socket.emit('game-start', {
        nickname: $("#nickname").val(),
        userid: MY_USER_ID,
    });
}

socket.on('new-player', function(player) {
    console.log(`call new-player`);
    $("#start-screen").hide();
    if(!my_player){
        my_player = new Player(player);
        ccdm.players[my_player.id] = my_player;
    }else{
        my_player.respone();
    }
    if(!start_flg){
        frame_counter = 0;
        game_timer = setInterval(interval_game, 1000/CONF.FPS);
    }
});
$("#start-button").on('click', gameStart);

gameStart();

$(document).on('keydown keyup', (event) => {
    const KeyToCommand = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        // 'ArrowLeft': 'left',
        // 'ArrowRight': 'right',
        ' ': 'jump',
    };
    const command = KeyToCommand[event.key];
    if(command){
        if(event.type === 'keydown'){
            movement[command] = true;
        }else{ /* keyup */
            movement[command] = false;
        }
        my_player.movement = movement;
    }
});

socket.on('dead', () => {
    clearInterval(game_timer);
    start_flg = false;
    $("#start-screen").show();
});
