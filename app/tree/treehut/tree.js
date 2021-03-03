// TODO 
//          pool
//          smooth scrolling: move div instead of items and so i can use use behaviour: smooth scroll
///          //vertical rendering
//          //        down
//          //            display
//          //            remvoe
//          //        up
//          //ease
//          //horizontal rendering
//          //       // NO animation just replace
//          //        with render loop 10 pixels jump
//          //        ease render horizontal
//          //          prevent click button while scrolling horizontally
//          //bounce
//          //        when head has children and travels above top of view, bounce back
import {CANOPY_ADD_CARD} from '../canopy/canopy.js';
import {createPreload} from './preload.js';
import {Bar} from './bar.js';
import {Icon} from './icon.js';
import {STAGE_CARD, STAGE_CARD_NAV, STAGE_CARD_ROUTE} from './stage.js';

const
    DOWN = 1,
    UP = -1;

export function Tree({oo, css}, {ß, log}) {
    css(`
    Tree List {
        z-index: var(--ztree);
        display: block;
        /*overflow: hidden;*/
        position: absolute;
        width: var(--widthfull);
        height: var(--heightfull);
        background-color: var(--darkgray);
    }

    Tree List Item {
        /*background-color: #0f0;*/
        overflow: hidden;
        position: absolute;
        color: #f0f0f0;
        width: 100%;
        height: var(--heightballoon);
        display: grid;
        grid-template-columns: ${40}px calc(var(--widthfull) - 80px) ${40}px;
    }

    Tree List Item .middle {
        overflow: hidden;
        border-radius: 3px;
        padding: 10px;
        height: 80%;
        background-color: var(--graymedium);
    }

    Tree List Item .side {
        /*background-color: #f0f;*/
        display: flex;
        align-items: center;
        text-align: center;
    }

    Tree List ItemPageButton {
        background-color: var(--graymedium);
        border-radius: 3px;
        padding: 3px;
        color: #00ab00;
    }

    Tree List ItemPageButton:hover {
        color: #000;
        background-color: #fff;
    }

    Tree List ItemPageButton .red {
        color: #ffde00;
    }

    Tree List ItemPageButton .green {
    }

    Tree Bar {
        z-index: var(--ztreebar);
        display: grid;
        grid-row: 1;
        grid-auto-rows: minmax(30px, auto);
        grid-template-columns: repeat(5, 20%);
    }

    `);
    oo(Treebar);
    const list = oo(List, {tag: 'List', ß, log});
    oo.x('init', list.init);
};

export function List({oo, css, go}, {ß, log}) {                              log?.n(0, 'create List');
////    debug
////    setInterval(() => {
////       const count = (o, cnt=0) => {
////           while(o) {
////               cnt++;
////               if(o.oldNext) cnt += count(o.oldNext);
////               o = o.next;
////            }
////           return cnt;
////       };
////       log({head, nbrItems: count(head), branchPoint});
////   }, 5000);
   const
        preload = createPreload({ß, log}),
        {height:VIEW_HEIGHT, width:VIEW_WIDTH} = oo.getBoundingClientRect(), // note: this will also force layout
        Y_MARGIN = 20,
        BOTTOM = VIEW_HEIGHT,
        TOP = 0,
        BOUNCE_BOTTOM = BOTTOM - Y_MARGIN,
        BOUNCE_TOP = TOP - Y_MARGIN,
        easeY = OO.ease.create(OO.ease.easeOutQuad, true),
        easeX = OO.ease.create(OO.ease.easeOutQuad, false),
        Y_DURATION = 1000, // TODO swipe speed
        X_DURATION = 350; // TODO swipe speed
        //pools = {};
    let focusSha256,
        head,
        branchPoint = {},
        bounceDirection = 0,
        scrollDirection,
        change,
        swipe;

    const removeCardListener = ß.canopy.on(CANOPY_ADD_CARD, () => {
        refresh();
        render();
    });

    oo.onDestroy(() => {
        // TODO deregister mouse input etc
        removeCardListener();
        head = null; // prevents possible rendering
    });

    //canopy on updated render // TODO

    function scrollY(change, duration=Y_DURATION) {                                        //log({bounceDirection, scrollDirection});
        scrollDirection = change > 0 ? DOWN : UP;
        if(bounceDirection !== 0 && bounceDirection !== scrollDirection) return;
        bounceDirection = 0;
        change = Math.abs(change);
        if(change > VIEW_HEIGHT) {
           change = VIEW_HEIGHT;
        }
        easeY.init(0, change * 0.9, duration, scrollDirection);
        render();
    }
    OO.gesture.scrollWheel(oo, event => scrollY(event.deltaY));

    function render() { //console.log('render');
        if(head) {
            let isRequest,
                x = 0, outX = 0,
                y = head.topY - Y_MARGIN;
            if(easeX.timeLeft() >= 0) {
                x =  easeX.tick();
                outX = x * -1;
                x = VIEW_WIDTH - x;
                isRequest = true;
            }
            if(easeY.timeLeft() >= 0) {
                y += easeY.tick();
                isRequest = true;
            }
            renderList(head, parseInt(y, 10), parseInt(x, 10), parseInt(outX, 10));
            if(isRequest) window.requestAnimationFrame(render);
        }
        //window.requestAnimationFrame(render); // TODO instead listen to canopy updates
    }

    oo.x('init', (sha256, swipeDirection) => {                 //log?.n(0, 'init', {sha256, swipeDirection});
        const isReplace = focusSha256 !== sha256;              //console.log({isReplace, sha256});
        focusSha256 = sha256;

        let cardNode = ß.canopy.grabNode(null, sha256); // TODO sort ?
        let {prev} = cardNode.card.data;                        log('init', {prev, cardNode, sha256});
        if(!swipeDirection) {
            // not swiping, hence loading a new tree,
            if(prev) {
                const prevNode = ß.canopy.grabNode(null, prev); // TODO sort ?
                if(prevNode) {
                    // and has a parent so lets put the parent on screen
                    cardNode = prevNode;
                    sha256 = prev;
                    branchPoint = {
                        sha256,
                        next: focusSha256
                    };                                               log('has parent', {prev, cardNode, branchPoint});
                }
            }
        }

        swipe = swipeDirection;
        const isSwipe = swipe === 'right' || swipe === 'left';
        const item = get(sha256);
        const isItemNotFound = !item;
        if(isReplace && !isSwipe && isItemNotFound && head) {
            remove(head, true);
        }
        const o = get(prev);                                    //log('prev', {o, prev, cardNode});
        const hasPrev = !!o;
        if(isSwipe) {
            if(isItemNotFound && !hasPrev && head) {
                branchPoint = {};
                if(!head) remove(head, true);
            }
        }
        //log({sha256, swipeDirection, isReplace, isItemNotFound, hasPrev});
        if(isItemNotFound) {
            if(hasPrev) {                                          log(sha256 + ' has parent card');
                // create old list
                if(o.oldNext) throw 'bad state';
                o.oldNext = o.next; //console.log('o.oldNext', {o});
                o.oldNext.prev = null; // detach branch from tree
                // create the new list
                branchPoint = {
                    sha256: prev,
                    next: sha256
                };
                o.next = create(cardNode);
                o.next.prev = o;
                // animate
                easeX.init(0, VIEW_WIDTH, X_DURATION, 1);
            } else {                                                log('new card');
                if(head) remove(head);                          //log('clearing list', {head, cardNode});
                head = create(cardNode);
                head.topY = 0;
            }
            render();
        }
    });

    function renderList(o, bottomY, x, outX, isHorizontal) {           //log?.n(0, 'renderList', o.sha256);
        let isAboveBottomView = true,
            tail,
            isBounce;
        while(o) {                                                      //log(`render=${o.sha256} next=${o.next}`);
            // vertical
            tail = o;
            o.topY = bottomY + Y_MARGIN;
            o.oo.elm.style.top = o.topY; // browser
            let itemHeight = getItemHeight(o);
            bottomY = o.topY + itemHeight;
            if(isHorizontal) { //log(o.sha256);
                if(swipe === 'right') {
                    if(o.oo.elm.style.right) o.oo.elm.style.right = null;
                    o.oo.elm.style.left = x + 'px';
                } else {
                    if(o.oo.elm.style.left) o.oo.elm.style.left = null;
                    o.oo.elm.style.right = x + 'px';
                }
            }
            if(scrollDirection === UP) {                                //log('items appear from ABOVE');
                if(o.topY > BOTTOM) {                                   //log('REMOVE bottom');
                    remove(o);
                    isAboveBottomView = false;
                    // TODO if head goes to low, bounce list
                    break;
                }
            } else {                                                    //log('items appear from BELOW. top=', o.sha256);
                if(bottomY < TOP) {                                     //log(`REMOVE head. next head=${head?.next.sha256}`);
                    let next = o.next;
                    remove(head);
                    o = head = next;
                    // TODO if have children bounce list
                    continue;
                }
            }
            // horizontal
            if(o.oldNext) {
                if(x === 0) {
                    remove(o.oldNext, true); //log('stale branch removed');
                    o.oldNext = null;
                } else {
                    isHorizontal = true;
                    renderList(o.oldNext, bottomY, outX, undefined, isHorizontal);          // log('draw oldNext');
                    if(!isBounce) isBounce = bounceDirection === 0 && (o.topY < BOUNCE_TOP || bottomY > BOUNCE_BOTTOM - itemHeight);
                }
            }
            // next
            o = o.next;
        }
        //log('tail=', tail?.sha256, 'head=', head?.sha256);

        if(head) {
            // prepend to head
            while((head.topY - Y_MARGIN) > TOP) {                                      //log('is head below top. head=', head.sha256);
                bottomY = head.topY - Y_MARGIN;
                o = create(ß.canopy.grabParent(undefined, undefined, head.sha256));
                if(o) {                                                                //log('NEW head');
                    o.next = head;
                    head.prev = o;
                    head = o;
                    head.topY = bottomY - getItemHeight(head);//.height;
                    head.oo.elm.style.top = o.topY; // browser
                } else {
                    preload.bestAncestorCards(tail.sha256);
                    break;
                }
            }
        }

        // append to tail
        if(isAboveBottomView) {                                              //log('isAboveBottomView', {tail, head});
            while(tail) {
                let topY = tail.topY + getItemHeight(tail) + Y_MARGIN;       //log?.n(0, tail.sha256, branchPoint);
                if(topY < BOTTOM) {
                    if(tail.sha256 === branchPoint.sha256) o = create(ß.canopy.grabNode(null, branchPoint.next));
                    else o = create(ß.canopy.grabBestChild(undefined, undefined, tail.sha256));
                    if(o) {                                                  //log('create tail', o.sha256);
                        o.topY = topY;
                        o.oo.elm.style.top = o.topY; // browser
                        tail.next = o;
                        o.prev = tail;
                        tail = o;
                    } else {
                        //preload.bestSubtreeCards(tail.sha256);
                        preload.bestBranchCards(tail.sha256);
                        preload.bestSiblingCards(tail.sha256);
                        //console.log('preload tail at bottom of vertical list',   {tail});
                        //preload(tail, 'next');
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        // bounce
        if(bounceDirection === 0 && !head.next) isBounce = true;
        if(isBounce) {
            bounceDirection = scrollDirection * -1;
            easeY.init(0, easeY.distanceLeft()*0.22, Math.ceil(easeY.timeLeft() * 0.8), bounceDirection);
        }

    } // renderList: end

    function get(sha256) {
        let o = head;                                                               //log('get->', {head});
        while(o) {                                                                  //log(' while', {o}, o.sha256 === sha256);
            if(o.sha256 === sha256) return o;
            o = o.next;
        }
    }

    function remove(o, isRemoveAll) { //console.log({o, removeAll})
        if(o.prev) {                                                //log('not at top', {o});
            o.prev.next = null;
            if(o.next) remove(o.next);
        } else {                                                    //log('head', {o, isOldBranch});
            if(o.next) o.next.prev = null;
        }
        if(isRemoveAll && o.next) remove(o.next, isRemoveAll);
        o.prev = null;
        o.next = null;
        o.oo.destroy(); // o.push(o); // to pool
    }

    function getItemHeight(item) {
        if(!item.height) item.height = item.oo.getBoundingClientRect().height; //console.log(item.height);
        return item.height;
    }

    function goSwipe(id, swipe) {
        if(!(easeX.timeLeft() >= 0)) {
            if(id) go(`/card/${id}`, undefined, {swipe});
        }
    }

    function create(cardNode) {                                         //log?.n(0, 'create', {cardNode});
        if(cardNode) {
            const o = {};//obtainItem(Item);
            //o.oo.set({node: cardNode, canopy}); // pooled
            o.oo = oo(Item, {swipe:goSwipe}).set({node: cardNode, ß});
            o.sha256 = cardNode.card.data.sha256;
            o.prev = null;
            o.next = null;
            o.topY = 0;                                                 //log(o);
            return o;
        }
    }

    function refresh() {
        let o = head;
        while(o) {
            o.oo.refresh();
            o = o.next;
        }
    }

    // TODO
    //          ensure unique ref
    //          detach from DOM
    //function obtainItem(Tug) {
    //    if(!pools[Tug.name]) {
    //        pools[Tug.name] = createPool(Tug);
    //    }
    //    return pools[Tug.name].pop();
    //};
    //function createPool(Tug, arr=[]) {
    //    const
    //        pool = {},
    //        createItem = () => {
    //            const o = oo(Tug);
    //            return {
    //                oo: o,
    //                push: pool.push,
    //                pop: pool.pop
    //            };
    //        };
    //    pool.push = o => arr.push(o || createItem());
    //    pool.pop = () => {
    //        return arr.pop() || createItem();
    //    };
    //    return pool;
    //}
};

function ItemPageButton(oo, {swipe}) {
    let id, swipeDirection;
    const o = oo('button').onclick(() => {
        if(id) swipe(id, swipeDirection);
        else console.log('no id');
    });
    oo.x('set', ({count, id:cardId, swipe}) => {
        if(count >= 1) o.className('red');
        o.html(count);
        id = cardId;
        o.elm.title = id;
        swipeDirection = swipe
    });
    //oo('button', Math.floor(Math.random() * 100));
}

function Item({oo, go}, {ß, swipe}) {
    let sha256 = 'no id';
    const left = oo('div', {className: 'side'})('div', {style:{width:'100%'}}),
          inner = oo('div', {className: 'middle'}),
          right = oo('div', {className: 'side'})('div', {style:{width:'100%'}});
    // TODO change to oo.xx
    const leftButton = left(ItemPageButton, {swipe});//.onclick(() => swipeCb('left', id));
    const rightButton = right(ItemPageButton, {swipe});//.onclick(() => swipeCb('right', id));
    //oo.x('onswipe', (cb) => { 
    //    swipeCb = cb;
    //});
    const text2Span = inner('span');
    const textSpan = inner('span', {style:{color: '#888'}});
    inner('br');
    inner(Icon, {i:'&#10000;'}).onclick(() => {
        go('/compose/' + sha256);
    });
    let pub;
    inner(Icon, {i:'&#9787;'}).onclick(() => {
        go(`/signer/${pub}`);
    });
    oo.x('set', ({node, ß}) => {
        sha256 = node.card.data.sha256;
        oo.refresh();
    });
    oo.x('refresh', () => { //console.log({node});
        const
            node = ß.canopy.grabNode(null, sha256),
            parentNode = ß.canopy.grabParent(node),
            children = parentNode ? ß.canopy.grabSortedChildren(parentNode) : [],
            //children = canopy.children(parentNode),
            nbrChildren = children.length,
            index = children.findIndex(o => sha256 === o.sha256),
            leftId = children[index-1]?.sha256,
            rightId = children[index+1]?.sha256,
            leftNbrChildren = index,
            rightNbrChildren = nbrChildren - index - 1;

        pub = node.card.data.pub;

        leftButton.set({count: leftNbrChildren, id: leftId, swipe: 'left'});
        rightButton.set({count: rightNbrChildren, id: rightId, swipe: 'right'});

        let text = parentNode ? `prev:${parentNode.card.data.sha256}` : 'is topmost';
        textSpan.html(text);
        text = ` self:${sha256}--${node.card.data.text}`;
        const {peerScore, score, heightScore} = ß.canopy.debug.getScore(sha256);
        text += ` PeerScore:${peerScore} Score:${score} HeightScore:${heightScore}`;
        text2Span.html(text);
    });
}

function Treebar({oo, css, on, go, x, $:{$, set}}) {
    oo = oo(Bar);
    const backBtn = oo('div')(Icon, {i:'&#8592;'}).onclick(() => set(STAGE_CARD_NAV, 'back'));
    const forwardBtn = oo('div')(Icon, {i:'&#8594;'}).onclick(() => set(STAGE_CARD_NAV, 'forward'));
    oo('div')(Icon, {i:'&#9744;'}).onclick(() => go('/')); //.onclick(x('onBack'));
    oo('div')(Icon, {i:''}); // 4
    oo('div')(Icon, {i:''}); // 5

    const updateNavHistory = () => {
        const card = $(STAGE_CARD),
              history = card.history; //console.log(card.index, card.history.length);
        if(!(card.index >= 1)) backBtn.classList({add:'disabled'});
        else backBtn.classList({remove:'disabled'});
        if(card.history.length > 0 && card.index+1 < card.history.length) forwardBtn.classList({remove:'disabled'});
        else forwardBtn.classList({add:'disabled'});
    };
    on(STAGE_CARD_ROUTE, (r) => updateNavHistory());
    on(STAGE_CARD_NAV, {when:['back','forward']}, nav => {
        const card = $(STAGE_CARD),
              history = card.history,
              cardId = history[card.index];
        let isGo;
        if(nav === 'back' && card.index > 0) {
            card.index--;
            isGo = true;
        } else if(nav === 'forward' && card.index+1 < history.length) {
            card.index++;
            isGo = true;
        }
        if(isGo) {
            go('/card/' + history[card.index], undefined, {dontPushHistory: true});
        }
    });

}


