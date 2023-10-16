console.log("Load gameClass");

const SERVER_NAME = 'main';
const FIELD_WIDTH = 256;
const FIELD_HEIGHT = 240;
const FPS = 60;
const move_score = 10;
const BLK = 16;
const DEAD_LINE = FIELD_HEIGHT + BLK * 1;
const DEAD_END = FIELD_HEIGHT + BLK * 3;
const MAX_HEIGHT = FIELD_HEIGHT / BLK - 1;
const MAX_WIDTH = FIELD_WIDTH / BLK;
const CENTER = 8;
const CMD_HIS = 5;

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
    server_name: SERVER_NAME,
    log_level: 'debug',
    name: this.constructor.name,
});

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
        // this.stage = new Stage();
        this.goal = null;
        this.conf = {
            SERVER_NAME: SERVER_NAME,
            FIELD_WIDTH: FIELD_WIDTH,
            FIELD_HEIGHT: FIELD_HEIGHT,
            FPS: FPS,
            BLK: BLK,
            MAX_HEIGHT: MAX_HEIGHT,
            MAX_WIDTH: MAX_WIDTH,
            CENTER: CENTER,
        };
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
            server_name: SERVER_NAME,
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
        this.END_POINT = obj.END_POINT ? obj.END_POINT : FIELD_WIDTH;
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
            this.y + this.height >= DEAD_END
        )
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            angle: this.angle,
            direction: this.direction,
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
            name:       { x: BLK*1, y: BLK*1, v:this.nickname },
            score:      { x: BLK*1, y: BLK*2, v:0 },

            coin:       { x: BLK*5, y: BLK*2, v:0 },
            stage_name: { x: BLK*9, y: BLK*1, v:"WORLD" },
            stage_no:   { x: BLK*9, y: BLK*2, v:"1-1" },
            time_title: { x: BLK*13, y: BLK*1, v:"TIME" },
            time:       { x: BLK*13, y: BLK*2, v:300 },
        }

        this.movement = {};

        this.width = BLK;
        this.height = BLK;
        this.angle = 0;
        this.direction = 'r';  // direction is right:r, left:l;
        this.jampping = 0;
        this.jump_count = 0;
        this.flg_fly = true;
        this.cmd_his = []; //command history. FIFO.
        for(let i=0; i<CMD_HIS; i++){
            this.cmd_his.push({});
        }
    }
    command(param){
        this.movement = param;
    }
    frame(){
        let command = this.movement;
        // console.log(this.cmd_his);
        // movement
        if(command.forward){
            this.move(server_conf.move_speed);
        }
        if(command.back){
            this.move(-server_conf.move_speed);
        }
        if(command.left){
            this.angle = Math.PI * 1;
            this.direction = 'l';
            this.move(server_conf.move_speed);
        }
        if(command.right){
            this.angle = Math.PI * 0;
            this.direction = 'r';
            this.move(server_conf.move_speed);
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

        if(command.jump){
            this.jump();
        }else{
            this.jump_count = 0;
        }
        if(this.jampping > 0){
            this.hopping();
        }else{
            this.fall(server_conf.fall_speed);
        }

        // command reflesh.
        this.cmd_his.push(command);
        if(this.cmd_his.length > CMD_HIS){
            this.cmd_his.shift();
        }
    }
    collistion(oldX, oldY, oldViewX=this.view_x){
        let collision = false;
        if(this.intersectField()){
                collision = true;
        }
        if(this.intersectBlock(oldX, oldY)){
            collision = true;
        }
        if(collision){
            this.x = oldX; this.y = oldY;
            this.view_x = oldViewX;
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
        if(this.x + dis_x <= this.view_x + CENTER){
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
        if(this.y > DEAD_LINE){
            dead_flg = true;
        }

        if(dead_flg){
            this.dead_flg = true;
            this.respone();
        }
    }
    fall(distance){
        this.flg_fly = super.fall(distance);
        return this.flg_fly;
    }
    jump(){
        if(this.jampping <= 0 && !this.flg_fly && this.jump_count == 0){
            this.flg_fly = true;
            this.jampping = 2 * BLK;
            this.jump_count = 1;
        }else if( this.jump_count == 1){
            this.jump_count = 2;
        }else if( this.jump_count == 2){
            this.jampping += 1.5 * BLK;
            this.jump_count = 3;
        }else if( this.jump_count == 3){
            this.jump_count = 4;
        }else if( this.jump_count == 4){
            this.jampping += 1.5 * BLK;
            this.jump_count = 5;
        }else{
            this.jump_count = 0;
        }
    }
    hopping(){
        if(this.rise(server_conf.jamp_speed)){
            this.jampping -= server_conf.jamp_speed;
        }else{
            this.jampping = 0;
        }
        if(this.jampping <= 0){
            this.jampping = 0;
        }
    }
    dash(sw){
        if(sw){
            this.speed = 1 * 1.5;
        }else{
            this.speed = 1;
        }
    }
    remove(){
        delete players[this.id];
        io.to(this.socketId).emit('dead');
    }
    respone(){
        // delete ccdm.players[this.id];
        this.x = BLK * 2;
        this.y = FIELD_HEIGHT * 0.5;
        this.view_x = 0;
        this.dead_flg = false;
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

        let speed = Math.floor(server_conf.move_speed / 3);
        if(!this.move(speed)){
            if(this.direction == 'l'){
                this.direction = 'r';
                this.angle = Math.PI * 0;
            }else{
                this.direction = 'l';
                this.angle = Math.PI * 1;
            }
        }
        this.fall(server_conf.fall_speed);
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

class Sample {
    constructor(){
        console.log('Hello World!!Sample.');
    }
}

// **vvv
// ## build cut static.
// ## modules

module.exports = {
    SAMPLE: Sample,
    CCDM: CCDM,
    GM: GameObject,
    Player: Player,
}
