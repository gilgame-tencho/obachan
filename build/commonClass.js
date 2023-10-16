const fs = require('fs');
const build_fs = {
    gameClass: 'gameClass.js',
}
const static_out_dir = 'common';
const DELI = '// **vvv';

console.log("----- build Start.----");

let input = fs.readFileSync(__dirname + '/../common/gameClass.js', 'utf-8');
let indexOf = input.indexOf(DELI);
let text = input.slice(0, indexOf);
fs.writeFileSync(__dirname + '/../static/common/gameClass.js', text, (err, data) => {
    if(err) console.log(err);
    else console.log('write end');
});

console.log("----- build END.  ----");

