const fs = require('fs');
const build_fs = {
    gameClass: 'gameClass.js',
}
const static_out_dir = 'common';
const START_MARK = '// **vvv** START_MARK';
const END_MARK = '// **vvv** END_MARK';

console.log("----- build Start.----");

let input = fs.readFileSync(__dirname + '/../common/gameClass.js', 'utf-8');
let start_indexOf = input.indexOf(START_MARK);
let end_indexOf = input.indexOf(END_MARK);
let text = input.slice(start_indexOf, end_indexOf);
fs.writeFileSync(__dirname + '/../static/common/gameClass.js', text, (err, data) => {
    if(err) console.log(err);
    else console.log('write end');
});

console.log("----- build END.  ----");

