const yaml = require('yaml');
const fs = require('fs');
console.log("Server Load gameClass.");
const CONF = Object.assign(
    yaml.parse(fs.readFileSync(__dirname + '/../conf/server_conf.yml', 'utf-8')),
    yaml.parse(fs.readFileSync(__dirname + '/../conf/apl_conf.yml', 'utf-8')),
);

CONF.DEAD_LINE = CONF.FIELD_HEIGHT + CONF.BLK * 1;
CONF.DEAD_END = CONF.FIELD_HEIGHT + CONF.BLK * 3;
CONF.MAX_HEIGHT = CONF.FIELD_HEIGHT / CONF.BLK - 1;
CONF.MAX_WIDTH = CONF.FIELD_WIDTH / CONF.BLK;
CONF.FPMS = Math.round(CONF.RTms_Psec / CONF.FPS * 100) / 100;
CONF.MV_SPEED = CONF.FPMS / CONF.RTms_Psec * CONF.move_speed;
CONF.FALL_SPEED = CONF.FPMS / CONF.RTms_Psec * CONF.fall_speed;
CONF.JUMP_SPEED = CONF.FPMS / CONF.RTms_Psec * CONF.jump_speed;

// File access is there. ====

// function local_load_stage(){
//     let stage = fs.readFileSync(__dirname + '/../conf/stages/s1.txt', 'utf-8');
//     let lines = stage.split("\r\n");
//     let st = [];
// }

// CONF.STAGE = [];


// **vvv** START_MARK

console.log("Load gameClass");

class loggerClass{
    constructor(obj={}){
      this.server_name = obj.server_name;
        this.level_no = {
            debug: 1,
            info: 2,
            error: 3,
        };
        this.log_level = this.level_no[obj.log_level];
        this.iam = obj.name;
    }
    // not use.
    log(msg, level='debug'){
        let logmsg = '';
        logmsg += `[${this.server_name}] `;
        logmsg += `[${level} ${this.iam}] `;
        logmsg += msg;
        if(this.level_no[level] >= this.log_level){
            console.log(logmsg);
        }
    }
    debug(msg){
      this.log(msg, 'debug');
    }
    info(msg){
        this.log(msg, 'info');
    }
    error(msg){
        this.log(msg, 'error');
    }
}

const logger = new loggerClass({
    server_name: CONF.SERVER_NAME,
    log_level: 'debug',
    name: this.constructor.name,
});

function random(range){
    return Math.round(Math.random() * range * 10, 0) % range;
}

// ## Defind Class. -----###

class ClientCommonDataManager{
    constructor(obj={}){
        this.id = Math.floor(Math.random()*1000000000);
    }
    toJSON(){
        return {
            id: this.id,
        };
    }
}
class CCDM extends ClientCommonDataManager{
    constructor(obj={}){
        super(obj);
        this.players = {};
        this.enemys = {};
        this.blocks = {};
        this.items = {};
        this.stage = new Stage();
        this.goal = null;
        this.conf = CONF;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            players: this.players,
            enemys: this.enemys,
            blocks: this.blocks,
            items: this.items,
            stage: this.stage,
            conf: this.conf,
            goal: this.goal,
        });
    }
}

class OriginObject{
    constructor(obj={}){
        this.id = Math.floor(Math.random()*1000000000);
        this.logger = new loggerClass({
            server_name: CONF.SERVER_NAME,
            log_level: 'debug',
            name: this.constructor.name,
        });
    }
    toJSON(){
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        };
    }
}
class PhysicsObject extends OriginObject{
    constructor(obj={}){
        super(obj);
        this.x = obj.x;
        this.y = obj.y;
        this.width = obj.width;
        this.height = obj.height;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        });
    }
}
class GeneralObject extends OriginObject{
    constructor(obj={}){
        super(obj);
        this.name = obj.name;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            name: this.name,
        });
    }
}
class GameObject extends PhysicsObject{
    constructor(obj={}){
        super(obj);
        this.angle = obj.angle;
        this.direction = obj.direction;
        this.END_POINT = obj.END_POINT ? obj.END_POINT : CONF.FIELD_WIDTH;
    }
    collistion(oldX, oldY){
        let collision = false;
        if(this.intersectField()){
                collision = true;
        }
        if(this.intersectBlock()){
            collision = true;
        }
        if(collision){
            this.x = oldX; this.y = oldY;
        }
        return collision;
    }
    move(distance){
        const oldX = this.x, oldY = this.y;

        let dis_x = distance * Math.cos(this.angle);
        let dis_y = distance * Math.sin(this.angle);
        this.x += dis_x;
        this.y += dis_y;

        return !this.collistion(oldX, oldY);
    }
    fall(distance){
        const oldX = this.x, oldY = this.y;

        this.y += distance;

        return !this.collistion(oldX, oldY);
    }
    rise(distance){
        const oldX = this.x, oldY = this.y;

        this.y -= distance;

        return !this.collistion(oldX, oldY);
    }
    intersect(obj){
        return (this.x < obj.x + obj.width) &&
            (this.x + this.width > obj.x) &&
            (this.y < obj.y + obj.height) &&
            (this.y + this.height > obj.y);
    }
    intersectBlock(){
        return Object.keys(ccdm.blocks).some((id)=>{
            if(this.intersect(ccdm.blocks[id])){
                return true;
            }
        });
    }
    intersectField(){
        return (
            this.x < 0 ||
            this.x + this.width >= this.END_POINT ||
            this.y < 0 ||
            this.y + this.height >= CONF.DEAD_END
        )
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            angle: this.angle,
            direction: this.direction,
            END_POINT: this.END_POINT,
        });
    }
}

class Player extends GameObject{
    constructor(obj={}){
        super(obj);
        this.socketId = obj.socketId;
        this.nickname = obj.nickname;
        this.player_type = 'player';
        this.view_x = 0;
        this.speed = 1;
        this.dead_flg = false;
        if(obj.id){ this.id = obj.id }

        this.menu = {
            name:       { x: CONF.BLK*1, y: CONF.BLK*1, v:this.nickname },
            score:      { x: CONF.BLK*1, y: CONF.BLK*2, v:0 },

            coin:       { x: CONF.BLK*5, y: CONF.BLK*2, v:0 },
            stage_name: { x: CONF.BLK*9, y: CONF.BLK*1, v:"WORLD" },
            stage_no:   { x: CONF.BLK*9, y: CONF.BLK*2, v:"1-1" },
            time_title: { x: CONF.BLK*13, y: CONF.BLK*1, v:"TIME" },
            time:       { x: CONF.BLK*13, y: CONF.BLK*2, v:300 },
        }
        this.score_interval = CONF.FPS;
        this.score_i = 0;

        this.movement = {};

        this.width = CONF.CHAR_W;
        this.height = CONF.CHAR_Y;
        this.angle = 0;
        this.direction = 'r';  // direction is right:r, left:l;
        this.cmd_unit = {
            jump: {
                type: 'single',
                in_action: false,
                e: 0,
                max_e: CONF.jump_power * CONF.BLK,
                cooltime: 0,
            }
        };

        this.flg_fly = true;
        this.cmd_his = []; //command history. FIFO.
        for(let i=0; i<CONF.CMD_HIS; i++){
            this.cmd_his.push({});
        }
        this.auto_move = true;
        this.debug_info = {
            collistion: '',
        };
    }
    command(param){
        this.movement = param;
    }
    frame(){
        this.score_cal();
        let command = this.movement;
        // console.log(this.cmd_his);
        // movement
        if(command.forward){
            this.move(CONF.MV_SPEED);
        }
        if(command.back){
            this.move(-CONF.MV_SPEED);
        }
        if(command.left){
            this.angle = Math.PI * 1;
            this.direction = 'l';
            this.move(CONF.MV_SPEED);
        }
        if(command.right){
            this.angle = Math.PI * 0;
            this.direction = 'r';
            this.move(CONF.MV_SPEED);
        }
        if(command.up){
        }
        if(command.down){
        }

        // dash
        if(command.dash){
            this.dash(true);
        }else{
            this.dash(false);
        }

        // jump
        if(!this.jump(command.jump)){
            this.fall(CONF.FALL_SPEED);
        }

        // command reflesh.
        this.cmd_his.push(command);
        if(this.cmd_his.length > CONF.CMD_HIS){
            this.cmd_his.shift();
        }

        if(this.auto_move){
            this.angle = Math.PI * 0;
            this.direction = 'r';
            this.move(CONF.MV_SPEED);
        }
    }
    collistion(oldX, oldY, oldViewX=this.view_x){
        let collision = false;
        if(this.intersectField()){
                collision = true;
                this.debug_info.collistion = 'intersectField';
        }
        if(this.intersectBlock(oldX, oldY)){
            collision = true;
            this.debug_info.collistion = 'intersectBlock';
        }
        if(collision){
            this.x = oldX; this.y = oldY;
            this.view_x = oldViewX;
        }else{
            this.debug_info.collistion = '';
        }
        return collision;
    }
    move(distance){
        // if(this.dead_flg){ return };
        const oldX = this.x, oldY = this.y;
        const oldViewX = this.view_x;

        let range = distance * this.speed;
        let dis_x = range * Math.cos(this.angle);
        let dis_y = range * Math.sin(this.angle);
        if(this.x + dis_x <= this.view_x + CONF.CENTER){
            this.x += dis_x;
            this.y += dis_y;
        }else{
            this.view_x += dis_x;
            this.x += dis_x;
            this.y += dis_y;
        }

        let collision = this.collistion(oldX, oldY, oldViewX);

        this.isDead();

        if(!collision){
            Object.keys(ccdm.items).forEach((id)=>{
                if(ccdm.items[id] && this.intersect(ccdm.items[id])){
                    ccdm.items[id].touched = this.id;
                    this.menu.coin.v++;
                    delete ccdm.items[id];
                }
            });
        }
        return !collision;
    }
    intersectBlock(oldX, oldY){
        return Object.keys(ccdm.blocks).some((id)=>{
            if(this.intersect(ccdm.blocks[id])){
                if(oldY > this.y){
                    ccdm.blocks[id].touched = this.id;
                }
                return true;
            }
        });
    }
    isDead(){
        let dead_flg = false;
        if(this.y > CONF.DEAD_LINE){
            dead_flg = true;
        }

        if(dead_flg){
            this.dead_flg = true;
            // this.respone();
        }
    }
    fall(distance){
        this.flg_fly = super.fall(distance);
        return this.flg_fly;
    }
    jump(cmd){
        let e = this.cmd_unit.jump.e;
        let in_action = this.cmd_unit.jump.in_action;
        let max_e = this.cmd_unit.jump.max_e;

        if(!cmd){
            this.cmd_unit.jump.e = 0;
            this.cmd_unit.jump.in_action = false;
            return false;
        }
        if(!in_action){
            if(this.flg_fly){ // TODO: OR cooltime.
                return false;
            }
            //is init.
            this.cmd_unit.jump.in_action = true;
        }

        // jump method.
        if(e <= max_e && this.rise(CONF.JUMP_SPEED)){
            this.cmd_unit.jump.e += CONF.JUMP_SPEED;
        }else{
            this.cmd_unit.jump.e = 0;
            this.cmd_unit.jump.in_action = false;
            return false;
        }
        return true;
    }
    dash(sw){
        if(sw){
            this.speed = 1 * 1.5;
        }else{
            this.speed = 1;
        }
    }
    score_cal(){
        if(this.score_i > this.score_interval){
            this.menu.score.v += Math.round(CONF.MV_SPEED * this.score_interval,0);
            this.score_i = 0;
        }
        this.score_i ++;
    }
    remove(){
        delete players[this.id];
        io.to(this.socketId).emit('dead');
    }
    respone(){
        // delete ccdm.players[this.id];
        this.x = CONF.BLK * 2;
        this.y = CONF.FIELD_HEIGHT * 0.2;
        this.view_x = 0;
        this.dead_flg = false;
        this.menu.score.v = 0;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            socketId: this.socketId,
            nickname: this.nickname,
            player_type: this.player_type,
            view_x: this.view_x,
            menu: this.menu,
            dead_flg: this.dead_flg,
        });
    }
}

class Enemy extends Player{
    constructor(obj={}){
        super(obj);
        this.player_type = 'enemy';
        this.enemy_type = 'kuribo';
        this.type = 'kuribo';
        this.angle = Math.PI * 1;
        this.direction = 'l';
        this.END_POINT = ccdm.stage.END_POINT;
        this.sleep = true;
        this.mm = 0;
    }
    self_move(){
        if(this.sleep){ return }

        let speed = Math.floor(CONF.MV_SPEED / 3);
        if(!this.move(speed)){
            if(this.direction == 'l'){
                this.direction = 'r';
                this.angle = Math.PI * 0;
            }else{
                this.direction = 'l';
                this.angle = Math.PI * 1;
            }
        }
        this.fall(CONF.FALL_SPEED);
    }
    move(distance){

        const oldX = this.x, oldY = this.y;

        let dis_x = distance * Math.cos(this.angle);
        let dis_y = distance * Math.sin(this.angle);
        this.x += dis_x;
        this.y += dis_y;

        let collision = this.collistion(oldX, oldY);
        // logger.debug(`Enemy is move! collision:${collision}`);

        return !collision;
    }
    respone(){
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            enemy_type: this.enemy_type,
            type: this.type,
        });
    }
}


class Stage extends GeneralObject{
    constructor(obj={}){
        super(obj);
        this.no = obj.no;
        // ### Explanation. ###
        // # height max 14, width max 500
        // # height min 14, width min 16
        // # mark{ 'b':hardblock '.': nothing 'n':normalblock}
        // ###
        this.map = this.load_stage();
        this.END_POINT = this.map.length * CONF.BLK;
    }
    def(){
        let st = [];
        let blk_y = CONF.MAX_HEIGHT - 1;
        let blk_exist = false;
        let blk_viewing = false;
        let blk_height = 3;
        for(let x=0; x<CONF.MAX_WIDTH*30; x++){
            st.push([]);
            for(let y=0; y<CONF.MAX_HEIGHT; y++){
                if(blk_viewing){
                    st[x].push('b');
                    blk_height--;
                }else if(y == blk_y){
                    if(x % CONF.MAX_WIDTH == 0){
                        st[x].push('n');
                        blk_viewing = true;
                        blk_height--;
                        blk_exist = true;
                    }else if(random(3) == 1){
                        st[x].push('.');
                    }else if(random(5) == 1){
                        st[x].push('i');
                        blk_exist = true;
                    }else{
                        st[x].push('b');
                        blk_viewing = true;
                        blk_height--;
                        blk_exist = true;
                    }
                }else{
                    st[x].push('.');
                }
                if(blk_viewing && blk_height < 1){
                    blk_viewing = false;
                }
            }
            if(blk_exist){
                blk_y = this.rand_step(blk_y);
                blk_exist = false;
                blk_height = random(5)+1;
            }
            blk_viewing = false;
        }
        return st;
    }
    load_stage(){
        return this.def();
    }
    rand_step(step){
        // range: 5 ~ max -1
        let min = 5;
        let max = CONF.MAX_HEIGHT - 1;
        return random(max - min) + min;
    }
    toJSON(){
        return Object.assign(super.toJSON(),{
            no: this.no,
            map: this.map,
            END_POINT: this.END_POINT,
        });
    }
}

class commonBlock extends PhysicsObject{
    constructor(obj={}){
        super(obj);
        this.attr = "Block";
        this.type = obj.type;
        this.height = CONF.BLK * 1;
        this.width = CONF.BLK;
        this.touched = null;
        this.bounding = false;
        this.effect = false;
        this.event = false;
    }
    toJSON(){
        return Object.assign(super.toJSON(),{
            type: this.type,
            attr: this.attr,
            touched: this.touched,
            bounding: this.bounding,
            effect: this.effect,
            event: this.event,
        });
    }
}
class hardBlock extends commonBlock{
    constructor(obj={}){
        super(obj);
        // this.type = "hard";
        this.type = "hard";
        this.height = CONF.BLK * 1;
    }
}
class ichigoBlock extends commonBlock{
    constructor(obj={}){
        super(obj);
        // this.type = "hard";
        this.type = "ichigo";
        this.height = CONF.BLK * 2;
        this.width = CONF.BLK * 2;
    }
}
class normalBlock extends commonBlock{
    constructor(obj={}){
        super(obj);
        this.type = "normal";
        this.bounding = true;
    }
}
class hatenaBlock extends commonBlock{
    constructor(obj={}){
        super(obj);
        this.type = "hatena";
        this.bounding = true;
        this.effect = obj.effenct ? obj.effect : 'coin';
    }
}
class goalBlock extends commonBlock{
    constructor(obj={}){
        super(obj);
        this.type = "goal";
        this.height = CONF.BLK * 1;
        this.top = 1;
        this.flag = 1;
        this.pole = 9;
        this.block = 1;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            top: this.top,
            flag: this.flag,
            pole: this.pole,
            block: this.block,
        });
    }
}

const ccdm = new CCDM();

// ### ---
class GameMaster{
    constructor(){
        this.create_stage(ccdm);
        logger.debug("game master.");
        // console.log(ccdm.stage.load_stage());
    }
    create_stage(ccdm){
        let x = 0;
        let y = 0;
        let goal_flg = false;
        ccdm.stage.map.forEach((line)=>{
            y = 0;
            line.forEach((point)=>{
                let param = {
                    x: x * CONF.BLK,
                    y: y * CONF.BLK,
                };
                if(point === 'b'){
                    let block = new hardBlock(param);
                    ccdm.blocks[block.id] = block;
                }
                if(point === 'n'){
                    let block = new normalBlock(param);
                    ccdm.blocks[block.id] = block;
                }
                if(point === 'i'){
                    let block = new ichigoBlock(param);
                    ccdm.blocks[block.id] = block;
                }
                y++;
            });
            x++;
        });
    }
}

const gameMtr = new GameMaster();

// **vvv** END_MARK
// ## build cut static.
// ## modules

module.exports = {
    GM: GameObject,
    Player: Player,
    CONF: CONF,
    ccdm: ccdm,
    gameMtr: gameMtr,
}
