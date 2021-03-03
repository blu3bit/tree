/*
 * TODO
 *      fix:
 *      fr:
 *      roadmap:
 *                  add peer signature validation for all messages
 *
 * v0.0.1-1
 * Grapvine - Middleware - Treenet
 * Communication layer between Treenet nodes.
 */
let DEBUG_NBR_OF_RETRIEVERS = 0; // turn off auto polling
//let DEBUG_NBR_OF_RETRIEVERS = 1; // one auto polling instance

import {createQuotaTalk} from './quota-talk.js';
import {createTreeTalk} from './tree-talk.js';
import {createSignerTalk} from './signer-talk.js';
import {createRetriever} from './retriever.js';
import {createReplier} from './replier.js';
import {createUploadManager} from './upload-manager.js';
import {createLufo} from '../lufo.js';

export const
    ERR_SEND            = 'grapevine:err:SEND',
    ERR_NONCE           = 'grapevine:err:NONCE',
    ERR_TIMEOUT         = 'grapevine:err:TIMEOUT',
    DESCRIPTION_UPDATED = 'grapevine:DESCRIPTION_UPDATED',
    MESSAGE_REPLY       = 'grapevine:MESSAGE_REPLY',
    MESSAGE_SEND        = 'grapevine:MESSAGE_SEND',
    MESSAGE_RECEIVED    = 'grapevine:MESSAGE_RECEIVED',
    PEER_CREATED        = 'grapevine:PEER_CREATED',
    PEER_DESTROYED      = 'grapevine:PEER_DESTROYED',
    PEER_UPDATED        = 'grapevine:PEER_UPDATED',
    PING                = 'grapevine:PING';

export function createGrapevine({ß, log}) {

    const
        quotaTalk = createQuotaTalk({ ß, log: log?.createLog({suffix: '/quotaTalk', level:3}) }),              // 3 is nice
        treeTalk = createTreeTalk({ ß, log: log?.createLog({suffix: '/treeTalk', level:3}) }),              // 3 is nice
        signerTalk = createSignerTalk({ ß, log: log?.createLog({suffix: '/signerTalk', level:3}) }),
        uploadManager = createUploadManager({ ß, log: log?.createLog({suffix: '/uploadManager', level:3}) });          // 3 is nice

    //
    // NODE
    //
    let node;
    const
        peerProxies = {},
        listeners = {};

    function createNode(name, description) {
        // TODO signature
        if(node) throw 'node already exists. node.name=' + node.name;
        node = {
            name,
            description
        };
    }

    function on(event, l) {
        if(!listeners[event]) listeners[event] = [];
        listeners[event].push(l);
        return () => {
            const i = listeners[event].findIndex(l => l === l);
            if(i >= 0) listeners[event].splice(i, 1);
        };
    }

    function notify(event, data, cb) { //console.log('notify', event, data, listeners[event]);
        if(listeners[event]) listeners[event].forEach(l => l(data, cb));
    }

    function addMessage(message) { //console.log('addMessage', node.name);
        // TODO clean message and validate signatures
        const o = peerProxies[message.from];
        if(o) return o.addMessage(message);
        throw 'peer not found. name='+message.from;
    }

    function setDescription(s) {
        node.description = s;
        notify(DESCRIPTION_UPDATED, s);
        Object.keys(peerProxies).forEach(k => peerProxies[k].createAndSendMessage(DESCRIPTION_UPDATED, s));
    }

    //
    // PEER
    function addPeer(name) {
        if(peerProxies[name]) throw 'name already exists. name='+name;
        const o = new PeerProxy(name);
        peerProxies[name] = o;
        notify(PEER_CREATED, name);
        if(DEBUG_NBR_OF_RETRIEVERS > 0) { // TODO remove
            DEBUG_NBR_OF_RETRIEVERS--;
            o.getRetriever().startPolling();
        } else {
            uploadManager.start({
                timeslotDurationMs: 1000 * Math.ceil(  
                    (Math.random() * ß.config.UPLOAD_INTERVAL_SECONDS) + (ß.config.UPLOAD_INTERVAL_SECONDS*0.5)  ),
                delayStartMs: 1000,
                uploadQuota: ß.config.UPLOAD_QUOTA
            });
        }
        return o;
    }
    function PeerProxy(name) {
        log?.('new Peer', name);
        this.name = name;
        this.listeners = {};
        this.messageNonce = Math.floor(Math.random() * 123123);
        this.description = 'desc';
        this.messageBox = {
            sent: [],
            received: []
        };
        const peerProxy = this;
        this.scorelist = createLufo({ maxKeys:0, maxSize:0}); // card scores downloaded from peer // TODO set lufo from outside
        this.replier = createReplier({ peerProxy, ß, log: log?.createLog({suffix: '/replier', level: 10}) }); // TODO load saved replier
        this.retriever = createRetriever({ peerProxy, ß, log: log?.createLog({suffix: '/retriever', level:10}) });
    }

    PeerProxy.prototype.notify = function(event, data) {
        const arr = this.listeners[event];
        log?.n(3, 'notify', event, data, arr);
        for(let i = 0; i < arr.length; i++) if(arr[i](data, this) === false) return true;
    };
    PeerProxy.prototype.createMessage = function(type, data, nonce) {
        // TODO sign message
        if(!nonce) {
            this.messageNonce++;
            nonce = this.messageNonce;
        }
        const message = {to: this.name, type, data, from: node.name, created: Date.now(), nonce};
        log?.n(0, 'createMessage', message);
        return message;
    };
    PeerProxy.prototype.createReply = function(data, nonce) {
        return this.createMessage(MESSAGE_REPLY, data, nonce);
    };
    PeerProxy.prototype.createReplyAndSendMessage = async function(data, nonce, cb) {
        const message = this.createReply(data, nonce);
        this.sendMessage(message, cb);
    };
    PeerProxy.prototype.createAndSendMessage = function(type, data, cb) {
        const message = this.createMessage(type, data);
        this.sendMessage(message, cb);
    };
    PeerProxy.prototype.sendMessage = function(message, cb) {
        log?.n(2, 'sendMessage', {message});
        notify(MESSAGE_SEND, message, (err) => {
            if(err) log?.w('sendMessage', {message});
            else this.messageBox.sent.push(message);
            if(cb) cb(err);
        });
    };
    PeerProxy.prototype.on = function(event, l) {
        log?.n(3, 'on', event, l);
        const listeners = this.listeners;
        if(!event) throw 'event is undefined';
        if(!listeners[event]) listeners[event] = [];
        listeners[event].push(l);
        const self = this;
        return () => {
            const i = self.listeners[event].findIndex(l => l === l);
            if(i >= 0) self.listeners[event].splice(i, 1);
        };
    };
    PeerProxy.prototype.addMessage = function(message) {
        // TODO check signature and integrity
        log?.n(2, 'addMessage', {message});
        this.messageBox.received.push(message);
        const
            isConsumed = this.notify(MESSAGE_RECEIVED, message),
            peerProxy = this;
        if(MESSAGE_REPLY && isConsumed) return;
        else if(message.type === PING) this.pong(message);
        else if(message.type === DESCRIPTION_UPDATED) this.setDescription(message.data);
        else if(message.type.startsWith('quotatalk:')) quotaTalk.addMessage({message, peerProxy});
        else if(message.type.startsWith('treetalk:')) treeTalk.addMessage({message, peerProxy});
        else if(message.type.startsWith('signertalk:')) signerTalk.addMessage({message, peerProxy});
        else throw 'unhandled message. message=' + JSON.stringify(message)
    };
    PeerProxy.prototype.setDescription = function(s) {
        this.description = s;
        notify(PEER_UPDATED, this.name);
    };
    PeerProxy.prototype.exchangeMessageAsync = async function(outMessage, maxTimeoutSeconds=30) {
        log?.n(0, 'exchangeMessageAsync', {outMessage, maxTimeoutSeconds});
        const promise = new Promise((resolve, reject) => {
            const clean = () => {
                if(remove) remove();
                if(timeoutId) clearTimeout(timeoutId);
                remove = null;
                timeoutId = null;
            };
            let timeoutId = setTimeout(() => {
                timeoutId ?? fail(ERR_TIMEOUT, `timeout. maxTimeoutSeconds=${maxTimeoutSeconds}`);
            }, 1000 * 60 * maxTimeoutSeconds);
            let remove = this.on(MESSAGE_RECEIVED, inMessage => {
                if(inMessage.nonce === outMessage.nonce) {
                    // TODO validate message integrity
                    if(inMessage.from !== outMessage.to) {
                        fail(ERR_NONCE, `bad msg. out=${JSON.stringify(outMessage)} in=${JSON.stringify(inMessage)}`);
                    } else {
                        log?.n(10, 'success exchanging messages', {outMessage, inMessage});
                        clean();
                        resolve(inMessage);
                        return false; // consume event
                    }
                }
            });
            const fail = (err, msg) => {
                log?.w('failed to exchange messages', {msg, outMessage});
                clean();
                reject({err, msg});
            };
            this.sendMessage(outMessage, err => {
                if(err) fail(ERR_SEND, err);
            });
        });
        return promise;
    };
    PeerProxy.prototype.ping = async function(data, maxTimeoutSeconds=1) {
        log?.n(0, 'ping', data);
        const outMessage = this.createMessage(PING, data);
        return this.exchangeMessageAsync(outMessage, maxTimeoutSeconds);
    };
    PeerProxy.prototype.pong = async function(inMessage) {
        log?.n(0, 'pong', inMessage)
        const outMessage = this.createMessage(MESSAGE_REPLY, 'pong to your ' + inMessage.data, inMessage.nonce);
        this.sendMessage(outMessage, err => {
            if(err) alert('Sending Pong message failed.\r\n\r\nError:' + err);
        });
    };
    PeerProxy.prototype.getRetriever = function() {
        return this.retriever;
    };
    PeerProxy.prototype.getReplier = function() {
        return this.replier;
    };
    PeerProxy.prototype.addCardScore = function(sha256, score) {
        this.scorelist.addDescending(sha256, {sha256, score}, 'score');
    };
    PeerProxy.prototype.eachBestCardScore = function(cb, arr) {
       return this.scorelist.forEachValue(0, cb, arr);
    };
    PeerProxy.prototype.hasCardScore = function(sha256) {
        return this.scorelist.has(sha256);
    };
    PeerProxy.prototype.getCardScore = function(sha256) {
        return this.scorelist.getValue(sha256)?.score || 0;
    };

    function destroyPeer(name) {
        const o = peerProxies[name]; // TODO remove
        delete peerProxies[name];
        notify(PEER_DESTROYED, name);
    }

    function PeerProxies() {
         // peerProxies are very likely to be used in async operations,
         // and peerProxies object may very well mutate, hence return
         // a shallow copy in the shape of an itteratable datastructure.
         this.arr = Object.keys(peerProxies).map(v => peerProxies[v]);
    }
    PeerProxies.prototype.size = function() { return this.arr.length; };
    PeerProxies.prototype.get = function(i) { return this.arr[i]; };
    PeerProxies.prototype.each = async function(cb, filter, result={}) {
        for(let i = 0, peerProxy; i < this.size(); i++) {
            peerProxy = this.get(i);
            if(!filter || filter?.(peerProxy)) {
                result[peerProxy.name] = await cb(peerProxy);
                if(result[peerProxy.name] === false) break;
            }
        }
        return result;
    };
    PeerProxies.prototype.forEach = function(cb) {
        this.arr.forEach(o => cb(o));
    };
    PeerProxies.prototype.map = function(cb) {
        return this.arr.map(o => cb(o));
    };

    function getPeerProxies() {
        return new PeerProxies();
    }

    function getPeerProxy(name) {
        return peerProxies[name];
    }

    function hasPeer(name) {
        return peerProxies.hasOwnProperty(name);
    }

    function allCardScores(sha256) {
        return Object.keys(peerProxies).map(v => peerProxies[v].getCardScore(sha256));
    }

    return {
        on,
        getQuotaTalk: () => quotaTalk,
        getTreeTalk: () => treeTalk,
        getSignerTalk: () => signerTalk,
        getUploadManager: () => uploadManager,
        // node
        getNode: () => node,
        createNode,
        setDescription,
        // peer
        addPeer,
        hasPeer,
        destroyPeer,
        getPeerProxies,
        getPeerProxy,
        peerProxies,
        // messaging
        addMessage,
        // card
        allCardScores,
        // TODO
        // debug
        debug: {
            debugId: log?.name
        }
    };
};

