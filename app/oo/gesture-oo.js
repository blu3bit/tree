(function() {
    const gesture = OO.extend('gesture', {});

    const isNodeJs = typeof process === 'object'; //if(!this.window) {

    const eventNames = [];
    if(this.window.PointerEvent && !this.window.TouchEvent) {
        ['pointerdown','pointermove','pointerup'].forEach(v => eventNames.push(v));
    } else {
        ['mousedown','mousemove', 'mouseup','touchstart','touchmove','touchend'].forEach(v => eventNames.push(v));
    }

    const eventBinder = (elm, eventName, isCapture, isPreventDefault, cb) => {
        const handler = event => {
            if(isPreventDefault) event.preventDefault();
            return cb(event);
        };
        elm.addEventListener(eventName, handler, isCapture);
        return () => {
            elm.removeEventListener(eventName, handler, isCapture);
        };
    };

    //TODO gesture.swipe = (oo, cb, isCapture, isPreventDefault) => {
    //    const elm = oo.elm,
    //          handler = () => {
    //          };
    //    eventNames.forEach(name => oo.onDestroy( eventBinder(elm, name, handler, isCapture) ));
    //};
    // TODO https://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily#4770179
    //let windowScrollY,
    //    removeWindowScrollListener,
    //    currScrollCb = () => {}; // instead of undefined check
    //gesture.scroll = (oo, cb, isCapture, isPreventDefault) => {
    //    const elm = oo.elm;
    //    oo.onDestroy(eventBinder(elm, 'mouseenter', () => {
    //        currScrollCb = cb;
    //    }, isCapture, isPreventDefault));
    //    if(!removeWindowScrollListener) {
    //        removeWindowScrollListener = eventBinder(window, 'scroll', (event) => {
    //            const deltaY = windowScrollY = window.scrollY;
    //            currScrollCb(deltaY, event);
    //            windowScrollY = window.scrollY;
    //            event.returnValue = false;
    //            return true;
    //        }, true, true);
    //    }
    //};

    let windowOnWheel = window.onwheel,
        scrollWheelCb;
    gesture.scrollWheel = (oo, cb, isDontPreventDefault) => {
        oo.onDestroy(eventBinder(oo.elm, 'mouseenter', false, false, () => {
            window.onwheel = (event) => {
                if(!isDontPreventDefault) event.preventDefault();
                return cb(event);
            };
        }));
        oo.onDestroy(() => { if(windowOnWheel === cb) windowOnWheel = window.onwheel; });
    };
})();

