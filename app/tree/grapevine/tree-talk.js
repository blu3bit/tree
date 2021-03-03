/**
 * Peers talks about cards with oneanother.
 * This is NOT a gossip protocol where they blabbber about everything to everyone.
 * On the contrary the whole idea is that a peer should filter out what itself percieves as noise,
 * and forward that which it thinks (accordingly to its own standards) have the greatest value.
 * Basically a peer is a reducing function, that removes that which it believes have the least value.
 * This is achieved by scoring every card and sharing those with the highest score.
 * While nothing stops a peer from making up its own scoring rules,
 * the scoring mechanism here takes the peers scoring into account and
 * then weighting that score by some additional metrics such as use.
 * Since the delta between the data set of two peers can not be known for certain,
 * the protocol is implemented in such a way that two peers will first exchange a docket containing
 * a list of card identifiers along with the card scores.
 *
 * The talk goes like this:
 * A node first initiates a talk about cards by creating an offer based on previous interaction with the same peer.
 * The peer replies with either accepting fully, rejecting partially or rejecting fully.
 * Once the node receives the response to the offer, it requesting new cards along with sending a docket with
 * cards that it already has. This is the first step of the retrieval process.
 * The responding peer make a note of what cards the retrieving peer have and then dispense a docket
 * containing suitable cards that the retrieving peer may not have (since it already got some cards,
 * it at least knows not to include those).
 * The retriever makes a note of what cards the dispenser provided it with and attempts to download
 * those it did not already have. The procedure it then complete.
 * In the process the dispensing peer might have found out that its peer had some cards wich it did not,
 * and the dispenser may now become a retriever itself.
 * However, this time both of the peers knows a lot more of one anothers data sets, so the starting point
 * is different.
 * When the process is repeated enough times, enough cards will have been exchanged.
 *
 * Game strategy considerations:
 * While tit-for-tat is usually a great strategy for data sharing networks, in its naive form (byte for a byte) it
 * is probably not so good here. Because a node can create basically new unlimited amount of cards,
 * punishing those peers that do not upload/share cards is at best pointless and at worst it creates an incentive to
 * create new spam cards instead of downloading these, whenever the bandwidth is more expencive compared compared to CPU power.
 * Perhaps even worse, if a new node on the network have not yet downloaded any content, it will not be able to upload anything
 * either, hence a node might instead create new spam cards just to build up its quota.
 * To help with the bootstrapping issue and to promote sharing of non-spam content, the following strategy is used.
 * Keep in mind that there is no rule that says that all nodes must use this strategy, nor is it possible to force anyone to do so.
 * On the contrary it is advocated that if a better strategy is found, the following one should be replaced.
 * 
 * The upload strategy:
 * A node first creates the duration of a _time slot_, lets say 10 minutes.
 * Then the node allocates a _quota for how many cards to upload_ during this time slot, lets say 40 cards.
 * All the peers a node have, are _scored in order of importance_.
 * The importance of a peer is based on the _objective amount and the subjective quality of the uploaded cards_.
 * The more important a peer is, the bigger chunk of the total quota the peer alloted.
 * Peers are encouraged to make use of its whole alloted quota during the time slot.
 * A node will attempt top serve the cards that are deemed the best for the specific peer is is uploading to.
 * It will do so by trying to figure out what kind of cards is the most suitable for the peer.
 * Basically all nodes will alwayes be competing with one another for being the best at serving the most best cards.
 * The penalty for leeching cards (donwload only never upload), is that peers are more likely to drop the connection when they find
 * better behaving peers.
 * This strategy creates a stratitifcation, where peers that are able to share eachother the most best cards will tend
 * to group together and create strong bonds, at the detriment of those peers that are not as good at sharing content.
 * In the worst case a node will upload all its quota and not get anything in return. If this happens the node will seek out
 * new peers and replace the old non beneficial relationships with relatively speaking better ones.
 * A node which have good relationship with a peer, is incentiviced to keep it. Also since it is impossible for a node to know
 * for sure what kind of relationship its peer may have with other peers, a node should always try to do its best to please its nodes.
 * A hub that have basically unlimited upload quota and never demand cards from its peers, is the perfect peer for a low bandwidth
 * node. However, since the hub does not demand downloads, the low-bandiwdth node is incentiviced to share cards with its other peers.
 * A hub does not need to fear not getting new content, because card creators are incentiviced to upload their cards to hubs because
 * they have the greatest reach. Hence a great hub will not download much from low bandwidth nodes.
*
 * The implications of this are:
 *      both participants benefits from storing each others hishscore cards
 *      both participants also benefits from storing the highscore cards they have already sent
 *           because that increase the more information they both share, the more likely they find out new information they beneift from
 *      use "score sorted lufo" to score highscore list assocaited with a peer
 *           should a thin client (mobile) talk to a hub (huge aws server) - only the highest scored cards will be saved 
 * * v0.0.1-1
 * Cardtalk - Middleware - Treenet
 * Card sync.
 */
export const
    CARDS                = 'treetalk:CARDS',
    //SUBTREE_SCORES       = 'treetalk:SUBTREE_SCORES',
    ANCESTOR_SCORES      = 'treetalk:ANCESTOR_SCORES',
    BEST_BRANCH_SCORES   = 'treetalk:BEST_BRANCH_SCORES',
    BEST_SIBLINGS_SCORES = 'treetalk:BEST_SIBLINGS_SCORES',
    BEST_SCORES          = 'treetalk:BEST_SCORES';

import {CANOPY_UPDATED} from '../canopy/canopy.js';
import {NOT_ENOUGH_QUOTA} from './replier.js';
//import {createScoretree} from './scoretree.js';
import {createLufo} from '../lufo.js';

//
// utils
//
function zero(a) {
    return !(a > 0);
}

function wrapController(controller) {
    const o = { ondemand: controller.ondemand };
    controller.onAbort = () => { o.abort?.(); };
    return o;
}

export function createTreeTalk({ß, log}) {

    //
    // ß.grapevine
    // 
    function addMessage({peerProxy, message}) {                              //log?.n(0, 'addMessage', ...arguments);
        // TODO check integrity and signature
        const
            replier = peerProxy.getReplier(),
            reply = replier.createReply(message),
            o = {peerProxy, reply, message};

        if(zero(replier.getAvailableQuota())) {
            reply.consumeQuota(ß.config.UPLOAD_QUOTA_FACTOR_ERROR); // prudently superflous
            reply.send({error: NOT_ENOUGH_QUOTA, friendly: 'available quota is zero'});
        }
        else if(message.type === BEST_SCORES) replyBestScores(o);
        else if(message.type === CARDS) replyCards(o);
        //else if(message.type === SUBTREE_SCORES) replySubtreeScores(o);
        else if(message.type === ANCESTOR_SCORES) replyAncestorScores(o);
        else if(message.type === BEST_BRANCH_SCORES) replyBestBranchScores(o);
        else if(message.type === BEST_SIBLINGS_SCORES) replyBestSiblingsScores(o)
        else log?.e('unknown message type', message);
    }

    //function quotaError(peerProxy, reply, consumeQuota) {
    //     if(!peerProxy.getReplier().isQuotaEnough(consumeQuota)) {
    //        reply({error: NOT_ENOUGH_QUOTA,
    //            friendly: `retrieval would consume: ${consumeQuota} available: ${peerProxy.getReplier().getAvailableQuota()}`},
    //            ß.config.UPLOAD_QUOTA_FACTOR_ERROR);
    //        return true;
    //    }
    //}

    //
    // scores
    //
    function addScores(peerProxy, scores) {
        scores.filter(({sha256, score}) => { // TODO change from filter to forEach
            peerProxy.addCardScore(sha256, score);
            // TODO calc number of duplcates... peer.hasCardSore to create penalty in deal
        });
    }

    async function retrieveScoresAsync({peerProxy, max, controller}) {
        const data = {max};
        log?.treetalk(5, `retrieveScoresAsync from ${peerProxy.name}`, {'retrieve scores max': max} );
        const reply = await peerProxy.getRetriever().retrieveAsync({type: BEST_SCORES, data, controller});
        if(!reply.error) {
            addScores(peerProxy, reply.scores);
            return true;
        }
    }

    function replyBestScores({peerProxy, reply, message}) {
        const
            cost = ß.config.UPLOAD_QUOTA_FACTOR_SCORES,
            scores = [],
            {max} = message.data;

        ß.canopy.eachBest(({cardNode, score}, i) => {
            if(!reply.isQuotaEnough(cost)) return false;
            if(max && scores.length >= max) return false;

            const {sha256/*, ms*/} = cardNode.card.data;
            if(!peerProxy.hasCardScore(sha256)) {
                scores.push({sha256, score/*, ms*/});
                reply.consumeQuota(cost);
            }
        });

        sendScoresHelper('replyBestScores', peerProxy, reply, scores, max);
   }

    //
    // cards
    //
    async function retrieveBestCardsAsync({peerProxy, max, controller}) {
        // TODO optmz. keep a list of scores of cards that have not yet been downloaded.
        const sha256s = [];
        peerProxy.eachBestCardScore(({sha256}) => {
            if(sha256s.length >= max) return false; // stop
            if(!ß.canopy.hasCard(sha256)) return sha256; // card not found in storage
        }, sha256s);
        if(sha256s.length) return await retrieveCardsAsync({peerProxy, sha256s, controller}).catch(log?.c);
    }

    async function retrieveCardsAsync({peerProxy, sha256s, controller}) {
        if(!sha256s.length) log?.w('empty arr');
        const
            data = sha256s,
            result = [];
        log?.treetalk(5, `retrieveCardsAsync from ${peerProxy.name}`, {'number of cards': data.length, 'retrieve these cards': data});
        const reply = await peerProxy.getRetriever().retrieveAsync({type: CARDS, data, controller});
        if(!reply.error) {
            reply.cards.forEach(o => {
                const cardNode = ß.canopy.addCard(o, undefined, peerProxy.name);
                result.push(cardNode.card.data.sha256);
            });
            log?.n(6, reply.cards.length ? '#00ff00' : '#ffff00', 'Cards downloaded: '+ reply.cards.length);
            ß.canopy.notify(CANOPY_UPDATED);
        }
        return result;
    }

    function replyCards({peerProxy, reply, message}) { //log?.n(0, 'replyCards', sha256s);
        const
            cost = ß.config.UPLOAD_QUOTA_FACTOR_CARD,
            sha256s = message.data,
            cards = [];

        for(let i = 0; i < sha256s.length && reply.isQuotaEnough(cost); i++) {
            const o = ß.canopy.getCard(sha256s[i]);
            if(o) {
                reply.consumeQuota(cost);
                cards.push(o.card);
            }
        }

        log?.treetalk(5, `replyCards to ${peerProxy.name}`, {'number of cards': cards.length, 'reply with these cards': cards})
        reply.send({cards}, err => {
            if(!err) {
                addScores(peerProxy, cards.map(card => {
                        return {sha256: card.data.sha256, score: 0};
                }));
            }
        });
    }

    //
    // helpers
    //
    async function retrieveCardsByScoresHelper({sha256, max, controller}, retrieveScoresFunction) {
        log({'retrieveScoresFunction':{sha256, max, controller}});
        const
            allPeers = ß.grapevine.getPeerProxies(),
            peers = [],
            result = [];
        let sha256s = [];

        allPeers.forEach(peerProxy => {
            if(peerProxy.hasCardScore(sha256)) peers.unshift(peerProxy);
            else peers.push(peerProxy); // ask those who we dont know if they have it or not last
        });

        for(let i = 0, scoresIn; i < peers.length; i++) {
            if(controller.isAbort) return;
            if(sha256s.length >= max) return;
            scoresIn = await retrieveScoresFunction(peers[i]);
            scoresIn.forEach(({sha256}) => {
                if(!ß.canopy.hasCard(sha256) && !sha256s.includes(sha256)) sha256s.push(sha256);
            });
        }

        for(let i = 0, missing; i < peers.length; i++) {
            if(controller.isAbort) return;
            if(sha256s.length) {
                const retrieved = await retrieveCardsAsync({peerProxy: peers[i], sha256s, controller: wrapController(controller)}).catch(log?.c);
                missing = [];
                sha256s.forEach(sha256 => {
                    if(retrieved.includes(sha256)) result.push(sha256);
                    else missing.push(sha256);
                });
                sha256s = missing;
            }
        }
        return result;
    }

    function sendScoresHelper(logName, peerProxy, reply, scores, max) {
        log?.treetalk(1, `${logName} to ${peerProxy.name}`,
            {
                'reply scores': scores.sort(({score:a}, {score:b}) => b-a),
                'unfilled reply scores': scores.length - max
            }
        );
        reply.send({scores}, err => {
            if(!err) {
                // note: if retriever got the scores from the replier,
                // the retriever will never upload those scores (it knows it got it from the replier)
                // hence the replier needs to remember that it has shared these scores with the retriever already.
                // TODO
                //          because of this the replier will not be able to find out what score the retriever,
                //          but this is not super important as long as replier have several peers.
                addScores(peerProxy, scores.map(({sha256}) => {
                    return {sha256, score: 0};
                }));
            }
        });
    }

    //
    //ancestors
    //
    async function retrieveBestAncestorCardsAsync({sha256, max, controller}, cb) {
        const result = await retrieveCardsByScoresHelper({sha256, max, controller}, async (peerProxy) => {
            const scoresIn = await retrieveAncestorScoresAsync({peerProxy, sha256, max, controller});
            return scoresIn;
        });
        if(cb) cb(result);
        return result;
    }

    async function retrieveAncestorScoresAsync({peerProxy, sha256, max, controller}) {
        const data = {sha256, max};
        log?.treetalk(5, `retrieveAncestorScoresAsync from ${peerProxy.name}`, {max});
        const reply = await peerProxy.getRetriever().retrieveAsync({type: ANCESTOR_SCORES, data, controller});
        if(!reply.error) {
            addScores(peerProxy, reply.scores);
            return reply.scores;
        }
        return [];
    }

    function replyAncestorScores({peerProxy, reply, message}) {
        const
            cost = ß.config.UPLOAD_QUOTA_FACTOR_SCORES,
            {sha256, max} = message.data,
            scores = [];

        if(reply.isQuotaEnough(cost)) {
            let cardNode = ß.canopy.grabNode(undefined, sha256); // branch point is NOT included
            for(let i = 0, score; i < max && cardNode && reply.isQuotaEnough(cost); i++) {
                cardNode = ß.canopy.grabParent(cardNode);
                if(cardNode) {
                    score = ß.canopy.getCardScore(cardNode);
                    if(score !== undefined) scores.push({sha256: cardNode.card.data.sha256, score});
                }
                reply.consumeQuota(cost);
            }
        }
        sendScoresHelper('replyAncestorScores', peerProxy, reply, scores, max);
    }

    //
    // branch (best child child...)
    //
    async function retrieveBestBranchCardsAsync({sha256, max, controller}, cb) {
        const result = await retrieveCardsByScoresHelper({sha256, max, controller}, async (peerProxy) => {
            const scoresIn = await retrieveBestBranchScoresAsync({peerProxy, sha256, max, controller});
            return scoresIn;
        });
        if(cb) cb(result);
        return result;
    }

    async function retrieveBestBranchScoresAsync({peerProxy, sha256, max, controller}) {
        const data = {sha256, max};
        log?.treetalk(5, `retrieveBestBranchScoresAsync from ${peerProxy.name}`, {max});
        const reply = await peerProxy.getRetriever().retrieveAsync({type: BEST_BRANCH_SCORES, data, controller});
        if(!reply.error) {
            addScores(peerProxy, reply.scores);
            return reply.scores;
        }
        return [];
    }

    function replyBestBranchScores({peerProxy, reply, message}) {
        const
            cost = ß.config.UPLOAD_QUOTA_FACTOR_SCORES,
            {sha256, max} = message.data,
            scores = [];

        if(reply.isQuotaEnough(cost)) {
            let cardNode = ß.canopy.grabNode(undefined, sha256); // branch point is NOT included
            for(let i = 0, score; i < max && cardNode && reply.isQuotaEnough(cost); i++) {
                cardNode = ß.canopy.grabBestChild(cardNode);
                if(cardNode) {
                    score = ß.canopy.getCardScore(cardNode);
                    if(score !== undefined) scores.push({sha256: cardNode.card.data.sha256, score});
                }
                reply.consumeQuota(cost);
            }
        }

        sendScoresHelper('replyBestBranchScores', peerProxy, reply, scores, max);
    }

    //
    // siblings
    //
    async function retrieveBestSiblingCardsAsync({sha256, max, controller}, cb) { log({sha256, max, controller});
        const result = await retrieveCardsByScoresHelper({sha256, max, controller}, async (peerProxy) => {
            const scoresIn = await retrieveBestSiblingsScoresAsync({peerProxy, sha256, max, controller});
            return scoresIn;
        }).catch(log?.c);
        if(cb) cb(result);
        return result;
    }

    async function retrieveBestSiblingsScoresAsync({peerProxy, sha256, max, controller}) {
        const data = {sha256, max};
        log?.treetalk(5, `retrieveBestSiblingsScoresAsync from ${peerProxy.name}`, {max});
        const reply = await peerProxy.getRetriever().retrieveAsync({type: BEST_SIBLINGS_SCORES, data, controller});
        if(!reply.error) {
            const scores = reply.scores.filter(o => !peerProxy.hasCardScore(o.sha256));
            addScores(peerProxy, scores);
            return scores;
        }
        return [];
    }

    function replyBestSiblingsScores({peerProxy, reply, message}) {
        const
            cost = ß.config.UPLOAD_QUOTA_FACTOR_SCORES,
            {sha256:branchSha256, max} = message.data,
            scores = [];

        if(reply.isQuotaEnough(cost)) {
            const parentNode = ß.canopy.grabParent(undefined, undefined, branchSha256);
            if(parentNode) {
                const children = ß.canopy.grabSortedChildren(parentNode);
                for(let i = 0, sha256; i < children.length && i < max && reply.isQuotaEnough(cost); i++) {
                    sha256 = children[i].sha256;
                    if(!peerProxy.hasCardScore(sha256)) {
                        if(sha256 !== branchSha256) {
                            const score = ß.canopy.getCardScore(null, sha256)
                            scores.push({sha256, score});
                            reply.consumeQuota(cost);
                        }
                    }
                }
            }
        }
        sendScoresHelper('replyBestSiblingsScores', peerProxy, reply, scores, max);
    }

    ////
    //// subtree
    //  TODO optmized downloading of a whole subtree.
    //          probably this should be done very late stage in the project,
    //          because its mainly a usability improvement (and network load)
    //          but not needed in a proof of concept
    ////
    //async function retrieveBestSubtreeCardsAsync({sha256, maxDepth, maxWidth, controller}, cb) { log({sha256, max, controller});
    //    const result = await retrieveCardsByScoresHelper({sha256, maxDepth, maxWidth, controller}, async (peer) => {
    //        const scoresIn = await retrieveBestSubtreeScoresAsync({peer, sha256, max, controller});
    //        return scoresIn;
    //    }).catch(log?.c);
    //    if(cb) cb(result);
    //    return result;
    //}

    //async function retrieveBestSubtreeScoresAsync({peer, sha256, maxDepth, maxWidth, controller}) {
    //    const data = {sha256, max};
    //    log?.treetalk(5, `retrieveBestSubtreeScoresAsync from ${peer.name}`, {maxDepth, maxWidth});
    //    const reply = await peer.getRetriever().retrieveAsync({type: SUBTREE_SCORES, data, controller});
    //    if(!reply.error) {
    //        addScores(peer, reply.scores);
    //        return reply.scores;
    //    }
    //    return [];
    //}

    //function replySubtreeScores({peer, reply, message}) {
    //    const
    //        cost = ß.config.UPLOAD_QUOTA_FACTOR_SCORES,
    //        {sha256:branchSha256, maxDepth, maxWidth} = message.data,
    //        scores = [];

    //    function replyBestSiblingsScores({peer, reply, message}) {

    //    sendScoresHelper('replySubtreeScores', peer, reply, scores, max);
    //}

    return {
        // retrieve from parameterized peer
        retrieveBestCardsAsync,
        retrieveCardsAsync,
        retrieveScoresAsync,
        // retrieve from all peers
        retrieveBestBranchCardsAsync,
        retrieveBestSiblingCardsAsync,
        retrieveBestAncestorCardsAsync,
        // grapevine
        addMessage
    };
};

