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
}
