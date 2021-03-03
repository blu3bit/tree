const OO = function(rootElement, store={}, context={}, ooptions={}, pAArent) {
    if(arguments.length === 1 && typeof rootElement === 'object' && !rootElement.appendChild) {
        ooptions = rootElement;
        rootElement = undefined;
    }
    const DEBUG = ooptions.debug, // general
          DEBUG_VDOM = ooptions.debugVirtualDom,
          DEBUG_ROUTE = ooptions.debugRoute,
          DEBUG_EXPRESSION = ooptions.debugExpressions;
    /*
     * OO - v0.0.1-0.29
     *                     ?
     *                  OO
     *                -____-
     *
     * Purpose of this function is to limit bloat,
     * boilerplate, memory footprint and third-party dependencies.
     * This achieved by extensive use of scope, currying and
     * taking a non-modularized approach; packaging DOM, route and
     * model into a dense single function.
     */
    if(!pAArent) {
        if(ooptions) console.log('[OO] ooptions=', ooptions);
        // shim prima
        //String.prototype.hashcoode = function {
        //    // https://stackoverflow.com/questions/194846/is-there-any-kind-of-hash-code-function-in-javascript#8076436
        //    var hash = 0;
        //    for (var i = 0; i < this.length; i++) {
        //        var character = this.charCodeAt(i);
        //        hash = ((hash<<5)-hash)+character;
        //        hash = hash & hash; // Convert to 32bit integer
        //    }
        //    return hash;
        //}


        // setup OO
        context = {
            //rootRef: 'r' + (DEBUG > 0 ? '' : Date.now() + Math.random()), // used for client-side plugin to server side rendering
            //rootRef: 'r' + Math.random(),
            rootRef: 'r',
            store: {$:{}},
            oos: {},
            globalProps: ooptions?.globalProps || {},
            ...context // presumably re-inflating a deflated context
        };
        if(DEBUG > 0) {
            OO.debug(context, DEBUG);
        }

        // UTILS & HELPERS
        context.parseTug = (o, isTag, excludes=['props']) => {
            if(!o) return;
            for(let p in o) { // TODO make props rserver key word for Tug
                let isCapital = isTag || p[0] !== p[0].toLowerCase();
                if(isCapital && o.hasOwnProperty(p) && !excludes.includes(p)) { //console.log('parsing', p, o);
                    let t = o[p];
                    if(isTag || (!isTag && typeof t !== 'string')) {
                        return o[p];
                    }
                }
            }
        };
        //context.isFalsy = (v) => {
        //    switch(v) { case false: case 0: case -0: case '': case null: case undefined: case NaN: return true; }
        //};
        context.eachProp = (o, cb, excludeProp) => {
            for(let p in o) {
                if(o.hasOwnProperty(p) && p !== excludeProp) {
                    cb(o[p], p, o);
                }
            }
        };
        context.toArray = (obj, prop, arr=[]) => {
            //console.log(obj, prop);
            context.eachProp(obj, o => arr.push(prop ? o[prop] : o));
            return arr;
        };
        context.each = (obj_arr, prop_cb, cb) => {
            if(!cb) {
                cb = prop_cb;
            }
            //console.log('each', obj_arr, prop_cb, Object.prototype.toString.call(obj_arr));
            if(Object.prototype.toString.call(obj_arr) === '[object Array]') {
                // shallow copy arising from removing items in same array,
                // while itterating through it, which OO does a lot.
                const arr = obj_arr.slice(0);
                arr.forEach(cb);
            } else {
                context.eachProp(obj_arr, cb, prop_cb);
            }
        }; 
        context.shallow = (source, props, target={}) => {
            props.forEach(p => { target[p] = source[p]; });
            return target;
        };
        context.applyStyle = (elm, style) => {
            //console.log({elm, style});
            if(style !== undefined) {
                for(let p in style) {
                    if(Object.prototype.hasOwnProperty.call(style, p)) {
                        elm.style[p] = style[p];
                    }
                }
            }
        };
        context.createWhen = (when) => {
            const whenType = Object.prototype.toString.call(when),
                  isObj = whenType === '[object Object]';
            if(!isObj && whenType !== '[object Array]') when = [when];
            if(!isObj) {
                when = when.map(v => {
                    if(Object.prototype.toString.call(v) === '[object Function]') {
                        return {t: v.name.toLowerCase()}; // String, Boolean etc.
                    } else {
                        return {v};
                    }
                });
            }
            let transform = v => v,
                is;
            if(!isObj) {
                is = (v) => {
                    const type = typeof v;
                    for(let i = 0; i < when.length; i++) {
                        let o = when[i]; //console.log({o, when});
                        if(o.t) {
                            if(type === o.t) return true;
                            return {v}; // TODO transform
                        } else if(v === o.v) {
                            return true;
                        }
                    }
                };
            } else {
                is = v => {
                    let is = when.hasOwnProperty(v);
                    //if(Object.prototype.toString.call(v) === '[object Function]') {
                    //    console.log('fun name='+v.name.toLowerCase());
                    //}
                    //console.log(when[v], 'transform is, ', is, 
                    //'for v=', v, 'when[',v,']='+v, 'tostrng='+Object.prototype.toString.call(v), 'typeof=',typeof v);
                    return is;
                };
                transform = v => when[v];
            }
            return {
                transform,
                is
            };
            isObj ? transform : is;
        };
        context.expressionfy = (f, arg1, arg2, cb, is, exp, isPreferValue, is$, isForce, debugTag) => { //console.log({f, arg1, arg2, cb, is});
            // expressionlistener
            if(is || is === undefined) {
                if(!exp) {
                    exp = context.expression.exec(arg1, cb, undefined, isPreferValue, is$, isForce, debugTag);
                } //console.log({exp});
                if(exp.isExpression) {
                    f.onRemoved.push(exp.remove);
                    return;
                } else if(exp.string) {
                    cb(exp.string);
                    return;
                }
            }
            cb(arg2 || arg1);
        };
        //context.shimMethod = (f, key, elm, cbShim) => {
        //    f[key] = (cb) => {
        //        elm[key] = function() {
        //            if(cbShim) {
        //                return cbShim({cb, args: arguments});
        //            } else {
        //                return cb(f, ...arguments);
        //            }
        //        };
        //        return f;
        //    };
        //};
        //context.shimEvent = (f, key, elm) => {
        //    f[key] = () => {
        //        elm.addEventListener(key, function() { // TODO removeEventListener onRemoved
        //            cb(f, ...arguments);
        //        });
        //        return f;
        //    };
        //};
        context.isNodeJS = () => typeof process === 'object';
        context.history = (function() { // makes it easy to shim history in nodejs
            return {
                onpopstate: l => { window.onpopstate = l;},
                replaceState: function() { history.replaceState(...arguments); },
                pushState: function() {history.pushState(...arguments) },
                back: function() { history.back(); },
                length: function() { history.length }
            };
        })();
        context.dangerous = (function() {
            function clean(dirty) {
                let clean = dirty; // TODO
                return clean;
            }

            function innerText(elm, v) {
                elm.innerText = v; // TODO
            }

            function innerHTML(elm, v) {
                elm.innerHTML = v; // TODO
            }

            return {innerHTML, innerText, clean};
        })();

        // STOREKEEPER BEGIN
        context.storekeeper = (function() {
            /*
             * a store is a series of container objects on unique plain paths,
             * pointing to values or object.
             * a container will NOT bind to both a value and an obj.
             * importing/adding will NOT transform the input.
             * if manipulating values in an array,
             * dont forget to update the store (@see return in observer)
             *
             * store observers are notified of mutations by regestering as
             * plain paths or parameterized paths listeners.
             * a path listener is notified with a String of the path to the mutation.
             * a param path listener is also notified with an Object containing all the
             * information needed to get the path to the mutation(s), the params and
             * their paths.
             *
             * the storekeeper can keep track of many root objects,
             * hence can store multiple unsegregated stores.
             *
             * development hint:
             *      internally $ refers to the meta object keeping track of the stored data
             *      externally $ refers to storekeeper utils and $() is a shortcut for getting data 
             *      OO internal use of store observers, have been commented with "storelistener"
             *      path is internally an array (efficiency), externally a string (friendlyness). underscore indactes array.
             */

            let promises = [];
            const onParamPaths = [], // parameterized paths
                  onResolveds = []; // all current promises resolved.
 
            function buildPath(_path) {
                //console.log({_path});
                let $ = grab(_path);
                if($) return $;
                let walk = [],
                    _parent;
                _path.forEach((seg, i) => {
                    //if(seg === '..') {
                    //    // root/child_a/grandchild/../../child_b
                    //    // push(root) push(child_a) push(grandchild) pop(grandchild) pop(child_a) push(child_b)
                    //    walk.pop();
                    //} else {
                    walk.push(seg);
                    if(!grab(walk)) {
                        //console.log(walk ,' did not exist, will create it');
                        $ = {
                            $: {},
                            _parent,  // path to parent
                            _path: walk.slice(0),
                            seg, // path segment
                            on: []
                        };
                        //console.log('buildPath to: ', $.parent);
                        put($);
                    }
                    _parent = walk.slice(0);
                    //}
                });
                return $;
            }

            function grabParent($) {
                if($._parent) {
                    return grab($._parent);
                } else {
                    return context.store;
                }
            }

            function grab(_path) { //console.log('grab _path=', _path);
                //console.trace();
                const len = _path.length;
                let $$ = context.store; //console.log('grab', _path, 'from store', JSON.stringify(context.store));
                for(let i = 0; i < len; i++) {
                    //console.log(i, _path[i], $$);
                    if(!$$) return;
                    $$ = $$.$;
                    if(!$$) {
                        //console.log(i+'\t\t not found',path, _path[i]);
                        return;
                    }
                    $$ = $$[_path[i]];
                    //console.log(i+'\t\t',path, _path[i], $$);
                }
                //console.log('\tfound', $$);
                return $$;
            }

            function put($) {
                //console.log('put', path, $, arr);
                //console.trace();
                //store[path] = obj;
                const _path = $._path,
                      len = _path.length - 1;
                let $$ = context.store;
                for(let i = 0; i < len; i++) {
                    $$ = $$.$[_path[i]];
                    //console.log(i+'\t\t',path, _path[i], $$);
                }
                $$.$[_path[len]] = $;
                //console.log('\tputted', _path[len], $$);
            }

            //function destroy(_path) { //  TODO verify that this works
            //    //delete store[path];
            //    const len = _path.length - 1;
            //    let $$ = context.store;
            //    console.log('destroy', {_path, $$});
            //    for(let i = 0; i < len; i++) {
            //        $$ = $$.$[_path[i]]
            //    }
            //    console.log('destroy', _path[len], $$);
            //    delete $$.$[_path[len]];
            //    throw 'asd';
            //}

            function onResolved(cb) {
                onResolveds.push(cb);                                   if(DEBUG > 0) context.debug.allocate('store.onresolved');
                return () => {
                    const i = onResolveds.findIndex((o) => o === cb);
                    if(i >= 0) {
                        onResolveds.splice(i, 1);                       if(DEBUG > 0) context.debug.release('store.onresolved');
                    }
                };
            }

            function notify(_path, $, isNotifyParent, isSupressNotify) {
                if(isSupressNotify) return;

                notifyParamPaths(_path);
                const arr = $.on.slice(0); // protect aganst listeners ruining the arr
                arr.forEach(l => { //console.log('notify', i, _
                    notifyListener(l, _path, get); // storelistener
                });

                if(isNotifyParent && $._parent) {
                    const _parent$ = grab($._parent);
                    notify(_parent$._path, _parent$, false, false);
                }
            }

            function notifyListener(cb, _path, get, params) { // storelistener
                // if a _path observer returns a promise,
                // it implies that it is a "doer",
                // meaning something that intended to do (mutate store) something async.
                // if it returns something other then a promise it means to do it right away.
                // if it return undefined, it does not intend to do anything at all.
                const o = cb(_path, get, params);
                if(o && o.toString() === '[object Promise]') {
                    promises.push(o);
                    o.then(() => {
                        const i = promises.findIndex(p => p === o);
                        if(i >= 0) {
                            promises.splice(i, 1);
                        }
                        if(promises.length === 0) {
                            const arr = onResolveds.slice(0);
                            arr.forEach(cb => cb());
                        }
                    });
                }
            }

            function resolvePromises() {
                Promise.all(promises).then(() => {
                    promises = [];
                });
            }

            function notifyParamPaths(_path) {
                // P = _path with params
                // N = notifying _path pointing to stored data that have been mutated
                let fullPath;
                // reduce
                for(let j = 0, len = _path.length, jj = onParamPaths.length; j < jj; j++) {
                    let oP = onParamPaths[j];
                    if(oP.len === len) {
                        for(let i = len-1, params = {}; i >= 0; i--) {
                            let segP = oP.segs[i],
                                segment = _path[i];
                            //console.log({j, i}, segP.s, segment);
                            if(!segP.is && segP.s !== segment) {
                                // neither a param,
                                // or matching string
                                //console.log('break');
                                break;
                            }
                            if(segP.is) {
                                let segs = _path.slice(0, i+1);
                                //console.log(segP, i, {segs, _path});
                                if(!fullPath) {
                                    fullPath = _path.join('/');
                                }
                                params[segP.s] = {
                                    fullPath,
                                    _path: segs, // internally store always us a _path split into segments...
                                    path: segs.join('/'), // ...but externally it might be more friendly to work with string.
                                    paramPath: oP.paramPath,
                                    param: segP.s,
                                    segment,
                                    index: i,
                                    len
                                };
                                //console.log(j, params[segP.s]);
                                //console.trace();
                            }
                            if(i === 0) {
                                // found a parameterized _path listener,
                                // that had the same number of segments as _path
                                // and where the segments were an exact match,
                                // or paramPath had a :param
                                // notify
                                // pass an arr if there were many _paths,
                                // or a single object if there was only one.
                                //console.log(_path, get, params);
                                notifyListener(oP.cb, _path, get, params); // storelistener
                            }
                            //else { console.log('continue');}
                        }
                    }
                }
            }

            function onParamPath(paramPath, cb) {
               const o = {
                    segs: [],
                    paramPath,
                    cb
                };
                //paramPath.split('/').forEach(s => {
                paramPath.forEach(s => {
                    const is = s.startsWith(':'); //pre-compute
                    o.segs.push({
                        is,
                        s: is ? s.substring(1, s.length) : s
                    });
                });
                o.len = o.segs.length;
                onParamPaths.push(o);                                   if(DEBUG > 0) context.debug.allocate('store.onparam');
                return () => {
                    const i = onParamPaths.findIndex((o) => o === cb);
                    if(i >= 0) {
                        onParamPaths.splice(i, 1);                      if(DEBUG > 0) context.debug.release('store.onparam');
                    }
                };
            }

            function buildTree($, child) {
                let _parent = $._parent;
                while(_parent) {
                    let seg = $.seg;
                    $ = grab(_parent); //console.log('have parent', $._parent, _parent$, $.seg);
                    if($.isValue) throw 'TODO';
                    if(!$.obj) {
                        _parent = $._parent;
                        $.obj = {};
                    } else {
                        _parent = null;
                    }
                    $.obj[seg] = child; //console.log('set ' + JSON.stringify(child) + ' on ' + seg);
                    child = $.obj;
                }
            }

            function dooo(_path, val_obj, isNotifyParent, isSupressNotify) {
                //console.log('dooo', _path, val_obj);
                const $ = buildPath(_path);
                if(Object.prototype.toString.call(val_obj) === '[object Object]') {
                    if($.obj) {
                        //console.log('remove outdated props', $.obj);
                        let arr;
                        for(let p in $.obj) {
                            if(!Object.prototype.hasOwnProperty.call(val_obj, p)) {
                            //if(!context.hasProp(val_obj, p)) {
                                //console.log('prop i prev obj, does not exist in new', p);
                                arr = _path.slice(0);
                                arr.push(p); //console.log(arr, p);
                                remove(undefined, arr);
                            }
                        }
                    } else {
                        delete $.isValue;
                    }
                    //console.log('set new obj', $, val_obj);
                    $.obj = val_obj; // obj
                    if($._parent) {
                        //REMOVE const _parent$ = grab($._parent); //console.log('have parent', $._parent, _parent$, $.seg);
                        //if(!_parent$.obj) {
                        //    if(_parent$.isValue) {
                        //        delete _parent$.isValue;
                        //        throw 'TODO: is this proper way to do this?!';
                        //    }
                        //    _parent$.obj = {};
                        //}
                        //_parent$.obj[$.seg] = val_obj;
                        buildTree($, val_obj);
                    }
                    let subPath;
                    for(let p in val_obj) {
                        if(Object.prototype.hasOwnProperty.call(val_obj, p)) {
                            //console.log(p, val_obj[p]);
                            subPath = _path.slice(0);
                            subPath.push(p);
                            dooo(subPath, val_obj[p], isSupressNotify);
                        }
                    }
                    //contect.eachProp(val_obj, (v, p) => dooo(path + '/' + p, v));
                } else {
                    $.isValue = true;
                    buildTree($, val_obj);
               }
               notify(_path, $, isNotifyParent, isSupressNotify); // storelistener
            }

            function remove(path, _path, isNotifyParent, isSupressNotify) { //console.log({path, _path});
                if(DEBUG > 0 && typeof _path === 'string') throw 'expectec arr.';
                if(path) _path = path.split('/');

                //console.log('asking to remove path:', _path);
                const $ = grab(_path);
                if($) {
                    //console.log('  ...attemptin to remove', _path, ' leaf:', $);
                    let isListener;
                    const _parent$ = grabParent($);
                    if($.isValue) {
                        //console.log('   ...which is a value');
                        delete $.isValue;
                        delete _parent$.obj[$.seg];
                    } else {
                        //console.log('      ...which is an object...', $.obj);
                        let arr;
                        for(let p in $.$) {
                            arr = _path.slice(0);
                            arr.push(p);
                            //console.log('         ...so also remove path', arr);
                            if(!isListener && remove(undefined, arr, false)) { // do NOT notify parents on subpaths
                                isListener = true;
                            }
                        }
                        if(_parent$.obj) { //console.log('      ...which also has a parent...', _parent$);
                            delete _parent$.obj[$.seg];
                        }
                        //else { console.log('      ...which is a root path...'); }
                        delete $.obj; // remove obj itself
                    }
                    // TODO notify. if there is no listeners and keepRef is false, then delete
                    if($.on.length === 0) {
                        //console.log('   ...no more listeners, so we can delete', $.seg, 'in', _parent$.$);
                        // destroy
                        //if(!_parent$) {
                        //    _parent$ = grabParent($);
                        //}
                        if(!isListener) {
                            if(_parent$ === context.store) {
                                //console.log('        ...remove from root', $.seg, _parent$);
                                delete _parent$.$[$.seg];
                            } else {
                                //console.log('        ...remove from branch', $.seg, _parent$.$, _parent$);
                                delete _parent$.$[$.seg];
                            }
                        }
                        //else console.log('   ...but we can not because there was a listner in the tree');
                    } else if(!isListener){
                        isListener = true;
                    }
                    notify(_path, $, isNotifyParent, isSupressNotify); // storelistener
                    return isListener; // recursive
                }
                //console.log('done remove path:', _path, context.store);
                //else { console.log('nothing to remove'); }
            }

            function buildCanonicalPath(string_arr) {
                if(typeof string_arr === 'string') {
                    string_arr = string_arr.split('/');
                }
                const path = [];
                string_arr.forEach(seg => {
                    if(seg === '..') {
                        path.pop();
                    } else {
                        path.push(seg);
                    }
                });
                //console.log('absolute path: ', string_arr, ' transformed to canonical path:', path);
                return path;
            }

            function doo(path_obj, val_obj, isNotifyParent, isSupressNotify) {
                //console.log('doo', {path_obj, val_obj, isNotifyParent, isSupressNotify});
                //console.trace();
                if(arguments.length > 1) {
                    return dooo(buildCanonicalPath(path_obj), val_obj, isNotifyParent, isSupressNotify);
                }

                for(let p in path_obj) {
                    if(Object.prototype.hasOwnProperty.call(path_obj, p)) {
                        dooo([p], path_obj[p], isNotifyParent, isSupressNotify);
                    }
                }
            }

            function get(_path, isPreferValue, is$, params) { //console.log('get', {_path, isPreferValue, is$, params});
                if(params) { //console.log('   return params');
                    let param,
                        cnt = 0;
                    for(let p in params) {
                        if(Object.prototype.hasOwnProperty.call(params, p)) {
                            // note: params arg will be mutated
                            param = params[p]; //console.log(p, ' *****     param=',param, param._path);
                            let $ = grab(param._path), // if object was dropped $ will be undefined
                                data;
                            if($) {
                                data = getData(undefined, isPreferValue, $); //console.log(p, param._path, {isPreferValue, _path, data});
                                //if(data === undefined && param.index === param.len-1) { // TODO maybe add a DEBUG or WARNING check?
                                //    throw 'prop named "' + param.param  + '" not found in stored object. _path=' + param.paramPath;
                                //}
                            }
                            if(!is$ && isPreferValue && $.isValue) {
                                // note: isPreferValue hint that the value of leafs in the object tree is preffered,
                                // and in parameterized paths this implies that meta data related to param is unwanted.
                                param = data;
                            } else {
                                createMeta(data, param);
                            }
                            //console.log({param});
                            params[p] = param;
                            cnt++;
                        }
                    }
                    //console.log('getData', _path, params);
                    return cnt > 1 ? params : param;
                } else if(is$) { //console.log('    return $');
                    //console.trace();
                    const $ = grab(_path),
                          data = getData(undefined, isPreferValue, $);
                    return createMeta(data); 
                } else { //console.log('   return data');
                    return getData(_path, isPreferValue);
                }
            }

            function getData(_path, isPreferValue, $) { //console.log('getData', {_path, isPreferValue, $});
                //if(!$) {
                //    $ = grab(_path);
                //}
                $ = $ || grab(_path);
                if($) {
                    if($.isValue) {
                        const _parent$ = grab($._parent),
                              obj = _parent$.obj;
                        if(isPreferValue) { //console.log('is value, prefer value');
                            return obj[$.seg];
                        } else { //console.log('is value, prefer obj');
                            return obj; // parent$.obj
                        }
                    } else { //console.log('no value , return obj');
                        return $.obj;
                    }
                }
            }

            function on(path, cb, isSilent, isForce) { //console.log('asd', path);
                if(path.indexOf(':') >= 0) {
                    // note: a parameterized path is by definition not a plain path,
                    // hence it does not know yet exactly to what in the store it is referencing,
                    // hence the isSilent bool is dropped.
                    return onParamPath(buildCanonicalPath(path), cb);
                }

                const _path = buildCanonicalPath(path),
                      $ = buildPath(_path);
                //console.log('on', path, cb, isSilent, $);
                $.on.push(cb);                                          if(DEBUG > 0) context.debug.allocate('store.on');
                //if(!isSilent && ($.obj || $.isValue)) {
                if(!isSilent) {
                    if($.obj || $.isValue || isForce) { //console.log({isForce});
                        cb(_path, get);
                    }
                    //cb(get(path), $.isValue ? $.seg : undefined);
                }
                return () => {
                    // remove path mutation listener
                    const $ =  grab(_path);
                    if($) {
                        const i = $.on.findIndex((o) => o === cb);
                        if(i >= 0) {
                            $.on.splice(i, 1);                          if(DEBUG > 0) context.debug.release('store.on');
                        }
                        if($.on.length === 0) {
                            //console.log('NO LISTNER LEFT');
                            if(!$.isValue) {
                                //console.log('   NOT A VALUE');
                                const _parent$ = grabParent($);
                                if(!_parent$.obj) {
                                    //console.log('   NO OBJ... lets remove');
                                    remove(undefined, $._path, );
                                }
                            }
                        }
                    }
                };
            }

            function createMeta(data, o={}) {
                o.size = prop => {
                    if(!data) return 0;
                    return Object.keys(prop ? data[prop] : data).length;
                };
                o.get = prop => data && data[prop];
                o.has = prop => data && !!data[prop];
                //o.each = (cb_prop, cb) => context.each(data, cb_prop, cb);
                o.each = (cb_prop, cb) => context.each(data, cb_prop, cb);
                o.$ = data;
                return o;
            }

            const storeUtils = (function() {
                const $ = (path, isPreferValue) => get(buildCanonicalPath(path), isPreferValue === undefined ? true : isPreferValue);
                const mutate = (path, isNotifyParent, isSupressNotify, cb) => {
                    const _path = buildCanonicalPath(path),
                          meta$ = grab(_path),
                          v = cb(getData(undefined, true, meta$));
                    notify(_path, meta$, isNotifyParent, isSupressNotify); // storelistener
                    return v;
                };
                // mutations
                $.drop = (path, isNotifyParent) => remove(path, undefined, isNotifyParent);
                $.assign = (p, v, isNotifyParent, isDontNotify) => mutate(p, isNotifyParent, isDontNotify, o => Object.assign(o, v));
                $.push = (p, v, isNotifyParent, isDontNotify) => mutate(p, isNotifyParent, isDontNotify, a => a.push(v));
                $.pop = (p, isNotifyParent, isDontNotify) => mutate(p, isNotifyParent, isDontNotify, a => a.pop());
                $.prepend = (p, v, isNotifyParent, isDontNotify) => mutate(p, isNotifyParent, isDontNotify, a => a.unshift(v));
                $.shift = (p, isNotifyParent, isDontNotify) => mutate(p, isNotifyParent, isDontNotify, a => a.shift());
                //$.clear = (path) => {
                //    const o = $(path, true);
                //    return o ? Object.keys(o).length : 0;
                //};
                // benign
                $.each = (path, prop_cb, cb) => context.each($(path, true), prop_cb, cb),
                $.size = (path) => {
                        const o = $(path, true);
                        return o ? Object.keys(o).length : 0;
                };
                $.set = doo;
                $.$ = $;
                return $;
            })();

            return {
                $: storeUtils,
                hasUnresolved: () => promises.length > 1,
                buildCanonicalPath,
                resolvePromises,
                createMeta,
                onResolved,
                do: doo,
                remove,
                get,
                on,
                debug: {
                    getMapPath: () => mapPath
                }
            };
        })();
        context.createStoreListener = function(path, isPreferValue_cb, cb) {
            if(!cb) {
                cb = isPreferValue_cb;
                isPreferValue_cb = true;
            }
            return context.storekeeper.on( path, (_path, get, params) => cb(get(get(_path, isPreferValue_cb, false, params))) );
        };
        // STOREKEEPER END

        // EXPRESSION START
        context.expression = (function() {

            /*
             * expressions are used to craft complex store data retrieval queries.
             * they permit the use of :params in store paths and can be inbedded in human readable strings.
             * expressions observe store mutations and then propagate the result to observers of the expression.
             *
             * development hint:
             *      OO internal use of store observers, have been commented with "expressionlistener"
             */
            function exec(x, cb, funcName, isPreferValue, is$, isForce, debugTag) { //console.log({x, cb, funcName, isForce});
                // x = '@value hello $a/b world$c  cost $$10.'; // 'hello EARTHworldMOON cost $10.'
                if(typeof x !== 'string' || x.indexOf('$') === -1) { // quick check
                    return {
                        string: x,
                        isExpression: false
                    };
                }
                let i = 0; 
                //console.log('parse delegation function name');
                if(x.startsWith('@')) { // escape using two @
                    if(x.startsWith('@@')) {
                        i++;
                    } else {
                        const pos = x.indexOf(' ');
                        funcName = x.substr(1, pos-1);
                        if(!DEBUG_EXPRESSION) {
                            x = x.substr(pos, x.length-pos);
                        }
                    }
                }
                //console.log('build array');
                let arr = [''];
                for(let i = 0, j = 0, c = '', p = ''; i < x.length; i++) {
                    c = x.charAt(i); //console.log(i, c, x);
                    if(c === '$') {
                        //console.log('escape using two $$');
                        if(x.charAt(i+1) !== '$') {
                            p = x.indexOf(' ', i); // use two space to print one after store expression
                            if(p === -1) {
                                p = x.length;
                            }
                            arr[j+1] = x.substr(i, p-i);
                            i = p;
                            j += 2;
                            arr[j] = '';
                            continue;
                        } else {
                            i++;
                        }
                    }
                    arr[j] += c;
                }
                let count = 0;
                arr = arr.filter(s => {
                    if(s.startsWith('$')) {
                        count++;
                    }
                    return s && s;
                }, []);
                // make elements with a path,
                // observe store for new values.
                const isHumanSentence = arr.length > count,
                      removeListeners = [];
                if(cb) {
                    for(let i = 0, s = ''; i < arr.length; i++) {
                        s = arr[i];
                        if(s.startsWith('$')) {
                            const path = s.substr(1, x.length-1);
                            if(!isHumanSentence && is$) {
                                arr[i] = context.storekeeper.createMeta();
                            }
                            removeListeners.push(createListener(path, isHumanSentence, arr,i,cb, funcName, isPreferValue, is$, isForce, debugTag));
                        }
                    }
                }
                const string = arr.join(''),
                      isExpression = removeListeners.length > 0; //console.log({x, string, isExpression, isHumanSentence});
                return {
                    string,
                    isExpression,
                    isHumanSentence,
                    remove: () => {
                        const arr = removeListeners.slice(0);
                        arr.forEach(f => f());
                    }
                };
            }

            function createListener(path, isHumanSentence, arr, index, cb, funcName, isPreferValue, is$, isForce, debugTag) {// expressionlistener
                //return context.storekeeper.on(path, (object, propName, isValue) => {
                return context.storekeeper.on(path, (_path, get, params) => { // storelistener
                    // note, replacing get because callback might execute in a context unaware
                    // what kind of result is returned
                    if(isHumanSentence) {
                        if(params) {
                            let s = '';
                            get(_path, false, false, params); // note: params may be mutated by get
                            //console.log('human readable', {_path, get, params});
                            for(let p in params) {
                                if(Object.prototype.hasOwnProperty.call(params, p)) {
                                    let o = params[p];
                                    // string concatenation when there are many :params in a single _path,
                                    // which is likely an edge-case
                                    //console.log({_path, isHumanSentence, cnt, arr});
                                    s += o.$[o.param];
                                }
                            }
                            arr[index] = s;
                        } else {
                            arr[index] = get(_path, true);
                        }
                        if(DEBUG_EXPRESSION) {
                            arr[index] += '['+_path+']';
                        }
                        return cb(arr.join(''), funcName);
                    } else {
                        arr[index] = get(_path, isPreferValue, is$, params);
                        //console.log(debugTag, arr[index], {isPreferValue, is$});
                        if(DEBUG_EXPRESSION) {
                            arr[index] += '['+_path+']';
                        }
                        return cb(arr.length === 1 ? arr[index] : arr, funcName);
                    }
                }, false, isForce);
            }

            return {
                exec
            };
        })();
        // EXPRESSION END

        // ROUTE START
        context.router = (function() {

            let state = {};
            const handlers = [];

            function buildOrigin() {
                if(context.isNodeJS()) throw 'TODO: probably using env variables';
                return window.location.origin;
            }

            function buildData(url) {
                // store friendly (no func)
                const data = { searchparams: {} };
                url.searchParams.forEach((v, k) => {
                    data.searchparams[k] = v;
                });
                return context.shallow(url, ['hash','host','hostname','href','origin','password','pathname',
                    'port','protocol','search','username'], data);
            }

            function route(parentHandler, arg1, arg2, arg3, arg4) {
                //console.log('createRoute', {parentHandler, arg1, arg2, arg3, arg4});
                let code, path, cb, chainCb;
                if(typeof arg1 === 'number') {
                    code = arg1;
                    path = arg2;
                    cb = arg3;
                    chainCb = arg4;
                } else {
                    path = arg1;
                    cb = arg2;
                    chainCb = arg3;
                }
                const handler = addHandler(parentHandler, code, path, cb, chainCb);
                if(!chainCb) return;
                chainCb((code, path, cb, chainCb) => {
                    route(handler, code, path, cb, chainCb); // sub-paths use parent oo
                });
            }

            function addHandler(parentHandler, code, path, cb) {
                // optmz match by pre-compute
                const segments = path.substr(1, path.length).split('/').map(s => {
                    const is = s.startsWith(':');
                    if(is) {
                        s = s.substr(1, s.length-1);
                        if(DEBUG > 0) switch(s) { case 'url':case 'title':case 'style':
                            throw 'reserved keyword. param=' + p;}
                    }
                    return { s, is };
                });
                const isRoot = !parentHandler,
                      handler = {
                          handlers: [],
                          segments,
                          isRoot,
                          code,
                          cb
                      },
                      arr = isRoot ? handlers : parentHandler.handlers;
                arr.push(handler);
                //if(DEBUG > 5) { handler.debug = { tugName: Tug ? Tug.name : 'no_tug'}; console.log('   push handler',{handler}); }
                return handler;
            }

            function storeListener(_path, get) { //console.log('asdasdasdadadasda');
                const routeData = get(_path, false); //console.log('storeListener 1', {routeData});
                if(!routeData) return;
                const {url, segments, title, hints} = routeData;
                const result = match(segments, handlers); //console.log('storeListener', {result});
                if(result) {
                    context.storekeeper.do('route/params', result.params);
                    const props = {
                        ...result.params,
                        url,
                        title
                    };
                    const handlers = result.handlers.slice(0);
                    for(let i = 0; i < handlers.length; i++) {
                        if(handlers[i].cb({props, hints, state}) === false) break;
                    }
                }
            }

            function match(segments, handlers, result={handlers:[], params:{}}) {
                // TODO
                //      feature add so that a handler can also match against searchparams and hashtags (now only match segments)
                // 
                //console.log('match', {segments, handlers, result});
                for(let i = 0; i < handlers.length; i++) {
                    let h = handlers[i],
                        segs = h.segments,
                        params = {};
                    //console.log(i, 'match against', h);
                    for(let j = 0; j < segments.length && j < segs.length; j++) {
                        let segH = segs[j],
                            seg = segments[j],
                            isMatchAll = false;
                        //console.log('   ', {j, segH, seg});
                        if(segH.is) { //console.log('listener segment is a param', segH);
                            params[segH.s] = seg;
                        } else if(segH.s === '*') { //console.log('listener segment is a "*" is a match all');
                            // but do not save as a param.
                            isMatchAll = true;
                        } else if(segH.s !== seg) {
                            //console.log('not a param and not same string', {segH, seg});
                            // implies this is not a match.
                            break;
                        }

                        if(j === segs.length - 1) { //console.log('success matching incomming url with this handler');
                            let is;
                            //console.log('and no more segments in this handler to match against...');
                            if(isMatchAll) { //console.log('...and last handler segment was a "match all"...');
                                is = true;
                            } else if(j === segments.length - 1) { //console.log('...and no more incomming url segments either...');
                                is = true;
                            } else { //console.log('...but incomming url had more segments to parse...');
                                if(h.handlers) { //console.log('...and handler had sub handlers...');
                                    let subSegments = segments.slice(j+1, segments.length); //console.log(j, {segments, subSegments});
                                    let r = match(subSegments, h.handlers);
                                    if(r) { //console.log('...that successfully matched...');
                                        result.handlers = result.handlers.concat(r.handlers);
                                        result.params = {
                                            ...result.params,
                                            ...r.params
                                        };
                                        is = true;
                                    } else { //console.log('...that failed to match against incomming...');
                                        is = false;
                                    }
                                }
                            }
                            if(is) { //console.log('...so this is a happy ending');
                                // matching sub handler will be matched first,
                                // so top handlers added to the list have to be added first.
                                result.handlers.unshift(h);
                                result.params = {
                                    ...result.params,
                                    ...params
                                };
                                return result;
                            }
                            //else { console.log('...so this failed.'); }
                        }
                    }
                }
            }

            function goTo(path, title, hints={}) {
                path = context.dangerous.clean(path);
                if(!path.startsWith('/')) {
                    throw 'bad arg. path=' + path;
                }
                context.storekeeper.remove(undefined, ['route']);
                // build common data
                const url = new URL(buildOrigin() + path),
                      data = buildData(url),
                      segments = url.pathname.split('/');
                segments.shift(); // always starts with "/"
                // propagate
                const route = {
                    url: data,
                    segments,
                    title,
                    hints
                };
                const href = ooptions.prefixUrlPath ? ooptions.prefixUrlPath + url.href : url.href;
                if(hints.popstate) {
                    context.history.replaceState({path, title}, title, href);
                } else {
                    context.history.pushState({path, title}, title, href); //console.log("push ", {path, title});
                    context.history.onpopstate(event => { //console.log("pop ", event);
                        if(event.state) {
                            go(event.state.path, event.state.title, {popstate:true});
                        } else {
                            throw 'no history to pop. event=' + JSON.stringify(event);
                        }
                    });
                }
                context.storekeeper.do('route', route); //console.log({route});
            }

            function goBack() {
                context.history.back();
            }

            const go = goTo;
            go.back = goBack;
            go.isBack = () => context.history.length > 0;

            return {
                storeListener,
                route,
                go
            };
        })();
        context.storekeeper.on('route', context.router.storeListener); // note: auto-register.
        // ROUTE END

        // CUE BEGIN
        context.createCue = function(rootoo) {
            /*
             * The purpose of a Cue, is to make it easy to transition visually between a set of different Tugs.
             * A Tug can either be: created (undefined is truthy), replaced or destroyed.
             * All of these actions may be coupled to transitions.
             * Cue is non-oppinionated as to how it should be used,
             * but generally speaking it is a good idea to break up a transition into two steps.
             * 
             * Create Tug if it does not already exist. also run enter transition:
             *      cue({Foo, classnName: 'enter'});
             * Run exit transition if Foo exists, then destroy when done:
             *      cue({Foo, className: 'exit', regenerate: false})({destroy: true});
             *
             * Each step takes a callback (optional) as an argument.
             * Callback in first step, will be invoked when transition starts to run.
             * Callback in second step, will be invoked when transition in first (note: not second) step ends.
             *
             * Run exit if Foo exists. When transition end replace Foo and create Toga (inside Foo) and finally run enter transition:
             *      cue({Foo, className: 'exit', regenerate: false})({className: 'enter', replace: true}, ({oo}) => {
             *          cue({oo, Toga, props:{} });
             *      });
             *
             * If you intend to do stuff _after_ the transition in the second step ends and write like this, it will NOT work:
             *      cue({Foo, className: 'exit'})({className: 'enter' }, () => cue({Toga})); // create Toga _before_ running enter
             * Instead do like this:
             *      cue({Foo, className: 'exit'})(() => { // when exit transtion ends do this
             *          cue({Foo, className: 'enter'})( () => cue({Toga}) ); // when enter ends, create Toga
             *      });
             *
             * If several Tugs of the same type is used in the same cue, it is possible to specify which using a key ('id').
             *      cue({Button, id: 'fooButton', autoId: true}, ({id, oo}) => {
             *          manualId = id;
             *          cue({Button, autoId: true}, ({id, oo}) => {
             *              autoId = id;
             *              cue({Button, id: manualId}, ({id, oo}) => {
             *                  //manualId === id
             *              });
             *          });
             *      });
             *
             */
            const tugs = {};

            function arg(tug) {
                return {oo: tug.o, id: tug.id, state: tug.state, Tug: tug.Tug, tug};
            }

            function exec(Tug, options_cb={}, runCb=()=>{}, id) { //console.log({Tug, options_cb, runCb, id});
                if(Object.prototype.toString.call(options_cb) === '[object Function]') {
                    runCb = options_cb;
                    options_cb = {};
                }
                if(options_cb.autoId) {
                    for(id = 1; tugs[id]; id++);
                }
                if(!id && options_cb) id = options_cb.id;
                if(!id && Tug) id = Tug.name;
                if(!id) throw 'no id found. name=' + name;
                let tug = tugs[id];
                if(!Tug && tug) Tug = tug.Tug;
                if(!Tug) throw 'no Tug found. id=' + id;
                const name = Tug.name;
                if(!tug) tug = { id, Tug, name, state: 'destroyed'}; // lazy
                const {className, regenerate, replace, destroy, defaultProps={}} = options_cb,
                      props = {...defaultProps, ...options_cb.props};
                let endCb = () => {}; // utlizing scope, set in return func
                //console.log({id, name, Tug, tug, className, regenerate, replace, destroy, defaultProps});
                if(destroy) {//console.log('destroy', {id, name});
                    if(tug.state !== 'destroyed' && tug.o) tug.o.destroy(); // will invoke onDestroy listener above
                } else if(replace || tug.state === 'destroyed') {
                    tug.oo = options_cb.oo || tug.oo || rootoo;
                    if(replace && tug.o) {
                        tug.o.destroy();
                        //props.replaceRef = tug.fullRef;
                    }
                    if(regenerate !== false) { //console.log({Tug, props});
                        tug.o = tug.oo(Tug, props);
                        tug.state = 'created';
                        tug.id = id;
                        tugs[id] = tug; // during a replace, onDestroy will first delete, so we add here
                        tug.o.onDestroy(f => { //console.log('destroyed', {name, f, id, tug});
                            tug.state = 'destroyed';
                            tug.o = null;
                            delete tugs[id];
                        });
                    }
                }
                const isTransitionRun = className && tug.o && tug.o.elm && !tug.o.elm.classList.contains(className);
                if(isTransitionRun) { //console.log({className, id, tug});
                    tug.isTransitionEnd = false;
                    tug.o.classList(className, {swap: tug.className || true});
                    tug.className = className;
                    tug.o.transition(() => runCb( arg(tug) ), () => {
                        tug.isTransitionEnd = true;
                        endCb();
                    });
                    //console.log('transition sghould run', id);
                } else {
                    runCb( arg(tug) );
                    tug.isTransitionEnd = true;
                }

                return (options_cb={}, cb=()=>{}) => { //console.log('do this', {isTransition});
                    if(Object.prototype.toString.call(options_cb) === '[object Function]') {
                        cb = options_cb;
                        options_cb = undefined;
                    }
                    endCb = () => { //console.log('postponed until transition is finished');
                        exec(Tug, options_cb, () => { //console.log('boom', arg(tug));
                            cb( arg(tug) );
                        }, id);
                    };
                    if(tug.isTransitionEnd) endCb();
                };
            }

            function all(options={}, cb) {
                const {except=[], regenerate, destroy} = options,
                      exceptIds = except.map(v => typeof v === 'string' ? v : v.name);
                Object.keys(tugs).forEach(k => {
                    const {Tug, id} = tugs[k]; //console.log({id});
                    if(!exceptIds.includes(id)) {
                        exec(Tug, {id, regenerate, destroy})({regenerate:false}, cb);
                    }
                });
            }

            function cue(arg1, arg2, arg3) {
                if(arg1 === 'all') {
                    all(arg2, arg3);
                } else if(Object.prototype.toString.call(arg1) === '[object Array]') {
                    arg1.forEach(TugOptions => { //console.log({TugOptions});
                        exec(context.parseTug(TugOptions), TugOptions);
                    });
                } else {
                    return exec(context.parseTug(arg1), arg1, arg2);
                }
            }

            return cue;
        };
        // CUE END

        // STYLING
        context.stylesheet = (css, ref) => {
            ref = 's/' + ref;
            //let style = id && context.getDomElementById(id);
            let style = ref && context.getDomElementByRef(ref);
            if(!style) {
                style = context.createDomElement('style');
                style.setAttribute('ref', ref);
                document.head.appendChild(style);
            }
            if(style.innerHTML != css) {
                context.dangerous.innerHTML(style, css);
            }
        };

        // DOM
        if(DEBUG > 1) console.log('[OO] initial context: ', context);
        context.getDomElementById = (id) => {
            return document.getElementById(id);
        };
        context.createDomElement = (tagName, xmlns) => {            if(DEBUG > 0) context.debug.allocate('dom.element');
            //console.log({tagName});
            // TODO
            //      add server rendering
            //          create virtual element with same methods as DOM.
            //          create virtual DOM tree to keep track of virtual elements.
            return xmlns ? document.createElementNS(xmlns, tagName) : document.createElement(tagName);
        };
        context.removeElement = (elm) => {                          if(DEBUG > 0) context.debug.release('dom.element');
            elm.remove();
        };
        context.getDomElementByRef = (ref) => {
            return document.querySelector('[ref="'+ref+'"]');
        };
        context.createooo = ({ref, elm, parentRef, children=[]}) => {
            // for every new real DOM element created with OO,
            // a virtual DOM element referred to as 'ooo', is created internally
            // and a function is returned. internally it is referred to as  'f' and externally as 'oo'.
            // the real DOM element is used by the browser,
            // the 'ooo' element is used to keep track of the real DOM element,
            // and the 'f' function makes it easy to chain the creation of new elements.
            // inernally theere is a map of all 'oos' created in the scope of OO.
            return {
                parentRef,
                children,
                ref,
                elm
            };
        };
        pAArent = context.createooo({ref: context.rootRef});
        context.byRef = (ref) => context.oos[ref];
        context.createIndexRef = (paarent) => {
            const pRef = paarent.ref;
            for(let i = 0; i < Number.MAX_VALUE; i++) {
                let r = pRef + '/' + i;
                if(!paarent.children.includes(r)) {
                    return i;
                }
            }
            throw 'out of bounds. parent.ref=' + paarent.ref
        };
        context.remove = (f, isPreserveElement, isPreserveChildren, debugTag) => {
            //if(DEBUG > 4) console.log('[OO] remove. ref=' + f.ref, debugTag);
            //console.log('[OO] remove. ref=' + f.ref, debugTag);
            const arr = f.onRemoved.slice(0); // protect aganst listeners ruining the arr
            arr.forEach(l => l(f)); // added externally and internally (store,expression)
            if(!isPreserveChildren) {
                const children = f.ooo.children.slice(0); // protect aganst listeners ruining the arr
                children.forEach(ref => { //console.log('   remove child from', debugTag, ref);
                    context.removeRef(ref, isPreserveElement);
                });
            }
            const elm = f.elm;
            if(elm && !isPreserveElement) {
                context.removeElement(elm); //elm.remove();
                f.elm = null; // should not be needed, but IF something is holding on to f, at least clear it here
            }
            // f is most likely a children of something...
            const parentF = context.oos[f.parentRef];
            if(parentF) {
                const i = parentF.ooo.children.findIndex(ref => ref === f.ref);
                if(i >= 0) {
                    // ...so remove it
                    parentF.ooo.children.splice(i, 1);
                }
            }
            delete context.oos[f.ref];                                  if(DEBUG > 0) context.debug.release('oo');
        };
        context.removeRef = (ref, isPreserveElement, isPreserveChildren) => { //console.log('removeRef', ref);
            return context.remove(context.oos[ref], isPreserveElement);
        };
        context.storekeeper.do(store);
        context.deflateContext = () => {
            // after rendering on server,
            // context can be exported and sent to browser client,
            // where it can be re-inflated.
            const oos = {};
            for(let p in context.oos) {
                if(Object.prototype.hasOwnProperty.call(context.oos, p)) {
                    // notice that the element itself is not stored,
                    // which informs OO that it should inspect the DOM.
                    oos[p] = {};
                }
            }
            return {
                //store: context.store
                rootRef: context.rootRef,
                oos
            };
        };

        // OO
        context.OO = function(paarent, Tug, x_prop_str, props={}, isSetup, debugTag) {
           //console.log({paarent, Tug, x_prop_str, props, debugTag});
           if(Object.prototype.toString.call(x_prop_str) === '[object Object]') {
                props = x_prop_str;
                x_prop_str = null;
            }
            for(let p in context.globalProps) {
                if(!props[p]) props[p] = context.globalProps[p]; // makes it possible to override
            }

            // CREATE
            const ref = isSetup ? context.rootRef : paarent.ref + '/' + (props.ref || context.createIndexRef(paarent)),
                  isFunction = Tug !== null && typeof Tug !== 'string',
                  elementName = isFunction ? (props.tag || Tug.name.toLowerCase()) : Tug,
                  isReplace = props.replaceRef || props.replace,
                  parentF = context.oos[paarent.ref],
                  xmlns = props.xmlns || (parentF && parentF.xmlns),
                  currf = context.oos[ref];

            //if(debugTag) console.log(elementName, ref, 'nbr children='+paarent.children.length);

            //if(currf && !props.ref) { throw 'ref already eixsts. ref=' + ref + ' elementName=' + currf.elementName; }
            let elm;
            if(!currf) {
                // totally new element
                if(DEBUG > 3) console.log('[OO] create. ref=' + ref);
                if(isSetup) {
                    elm = rootElement;
                } else if(elementName) {
                    elm = context.createDomElement(elementName, xmlns);
                } else {
                    throw 'TODO: oo hidden from DOM';
                }
            } else if(!currf.elm) {
                // there is a reference to an element but no element,
                // which is to be expected if HTML was rendered on server.
                const domElm = context.getDomElementByRef(ref);//const domElm = document.querySelector('[ref="'+ref+'"]');
                if(domElm) {
                    // but exists in dom,
                    // which is to be expected if HTML was server rendered.
                    elm = domElm;
                    currf.elm = elm;
                } else {
                    throw 'element not found in dom. ref=' + ref;
                }
            } else if(isReplace) {
                elm = context.createDomElement(elementName, xmlns);// document.createElement(elementName);
                if(DEBUG > 3) console.log('[OO] create and replace. ref=' + ref);
            }
            else if(currf.elm) {
            //    // there is a reference to an element,
            //    // and and element
            //    if(currf.elementName === elementName) {
            //        if(DEBUG > 3) console.log('[OO] re-use. ref=' + ref);
            //        elm = currf.elm;
            //        context.remove(currf, true, true);
            //    } else {
                    if(DEBUG > 3) console.log('[OO] destroy existing and create. ref=' + ref);
                    context.remove(currf);
                    elm = context.createDomElement(elementName, xmlns);// document.createElement(elementName);
            //    }
            }
            if(elm) elm.setAttribute('ref', ref);
            for(let p in props) {
                if(p !== 'className' && (typeof elm[p] === 'string' || xmlns)) {
                    elm.setAttribute(p, props[p]);
                }
            }
            // ADD TO DOM
            let isReplaced;
            if(isReplace) {
                let replace;
                if(props.replaceRef) {
                    let replaceRef;
                    if(props.replaceRef.startsWith('r')) {
                        if(DEBUG > 5) console.log('[OO] replace by full ref. ref=' + props.replaceRef);
                        replaceRef = props.replaceRef;
                    } else {
                        if(DEBUG > 5) console.log('[OO] replace by sibling ref. ref=' + props.replaceRef);
                        replaceRef = paarent.ref  + '/' + props.replaceRef;
                    }
                    replace = context.oos[replaceRef];
                } else if(typeof props.replace === 'boolean') {
                    replace = context.oos[ref];
                    if(DEBUG > 5) console.log('[OO] replace by self ref. ref=' + replace.ref);
                } else { // has to be by pointer
                    replace = props.replace;
                    if(DEBUG > 5) console.log('[OO] replace by pointer. ref=' + replace.ref);
                }
                if(replace) {
                    const previousSibling = replace.elm.previousSibling;
                    if(previousSibling) {
                        if(DEBUG > 4) console.log('[OO] insert ref=' + ref + ' after sibling ref=' + replace.ref);
                        previousSibling.insertAdjacentElement('afterend', elm)
                        isReplaced = true;
                    } else {
                        if(DEBUG > 4) console.log('[OO] insert ref=' + ref + ' at first child of ref=' + paarent.ref);
                        paarent.elm.insertAdjacentElement('afterbegin', elm);
                        isReplaced = true;
                    }
                    context.remove(replace, null, null, debugTag);
                } else {
                    if(DEBUG > 4) console.log('[OO] nothing to replace.  ref=' + ref);
                }
            }
            if(paarent.parentRef) {
                if(!isReplaced) {
                    if(DEBUG > 4) console.log('[OO] append ref=' + ref + ' to ref=' + paarent.ref);
                    paarent.elm.appendChild(elm);
                }
            }
            //remove else {
            //    if(DEBUG > 4) console.log('[OO] append ref=' + ref + ' to rootElement');
            //    console.log('rrot', rootElement);
            //    //rootElement.appendChild(elm);
            //}

            // VIRTUAL DOM
            const ooo = context.createooo({ref, elm, parentRef: paarent.ref}),
                  f = OO(null, null, context, ooptions, ooo);
            paarent.children.push(ref);
            context.oos[ref] = f;                                       if(DEBUG > 0) context.debug.allocate('oo');

                // DECORATE
            f.onRemoved = []; // traversed by context.remove
            f.ooo = ooo; // ooo is part of virtual dom to keep track of f and DOM elm
            f.oo = f; // f is a function (referred to as oo externally, so this helps with destructoring)
            f.elementName = elementName;
            f.parentRef = ooo.parentRef;
            f._ = parentF;// context.oos[ooo.parentRef];
            f.ref = ref;
            f.xmlns = xmlns;
            if(DEBUG > 1) {
                f.debugId = (debugTag ? '[ ' + debugTag + ' ] ' : '') +
                    '[ ' + (Tug.name || Tug) + ' : ' + ref + ' ] [ ' + Date.now() + '-' + Math.random() + ' ]';
                if(DEBUG > 2) {
                    console.log('[OO] created oo: ', f.debugId);
                }
            }
            f.elm = elm; //console.log({elm, rootElement});
            f.context = context;
            f.children = () => {
                return context.oos[ref].children;
            };
            f.byRef = context.byRef;
            f.html = v => {
                context.dangerous.innerHTML(elm, v);
                return f;
            };
            f.text = v => {
                context.dangerous.innerText(elm, v); // TODO turn into expression to it can listen 
                return f;
            };
                // element delegation methods
            f.style = (style_path, style) => {
                context.expressionfy(f, style_path, style, v => {
                    if(v) {
                        context.applyStyle(elm, v.$ || v);
                    }
                }, Object.prototype.toString.call(style_path) !== '[object Object]', undefined, false, true); // expressionlistener
                return f;
            };
            f.visible = (is) => {
                f.style({visibility: is ? 'visible' : 'hidden'});
                return f;
            };
            //TODO
            //f.disable = (is_path, is) => {
            //    elm.disable(context.expressionfy(f, is_path, null, ({data}) => {
            //        elm.disable = data;
            //    }, is));
            //    return f;
            //};
            f.getBoundingClientRect = () => {
                return elm.getBoundingClientRect();
            };
            f.className = (name_path, options={}) => {
                return f.classList(name_path, {...options, clear: true, add: true});
            };
            f.classList = function(name_path, options={}, cb) { //console.log({name_path, options});
                if(arguments.length === 1) {
                    options = name_path;
                }
                const type = Object.prototype.toString.call(options);
                if(type === '[object Function]') {
                    cb = options;
                    options = {};
                }
                let curr;
                const {toggle, remove, add, clear, swap, replace} = options;
                let when;
                if(options.when) when = context.createWhen(options.when);
                if(name_path) {
                    context.expressionfy(f, name_path, null, v => { // expressionlistener
                        //if(when) console.log({name_path, v}, f.elementName, when.is(v), when.transform(v));
                        const b = !when || when.is(v);
                        if(!b) return;
                        if(when) v = when.transform(v);
                        if(cb) v = cb(v);
                        if(v !== undefined) { //console.log('v='+v, {clear, add});
                            if(v === null || clear) {
                                const classList = f.elm.classList;
                                while(classList.length > 0) {
                                    classList.remove(classList.item(0));
                                }
                            }
                            if(remove) {
                                elm.classList.remove(typeof remove === 'string' ? remove : v);
                            } else if(toggle) {
                                elm.classList.toggle(typeof toggle === 'string' ? toggle : v);
                            } else if(add) {
                                elm.classList.add(typeof add === 'string' ? add : v);
                            } else if(replace) {
                                elm.classList.replace(v);
                            } else if(swap) {
                                //console.log({swap, curr});
                                elm.classList.remove(typeof swap === 'string' ? swap : curr);
                                if(v) elm.classList.add(v);
                            }
                            curr = v;
                        }
                    }, undefined, undefined, true, false, !!when);
                }
                return f;
            };
            f.onDestroy = (cb) => {
                f.onRemoved.push(cb);
            };
                // element shim methods
            f.onclick = (cb) => {
                elm.onclick = function(event) { //setTimeout(() =>{console.log(event,'defaultPrevented=' + event.defaultPrevented)}, 2);
                    const v = cb({event, oo: f.oo, $: f.$});
                    if(v === false) event.stopPropagation();
                    return v;
                };
                return f;
            };
            //context.shimMethod(f, 'onclick', elm);
            //context.shimMethod(f, 'oninput', elm, ({cb, args}) => {
            //    return cb(elm.input, f, ...args);
            //});
            //context.shimEvent(f, 'focusout', elm);
            //context.shimEvent(f, 'blur', elm);
            //context.shimMethod(f, 'onmouseover', elm)
            //context.shimMethod(f, 'onmouseout', elm)
                // element augmentation methods
            f.css = f.stylesheet = (css, name) => {
                if(!name) {
                    name = f.elementName;
                }
                if(css.indexOf('{') === -1) {
                    if(!name) throw 'missing a Tug name.';
                    css = name + ' { ' + css + ' }';
                }
                context.stylesheet(css, name || f.elementName);
            };
            f.destroy = () => context.remove(f);
            f.clear = () => {
                const arr = f.ooo.children.slice(0);
                arr.forEach(ref => context.removeRef(ref));
                return f;
            };
            f.createCue = context.createCue;
            f.transition = (run, end) => { //console.log(f.elm, className);
                //if(className) f.elm.classList.add(className);
                if(run) {
                    f.elm.addEventListener('transitionrun', event => { //console.log('transitionrun', event);
                        run(f, event);
                    }, {once: true});
                }
                if(end) {
                    f.elm.addEventListener('transitionend', event => { //console.log('transitionend', event);
                        //if(className) f.elm.classList.remove(className);
                        end(f, event);
                    }, {once: true});
                }
                return f;
            };
            f.go = context.router.go;
            f.route = function() {
                context.router.route(null, ...arguments)
                return f;
            };
            f.resolvePromises = context.storekeeper.resolvePromises;
            f.onResolved = (cb) => {
                f.onRemoved.push(context.storekeeper.onResolved(cb));
            };
            f.hasUnresolved = context.storekeeper.hasUnresolved;
                        // store
            f.storekeeper = context.storekeeper;
            f.store = context.createStoreListener;
            f.$  = context.storekeeper.$;
            f.on = (path, arg1, arg2, arg3) => { //console.log({path, arg1, arg2, arg3});
                if(!path.startsWith('$') && !path.startsWith('@')) {
                    path = '$' + path;
                }

                let mode, tagTug, props, cb, t;
                if(arg3) { //path, ''{}, TrueFalse, Cb
                    t = Object.prototype.toString.call(arg1);
                    tagTug = arg1;
                    mode = arg2;
                    cb = arg3;
                } else if(arg2) { // path, TrueFalse''{}, Cb
                    t = Object.prototype.toString.call(arg1);
                    if(t === '[object Boolean]') {
                        mode = arg1;
                    } else {
                        tagTug = arg1;
                    }
                    cb = arg2;
                } else if(arg1) { // path, Cb
                    cb = arg1;
                }

                let when;
                if(tagTug && t === '[object Object]') {
                    if(tagTug.hasOwnProperty('when')) { // hasOwnProperty needed, because when can be "undefined" 
                        when = context.createWhen(tagTug.when);
                    }
                    props = tagTug.props;
                    tagTug = context.parseTug(tagTug, true, ['when', 'props']);
                }

                let isPreferValue, is$;
                if(mode === true) {
                    isPreferValue = true;
                    is$ = true; // cb arg1 should be metadata
                } else if(mode === false) {
                    isPreferValue = false; // cb arg1 should be obj no matter what is stored
                } else { // undefined
                    isPreferValue = true; // most common use-case, arg1 should be obj/val depending on what is stored
                }

                let F = f,
                    lastV = {}; // init as obj, because value undefined (used in when) will not match and obj will pass through
                const exp = context.expression.exec(path, v => {
                    // objects should always propagate,
                    // so that if parent is told to be notified
                    // that object will be propagated.
                    if(lastV === v && typeof v !== 'object') return;
                    lastV = v;

                    //console.log({path, arg1, arg2, arg3, v});
                    //console.log({path, tagTug, props, isPreferValue, is$});
                    const b = !when || when.is(v);
                    if(!b) return;
                    if(when) {
                        v = when.transform(v);
                        if(typeof v === 'object') {
                            const parsedTug = context.parseTug(v, true, ['when', 'props']);
                            if(parsedTug) {
                                props = v.props;
                                tagTug = parsedTug;
                            }
                        }
                    }

                    if(tagTug) {
                        f.clear();
                        //if(F) F.destroy(); // when specifying tagTug, replace all children of f.
                        if(props) { //console.log('tagTug=', tagTug);
                            F = f(tagTug, props); // Tug
                        } else {
                            F = f(tagTug); // tag
                        }
                    }
                    return cb(v, F, F.$, debugTag);
                }, undefined, isPreferValue, is$, !!when/*, debugTag*/); // expressionlistener
                if(exp.isExpression) {
                    f.onRemoved.push(exp.remove);
                }
                return f;
            };
            f.xx = (name) => { // TODO if this is used a lot, add expressions
                const arr = []; // instead of check
                if(!f[name]) {
                    f[name] = (cb, cbOwner) => {
                        arr.push(cb);
                        if(!cbOwner) {
                            cbOwner = parentF;
                        }
                        if(DEBUG) console.log('no cb owner specified, so defaulting to parent. elementName=', cbOwner.elementName);
                        cbOwner.onRemoved.push(() => {
                            const i = arr.findIndex(o => o === cb);
                            if(i >= 0) arr.splice(i, 1);
                        });
                        return f;
                    };
                } else {
                    throw 'function exists. name=' + name;
                }
                return function() {
                    arr.forEach(cb => cb(...arguments));
                };
            };
            f.x = f.expose = function(mode_name, cbowner_name, cb) { // TODO possibly deprecate f.x in favour of f.xx
                if(typeof mode_name === 'string' && arguments.length === 1) {
                    // add callback
                    return f.xx(mode_name);
                }

                let name = cbowner_name;
                if(Object.prototype.toString.call(mode_name) === '[object Function]') {
                    cb = mode_name;
                    name = mode_name.name;
                } else if(!cb) {
                    cb = name;
                    name = mode_name;
                }
                if(!f[name]) {
                    f[name] = function() {
                        if(DEBUG > 2) {
                            console.log('expose', name, 'on', f.debugId);
                        }
                        const exp = context.expression.exec(arguments[0], v => cb(v, f)); // expressionlistener
                        if(exp.isExpression) {
                            f.onRemoved.push(exp.remove);
                        } else {
                            cb(...arguments, f);
                        }
                        return f;
                    };
                    if(mode_name === 'default') {
                        if(f.defaultExpose) {
                            throw 'default function exists. name='+name;
                        }
                        f.defaultExpose = f[name];
                    }
                } else {
                    throw 'function exists. name=' + name;
                }
                return f;
            };
            f.props = (props={}) => {
                f.style(props.style);
                f.className(props.className);
                return f;
            };
            f.props(props);

            let tugReturnValue;
            if(isFunction) {
                tugReturnValue = Tug(f, props);
            }

            // EXPRESSION
            if(x_prop_str) { //console.log({x_prop_str});
                context.expressionfy(f, x_prop_str, null, (v, funcName) => { // expressionlistener
                    if(funcName) {
                        f[funcName](v, f); // '@icecream eat $color/blue ice.'
                    } else if(f.defaultExpose) {
                        f.defaultExpose(v, f); // 'eat $color/blue ice.'
                    } if(elm.innerText !== undefined) {
                        f.text(v);
                   } else {
                        f.html(v);
                   }
                   // } else {
                   //     if(DEBUG > 5) throw 'bad parcel. funcName=' + funcName;
                   // }
                }, undefined, undefined, true);
            }

            if(DEBUG > 0 && !context.oos[ref]) throw 'missing oo in oos. ref='+ref;
            if(tugReturnValue !== undefined) return tugReturnValue; // break the chains
            return f;
        };
        //console.log('end of OO init (rootElement)');
        if(context.isNodeJS()) {
            throw 'TODO';
        } else if(typeof rootElement === 'string') {
            rootElement = context.getDomElementById(rootElement); //console.log('rootElement was a string', {rootElement});
            if(!rootElement) {
                throw 'missing rootElement';
            }
        } else if(!rootElement) {
            rootElement = document.body; console.log('no rootElement at all, using body');
        }
        return context.OO(pAArent, 'oo', undefined, undefined, true);
    }
    if(!context) {
        throw 'missing context. rootElement='+rootElement;
    }
    return (Tug, x_prop_str, props, debugTag) => context.OO(pAArent, Tug, x_prop_str, props, debugTag);
};
OO.extend = (name_func, obj_func) => { //console.log({name_func, obj_func});
    let name;
    if(typeof name_func === 'string') {
        name = name_func;
    } else {
        name = name_func.name;
        obj_func = name_func;
    }
    if(OO[name]) {
        throw 'OO extension exists. name='+name;
    } else {
        console.log('[OO] extending ', name);
        return OO[name] = obj_func;
    }
};
OO.debug = function(context, DEBUG) {
    context.debug = {};

    const map = {},
          logs = [],
          contexts = [];

    function get(type) {
        let o = map[type];
        if(!o) {
            o = { allocate: 0, release: 0 };
            map[type] = o;
        }
        return o;
    }

    function log(s) {
        logs.push('[' + new Date() + '] ' + s);
    }

    context.debug.watch = (isAbortLoop) => {
        console.log('-- Debug Watch --');
        contexts.forEach((o, i) => {
            let a, b;
            console.log('\tcontext '+ (i+1) + ' / ' + contexts.length);
            console.log('\t\trootRef: ' + o.rootRef);
            a = Object.keys(o.oos).length;
            console.log('\t\tOOS keys: ' + a);
            console.log('\tStore: ', o.store);
        });
        console.log('\ttotal:');
        for(let p in map) {
            if(map.hasOwnProperty(p)) {
                console.log('\t\t' + p + '\t\tallocate: ' + map[p].allocate + '\t\trelease: ' + map[p].release);
            }
        }
        if(!isAbortLoop) {
            setTimeout(context.debug.watch, 1000 * 60);
        }
    }

    context.debug.allocate = (type) => {
        get(type).allocate++;
        log('allocate ' + type);
    };

    context.debug.release = (type) => {
        get(type).release++;
        log('release ' + type);
    };

    if(DEBUG > 5) setTimeout(context.debug.watch, 1);

};
window.OO = OO;
