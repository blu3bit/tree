// TODO handle clock drift
const
    DBEUG_AUTOMATIC_RETRIEVAL = true;

const
    RETRIEVE_RETRY_SECOND = 1000 * 3,
    CONSUME_ALL_MS = 2,
    ERROR_ATTEMPTS = 'ERROR_ATTEMPTS';

import {NOT_ENOUGH_QUOTA} from './replier.js';

export function createRetriever({ß, log, peerProxy}) {
    let queue = [],
        idPolling, quota;

    const MAX_ATTEMPT = 3; // TODO refecator to ß.config

    function zero(a) {
        return !(a > 0);
    }

    async function createAndExchangeMessageAsync({type, data:outData, attempt=1, controller, cb}) {
        // XXX
        // only retrieval attempts with a controller attatched,
        // will retry if there is an error. this because if a
        // controller can not abort, the qutoa is not enough
        // and the refill is far between an un-userfriendly
        // latency might be result
        let inData = {error: ERROR_ATTEMPTS},
            isRetry;
        while(attempt > 0) {
            let now = Date.now(),
                delayMs, refill;
            if(controller) {
                if(quota) {
                    refill = quota.start + quota.duration;
                    let {earned, grace, available} = quota;
                    if(inData.error === NOT_ENOUGH_QUOTA || zero(available)) {
                        //log('wait: not enough quota', {isRetry});
                        // not enough quota,
                        // try sending message after next refill
                        if(zero(refill)) delayMs = RETRIEVE_RETRY_SECOND;
                        else delayMs = refill - now;
                    }
                }
                if(controller.isAbort) break; // no need to wait if aborted
                if(delayMs > 0) {
                    log?.n(2, '#696969', `Wait ${delayMs}, ${new Date(Date.now()+delayMs)}. refill: ${new Date(refill)}`);
                    await new Promise(r => setTimeout(r, delayMs));
                }
                if(controller.isAbort) break; // no need to retrieve if aborted
            }
            const
                outMessage = peerProxy.createMessage(type, outData),
                inMessage = await peerProxy.exchangeMessageAsync(outMessage).catch(log?.c);
            inData = inMessage.data;
            if(!inData) {
                console.error({inMessage});
                throw 'bad reply. inData missing';
                break;
            }
            quota = inData.quota;
            if(!controller) break;

            isRetry = inData.error === NOT_ENOUGH_QUOTA;
            if(!isRetry) {
                break;
            }
            attempt--; // loop
            if(attempt > 0) log?.n(2, '#696969', `Retry: ${MAX_ATTEMPT-attempt}/${MAX_ATTEMPT} ${type}`, inData);
        }
        if(controller) controller.isDone = true;
        if(cb) cb(inData);
        return inData;
    }

    async function processQueueAsync() { //console.trace();
        // will loop until queue is empty
        const o = queue.pop();
        if(o) {
            await createAndExchangeMessageAsync({...o}).catch(log?.c);
            setTimeout(processQueueAsync, 0);
        }
    }

    async function retrieveAsync({type, data, attempt, controller}) { //console.trace();
        return await new Promise(r => retrieve({type, data, attempt, controller}, r));
    }

    function retrieve({type, data, attempt, controller}, cb) {
        const o = {type, data, controller, cb};
        if(controller) {
            if(controller.abort) log.e('abort function exists', {controller});
            controller.abort = () => {
                controller.onAbort?.();
                if(!controller.isDone) log.w('aborted', {type, data, attempt, controller});
                controller.isAbort = true;
                const i = queue.findIndex(elm => elm === o);
                if(i >= 0) {
                    queue.splice(i, 1);
                }
            };
        }
        queue.push(o);
        // ondemand is always implicit, explicit set to false will queue retrieval
        if(!controller || (controller.ondemand === undefined || controller.ondemand)) processQueueAsync();
        else log.w('enqueue retrieval', {type, data, attempt, controller});
    }

    function startPolling(delayMs=500) {
        if(!DBEUG_AUTOMATIC_RETRIEVAL) return;
        let lastStart = 0,
            consumeQuota,
            isConsumeAll;
        stop();
        const f = async () => {
            log?.n(1, '#797979', 'poll');
            //log?.n(4, 'download...', {intervalMs});
            // every itteration do this
            // note: to fully consume all available quota
            // consumeQuotaFactor have to be adjusted upwards for every call,
            // to ensure an even distribution, so that last retrieval
            // has a consumeQuotaFactor: 1
            const
                quotaTalk = ß.grapevine.getQuotaTalk(),
                treeTalk = ß.grapevine.getTreeTalk();

            if(!quota) await quotaTalk.retrieveQuotaAsync({peerProxy});
            let nextMs = ß.config.POLL_INTERVAL_SECONDS * 1000/*ms*/;
            if(quota && quota.available > 0) {
                let {start, duration, available} = quota,
                    refill = start + duration;
                if(lastStart !== start) {
                    lastStart = start;
                    log?.w(0, 'presume that quota have been refilled.');
                    // retain a lot of quota so there is something
                    // left for ondemand use.
                    const nbrOfWaits = duration / (ß.config.POLL_INTERVAL_SECONDS * 1000/*ms*/);
                    if(nbrOfWaits < 0) consumeQuota = available * 0.5;
                    else consumeQuota = available / nbrOfWaits;
                 } else if(isConsumeAll) {
                    // time is running out, even if user have to
                    // wait for ondemand rerieval the latency
                    // wont be that long. so lets consume everything
                    // thats left instead.
                    consumeQuota = available;
                }

                let timeleftMs = refill - Date.now();
                log?.n(0, `consume: ${consumeQuota} / ${available} ( ${Math.ceil((consumeQuota/available)*100)}% ) seconds left: ${Math.floor(timeleftMs/1000)}`);

                const maxScore = Math.floor(consumeQuota * 0.5) || 1; // TODO descrete units of scores
                await treeTalk.retrieveScoresAsync({peerProxy, max: maxScore}).catch(log?.c);
                const maxCard = Math.floor(consumeQuota * 0.5) || 1; // TODO descrete units of cards
                await treeTalk.retrieveBestCardsAsync({peerProxy, max: maxCard}).catch(log?.c);

                // schedule next poll
                if(quota.available > 0 && timeleftMs > 0 && timeleftMs < CONSUME_ALL_MS && !isConsumeAll) {
                    log?.w(0, 'only X millis left, all of the quote left as fast as possible');
                    nextMs = 0;
                    isConsumeAll = true;
                } else {
                    isConsumeAll = false;
                    if(zero(quota.available) && timeleftMs > 0) {
                        log?.w(0, 'no more quota left, so wait for it to be refilled');
                        nextMs = timeleftMs; 
                    }
                }
                log?.n(0, `next poll: ${nextMs}`);
            }
            idPolling = setTimeout(f, nextMs);
        };
        setTimeout(f, delayMs);
        log?.n(1, 'started polling');
    }

    function stopPolling() {
        window.clearTimeout(id);
        id = null;
        log?.n(1, 'stopped polling');
     }

    return {
        startPolling,
        stopPolling,
        retrieve,
        retrieveAsync
    };
}
