/*
 * v0.0.1-1
 * Canopy - Middleware - Treenet
 * Treenet is a message passing and reducing network, where the messages are ecapsulated in cards.
 * All cards may have parents, siblings and children, hence a set of cards can be composed into a tree.
 * Treenet is able to discern which cards to propagate and store by each treenet node creating its own
 * internal scoring of the cards and giving greater value to those deemed relatively more valuable in
 * relative to all the other by the node, known cards. A tree derives its score value based partly
 * on the value of the cards.
 *
 * An important scoring design decision is that there is never any penalties. The score is always
 * based on the value of the data. It is a positive reinforcement where data compete to become valuable
 * by adding intrinsic value. Data should not be able to compete by decreasing value of other data.
 * This design decision has been made because the reference (note that all nodes can have their own)
 * scoring mechanism is open source and hence both readable and possilby gameable by all participants.
 * Note the difference between this way of valuing data and how big search engines and other social networks,
 * does it. Treenet is transparent and the idea is that by keeping the protocol transparent, everyone
 * will have to compete on adding value to the network instead of trying to game the system.
 * Or worded differently, instead of creating a "smart" scoring mechanism, the idea is to create a
 * network where the incentives are such that the data with the most value is distributed the most wildly,
 * hence has the most redundant copies, greatest reach and so forth and so on.
 * Note how this also contributes to the load balancing of the network. More popular data shoud be easier
 * accessible with less latency.
 */
import {createForest, FOREST_UPDATED} from './forest.js';
import {createSignerNode, createSignerStorage} from './signer-storage.js';
import {createFollowStorage} from './follow-storage.js';

export const // "canopy:" prefix is some events are routed through other modules (such as grapevine) to canopy.
    CANOPY_ADD_CARD         = 'canopy:CANOPY_ADD_CARD',
    CANOPY_ADD_SIGNER       = 'canopy:CANOPY_ADD_SIGNER',
    CANOPY_FOLLOW_SIGNER    = 'canopy:CANOPY_FOLLOW_SIGNER',
    CANOPY_UPDATED          = 'canopy:CANOPY_UPDATED'; // TODO refeactor into many different updates
    //ALL_CARDS_RESPONSE_DEV  = 'canopy:ALL_CARDS_RESPONSE_DEV',  // DEBUG
    //ALL_CARDS_DEV           = 'canopy:ALL_CARDS_DEV'; // DEBUG

export function createCanopy({ß, log}) {

    const followStorage = createFollowStorage({ß, log});
    const signerStorage = createSignerStorage({ß, log});
    const forest = createForest({ß, signerStorage, log});
    forest.on(FOREST_UPDATED, () => notify(CANOPY_UPDATED));

    const listeners = {};

    function on(event, l) {
        if(!listeners[event]) listeners[event] = [];
        listeners[event].push(l);
        return () => {
            const i = listeners[event].findIndex(l => l === l);
            if(i >= 0) listeners[event].splice(i, 1);
        };
    }

    function notify(event) {
        const arr = Array.from(arguments).slice(1);
        //console.warn('notify', event, listeners[event], ...arr);
        //console.trace();
        if(listeners[event]) listeners[event].forEach(l => l(...arr));
    }

    function addCard() {
        const cardNode = forest.addCard(...arguments);
        if(cardNode) {
            notify(CANOPY_ADD_CARD + '/' + cardNode.card.data.sha256, cardNode);
        }
        notify(CANOPY_ADD_CARD, cardNode);
        return cardNode;
    }

    function addSigner() {
        const signerProxy = signerStorage.addSigner(...arguments);
        if(signerProxy) {
            notify(CANOPY_ADD_SIGNER + '/' + signerProxy.getPublicKey(), signerProxy);
        }
        notify(CANOPY_ADD_SIGNER, signerProxy);
        return signerProxy;
    }

    function followSigner() {
        const pub = followStorage.addSigner(...arguments);
        if(pub) notify(CANOPY_FOLLOW_SIGNER + '/' + pub, pub);
    }

    function unfollowSigner() {
        const pub = followStorage.removeSigner(...arguments);
        if(pub) notify(CANOPY_FOLLOW_SIGNER + '/' + pub, pub);
    }

    // 
    // DBBUG
    //
    function dump(cb) {
        forest.debug.dump(cb);
    }

    return {
        // module
        on,
        notify,

        // signer
        createSignerNode,
        addSigner,
        eachSignerProxy: signerStorage.eachProxy,
        getSigner: signerStorage.getSigner,
        grabSignerProxy: signerStorage.grabProxy,
        followSigner: followSigner,
        unfollowSigner: unfollowSigner,
        isFollowingSigner: followStorage.hasSigner,
        eachFollowedSigner: followStorage.eachSigner,

        // network
        //addMessage,
//        networkSync,
        //  TODO refactor below
        //rootCards: () => forest.rootCards(),

        // forest
        getCardScore: forest.getCardScore,
        createCard: forest.createCard,
        addCard,
        getCard: forest.getCard,
        hasCard: forest.hasCard,
        children: forest.children,
        grabNode: forest.grabNode,
        grabParent: forest.grabParent,
        grabBestChild: forest.grabBestChild,
        grabSortedChildren: forest.grabSortedChildren,
        eachBest: forest.eachBest,
        eachTopmost: forest.eachTopmost,


        // debug
        debug: {
            dump,
            getScore:               function(){return forest.debug.getScore(...arguments);},
            createMockupSentence:   function(){return forest.debug.createMockupSentence;  },
            createMockupTree:       function(){return forest.debug.createMockupTree;      }
            ///toggleScoretree:        function(b){return forest.debug.toggleScoretree(b);   }
        }
    };
};

