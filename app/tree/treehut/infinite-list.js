export function InfiniteList(oo, type) {
    let isRendering = false,
        head = null,
        createItem,
        startBound,
        endBound,
        posType;

    function getBounds(oo) {
        const rect = oo.getBoundingClientRect();
        let start, end;
        if(type === 'vertical') {
            posType = 'top';
            start = rect.top;
            end = rect.bottom; //console.log({start, end}, end-start, oo.elm);
        } else {
            posType = 'left';
            start = rect.left;
            end = rect.right;
        }
        return {start, end};
    }

    function init(f, isForceRender) {
        clear();
        createItem = f;
        const bounds = getBounds(oo); //console.log({bounds}, type);
        startBound = bounds.start;
        endBound = bounds.end;
        if(isForceRender) render(0, 0);
    }

    function render(scrollPos) {                                        //console.log({scrollX, head});
        let pos = 0;
        if(!head) {                                                     //log(0, 'create head');
            head = obtainItem(oo, 0);
            pos = 0;
        } else {
            pos = head.pos - scrollPos;
            if(pos > endBound) {                                        //log(0, 'head beyond right');
                return;
            } else if(head.pos + head.endBound < 0) {          //log(0, 'head beyond left', head.x + ITEM_WIDTH);
                if(head.next) {                                         //log(0, 'replace head, from right');
                    pos = head.next.pos - scrollPos;
                    removeItem(head);
                } else {                                                //log(0, 'EOL', {head});
                    if(pos > head.pos) {
                        head.pos = pos;
                    }
                    return;
                }
            } else if(pos > 0) {
                if(head.index > 0) {                                    //console.log('replace head, from left');
                    head = obtainItem(oo, head.index - 1, null, head);
                    pos = pos - head.sizeBound;
                }
            }
        }
        let o = head;

        let isOutsideRight = false;
        while(o/* && i < 100*/) { //log({i, o, x}); i++;
            //o.oo.elm.style.right = scrollY + 'px';
            //o.oo.elm.style.left = x + 'px';
            o.oo.elm.style[posType] = pos + 'px';
            o.oo.elm.style.opacity = 1;
            o.pos = pos;
            pos = pos + o.sizeBound;                                    // console.log(o.sizeBound, o.oo.elm);
            if(pos > endBound) {
                isOutsideRight = true;
                if(o.next) {                                            //log(0, 'remove from end of list');
                    removeItem(o.next);
                }
                break;
            } else if(o.next) {
                o = o.next;
            } else {
                o = obtainItem(oo, o.index + 1, o);                         //if(o) log(0, 'add to end of list');
            }
        }
    }

    function removeItem(o) {
        if(o) {                                                          //console.log('REMOVE', o.index, o);
            if(o === head) head = o.next;
            if(o.next) o.next.prev = o.prev;
            if(o.prev) o.prev.next = o.next;
            o.next = null;
            o.prev = null;
            o.oo.destroy();
        }
    }

    function clear() {
        let o = head;
        while(o) {
            o.oo.destroy(); // TODO return to pool?
            o = o.next;
        }
        head = null;
    }

    function obtainItem(oo, index, prev, next) {
        oo = createItem(oo, index);
        if(oo) {
            const o = {oo};
            oo.elm.style.opacity = 0;
            const {start, end} = getBounds(oo);
            o.startBound = start;
            o.endBound = end;
            o.sizeBound = end - start;
            o.index = index;
            o.prev = prev;
            o.next = next;
            if(prev) prev.next = o;
            if(next) next.prev = o;
            return o;
        }
    };

    return {
        init,
        render,
        clear
    };
};

export function createVeritcalList(oo, log) {                                           //log(0, 'createVeritcalList');
    const
        easeY = OO.ease.create(OO.ease.easeOutQuad, true),
        {height:VIEW_HEIGHT} = oo.getBoundingClientRect(),
        verticalList = new InfiniteList(oo, 'vertical'),
        Y_DURATION = 1000, // TODO swipe speed
        DOWN = -1,
        UP = 1;

    let isRequesting,
        scrollDirection;
    function render() {
        let y = 0;
        if(easeY.timeLeft() >= 0) {
            y =  easeY.tick();
            isRequesting = true;
        } else {
            isRequesting = false;
        }
        verticalList.render(parseInt(y, 10)); // TODO parsing needed ?
        if(isRequesting) window.requestAnimationFrame(render);
    }

    function scrollY(change, duration=Y_DURATION) {                                        //log({bounceDirection, scrollDirection});
        //log({change});
        scrollDirection = change > 0 ? DOWN : UP;
        //if(bounceDirection !== 0 && bounceDirection !== scrollDirection) return;
        //bounceDirection = 0;
        change = Math.abs(change);
        if(change > VIEW_HEIGHT) {
           change = VIEW_HEIGHT;
        }
        easeY.init(0, change * 0.9, duration, scrollDirection);
        render();
    }

    return {
        init: verticalList.init,
        scrollY
    };
}

export function createHorizontalList(oo, duration) {  //console.log(oo.elm, duration);
    const
        {width:VIEW_WIDTH} = oo.getBoundingClientRect(), //, // note: this will also force layout
        horizontalList = new InfiniteList(oo, 'horizontal'),
        easeX = OO.ease.create(OO.ease.easeOutQuad, false);
    let isRequesting;

    // render
    function render() {
        let x = 0;
        if(easeX.timeLeft() >= 0) {
            x =  easeX.tick();
            isRequesting = true;
        } else {
            isRequesting = false;
        }
        horizontalList.render(parseInt(x, 10));
        if(isRequesting) window.requestAnimationFrame(render);
    }

    function scrollX(direction) {
        if(isRequesting) return;
        easeX.init(5, 10, duration, direction);
        render();
    }

    return {
        init: horizontalList.init,
        scrollLeft: () => scrollX(1),
        scrollRight: () => scrollX(-1)
    };
}

