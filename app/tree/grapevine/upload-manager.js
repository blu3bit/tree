export function createUploadManager({ß, log}) {
    let totalGrace = 0,
        id, removeUploadManager;

    function addGrace(v) {
        totalGrace += v;
    }
    //
    // upload
    //
    function start({timeslotDurationMs, delayStartMs, uploadQuota}) {        //log?.n(0, 'startUploadManager', ...arguments);
        stop();
        const
            f = () => {
                log?.n(5, '#88aaff', 'reset upload timeslot. will close ' + new Date(Date.now() + timeslotDurationMs));
                //log('#515151', 'startUploadManager reset ', new Date());
                const
                    peers = ß.grapevine.getPeerProxies(),
                    countPeers = peers.size(),
                    repliers = peers.map(o => o.getReplier());
                if(countPeers === 0) return;

                let unitializedPeers = [],
                    totalScore = 0,
                    totalWeight = 0;
                repliers.forEach(o => {
                    if(o.isUnitialized()) unitializedPeers.push(o);
                    else {
                        totalWeight += o.getWeight();
                        totalScore += o.totalCardScore();
                    }
                });

                if(unitializedPeers.length > 0) {
                    let avgWeight = 1,
                        avgScore = 1,
                        cntInitialized = peers.size() - unitializedPeers.length;
                    if(peers.size() === unitializedPeers.length) {
                        totalWeight = avgWeight;
                        totalScore = avgScore;
                    }
                    if(cntInitialized > 0) {
                        avgWeight = totalWeight / cntInitialized;
                        avgScore = totalScore / cntInitialized;
                    }
                    unitializedPeers.forEach(o => o.init(avgWeight, avgScore));
                    log?.n(0, 'initiated peers upload-quota', {avgWeight, avgScore, cntInitialized, unitializedPeers});
                }
                repliers.forEach(o => {
                    // though quota are added to peer here,
                    // it does not take immediate effect,
                    // because peer replier has a timer.
                    o.refill(totalWeight, uploadQuota, totalGrace);
                });
                totalGrace = 0;
                //log?.('reset of quota & timeslot', {uploadQuota, nextReset: new Date(nextTimeslotMs), timeslotDurationMs, totalScore, totalWeight});
                id = setTimeout(f, timeslotDurationMs);
            };
        setTimeout(f, delayStartMs);
        removeUploadManager = () => {
            window.clearTimeout(id);
            removeUploadManager = null;
        };
        log?.n(1, 'started');
    }

    function stop() {                                                   //log('stop');
        if(removeUploadManager) {                                       log?.n(1, 'stopping');
            removeUploadManager();
        }
    }

    return {
        addGrace,
        start,
        stop
    };
};
