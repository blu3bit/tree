// TODO
//      fix
//          if card is removed, update children[] to reflect that card is no longer there
//              note that card can get removed inside of Lugo and using external remove
//              preferably DO NOT use listners, instead use self-healing code that patches
//                  the bad array or similar of card is not found
//      refactor
//          ?! child.children[] turn into a lufo?
/*
 * v0.0.1-1
 * Tree - Treenet
 * Card data node tree and utils.
 * A card has data signed by a signer.
 * A root is a card that has no parent (it may or may not have children).
 * An orphan is a card that has a parent, but the card is missing.
 * A branch is the set of cards that share parent (root can not be parth of
 * a branch, but an orphan can).
 * Cards may be added at random.
 * A tree starts of as a acylic rooted tree, by creating a root signed card.
 * At this point it is not known whether the root will become a parent to
 * children or not and the same is true also for all other cards.
 * The tree may be extended with a child, by signing a card that include
 * reference to a parent, such as the root or another card.
 * Since parts of the tree might go missing when the network is propagating
 * the cards, cards may get orphaned.
 * The combination of cards going missing and cards not knowing if they are
 * parents or not, is so far an un-solveable problem.
 * But as missing cards are eventually aggregated, the tree can be composed.
 * As the tree is built, parent-child relationships are for optimizaiton purpsoes
 * saved locally as nodes.
 *
 * The process of card propagation and localy scoring will result in un-sorted
 * total global set of nodes, ending up as an ordered (not unlikely un-complete) local tree.
 * Note that while the global tree consists of a finite set of nodes, as time
 * progress new cards are added and therefor the tree should finally the ordered tree
 * is presented to the end-user, in such a way that the path with the greatest weight
 * is the most accessible.
 * User-epxerience of the sorted tree:
 *
 *      (root) card
 *              |
 *    (branch) card - card - card - card          (orphan) card        (branch, orphan) card - card - card 
 *              |      |      |      |                      |                            |
 *             card   card   card   card          (branch) card - card         (branch) card - card
 *              |                    |                      |                            |
 *             card        (branch) card - card            card                         card
 *                                   |
 *                                  card
 *
 * This makes is possible to source cards from many different sources at
 * different time. Note that a card knows about its parent, but not about
 * possible children. When a card is first created children are not
 * possible because the card did not exist. Because anyone at anytime can
 * create a child but it may or may not be propagated by the network,
 * it is never possible to know whether a card has a child or not.
 * Also note that a network node may receive a child before a parent and that a 
 * child per definition has a parent (otherwise its a root card of a tree).
 * For optimization purposes when orphans are added, a parent node
 * is created. When parent is added, a link between parent and child can
 * be created without having to traverse the database looking for orphans.
 *
 * Example:
 *  Initial:
 *      P(ost)1 - P2 | not yet added P3-P4  | P5 - P6
 *          Itterating using prev/children beginning at P1 will end at P2.
 *  Add P3:
 *      P(ost)1 - P2 - P3 | not yet added P4 | P5 - P6
 *          When P3 is added P2.children will be updated in the storage.
 *
 */
import {normCardLevel} from '../norm.js';
import {createLufo} from '../lufo.js';

export function createTreeStorage({lufo=createLufo({}), log}) {

    function add({card, sort, count}) { log&&log.n(2, '*** add:', card.data.sha256, {card});
        // add
        const sha256 = card.data.sha256;                        log?.n(10, `-card node does ${!lufo.has(sha256)?'NOT':''} exists`); 
        let o = lufo.get(sha256);                               log?.n(10, `---`, o);
        if(!o) {
            o = createNode({card});                  log?.n(10, '--create new card');
            lufo.add(sha256, o);
            count&&count.created++;
        } else if(o.value.isPlaceholder) {                                  log?.n(10, '--replace placeholder', o.children); 
            o = createNode({card, children: o.value.children});   log?.n(10, '--after replace', o.children);
            lufo.add(sha256, o);
            count&&count.replaced++;
        } else {
            count&&count.existed++;
        }

        // link
        const prev = card.data.prev;
        if(prev) {                                             log&&log.n(10, '-card node has a parent', prev);
            const prevObj = lufo.get(prev);
            let prevNode;
            if(prevObj) {
                prevNode = prevObj.value;                      log&&log.n(10, '--parent is', prevObj);
                if(!prevNode.isPlaceholder) {
                    if(!normCardLevel(prevNode.card, card)) { log&&log.w('bad consensus lvl', prevNode, card);
                        throw 'TODO';
                    }
                }
            }
            if(!prevNode) {                                     log&&log.n(10, '---no parent nodefound');
                prevNode = createNode({card:{data:{sha256: prev}}, isPlaceholder: true});     log&&log.n(10, ' ---add placeholder');
                count&&count.placeholders++;
            }
            if(!prevNode.children.includes(sha256)) {           log&&log.n(10, '----add child to parent');
                // TODO limit how large cihldren array can be (should be device/storage size/config dependent)
                prevNode.children.push(sha256);                 log&&log.n(10, '----', prevNode);
                lufo.add(prev, prevNode);
            }
        }
        return o;
    }

    function get(sha256) {
        const o = lufo.getValue(sha256); //console.log('get', sha256, o);
        if(o && !o.isPlaceholder) { //console.log('return o', o);
            return o;
        }
    }

    function use(sha256, sort) {
        return lufo.useValue(sha256, sort);
    }

    function forEach(startIndex, cb) {  //console.log('forEach', lufo.debugName, lufo.length(), length());
        lufo.forEach(startIndex, ({value}, i) => { //log(value);
            return cb(value, i);
        });
    }

    function remove(sha256) {
       lufo.remove(sha256);
    }

    function clear() { //console.log('clear', lufo.debugName, lufo.length());
        lufo.clear();
    }

    function has(sha256) {
        return !!get(sha256); // TODO optmz, lufo have to know about placeholders and non-placeholders
    }

    function length() {
        return lufo.length();
    }

    return {
        has,        // returns false if only placeholder
        add,        // card
        get,        // node
        use,        // node
        remove,     // node
        forEach,    // node
        length,     // node
        clear,      // storages
        debug: {
            lufo
        }
    };
}

function createNode({card, children=[], isPlaceholder}) { //console.log({card, children, isPlaceholder});
    const data = card.data;
    let sha256, prev, lvl, pub, type, ms, text, tag, blob;
    // TODO 
    //      verify props
    //      verify consensus
    sha256 = data.sha256;
    prev = data.prev;
    lvl = data.lvl;
    pub = data.pub;
    type = data.type;
    ms = data.ms;
    text = data.text;
    tag = data.tag;
    blob = data.blob;
    const signature = 'TODO'; // TODO
    const o = {
        // storage
        isPlaceholder,
        children,
        // posted
        card: {
            data: {
                sha256,     // uniquely identifies only this card
                prev,       // previous card sha256 (children can not be known at the time of creation)
                lvl,        // tree level
                pub,        // poster public key
                type,       // topic, post, repost
                ms,         // time arbitrarily set by poster
                text,       // limited in size
                tag,        // limited in size
                blob: blob ?? {
                    mime: undefined,
                    size: undefined,
                    data: undefined
                 }
            },
            signature       // card signed by pubkey owner
        }
    };
    //console.log({o});
    // TODO verify signature

    // TODO improve on debug 
    //console.log(window.__SIMSHIM__.debug.deterministicScoring);
    if(window.__SIMSHIM__.debug.deterministicScoring && text) {
        o.card.debug = {deterministicScoring: (text.length*1000)+99};
        //console.log(o.card.debug.deterministicScoring);
    }

    return o;
}

//(function() {
//    console.log('todo: test');
//    let LOG;
//    //let lufo = createNodeStorage();
//    //let forum = createCard({topicStorage, lufo});
////  TODO refactor createCard to createConversatinStorage (depends on present topicStorage to be re-named)
////function createNodeStorage() {
////    // TODO const lufo = createLocalStorageLufo({maxKeys: 20, prefix: 'crowd'}),
////    const lufo = createCachedStorageLufo({maxKeys: 5, lufo: createRamStorageLufo({maxKeys: 10, prefix: 'clp'})});
////          os = createCachedStorageLufo({maxKeys: 10, lufo});
////    return os;
//}
//
//})();
//function allTopicsByPoster({forum, limit, sort}) {
//    const topics = [];
//    forum.all((topic) => {
//        const sha256 = topic.sha256,
//              o = forum.get(topic.sha256);
//        if(o) {
//            if(sort === 'ms') {
//                let i = 0,
//                    ms = o.card.ms;
//                while(i < topic.length-1) {
//                    let o = forum.get(topics[i].sha256);
//                    if(o.)
//                    i++;
//                }
//                arr.splice(i, 0, sha256);
//            } else {
//                topics.push(o.sha256);
//            }
//        }
//    });
//    return topics;
//}

