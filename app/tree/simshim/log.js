let count = 0;

export function createLog({ß, name, suffix='', level}, logFunctions=[]) {
    count++;
    const n = `[${name+suffix} ${count}]`;
    const log = function() {
        if(typeof arguments[0] === 'string' && arguments[0].startsWith('#')) {
            let s = '%c' + n + ' ',
                arr = [];
            for(let i = 1; i < arguments.length; i++) {
                let o = arguments[i];
                if(typeof o === 'string') s += o;
                else arr.push(o); 
            }
            console.log(s, 'color: ' + arguments[0], ...arr);
        } else {
            console.log(n, ...arguments);
        }
    };
    log.n = function()  { if(arguments[0] <= level) log(...Array.from(arguments).slice(1)); };
    log.w = function()  { console.warn(n, ...arguments);                                 };
    log.e = function()  { console.error(n, ...arguments);                                };
    log.c = function(e) { console.error(e.message, e.stack, n, {e});                     };
    log.logName = n;
    log.createLog = ({ß:subß, name:subName, suffix, level:subLevel}) => {
        return createLog({ß:subß||ß, name:subName||name, suffix, level:subLevel||level}, logFunctions);
    };
    logFunctions.forEach(f => {
        log[f.name] = function() {
            if(arguments[0] <= level) f(log, ...Array.from(arguments).slice(1));
        };
    });
    return log;
};

