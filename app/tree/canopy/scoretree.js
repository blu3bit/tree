/*
 * TODO
 *          optmiz
 *              add(etc) batch jobs. so heightScore and topmost only have to bubble once
 * v0.0.1-1
 * Scoretree - Treenet
 */
import {createLufo} from '../lufo.js';

export function createScoretree({topmostLufo=createLufo({}), descendantLufo=createLufo({}), log}) {

    function eachTopmost(cb) {
        topmostLufo.forEachValue(0, cb);
    }

    function eachDescendant(cb) {
        descendantLufo.forEachValue(0, cb);
    }

    function createNode({sha256, prev}) {
        // since this node is a mirror of a card,
        // it should use the same sha256 as identifier.
        return {
            sha256,         // id
            prev,           // parent
            children: [],   // children
            topmost: null,  // referens to a root or orphan node
            score: null,
            heightScore: null
        };
    }

    function use(sha256) {
        return descendantLufo.useValue(sha256) || topmostLufo.useValue(sha256);
    }

    function get(sha256) {
        return descendantLufo.getValue(sha256) || topmostLufo.getValue(sha256);
    }

    function has(sha256) {
        return descendantLufo.has(sha256) || topmostLufo.has(sha256);
    }

    function isTopmost(sha256) {
        return topmostLufo.has(sha256);
    }

    function addCardNode(cardNode, score) {         log?.n(2, 'addCardNode', {cardNode, topmostLufo, descendantLufo});
        const
            children = cardNode.children,
            {sha256, prev} = cardNode.card.data;
        return add(children, sha256, prev, score);
    }

    function add(children, sha256, prev, score=0) {
        if(children.card) throw 'replace call with addCardNode' // TODO remove this check
        let prevSha256 = prev;
        /*
         * will create a mirror of the card, used for scoring purposes.
         * root/orphan cards will be tracked in a topmost lufo.
         * when a card is added, any existing copy will be overwritten.
         * the structure is self-healing, in the sense that an orphan will
         * become child as the missing parent card is added (deorphaned).
         *
         * when an orphan is deorphaned it cease being a topmost card,
         * structurally dependent data is recaalcuated/propagated througout
         * the new subtree. the structurally dependent are:
         *      all nodes should have a referece to its current topmost node
         *      all branch nodes should have the proper path score weighting
         *          and the score reflected in the proper scoring of children array
         *          with the greatest weighted path at index zero.
         *
         */
        // get or create
        let o = topmostLufo.getValue(sha256);
        if(!o) o = descendantLufo.getValue(sha256);
        if(!o) {
            o = createNode({sha256, prev: prevSha256});             log?.n(2, 'create', {sha256});
        }
        log?.n(2, 'current node', o);
        // children and scoring
        // When node.score and/or childrens are updated, re-calculate node.heightScore and children
        // set branchScores. Then bubble up the branchScore of the winning path.
        //      node.score          -   nodes own score
        //      node.heightScore    -   sum of all node scores from leaf to current node
        //      child.branchScore   -   heightScore at branching point
        const
            childrenIds = o.children.map(o => o.sha256), // note: this is children in scoretree
            removeChildrenIds = childrenIds.filter(sha256 => !children.includes(sha256)),
            addChildrenIds = children.filter(sha256 => !childrenIds.includes(sha256)),
            isChildrenUpdated = removeChildrenIds.length || addChildrenIds.length;
        removeChildrenIds.forEach(sha256 => {
            const i = o.children.findIndex(o => sha256 === o.sha256);
            if(i >= 0) o.children.splice(i, 1);
        });
        addChildrenIds.forEach(sha256 => {
            const child = descendantLufo.getValue(sha256) || topmostLufo.getValue(sha256),
                  branchScore = child ? child.heightScore : undefined;
            o.children.push({sha256, branchScore});             //log?.n(2, 'add child', {sha256, child, addChildrenIds});
        });
        if(isChildrenUpdated) o.children.sort((a, b) => b.branchScore > a.branchScore);
        const branchScore = o.children.length > 0 && o.children[0].branchScore; // best at zero
        if(score >= 0) o.score = score;
        o.heightScore = o.score + (branchScore || 0);           //log?.n(2, 'best branchScore', {branchScore, o});
        // topmost
        prev = topmostLufo.getValue(prevSha256);
        const isPrevTopmost = !!prev;                           //log?.n(2, `is prev(${prevSha256}) topmost`, {isPrevTopmost, prev});
        if(!prev) prev = descendantLufo.getValue(prevSha256);
        let isTopmost = !prev;                                  //log?.n(2, 'is topmost', isTopmost);
        if(prev) {                                              //log?.n(2, 'parent', prevSha256);
            if(isTopmost) {
                topmostLufo.remove(sha256);
                isTopmost = false;
            }
        }
        o.children.forEach(({sha256}) => {
            const o = topmostLufo.getValue(sha256);
            if(o) {
                topmostLufo.remove(sha256);                    log?.n(2, 'child was topmost', {sha256, o});
                descendantLufo.add(sha256, o);
            }
        });
        // set topmost
        let topmost;
        if(isTopmost) topmost = sha256;
        else topmost = prev.topmost;
        o.topmost = topmost;                                   //log?.n(2, {o});
        o.children.forEach(({sha256}) => cascadeTopmost(sha256, topmost));
        // save changes
        if(isTopmost) topmostLufo.add(sha256, o);
        else descendantLufo.add(sha256, o);
        if(prev) bubbleScore(prevSha256, sha256, o.heightScore); // bubble up
        //log?.n(2, `add ${sha256} done. children=`, o.children);
        return o;
    }

    function bubbleScore(sha256, childSha256, childHeightScore) {   //log?.n(2, 'bubbleScore', {sha256, childSha256, childHeightScore});
        let o = descendantLufo.getValue(sha256),
            isTopmost = !o;
        if(!o) o = topmostLufo.getValue(sha256);
        if(o) {
            let isUpdated; 
            // prepare
            const
                child = {sha256: childSha256, branchScore: childHeightScore},
                index = o.children.findIndex(o => childSha256 === o.sha256);
            if(index === -1) {
                o.children.push(child);
                isUpdated = true;
            }
            else if(o.children[index].branchScore !== childHeightScore) {
                o.children[index] = child;
                isUpdated = true;
            }
            if(!isUpdated) return; // no update needed
            // update
            o.children.sort((a, b) => b.branchScore > a.branchScore);
            const
                branchScore = o.children.length > 0 && o.children[0].branchScore, // best at zero
                heightScore = o.score + branchScore;
            if(heightScore > o.heightScore) o.heightScore = heightScore;
            // save
            if(isTopmost) topmostLufo.add(sha256, o);
            else {
                descendantLufo.add(sha256, o);
                bubbleScore(o.prev, sha256, o.heightScore);
            }
        }
    }

    function cascadeTopmost(sha256, topmost) {
        let o = descendantLufo.getValue(sha256);                        log?.n(2, 'cascadeTopmost', {sha256, topmost, o});
        if(o) {
            if(o.topmost !== topmost) {
                o.topmost = topmost;
                descendantLufo.add(sha256, o);
                o.children.forEach(o => cascadeTopmost(o.sha256, topmost));
            }
        }
    }

    function flat(cb) {
        const f = (o) => {
            cb(o);
            for(let i = 0; i < o.children.length; i++) {
                f(o.children[i]);
            }
        };
        topmostLufo.forEachValue(0, o => f(o));
    }

    return {
        use,
        add,
        addCardNode,
        get,
        has,
        flat,
        isTopmost,
        eachTopmost,
        eachDescendant,
        debug: {
            topmostLufo,
            descendantLufo
        }
    };
};

(() => { // ASSSERT
    console.log('test scoretree');
    let scoretree;
    const
        setup = () => {
            //scoretree = createScoretree({topmostLufo, descendantLufo, log:{n:console.log}});
            scoretree = createScoretree({topmostLufo:mockupLufo(), descendantLufo:mockupLufo()});
        },
        add = (cardNode, score) => { //console.log({cardNode});
            scoretree.addCardNode(cardNode, score);
            return add;
        };
    const
        mockupLufo = (lufo={}) => {
            return {
                lufo,
                getValue: v => lufo[v],
                add: (v, o) => lufo[v] = o,
                remove: v => delete lufo[v],
                has: v => !!lufo[v]
            };
        },
        mockupCard = (sha256, prev, children) => {
            return {
                children,
                card: {
                    data: {
                        sha256,
                        prev
                    }
                }
            };
        };
    const
        assertScore = (sha256, expectedScore, expectedHeightScore) => {
            const o = scoretree.get(sha256);// || descendantLufo.getValue(sha256); //console.log({o});
            if(o.score !== expectedScore) throw `bad score for ${sha256}. found=${o.score} expectedScore=${expectedScore}`;
            if(o.heightScore !== expectedHeightScore) throw `bad score for ${sha256}. found=${o.heightScore} expected heightScore=${expectedHeightScore}`;
            return assertScore;
        },
        assertTopmost = (arr, expected) => { //console.log({lufo});
            arr.forEach(o => { //console.log({o});
                const sha256 = o.card.data.sha256,
                      isTopmost = expected === sha256;
                const topmost = scoretree.get(sha256)?.topmost;
                if(topmost !== expected) throw `bad topmost for ${sha256}. topmost=${topmost} expected=${expected}`;
            });
            return assertTopmost;
        },
        assertLufo = (sha256, expectedTopmost) => { //console.log(scoretree.debug);
            if(expectedTopmost && !scoretree.isTopmost(sha256)) throw `bad assert sha256=${sha256} expectedTopmost=${expectedTopmost}`;
            if(!expectedTopmost && scoretree.isTopmost(sha256)) throw `bad assert sha256=${sha256} expectedTopmost=${expectedTopmost}`;
            if(!scoretree.has(sha256)) throw `bad assert did not find sha256=${sha256}`;
            return assertLufo;
        };
   const
        a = mockupCard('a', null,   ['b', 'c']             ),
        b = mockupCard('b',  'a',   ['d']                  ),
        d = mockupCard('d',  'b',   []                     ),
        c = mockupCard('c',  'a',   ['e']                  ),
        e = mockupCard('e',  'c',   ['f', 'g', 'h']        ),
        f = mockupCard('f',  'e',   []                     ),
        g = mockupCard('g',  'e',   []                     ),
        h = mockupCard('h',  'e',   ['i']                  ),
        i = mockupCard('i',  'h',   ['j']                  ),
        j = mockupCard('j',  'i',   ['k']                  ),
        k = mockupCard('k',  'j',   []                     );

    setup();
    add(j, 80); // j is a topmost orphan
    assertLufo('j', true);
    assertTopmost([j], 'j');
    assertScore('j', 80, 80);
    add(k, 100); // k is Not an orphan
    assertLufo('k', false);
    assertTopmost([j, k], 'j');
    assertScore('j', 80, 180)('k', 100, 100);
    add(e, 105); // e is a topmost orphan
    assertLufo('e', true);
    assertTopmost([e], 'e')([j, k], 'j');
    assertScore('e', 105, 105)('j', 80, 180)('k', 100, 100);
    add(f, 10); // f is Not an orphan
    assertLufo('f', false)('e', true);
    assertTopmost([e, f], 'e')([j, k], 'j');
    assertScore('e', 105, 115);
    add(i, 100); // i is a topmost orphan, and deorphans j
    assertLufo('i', true)('j', false);
    assertTopmost([i, j, k], 'i');
    assertScore('e', 105, 115)('i', 100, 280)('j', 80, 180)('k', 100, 100);
    add(h, 100); // h is Not an orphan, and deorphans i
    assertLufo('h', false);
    assertTopmost([k, j, i, h, e], 'e');
    assertScore('e', 105, 485);
    add(g, 500);
    assertScore('e', 105, 605);
    add(a, 100)(b, 101)(c, 100)(d, 100);
    assertScore('a', 100, 805);
    assertTopmost([a, b, c, d, e, f, g, h, i, j, k], 'a');
    add(k, 900); // re-add
    assertScore('a', 100, 1485);
    add(d, 1500); // re-add
    assertScore('a', 100, 1701);
    assertTopmost([a, b, c, d, e, f, g, h, i, j, k], 'a');
    add(g, 2000); // re-add
    assertScore('a', 100, 2305);
    //console.log({topmostLufo, descendantLufo});
})();

