/* v0.0.1-1
 * SignerTalk - Middleware - Treenet
 * Card sync.
 */
//const DEBUG_DISABLE_UPLOAD_QUOATA = false; // TODO improve on this debug

export const
    FOLLOWED_SIGNERS    = 'signertalk:FOLLOWED_SIGNERS',
    SIGNER_CARDS        = 'signertalk:SIGNER_CARDS',
    SIGNER_TRADE        = 'signertalk:SIGNER_TRADE'; // TODO refactor variable name

import {CANOPY_UPDATED} from '../canopy/canopy.js';
import {NOT_ENOUGH_QUOTA} from './replier.js';

export function createSignerTalk({ß, log}) {

    //
    // ß.grapevine
    // 
    function addMessage({peerProxy, message}) {                              //log?.n(11, 'addMessage', ...arguments);
        // TODO check integrity and signature
        const
            replier = peerProxy.getReplier(),
            reply = replier.createReply(message),
            o = {peerProxy, replier, reply, message};

        if(zero(replier.getAvailableQuota())) reply.send({error: NOT_ENOUGH_QUOTA, friendly: 'available quota is zero'});
        else if(message.type === SIGNER_TRADE) replySigners(o);
        else if(message.type === SIGNER_CARDS) replySignerCards(o);
        else if(message.type === FOLLOWED_SIGNERS) replyFollowedSigners(o);
        else log?.e('unknown message type', message);
    }

    //
    // utils
    //
    function zero(a) {
        return !(a > 0);
    }

    //function quotaError(peerProxy, reply, consumeQuota) {
    //     if(!peerProxy.getReplier().isQuotaEnough(consumeQuota)) {
    //        reply.send({error: NOT_ENOUGH_QUOTA, friendly: `retrieval would consume: ${consumeQuota} available: ${peerProxy.getReplier().getAvailableQuota()}`});
    //        return true;
    //    }
    //}

    //
    // signer
    //
    async function retrieveSignersAsync({peerProxy, pubs, controller}) {
        const data = pubs;
        log?.signertalk(5, `retrieveSignersAsync from ${peerProxy.name}`, {'number of signers': data.length, 'retrieve these signers': data});
        const reply = await peerProxy.getRetriever().retrieveAsync({type: SIGNER_TRADE, data, controller});
        if(!reply.error) {
            reply.signers.forEach(o => {                                            //log('add signer', {o});
                ß.canopy.addSigner(o);
            });
            log?.n(6, reply.signers.length ? '#00ff00' : '#ffff00', 'Signers downloaded: '+ reply.signers.length);
            ß.canopy.notify(CANOPY_UPDATED);
            return true;
        }
    }

    function replySigners({peerProxy, reply, message}) { //log?.n(0, 'replySigners', pubs);
        const
            pubs = message.data,
            signers = [];


        pubs.forEach(pub => {
            if(reply.isQuotaEnough(ß.config.UPLOAD_QUOTA_FACTOR_SIGNER)) {
                const o = ß.canopy.getSigner(pub); // TODO probably this method does not exsist... debug
                if(o) signers.push(o);
                reply.consumeQuota(ß.config.UPLOAD_QUOTA_FACTOR_SIGNER);
            }
        });

        log?.signertalk(5, `replySigners to ${peerProxy.name}`, {'number of signers': signers.length, 'reply with these signers': signers})
        reply.send({signers}, err => {
            console.log('TODO add that we have once sent a signer');
            //addScores(peerProxy, out.signers.map(signer => {
            //        return {pub: signer.data.pub, score: 0};
            //}));
        });
    }

    //
    //  following
    //
    async function retrieveFollowedSignersAsync({peerProxy, max=10 /* TODO magic default value, move to a setting*/, controller}) {
        const data = {max};
        log?.signertalk(5, `retrieveFollowedSignersAsync from ${peerProxy.name}`, {'max:': data.max, 'data': data});
        const reply = await peerProxy.getRetriever().retrieveAsync({type: FOLLOWED_SIGNERS, data, controller});
        if(!reply.error) {
            reply.signers.forEach(o => {                                            log('add signer', o);
                ß.canopy.addSigner(o);
            });
            log?.n(6, reply.signers.length ? '#00ff00' : '#ffff00', 'Followed signers downloaded: '+ reply.signers.length);
            ß.canopy.notify(CANOPY_UPDATED);
            return reply.signers;
        }
    }

    function replyFollowedSigners({peerProxy, reply, message}) {
        const
            max = message.data.max, // TODO check message
            signers = [];

        ß.canopy.eachFollowedSigner(o => {
            if(reply.isQuotaEnough(ß.config.UPLOAD_QUOTA_FACTOR_SIGNER)) {
                const signer = ß.canopy.getSigner(o); //console.log('****************************adding', signer);
                if(signer) signers.push(signer);
                reply.consumeQuota(ß.config.UPLOAD_QUOTA_FACTOR_SIGNER);
            }
        });

        log?.signertalk(5, `replyFollowedSigners to ${peerProxy.name}`, {'number of signers': signers.length, 'reply with these signers': signers})
        reply.send({signers}, err => {
            console.log('TODO add that we have once sent a signer');
            //addScores(peerProxy, out.signers.map(signer => {
            //        return {pub: signer.data.pub, score: 0};
            //}));
        });
    }

    async function retrieveSignerCardsAsync({peerProxy, pub, max=10 /* TODO magic default value, move to a setting*/, controller}) {
        const data = {pub, max};
        log?.signertalk(5, `retrieveSignerCardsAsync from ${peerProxy.name}`, {'max:': data.max, 'data': data});
        const reply = await peerProxy.getRetriever().retrieveAsync({type: SIGNER_CARDS, data, controller});
        if(!reply.error) {
//            reply.signers.forEach(o => {                                            log('add signer', o);
//                ß.canopy.addSigner(o);
//            });
//            log?.n(6, reply.signers.length ? '#00ff00' : '#ffff00', 'Followed signers downloaded: '+ reply.signers.length);
//            ß.canopy.notify(CANOPY_UPDATED);
//            return reply.signers;
        }
    }

    function replySignerCards({peerProxy, reply, message}) {
        const
            max = message.data.max, // TODO check message
            pub = message.data.pub,
            cards = [];

//        only the sha256s... not the cards
//        also exclude the sha256s I have already


        const 
        signerId = signerProxy.getPublicKey();
        let cardNode = signerProxy.getFirstCard(); console.log({signerProxy, cardNode});
 
        //ß.canopy.eachFollowedSigner(o => {
        //    if(reply.isQuotaEnough(ß.config.UPLOAD_QUOTA_FACTOR_SIGNER)) {
        //        const signer = ß.canopy.getSigner(o); //console.log('****************************adding', signer);
        //        if(signer) signers.push(signer);
        //        reply.consumeQuota(ß.config.UPLOAD_QUOTA_FACTOR_SIGNER);
        //    }
        //});

        //log?.signertalk(5, `replySignerCards to ${peerProxy.name}`, {'number of signers': signers.length, 'reply with these signers': signers})
        //reply.send({signers}, err => {
        //    console.log('TODO add that we have once sent a signer');
        //    //addScores(peerProxy, out.signers.map(signer => {
        //    //        return {pub: signer.data.pub, score: 0};
        //    //}));
        //});
    }


    return {
        retrieveSignerCardsAsync,
        retrieveSignersAsync,
        retrieveFollowedSignersAsync,
        addMessage
    };

};

