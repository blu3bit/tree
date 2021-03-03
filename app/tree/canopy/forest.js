/*
 * remove
 *      code related to rootCards
 * add
 *      replace "treeStorage" with favourite nodes, following nodes, etc
 * fix
 * refactor
 *
 * v0.0.1-1
 * Forest - Middleware - Treenet
 * The forest consists of one scoretree, and one or more treeStorage containing unique cards.
 * The scoretree is used to for sorting out which tree and which path in a tree,
 * contains the most relevant cards. Hence the scoretree storage must be so large that
 * it may contain the score of all of the cards in all of the treeStorage. Note that while it
 * should be possible to rebuild the scoretree from the tree of cards, cards might appear
 * missing for the rest of the system if they are not included in the scoretree.
 */
const 
    DEBUG_ODDS_OF_SAME_SIGNER = 0.01,
    DEBUG_NUMBER_CARDS = 1;
    //DEBUG_NUMBER_CARDS = 3;
const SORT_BUBBLE = 'bubble'; // TODO import from LUFO
const SORT_TOP = 'top'; // TODO import from LUFO
import {createTreeStorage} from './tree-storage.js';
import {createScoretree} from './scoretree.js';
import {normCardScore} from '../norm.js';
import {createLufo} from '../lufo.js';

export const FOREST_UPDATED = 'forest:FOREST_UPDATED';

export function createForest({ß, signerStorage, log}) {                                //log?.n(1, 'created forest');

    const
        createLufo = (name, o={}) => ß.storage.getOrCreateLufo({log, ...o, name: 'forest:' + name, type: ß.storage.PERMANENT}),
        scorelist = createLufo('scorelist'), // all card scores in a descending list
        // TODO bgin :replace with scoretree = createScoretree({topmostLufo: createLufo('topmostScoretree'), descendantLufo: createLufo('descendantScoretree')}),
        scoretree = createScoretree('scoretree'), //log: log?.createLog({name: 'debugscoretree', level:10}) // all card scores in t
        // TODO end
        treeStorage = createTreeStorage('treestorage', {log: log?.createLog({name: 'ALLCARDS - CARDSET', level:1})});
    const
        //sessionLufo = null;
        sessionLufo = createLufo('session');

    //
    // Module
    //
    const listeners = {};

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

    //
    // Debug
    //
    let debugCardCount;
    function debugCardCountReset() {
        debugCardCount = {
            //rootCards: {existed: 0, created: 0, replaced: 0, placeholders: 0},
            treeStorage:  {existed: 0, created: 0, replaced: 0, placeholders: 0}
        };
     }
    function debugCardCountVerify(count, s) {
        console.log(s, 'total', count.created + count.replaced, count);
        //if(count.replaced !== count.placeholders) throw 'bad count.';
        //if(count.created + count.replaced !== count.added) throw 'bad count.';
    }

    //
    // Storage
    //
    let debugNbrCards = 0;
    function createCard({prev, text, ms, pub, tag}) {
        if(!text) throw 'no text. prev=' + prev;
        let lvl;
        if(prev) {
            let prevNode = treeStorage.get(prev);
            if(prevNode) {  //log({prevNode});
                if(prevNode.isPlaceholder) throw 'node is a placeholder. prev='+prev;
                else lvl =  prevNode.card.data.lvl + 1;
            }
        } else {
            lvl = 0;
        }

        debugNbrCards++;
        const sha256 = '[_'+debugNbrCards + '_]-' +Math.random().toString().substring(2, 6) + '-' +Math.random().toString().substring(2, 4);
        return {
            data:{
                sha256,
                pub,
                prev,
                lvl,
                ms: ms ?? Date.now(),
                text,
                tag
            }
        };
    }

    function hasCard(sha256) {
        return treeStorage.has(sha256);
    }

    function getCard(sha256) {
        return treeStorage.get(sha256);
    }

    function addCard(card, sort, peerName, score) {              //log('addCard', {card, sort, peerName, score});
        //if(!card.data.prev) {
        //    rootCards.add({card, sort, count: debugCardCount?.rootCards}); //log('adding root card');
        //}
        const cardNode = treeStorage.add({card, sort, count: debugCardCount?.treeStorage}); //console.log({cardNode});
        score = score === undefined ? Math.floor(Math.random() * 123) : 1; // TODO random number.. replace with 
        const scoretreeNode = addScore({cardNode, score, peerName});
        signerStorage.addCard(card);

        // add card to session
        const prev = cardNode.card.data.prev;
        if(prev) {
            const value = sessionLufo?.getValue(prev);
            if(value && value.children) {
                const children = scoretree.use(prev).children.map(({sha256, branchScore}) => { return {sha256, branchScore}; });
                sessionLufo?.add(prev, {children});
            }
        }
        return cardNode;
        //console.log('cardNode:', cardNode, 'parent:', grabParent(cardNode));
    }

    function addScore({cardNode, score=0, peerName}) { //console.log({cardNode});
        //if(cardNode.card?.debug.deterministicScoring) score = cardNode.card.debug.deterministicScoring;

        const sha256 = cardNode.card.data.sha256;
        const peerScores = ß.grapevine.allCardScores(sha256);
        score = normCardScore({card:cardNode.card, peerScores, score});

        // TODO imporve on debug 
        if(cardNode.card.debug && cardNode.card.debug.deterministicScoring) score = cardNode.card.debug.deterministicScoring;

        sessionLufo?.add(cardNode.card.data.sha256, null);
        const scoretreeNode = scoretree.addCardNode(cardNode, score);

        // scorelist
        const o = scorelist.get(sha256);
        let oldScore;
        if(o) {
            if(!peerName) peerName = o.peerName;
            oldScore = o.score;
        }
        scorelist.addDescending(sha256, {sha256, score, peerName}, 'score');
        const peerProxy = ß.grapevine.getPeerProxy(peerName); //console.log({peer, peerName});
        if(peerProxy) peerProxy.getReplier().addCardScore(score, oldScore);

        // debug. ugly as hawk
        let debugText = cardNode.card.data.text;
        cardNode.card.data.text = debugText;
        //treeStorage.add({card});
        return scoretreeNode;
    }

    function grabNode(sort, sha256) {
        let o;
        if(sort) {
            o = treeStorage.use(sha256, sort);
        } else {
            o = treeStorage.get(sha256);
        }
        return o;
    }

    //function grabSibling(node, index, sort, sha256) {
    //    const arr = siblings(node, sha256),
    //          v = arr[index];
    //    if(v) {
    //        return grabNode(sort, v);
    //    }
    //}

    function grabBestChild(cardNode, sort, sha256) {        log?.n(2, `grabBestChild`, {cardNode, sort, sha256});
        const children = grabSortedChildren(cardNode, sha256);
        if(children.length > 0) {
            const child = grabNode(sort, children[0].sha256);
            if(!child) {
                throw `TODO len=${children.length}, zero=${children[0]}`;
            }
            return child;
        }
    }

    function grabSortedChildren(cardNode, sha256) {         log?.n(5, `grabSortedChildren sha256=${sha256}`, cardNode);
        let children;
        if(cardNode) {
            sha256 = cardNode.card.data.sha256;
        } /*else if(sha256) {
            cardNode = grabNode(undefined, sha256);
        }*/
        let session = sessionLufo?.use(sha256);              //console.log('session found', {session, sha256});
        if(session && session.value) {
            children = session.value.children;              log?.n(3, 'session found', {sha256, session, children});
            cardNode = grabNode(undefined, sha256);
            if(cardNode.children.length !== children.length) {
                throw 'TODO: verify 1) scoretree matches node children (if not rebuild scoretree) 2) if OK rebuild session';
            }
        } else { //} else if(sha256){
            const scoreNode = scoretree.use(sha256); //console.log('HAD ALL OF THIS', {cardNode, sha256, scoreNode});
            children = scoreNode.children.map(({sha256, branchScore}) => { return {sha256, branchScore}; }); // deep clone
            sessionLufo?.add(sha256, {children});           //log?.n(3, 'session added', {sha256, children});
        }
        return children || [];
    }

    function grabParent(node, sort, sha256) {
        if(!node) {
            node = grabNode(sort, sha256);
        }
        if(node) {
            return grabNode(sort, node.card.data.prev);
        }
    }

    function isRootCard(node, sha256) {
        if(!node) {
            node = grabNode(undefined, sha256);
        }
        return !!node.data.prev;
    }

    function grabChildren(node, sha256) {
        if(!node && sha256) {
            node = grabNode(undefined, sha256);
        }
        if(node) {
            return node.children;
        }
        return [];
    }

    //function siblings(node, sha256) {
    //    if(!node) {
    //        node = grabNode(undefined, sha256);
    //    }
    //    if(node) {
    //        const o = grabParent(node);
    //       children(o); slice away current node... mighy be to inefficent
    //    }
    //    return [];
    //}

    //function countSiblings(node, sha256) {
    //    const arr = siblings(node, sha256);
    //    if(arr) {
    //        return arr.length;
    //    }
    //    return 0;
    //}

    function printAllBestChildren(sha256) {
        console.log('print all children ========== begin with ' + sha256);
        let node = grabNode(undefined, sha256);
        while(node) {
            //let cntSiblings = countSiblings(node),
            let cntChildren = children(node).length;
            console.log(node.card.data.sha256, {node, cntChildren});
            node = grabBestChild(null, null, node.card.data.sha256);
        }
        console.log('print all children ========== end');
    }

    function createMockupTree() {
        debugCardCountReset();
        //
        // mockup: begin
        //
        function treeMockup(roonNbr, nbrCards) {
            const tag = log.logName;
            const createBranch = (prev, count) => {
                if(count <= 0) return;
                const create = count;
                let created = 0;
                const lvl = prev.data.lvl + 1;
                while(count > 0) {
                    let card = createCard({prev: prev.data.sha256, pub: getOrCreatePub(), tag,
                        text:`${createMockupSentence()} [root:${roonNbr}][#${lvl}]${tag}`});
                    card.data.lvl = lvl;
                    cards.push(card);
                    created++;
                    count -= 1;
                    if(Math.random() > 0.5) {
                        let nbrCardNextBranch = Math.floor(Math.random() * count);
                        count -= nbrCardNextBranch;
                        created += nbrCardNextBranch;
                        createBranch(card, nbrCardNextBranch);
                    }
                }
                //console.log({create, created});
            };
            let lastSigner;
            const getOrCreatePub = () => {
                if(lastSigner && Math.random() > DEBUG_ODDS_OF_SAME_SIGNER) return lastSigner.data.pub;
                let pub = Math.random() + '';
                //if(Math.random() > 0.75) pub = 'miss' + pub;
                lastSigner = ß.canopy.createSignerNode({pub}).signer;
                //if(!signer.pub.startsWith('miss')) ß.canopy.addSigner(signer); // miss(ing) signers are never added to any storage
                return lastSigner.data.pub;
            };
            let card = createCard({text:`${createMockupSentence()} [root:${roonNbr}]`, pub: getOrCreatePub(), tag});
            let cards = [card];
            createBranch(card, nbrCards);
            ///// shuffle
            //cards = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C'];
            const len = cards.length;
            for(let i = 0; i < len; i++) {
                let half = Math.ceil( (cards.length * Math.random()) / 2 );
                let firstHalf = cards.slice(0, half);
                let secondHalf = cards.slice(half, cards.length);
                cards = secondHalf.concat(firstHalf);
            }
            if(cards.length !== len) throw `cards are missing: cards.length=${cards.length}, len=${len}`;
            //console.log({cards});
            //console.log('All is there:', cards.length === len);
            //console.log(cards.join(', '), 'All is there:', cards.length === len);
            cards.forEach(card => { //console.log('', {card});
                addCard(card);
            });
            //console.log('Cards', cards);
            //printAllBestChildren(cards[0].data.sha256);
        }
        var nbrRoots = 1,
            maxNbrCards = DEBUG_NUMBER_CARDS;
        for(let i = 0; i < nbrRoots; i++) {
            treeMockup(i, maxNbrCards-1);
            //treeMockup(i, 1+Math.floor(Math.random() * maxNbrCards) );
        }
        //console.log('Root cards', rootCards.debug.lufo.debug.map);
        console.log('All cards', treeStorage.debug.lufo.debug.map);
        //debugCardCountVerify(debugCardCount.rootCards, 'createMockupTree');
        debugCardCountVerify(debugCardCount.treeStorage,  'createMockupTree');
        notify(FOREST_UPDATED);
        //
        // mockup: end
        //
    }
 
    function getScore(sha256) { // TODO use this to show stuff inb GUI
        let peerScore = 0;
        ß.grapevine.allCardScores(sha256).forEach(v => peerScore += v);
        let {score, heightScore} = scoretree.get(sha256);
        return {peerScore, score, heightScore};
    }

    function getCardScore(cardNode, sha256) {
        if(!sha256) {
            sha256 = cardNode.card.data.sha256;
        }
        const o = scorelist.get(sha256); //console.log({sha256, o});
        if(o) return o.value.score;
    }

    function eachRoot(cb) {
        // TODO optmz. store sha256 of roots in its own lufo.
        scoretree.eachTopmost(({sha256, score}, i) => {
            const cardNode = grabNode(undefined, sha256);
            if(cardNode && cardNode.card.data.prev) return cb({cardNode, score}, i);
        });
    }

    function eachTopmost(cb) {
        scoretree.eachTopmost(({sha256, score}, i) => {
            const cardNode = grabNode(undefined, sha256);
            if(cardNode) return cb({cardNode, score}, i);
        });
    }

    function eachDescendant(cb) {
       scoretree.eachDescendant(({sha256, score}, i) => {
            const cardNode = grabNode(undefined, sha256);
            if(cardNode) return cb({cardNode, score}, i);
        });
    }

    function eachBest(cb, arr) { //console.log({scorelist});
        return scorelist.forEachValue(0, ({sha256, score}, i) => {
            const cardNode = grabNode(undefined, sha256); //console.log('sha256, score', cardNode);
            if(cardNode) return cb({cardNode, score}, i);
        }, arr);
    }

    //
    // DEBUG
    //
    function dump(cb) {
        log('--- DUMP ---');
        let cntTopmosts;
        cb('= topmost =');
        eachTopmost((o, i) => {
            cb(i, o.cardNode.card.data.sha256, o)
            cntTopmosts = i + 1;
        });
        log('Nbr of topmosts: ' + cntTopmosts);
        cb('= descendant =');
        let cntDescendants;
        eachDescendant((o, i) => {
            cb(i, o.cardNode.card.data.sha256, o);
            cntDescendants = i + 1;
        });
        log('Nbr of descendants: ' + cntDescendants);
        cb('= node =');
        eachBest((o, i) => cb(i, o.cardNode.card.data.sha256, o));
    }

    return {
        // module
        on,
        // set
        createCard,
        addCard,
        // get
        getCard,
        hasCard,
        allTrees: () => treeStorage,
        getCardScore,
        // grab (get and sort)
        grabChildren,
        grabNode,
        //grabSibling,
        grabBestChild,
        grabSortedChildren,
        grabParent,
        // itterate
        eachRoot,
        eachTopmost, // root or orphan
        eachDescendant,
        eachBest,
        // debug
        // TODO refactor
        //rootCards: () => rootCards,
        debug: {
            dump,
            getScore,
            createMockupSentence,
            createMockupTree
        },
        debugCardCountReset,
        debugCardCountVerify,
        debugCardCount: () => debugCardCount,
    };
};

function createMockupSentence() {
    const pronouns = ['I','we','he','she','they'], we = pronouns;
    const verbs = ['report','place','lock','kiss','knot','stitch','ask','scribble','kill','thaw','decorate','jam','hand','play','develop','bless','puncture','whistle','influence','battle','terrify','prick','fetch','mend','present','permit','attend','ban','ski','bake','disagree','cross','itch','obey','coil','list','trip','explain','compare','decorate','regret'
,'blush','reign'
,'untidy'], explain = verbs;
    const adjectives = [,'poor','horrible','somber','woozy','hypnotic','curved','rude','sophisticated','regular','gaudy','sedate','wanting','observant','piquant','reminiscent','ill','brown','imminent','eager','drab','common','pointless','lopsided','safe','standing','smelly','unkempt','dirty','furtive','warm','cowardly','instinctive','greedy','able','bitter','shiny','trite','supreme','spiteful','wild','rich','abandoned','cheap','quarrelsome','efficient'], rich = adjectives;
    const adverbs = [,'frankly','justly','judgementally','lazily','abnormally','obnoxiously','vivaciously','kindly','simply','patiently','scarily','bravely','absentmindedly','zestily','again','worriedly','acidly','accidentally','daintily','deftly','painfully','broadly','rather','frenetically','blindly','intently','elsewhere','brightly','noisily','merely','almost','previously','solidly','vaguely'], frankly = adverbs;
    const prepositions = ['at','as','onto','over','for','unlike','toward','plus','anti','below','down','above','upon','under','before','minus','underneath','beneath','following','round','with','concerning','on','against','since','versus','in','amid','near','off','aboar'], unlike = prepositions;
    const nouns = ['playground','chance','berry','spy','nut','tail','leg','friends','play','hospital','slip','dinosaurs','hat','hose','arm','doll','daughter','zoo','lamp','snakes','wool','sun','government','airport','market','division','tax','crowd','texture','door','birds','sack','thread','lace','bite','flag','line','observation','low','bone','store','letters','title','current','selection','team','iron','bird','stamp','head'], birds = nouns;
    const _ = (arr, suffix=' ') => {
        const i = Math.floor(arr.length * Math.random());
        return arr[i] + suffix;
    };

    //let s = _(frankly) + _(we) + _(explain) + _(birds) + _(unlike) + _(rich) + _(birds, '.');
    let s = _(frankly) + _(we) + _(explain) /*+ _(birds) + _(unlike)*/ + _(rich) + _(birds, '.');
    s = s.replace(/^\w/, c => c.toUpperCase());
    return s;
}
