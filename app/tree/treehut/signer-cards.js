// TODO 
//          signerlist (will pave the way for horizontal dashboard lists)
//              impl specific for signer
//              then make a copy that scrolls horizontal AND is generic (refactor list to outside, and Item design should be local here)
//              then take the generic copy and use this for signer-list
//              make it so that it can scroll vertically
//          pool
const
    DOWN = 1,
    UP = -1;

import {CANOPY_ADD_CARD} from '../canopy/canopy.js';

export function SignerCards({oo, css, go}, {ß, signerId}) {
    css(`
    SignerCards List {
        top: 0;
        /*z-index: var(--ztree);*/
        display: block;
        /*overflow: hidden;*/
        position: absolute;
        width: var(--widthfull);
        height: var(--heightfull);
        background-color: #440;
        /*background-color: var(--darkgray)*(;
    }
    `);
    const list = oo(List);

    const removeCardListener = ß.canopy.on(CANOPY_ADD_CARD, ({card}) => {
        if(card.data.pub !== signerId) return;
        if(confirm('New cards by signer. Refresh list?'))
        list.init(signerId);
    });

    oo.onDestroy(() => {
        removeCardListener();
    });

    list.init(signerId);
}

function List({oo, css, go}, {ß, log}) {
    css(`
    SignerCards Item {
        /*background-color: #0f0;*/
        overflow: hidden;
        position: absolute;
        color: #f0f0f0;
        width: 100%;
        background-color: #0ff;
        height: var(--heightballoon);
        display: grid;
        grid-template-columns: ${40}px calc(var(--widthfull) - 80px) ${40}px;
    }

    SignerCards Item .middle {
        overflow: hidden;
        border-radius: 3px;
        padding: 10px;
        height: 80%;
        background-color: var(--graymedium);
    }

    SignerCards Item .side {
        /*background-color: #f0f;*/
        display: flex;
        align-items: center;
        text-align: center;
    }
    `);
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
//
   const
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
    console.warn({TOP, BOTTOM, Y_MARGIN, VIEW_HEIGHT});
        //pools = {};
    let signerProxy,
        signerId,
        focusSha256,
        head,
        //iibranchPoint = {},
        bounceDirection = 0,
        scrollDirection,
        change;
        //swipe;

    oo.onDestroy(() => {
        // TODO deregister mouse input etc
        head = null; // prevents possible rendering
    });

    //canopy on updated render // TODO

    function scrollY(change, duration=Y_DURATION) {                         //log({bounceDirection, scrollDirection, change});
        scrollDirection = change > 0 ? DOWN : UP;
        if(bounceDirection !== 0 && bounceDirection !== scrollDirection) return;
        bounceDirection = 0;
        //console.log('render', {change});
        change = Math.abs(change);
        if(change > VIEW_HEIGHT) {
           change = VIEW_HEIGHT;
        }
        easeY.init(0, change * 0.9, duration, scrollDirection);
        render();
    }
    OO.gesture.scrollWheel(oo, event => scrollY(event.deltaY));

    function render() {
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
            renderList(head, parseInt(y, 10));
            if(isRequest) window.requestAnimationFrame(render);
        }
        //window.requestAnimationFrame(render); // TODO instead listen to canopy updates
    }

    oo.x('init', (pub) => {                 //log?.n(0, 'init', {sha256, swipeDirection});
        signerProxy = ß.canopy.grabSignerProxy(pub, 'bubble');
        signerId = signerProxy.getPublicKey();
        let cardNode = signerProxy.getFirstCard(); console.log({signerProxy, cardNode});
        if(head) remove(head);                          //log('clearing list');
        head = create(cardNode);                        log({cardNode});
        head.topY = 0;
        render();
    });

    function renderList(o, bottomY) {           //log?.n(0, 'renderList', o.sha256);
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
            // next
            o = o.next;
        }
        //log('tail=', tail?.sha256, 'head=', head?.sha256);

        if(head) {
            // prepend to head
            while((head.topY - Y_MARGIN) > TOP) {                                  //    log('is head below top. head=', head.sha256);
                bottomY = head.topY - Y_MARGIN;
                o = create(signerProxy.getPrevCard(head.sha256));
                if(o) {                                                          //      log('NEW head');
                    o.next = head;
                    head.prev = o;
                    head = o;
                    head.topY = bottomY - getItemHeight(head);//.height;
                    head.oo.elm.style.top = o.topY; // browser
                } else {
                    break;
                }
            }
        }

        // append to tail
        if(isAboveBottomView) {                                              //log('isAboveBottomView', {tail, head});
            while(tail) {
                let topY = tail.topY + getItemHeight(tail) + Y_MARGIN;       //log?.n(0, tail.sha256, {topY, BOTTOM});
                if(topY < BOTTOM) {
                    //if(tail.sha256 === branchPoint.sha256) o = create(ß.canopy.grabNode(null, branchPoint.next));
                    o = create(signerProxy.getNextCard(tail.sha256));             //log('create = ', {o});
                    if(o) {                                                  //log('create tail', o.sha256);
                        o.topY = topY;
                        o.oo.elm.style.top = o.topY; // browser
                        tail.next = o;
                        o.prev = tail;
                        tail = o;
                    } else {
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

    function create(cardNode) {                                         //log?.n(0, 'create', {cardNode});
        if(cardNode) {
            const o = {};//obtainItem(Item);
            //o.oo.set({node: cardNode, canopy}); // pooled
            o.oo = oo(Item).set({node: cardNode, nbrCards: signerProxy.getCardLength(), ms: cardNode.card.data.ms});
            o.sha256 = cardNode.card.data.sha256;
            o.prev = null;
            o.next = null;
            o.topY = 0;                                                 //log(o);
            return o;
        }
    }
};

function Item({oo, go}, {ß}) {
    let id = 'no id';
    oo('div', {className: 'side'})('div', {style:{width:'100%'}});
    const inner = oo('div', {className: 'middle'});
    oo('div', {className: 'side'})('div', {style:{width:'100%'}});
    const textSpan = inner('span', {style:{color: '#888'}});
    inner('br');
    //inner(Icon, {i:'&#10000;'}).onclick(() => {
    //    go('/compose/' + id);
    //});
    let pub;
    inner(Icon, {i:'&#9787;'}).onclick(() => {
        go(`/signer/${pub}`);
    });
    oo.x('set', ({node, nbrCards, ms}) => { //console.log({node});
        const sha256 = node.card.data.sha256;
        pub = node.card.data.pub;
        id = node.card.data.sha256;
        const {peerScore, score, heightScore} = ß.canopy.debug.getScore(sha256);
        let text = `nbrCards: ${nbrCards} date: ${ms}`;
        text += ` self:${sha256}--${node.card.data.text}`;
        text += ` PeerScore:${peerScore} Score:${score} HeightScore:${heightScore}`;
        textSpan.html(text);
    });
}

function Icon(oo, {i}) {
    oo.stylesheet(`
    Icon {
        z-index: 100;
        color: #585858;
        font-size: 30px;
        font-style: normal;
        text-shadow: 0px 0px 2px #585858;
    }

    Icon:hover {
        color: #ffffff;
    }
    `);
    oo.html(i);
}


