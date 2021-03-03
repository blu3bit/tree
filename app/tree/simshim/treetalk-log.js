function TreetalkLog() {
    let cntRun = 0;
    const arr = [];

    function add({ß}) { //console.log(name, log);
        arr.push({ß});
        // TODO filter level
        return function treetalk() {
            const arr = Array.prototype.slice.call(arguments),
                  log = arr.shift();
            cntRun++;
            log('#898989', 'run: ' + cntRun + '\n', ...arr, run());
        };
    }

    function run() {
        try {
            let s = '\n';
            arr.forEach(({ß}) => {            //console.log('-------------->', ß);
                const treetalk = ß.grapevine.getTreeTalk(),
                      peers = ß.grapevine.getPeerProxies();
                peers.each(o => {
                    s += '\tPeer: ' + o.name + ' \n';
                    const
                        rp = o.getReplier(),
                        {earned, grace, available, refill, share} = rp.getQuota();
                    s += `\t\t\tQuota ${Math.floor(rp.getShare() * 1000)/10}%% Available: ${rp.getAvailableQuota()}/${available}, Weight: ${rp.getWeight()} Card score: ${rp.totalCardScore()} Initialized: ${!rp.isUnitialized()} \n`;
                    s += `\t\t\tRefill in: ${refill - Date.now()}ms : ${new Date(refill)} \n`;
                });
            });
            return s;
        } catch(e) {
            console.error(e);
        }
    }

    return {
        add
    };
}

const singleton = new TreetalkLog();

export function createTreetalkLog({ß}) {
    return singleton.add({ß});
}

