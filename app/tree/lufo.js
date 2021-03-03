/*
 * TODO
 *      fix:
 *      fr:
 *      roadmap:
 *
 * v0.0.1-1
 * Lufo
 * Least used first out.
 */
// https://en.wikipedia.org/wiki/Self-organizing_list
//(function() { let module; if(this.window) { window._lufo = { version: 'v0.0.1' }; module = window._lufo;}
// TODO
//      add test for pop
//      add test for double lufo
//      add test for combinedLufo
//      add test for forEachAsync
//      add test for splice
//      add test for addPrev, addNext, removeOverflow, append, push

const MAX_USE_COUNT = 1231006505; // magic

function roughSizeOfObject(object) {
    // TODO verify that it works (copied from internet!)
    var objectList = [];
    var stack = [ object ];
    var bytes = 0;
    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}

export function createCombinedLufo() {
    /*
     * Some methods requires a named lufo and some do not.
     *
     * Use:
     *      o = createCombinedLufo()
     *      o.addLufo('permanent', databaseLufo);
     *      o.addLufo('temporary', localStorageLufo)
     *      o.addLufo('session', memoryStorageLufo)
     *      o.add('session', 'xyz', v);
     *      o.move('xyz', 'permanent', 'bubble')
     */
    const obj = {},
          arr = [];

    function addLufo(name, lufo) {
        obj[name] = lufo;
        arr.push(lufo);
    }

    function has(key, name) {
        if(name) {
            return obj[name].has(key);
        } else {
            return get(key);
        }
    }

    function useValue(key, sort) {
        const o = use(key, sort);
        if(o) return o.value;
    }

    function use(key, sort) {
        if(name) {
            return obj[name].use(key, sort);
        } else {
            for(let i = 0, lufo, elm; i < arr.length; i++) {
                lufo = arr[i],
                elm = lufo.get(key);
                if(elm) {
                    lufo.use(key, sort);
                    return elm;
                }
            }
        }
    }

    function get(key, name) {
        if(name) {
            return obj[name].get(key);
        } else {
            for(let i = 0, lufo, elm; i < arr.length; i++) {
                lufo = arr[i],
                elm = lufo.get(key);
                if(elm) {
                    return elm;
                }
            }
        }
    }

    function getValue(key, name) {
        const o = get(key, name);
        if(o) return o.value;
    }

    function addPrev(atKey, key, value) {
        return obj[name].addPrev(atKey, key, value);
    }

    function addNext(atKey, key, value) {
        return obj[name].addNext(atKey, key, value);
    }

    function push(name, key, value) {
        return obj[name].add(key, value, 'top');
    }

    //function append(name, key, value) {
    //    const o = last();
    //    return o ? addNext(o.key, key, value) : add(key, value);
    //}

    function add(name, key, value, sort) {
        return obj[name].add(key, value, sort);
    }

    function pop(name, limit) {
        return obj[name].pop(limit);
    }

    function clone(name, {maxKeys, maxSize, lufo}) {
        return obj[name].clone({maxKeys, maxSize, lufo});
    }

    function move(key, name, sort) {
        // if element exists, move to name
        let elm, removed;
        if(name) {
            elm = obj[name].get(key);

        } else {
            for(let i = 0, lufo, elm; i < arr.length; i++) {
                lufo = arr[i];
                elm = lufo.get(key);
                if(elm) {
                    removed = lufo.remove(key);
                    break;
                }
            }
        }
        if(elm) {
            removed = obj[name].add(key, elm.value, sort);
        }
        return removed;
    }

    function forEachAsync(name, cb, done, isValue) {
        const l = obj[name];
        let o = l.first();
        const step = () => {
            const curr = o;
            o = l.next(curr.key);
            if(o) {
                cb(isValue ? curr.value : curr, step);
            } else {
                done();
            }
        };
        return step;
    }


    return {
        addLufo,
        move,
        add,
        use,
        useValue,
        pop,
        get,
        getValue,
        has
    };
}

export function createDoubleLufo({maxKeys, maxSize, read, write}) {
    read = read ?? createLufo({maxKeys, maxSize}),
    write = write ?? createLufo({maxKeys, maxSize})

    function flip() {
        const o = write;
        write = read;
        read = o;
    }

    function first() {
        return read.first();
    }

    function last() {
        return read.last();
    }

    function pop(limit) {
       return read.pop(limit);
    }

    function prev(key) {
        return read.prev(key);
    }

    function next(key) {
        return read.next(key);
    }

    function addArray({arr, sort, key, value}) {
        key = key ?? 'key';
        value = value ?? 'value';
        for(let i = 0, elm; i < arr.length; i++) {
            elm = arr[i];
            add(elm[key], elm[value], sort);
        }
    }

    function addPrev(atKey, key, value) {
        if(!read.get(key)) {
            return write.addPrev(atKey, key, value);
        }
    }

    function addNext(atKey, key, value) {
        if(!read.get(key)) {
            return write.addNext(atKey, key, value);
        }
    }

    function push(key, value) {
        if(!read.get(key)) {
            return write.add(key, value, 'top');
        }
    }

    function append(key, value) {
        if(!read.get(key)) {
            const o = write.last();
            return o ? write.addNext(o.key, key, value) : write.add(key, value);
        }
    }

    function add(key, value, sort) {
        if(!read.get(key)) {
            write.add(key, value, sort);
        }
    }

    function useValue(key, sort) {
        const o = use(key, sort);
        if(o) return o.value;
    }

    function use(key, sort) {
        let o = read.use(key, sort);
        if(!o) {
            o = write.use(key, sort);
        }
        return o;
    }

    function has(key) {
        return get(key);
    }

    function get(key) {
        let o = read.get(key);
        if(!o) {
            o = write.get(key);
        }
        return o;
    }

    function getValue(key) {
        const o = get(key);
        if(o) return o.value;
    }

    function remove(key) {
        remove(key);
        write.remove(key);
    }

    function forEachAsync(cb, done, isValue) {
        let o = first();
        const step = () => {
            const curr = o;
            o = next(curr.key);
            if(o) {
                cb(isValue ? curr.value : curr, step);
            } else {
                done();
            }
        };
        return step;
    }

    function clear(buffer) {
        if(!buffer || buffer === 'read') {
            read.clear();
        }
        if(!buffer || buffer === 'write') {
            write.clear();
        }
    }

    function clone(buffer, {maxKeys, maxSize, lufo}) {
        if(buffer === 'read') {
            return read.clone({maxKeys, maxSize, lufo});
        } else if(buffer === 'write') {
            return write.clone({maxKeys, maxSize, lufo});
        }
    }


    function length(buffer) {
        if(buffer === 'read') {
            return read.length();
        } else if(buffer === 'write') {
            return write.length();
        } else {
            throw 'bad buffer';
        }
    }

    return {
        first,
        last,
        pop,
        has,
        get,
        use,
        useValue,
        add,
        remove,
        clear,
        length
    };
}

export function createCachedStorageLufo({maxKeys, maxSize, storageLufo}) {
    const cacheLufo = createLufo({maxKeys, maxSize});

    function useValue(key, sort) {
        const o = use(key, sort);
        if(o) return o.value;
    }

    function use(key, sort) {
        let o = cacheLufo.use(key);
        if(!o) {
            o = storageLufo.use(key);
            if(o) {
                cacheLufo.add(key, o.value, sort)
            }
        }
        return o;
    }

    function addPrev(atKey, key, value) {
        return storageLufo.addPrev(atKey, key, value);
    }

    function addNext(atKey, key, value) {
        return storageLufo.addNext(atKey, key, value);
    }

    function push(key, value) {
        return add(key, value, 'top');
    }

    function append(key, value) {
        const o = last();
        return o ? addNext(o.key, key, value) : add(key, value);
    }

    function add(key, value, sort) {
        return storageLufo.add(key, value, sort);
    }

    function remove(key) {
        cacheLufo.remove(key);
        storageLufo.remove(key);
    }

    function clear() {
        cacheLufo.clear();
        storageLufo.clear();
    }

    function destroy() {
        cacheLufo.destroy();
        storageLufo.destroy();
    }

    function has(key) {
        return storageLufo.get(key);
    }

    function get(key) {
        let o = cacheLufo.get(key);
        if(!o) {
            o = storageLufo.get(key);
        }
        return o;
    }

    function getValue(key) {
        const o = get(key);
        if(o) return o.value;
    }

//    TODO 
//    FIX: Elements in cached and storage will not be in the same order,
//    hence everything that depends on ordering will be messy and wrong.
//    //function pop() {
//    //    const o = storageLufo.first();
//    //    if(o) {
//    //        remove(o.key);
//    //        return o;
//    //    }
//    //}
//
//    //function prev(key) {
//    //    let o = get(key);
//    //    if(o) {
//    //        return get(o.prev);
//    //    }
//    //}
//
//    //function next(key) {
//    //    let o = get(key);
//    //    if(o) {
//    //        return get(o.next);
//    //    }
//    //}
//
//    //function first() {
//    //    return storageLufo.first();
//    //}
//
//    //function last() {
//    //    return storageLufo.last();
//    //}
//
//    //function forEach(cb) {
//    //    let i = 0,
//    //        head = first(),
//    //        tail = last(),
//    //        curr = get(head);
//    //    while(curr) {
//    //        cb(curr, i, curr.key === head, curr.key === tail);
//    //        curr = next(curr.key);
//    //        i++;
//    //    }
//    //}
//
//    //function iterator() {
//    //    let o = first();
//    //    return () => {
//    //        const curr = o;
//    //        o = next(curr.key);
//    //        return curr;
//    //    };
//    //}

    return {
        get,
        getValue,
        use,
        useValue,
        add,
        remove,
        clear,
        destroy,
        //forEach,
        //forEachAsync,
        getCacheLufo: () => cacheLufo,
        getStorageLufo: () => storageLufo
    };
}

export function createLocalStorageLufo({maxKeys, maxSize, prefix, isReset}) {
    if(isReset) {
        localStorage.clear();
        localStorage.setItem(prefix, JSON.stringify({})); // meta
    }
    const storage = {
        clearMeta: () => localStorage.setItem(prefix, JSON.stringify({})),
        getMeta: (key) => JSON.parse(localStorage.getItem(prefix))[key],
        setMeta: (key, value) => {
            const meta = JSON.parse(localStorage.getItem(prefix));
            meta[key] = value;
            localStorage.setItem(prefix, JSON.stringify(meta));
        },
        setItem: (key, value) => {
            localStorage.setItem(prefix+key, JSON.stringify(value));
        },
        getItem: (key) => {
            const s = localStorage.getItem(prefix+key);
            try { return s && JSON.parse(s); } catch(e) {}
        },
        removeItem: (key) => localStorage.removeItem(prefix+key)
    };
    return createStorageLufo({maxKeys, maxSize, storage});
}

export function createRamStorageLufo({maxKeys, maxSize, prefix, load}) {
    if(load) {
        throw 'load not supported for memory';
    }
    let map = {};
    map[prefix] = {};
    const storage = {
        clearMeta: () => { map = {}; },
        getMeta: (key) => map[prefix][key],
        setMeta: (key, value) => {
            const meta = map[prefix];
            meta[key] = value;
        },
        setItem: (key, value) => { map[prefix+key] = value; },
        getItem: (key) => map[prefix+key],
        removeItem: (key) => { delete map[prefix+key] }
    };
    return createStorageLufo({maxKeys, maxSize, storage});
}

export function createStorageLufo({maxKeys, maxSize, storage}) {
    // Just like ram Lufo, but everything is saved at all times.
    function size() {
        return storage.getMeta('valueSize');
    }

    function splice(key, limit) {
        const arr = [];
        while(limit > 0) {
            const o = get(key);
            arr.push(o);
            remove(key);
            key = o.next;
            limit--;
        }
        return arr;
    }

    function pop(limit) {
        const o = first();
        if(limit > 0) {
            return o ? splice(o.key, limit) : [];
        } else if(o) {
            remove(o.key);
            return o;
        }
    }

    function first() {
        return storage.getItem(storage.getMeta('head'));
    }

    function last() {
       return storage.getItem(storage.getMeta('tail')) || storage.getItem(storage.getMeta('head'));
    }

    function length() {
        return storage.getMeta('keyCount');
    }

    function has(key) {
        return storage.getItem(key);
    }

    function get(key) {
        return storage.getItem(key);
    }

    function getValue(key) {
        const o = get(key);
        if(o) return o.value;
    }

    function prev(key) {
        return storage.getItem(storage.getItem(key).prev);
    }

    function next(key) {
        return storage.getItem(storage.getItem(key).next);
    }

    function useValue(key) {
        const o = use(key);
        if(o) return o.value;
    }

    function use(key) { // bump one step close to first
        const o = storage.getItem(key);
        if(o) {
            if(o.use < MAX_USE_COUNT /* magic value */) {
                o.use++;
            }
            const head = storage.getMeta('head'),
                  tail = storage.getMeta('tail');
            if(o.key !== head) {
                const prevObj = storage.getItem(o.prev), //|| {},
                      nextObj = storage.getItem(o.next); //|| {};
                //console.log(o);
                if(prevObj.key === head) {
                    o.prev = null;
                    storage.setMeta('head', o.key); // store head
                } else {
                    const prevPrevObj = storage.getItem(prevObj.prev);
                    prevPrevObj.next = o.key;
                    storage.setItem(prevPrevObj.key, prevPrevObj); // store prev.prev
                    //if(prevPrevObj.key === head) {
                    //    storage.setMeta('head', prevPrevObj); // store head
                    //}
                }
                o.prev = prevObj.prev;
                o.next = prevObj.key;
                storage.setItem(o.key, o); // store o
                prevObj.prev = o.key;
                if(o.key === tail) {
                    prevObj.next = null;
                    storage.setMeta('tail', prevObj.key); // store tail
                } else {
                    nextObj.prev = prevObj.key;
                    prevObj.next = nextObj.key;
                    storage.setItem(nextObj.key, nextObj); // store next
                }
                storage.setItem(prevObj.key, prevObj); // store prev
            }
        }
        return o;
    }

    function push(key, value) {
        return add(key, value, 'top');
    }

    function append(key, value) {
        const o = last();
        return o ? addNext(o.key, key, value) : add(key, value);
    }

    function add(key, value, sort) { // returns false if object was not added, arr of removed if added
        const itemObj = createItem(key, value);
        if(!itemObj) {
            return;
        }

        const o = storage.getItem(key);
        if(o) { // object already exists...
            if(sort === 'top') {
                remove(key); // ...put object on top.
            } else {
                o.value = value; // ...update its content...
                o.size = size;
                if(sort) { // ...sort it
                    if(sort === 'bubble') { // transpose
                        use(key);
                    } else {
                        throw 'bad sort';
                    }
                }
                return;
            }
        }

        // sort
        const old = storage.getItem(storage.getMeta('head')),
              headObj = itemObj;
        if(old) {
            headObj.next = old.key;
            old.prev = headObj.key;
            storage.setItem(old.key, old);
            if(!storage.getMeta('tail')) {
                //console.log('set new tail to ', old.key);
                storage.setMeta('tail', old.key);
            }
        }
        storage.setMeta('head', headObj.key);

        storage.setItem(key, headObj);
        let keyCount = storage.getMeta('keyCount') ?? 0;
        keyCount++;
        storage.setMeta('keyCount', keyCount);

        return removeOverflow(itemObj.size);
     }

    function addPrev(atKey, key, value) {
        if(atKey === key) return;
        remove(key);
        const atObj = storage.getItem(atKey);
        if(atObj) {
            const head = storage.getMeta('head');
            if(atKey === head) {
                return add(key, value, 'top');
            } else {
                const itemObj = createItem(key, value),
                      prevObj = storage.getItem(atObj.prev);
                prevObj.next = key;
                itemObj.prev = prevObj.key;
                itemObj.next = atKey;
                atObj.prev = itemObj.key;
                storage.setItem(itemObj.key, itemObj);
                storage.setItem(atObj.key, atObj);
                storage.setItem(prevObj.key, prevObj);
                storage.setMeta('keyCount', storage.getMeta('keyCount') + 1);
                return removeOverflow(itemObj.size);
            }
        }
    }

    function addNext(atKey, key, value) {
        if(atKey === key) return;
        remove(key);
        const atObj = storage.getItem(atKey);
        if(atObj) {
            const tail = storage.getMeta('tail'),
                  itemObj = createItem(key, value);
            if(!tail || atKey === tail) {
                storage.setMeta('tail', key);
            } else {
                itemObj.next = atObj.next;
                const nextObj = storage.getItem(atObj.next);
                nextObj.prev = key;
                storage.setItem(nextObj.key, nextObj);
            }
            itemObj.prev = atKey;
            atObj.next = key;
            storage.setItem(itemObj.key, itemObj);
            storage.setItem(atObj.key, atObj);
            storage.setMeta('keyCount', storage.getMeta('keyCount') + 1);
            return removeOverflow(itemObj.size);
        }
    }

    
    function addDescending(key, value, prop) {
        // TODO optimize by reducing search range, by means of adding a memory (lastDescending)
        const keyCount = length();
        const head = first();
        const v = value[prop]; //console.log('addDescending ----------------\r\n', {key, value, prop, v, head, tail});
        if(!keyCount || head.value[prop] <= v) { //console.log('will add as head. head key=', debugDumpItem(head?.key));
            // add to top beuacse if head existed it was less
            const o = add(key, value, 'top'); //console.log('added as head. head key=', debugDumpItem(head.key));
            return o;
        } else {
            const tail = last();
            if(!tail || tail.value[prop] >= v) { //console.log('will add as tail. tail key=', debugDumpItem(tail?.key), {tail});
                // add to bottom because if tail existed it was greater
                const o = append(key, value); //console.log('added as tail. tail key=', debugDumpItem(tail?.key), {tail});
                return o;
            }
        }
        // search between head and tail,
        // until finding element which is lower
        let o = head;
        while(o) { //console.log({o});
            //map[key].next;
            if(o.value[prop] <= v) break;
            o = next(o.key);
        }
        return addPrev(o.key, key, value); // has to be lower, so add before
    }

    function createItem(key, value) {
        let size;
        if(maxSize) {
            size = roughSizeOfObject(value);
            if(size > maxSize) {
                return;
            }
        }
        return {key, value, size, use: 0};
    }

    function removeOverflow(sizeIncrease) {
        // limit
        const removed = [];
        if(maxKeys) {
            const keyCount = storage.getMeta('keyCount');
            if(keyCount > maxKeys) {
                const o = remove(last().key);
                // TODO if memory do not allow for this item.value = null;
                removed.push(o);
            }
        }
        if(maxSize) {
            let valueSize = storage.getMeta('valueSize') ?? 0;
            valueSize += sizeIncrease;
            storage.setMeta('valueSize', valueSize);
            while(valueSize > maxSize) {
                valueSize = storage.getMeta('valueSize');
                const o = remove(last().key);
                // TODO if memory do not allow for this item.value = null;
                removed.push(o);
            }
        }

        return removed;
    }

    function remove(key, isDebug) {
        const o = storage.getItem(key);
        if(o) {
            let head = storage.getMeta('head'),
                tail = storage.getMeta('tail');
            const nextObj = storage.getItem(o.next),
                  prevObj = storage.getItem(o.prev),
                  isHead = head === o.key,
                  isTail = tail === o.key,
                  hasTail = nextObj;
            if(isHead) {
                if(hasTail) {
                    nextObj.prev = null;
                    storage.setItem(nextObj.key, nextObj);
                    storage.setMeta('head', nextObj.key);
                } else {
                    storage.setMeta('head', null);
                }
            } else if(isTail) {
                if(prevObj.key === head) {
                    prevObj.next = null;
                    storage.setItem(prevObj.key, prevObj);
                    storage.setMeta('tail', null);
                } else {
                    prevObj.next = null;
                    storage.setItem(prevObj.key, prevObj);
                    storage.setMeta('tail', prevObj.key);
                }
            } else {
                if(isDebug) console.log({key, prev, next});
                prevObj.next = nextObj ? nextObj.key : null;
                storage.setItem(prevObj.key, prevObj);
                if(nextObj) {
                    nextObj.prev = prevObj.key;
                    storage.setItem(nextObj.key, nextObj);
                }
            }
            storage.removeItem(key); // remove curr

            // limit
            let keyCount = storage.getMeta('keyCount');
            keyCount--;
            storage.setMeta('keyCount', keyCount);
            if(maxSize) {
                const valueSize = storage.getMeta('valueSize') - o.size;
                storage.setMeta('valueSize', valueSize);
            }

            return o;
        }
    }

    function forEach(cb) {
        let i = 0,
            head = storage.getMeta('head'),
            tail = storage.getMeta('tail'),
            curr = storage.getItem(head);
        while(curr) {
            if(cb(curr, i, curr.key === head, curr.key === tail) === false) {
                return;
            };
            curr = storage.getItem(curr.next);
            i++;
        }
    }

    function forEachAsync(cb, done, isValue) {
        let o = first();
        const step = (cb) => {
            const curr = o;
            o = next(curr.key);
            if(o) {
                cb(isValue ? curr.value : curr, step);
            } else {
                done();
            }
        };
        return step;
    }

    function clear() {
        forEach((curr) => remove(curr.key));
        storage.clearMeta();
    }

    function clone({maxKeys, maxSize, lufo}) {
        lufo = lufo ?? createLufo({maxKeys, maxSize});
        forEach(o => lufo.add(o.key, o.value));
        return lufo;
    }

    return {
        has,
        get,
        getValue,
        use,
        useValue,
        add,
        addDescending,
        push,
        remove,
        clear,
        first,
        last,
        prev,
        next,
        forEachAsync,
        size,
        length,
        forEach,
    };
}

export function createLufo({maxKeys=0, maxSize=0}) {
    //const log = function() {console.log('createLufo['+createLufo.debugCount+']', ...arguments); };
    // Least Used First Out
    //     use will make value propagate to head
    //     prev.prev...prev is head
    //     next.next...next is tail
    //     head never same as tail
    //     head can be first and last
    //     tail can only be last
    // TODO
    //      measure what takes a lot of time, and optimize
    let map = {},
        keyCount = 0,
        valueSize = 0,
        head,
        tail;

    function size() {
        return valueSize;
    }

    function splice(key, limit) {
        const arr = [];
        while(limit > 0) {
            const o = get(key);
            arr.push(o);
            remove(key);
            key = o.next;
            limit--;
        }
        return arr;
    }

    function pop(limit) {
        const o = head; 
        if(limit > 0) {
            return o ? splice(o.key, limit) : [];
        } else if(o) {
            remove(o.key);
            return o;
        }
    }

    function first() {
        return head;
    }

    function last() {
        return tail || head;
    }

    function length() {
        return keyCount;
    }

    function has(key) {
        return !!map[key];
    }

    function get(key) { //console.log('get', key, map[key]);
        return map[key];
    }

    function getValue(key) {
        const o = get(key);
        if(o) return o.value;
    }

    function prev(key) {
        return map[key].prev;
    }

    function next(key) { //console.log({key});
        return map[key].next;
     }

    function useValue(key) {
        const o = use(key);
        if(o) return o.value;
    }

    function use(key) { // bump one step close to first
        const o = map[key];
        if(o) {
            if(o.use < MAX_USE_COUNT /* magic value */) {
                o.use++;
            }
            if(o !== head) {
                const prev = o.prev,
                      next = o.next;
                if(prev === head) {
                    head = o;
                    head.prev = null;
                } else {
                    prev.prev.next = o;
                }
                o.prev = prev.prev;
                o.next = prev;
                prev.prev = o;
                if(o === tail) {
                    tail = prev;
                    tail.next = null;
                } else {
                    next.prev = prev;
                    prev.next = next;
                }
            }
        }
        return o;
    }

    function push(key, value) {
        return add(key, value, 'top');
    }

    function append(key, value) {
        const o = last(); //console.log('append', key, ' last key=', o?.key);
        return o ? addNext(o.key, key, value) : add(key, value);
    }

    function add(key, value, sort) { //console.log('add', {key, value, sort, map, has:has(key)});
        //if(!value) console.trace();
        // returns false if object was not added, arr of removed if added
        const item = createItem(key, value); //console.log({key, value, item});
        if(!item) {
            return;
        }

        const o = map[key];
        if(o) { // object already exists...
            if(sort === 'top') {
                remove(key); // ...put object on top.
            } else {
                o.value = value; // ...update its content...
                o.size = item.size;
                if(sort) { // ...sort it
                    if(sort === 'bubble') {
                        use(key);
                    } else {
                        throw 'bad sort';
                    }
                }
                return;
            }
        }

        // sort
        const old = head;
        head = item;
        if(old) {
            head.next = old;
            old.prev = head;
            if(!tail) {
                tail = old;
            }
        }

        map[key] = head;
        keyCount++;

        return removeOverflow(item.size);
    }

    function addPrev(atKey, key, value) {
        if(atKey === key) return;
        remove(key);
        const at = map[atKey];
        if(at) {
            if(at === head) {
                return add(key, value, 'top');
            } else {
                const item = createItem(key, value);
                item.prev = at.prev;
                item.prev.next = item;
                item.next = at;
                at.prev = item;
                map[key] = item;
                keyCount++;
                return removeOverflow(item.size);
            }
        }
    }

    function addNext(atKey, key, value) { //console.log('-------------->addNext', {atKey, key});
        if(atKey === key) return;
        remove(key);
        const at = map[atKey];
        const item = createItem(key, value);
        if(!tail || at === tail) {
            tail = item; //console.log('replacing tail with', {key, tail});
        } else if(at) {
            item.next = at.next;
            item.next.prev = item;
        }
        if(at) {
            item.prev = at;
            at.next = item;
        }
        map[key] = item;
        keyCount++;
        return removeOverflow(item.size);
    }

    function debugDumpItem(key) {
        const o = get(key);
        console.log({o});
        if(o) return `key=${o.key} prev=${o?.prev?.key} next=${o?.next?.key} value=${o.value}`;
    }

    function addDescending(key, value, prop) {
        // TODO optimize by reducing search range, by means of adding a memory (lastDescending)
        const v = value[prop]; //console.log('addDescending ----------------\r\n', {key, value, prop, v, head, tail});
        if(!keyCount || head.value[prop] <= v) { //console.log('will add as head. head key=', debugDumpItem(head?.key));
            // add to top beuacse if head existed it was less
            const o = add(key, value, 'top'); //console.log('added as head. head key=', debugDumpItem(head.key));
            return o;
        } else if(!tail || tail.value[prop] >= v) { //console.log('will add as tail. tail key=', debugDumpItem(tail?.key), {tail});
            // add to bottom because if tail existed it was greater
            const o = append(key, value); //console.log('added as tail. tail key=', debugDumpItem(tail?.key), {tail});
            return o;
        }
        // search between head and tail,
        // until finding element which is lower
        let o = head;
        while(o) { //console.log('v='+v, map[o.key], {map});
            //map[key].next;
            if(o.value[prop] <= v) break;
            o = next(o.key);
        }
        return addPrev(o.key, key, value); // has to be lower, so add before
    }

    function createItem(key, value) {
        if(!key) throw 'bad key. key= ' + key;
        let size;
        if(maxSize) {
            size = roughSizeOfObject(value);
            if(size > maxSize) {
                return;
            }
        }
        return {key, value, size, use: 0};
    }

    function removeOverflow(sizeIncrease) {
        // limit
        let removed = [];
        if(maxKeys) {
            if(keyCount > maxKeys) {
                removed.push(remove(last().key));
            }
        }
        if(maxSize) {
            valueSize += sizeIncrease;
            while(valueSize > maxSize) {
                removed.push(remove(last().key));
            }
        }

        return removed;
    }

    function remove(key, isDebug) { //log('remove', {key, map});
        const o = map[key];
        if(o) {
            const next = o.next,
                  prev = o.prev,
                  isHead = head === o,
                  isTail = tail === o,
                  hasTail = next;
            if(isHead) {
                if(hasTail) {
                    head = next;
                    head.prev = null;
                } else {
                    head = null;
                }
            } else if(isTail) {
                if(prev === head) {
                    tail = null;
                    head.next = null;
                } else {
                    tail = prev;
                    tail.next = null;
                }
            } else {
                //if(isDebug) console.//log({key, prev, next});
                prev.next = next;
                next.prev = prev;
            }
            delete map[key];

            // limit
            keyCount--;
            if(maxSize) {
                valueSize -= o.size;
            }

            return o;
        }
    }

    function forEachValue(startIndex, cb, arr) { //console.log('---------------------------');
        return forEach(startIndex, cb, true, arr);
    }

    function forEach(startIndex, cb, isValue, arr) { //log('forEach', {map, length:length()});
        let i = 0,
            curr = head; //console.log({i, curr, arr});
        while(curr) { //console.log(i, startIndex);
            if(i >= startIndex) {
                let v = cb(isValue ? curr.value : curr, i, curr === head, curr === tail);
                if(v === false) break;
                if(arr && v) arr.push(v);
            }
            curr = curr.next;
            i++;
        }
        return arr;
    }

   function forEachAsync(done, isValue) {
        let o = first();
        const step = () => {
            const curr = o;
            o = next(curr.key);
            if(o) {
                cb(isValue ? curr.value : curr, step);
            } else {
                done();
            }
        };
        return step;
    }

    function clone({maxKeys, maxSize, lufo}) {
        lufo = lufo || createLufo({maxKeys, maxSize});
        forEach(o => lufo.add(o.key, o.value));
        return lufo;
    }

    function clear() { //console.log('clear', {map, head, tail});
        map = {};
        keyCount = 0;
        valueSize = 0;
        head = null;
        tail = null;
    }

    function destroy() {
        clear();
    }

    return {
        has,
        get,
        getValue,
        use,
        useValue,
        add,
        addDescending,
        push,
        remove,
        first,
        last,
        prev,
        next,
        size,
        length,
        forEach,
        forEachValue,
        forEachAsync,
        clear,
        destroy,
        debug: {
            map
        }
     };
}

(function(){
    console.log('test lufo');
    let LOG,
        lufo;
    function dump(s, l) {
        l = l || lufo;
        if(LOG > 1) {
            console.log(s);
            l.forEach((o, i, isHead, isTail) => console.log(i, o,
                o.prev ? 'prev='+(o.prev.key || o.prev) : 'head='+isHead,
                o.next ? 'next='+(o.next.key || o.next) : 'tail='+isTail));
        }
    }
    function assert(o, expected, propName) {
        const found = propName ? o.value[propName] : o.value;
        if(found !== expected) {
            console.log('ASSERTION ERROR LUFO', {expected, found, o})
            throw 'bad lufo assert';
        };
    }
    function create(creator, nbrObjects, {maxKeys, maxSize}) {
        lufo = creator({maxKeys, maxSize});
        for(let i = 0; i < nbrObjects; i++) {
            lufo.add('k'+i, 'v'+i);
        }
    }
    function test(creator, expectedSize) {
        create(creator, 4, {}); dump('after init get,first,last,add,use');
        assert(lufo.get('k'+0), 'v'+0);
        assert(lufo.get('k'+2), 'v'+2);
        assert(lufo.first(), 'v'+3);
        assert(lufo.last(), 'v'+0);
        lufo.add('k'+1, 'v'+1);                 dump('after add k1 no sort');
        lufo.add('k'+1, 'v'+1);                 dump('after add k1 no sort');
        assert(lufo.prev(lufo.last().key), 'v'+1);
        lufo.push('k'+1, 'v'+1);                dump('after add k1 sort by top');
        assert(lufo.prev(lufo.last().key), 'v'+2);
        assert(lufo.first(), 'v'+1);
        lufo.add('k'+2, 'v'+2, 'bubble');       dump('after add k2 sort by bubble');
        assert(lufo.next(lufo.first().key), 'v'+2);
        lufo.use('k'+2, 'v'+2, 'bubble');       dump('after use k2 - bubble ');
        assert(lufo.first(), 'v'+2);
        assert(lufo.next(lufo.first().key), 'v'+1);
        lufo.use('k'+2, 'v'+2, 'bubble');       dump('after use k2 - already on top');
        assert(lufo.first(), 'v'+2);
        lufo.use('k'+0, 'v'+0, 'bubble');       dump('after use k0');
        assert(lufo.last(), 'v'+3);
        assert(lufo.prev(lufo.last().key), 'v'+0);
        lufo.clear();

        create(creator, 3, {maxKeys: 2}); dump('test max nbr keys');
        assert({value: lufo.length()}, 2);
        assert(lufo.first(), 'v'+2);
        assert(lufo.last(), 'v'+1);
        lufo.clear();

        create(creator, 30, {maxSize: 150}); dump('test max size');
        assert({value: lufo.size()}, expectedSize);
        lufo.clear();

        create(creator, 2, {}); dump('test remove tail');
        lufo.remove('k'+0); dump('after remove k0');
        assert({value: lufo.length()}, 1);
        lufo.remove('k'+1); dump('after remove k1');
        assert({value: lufo.length()}, 0);
        lufo.clear();

        dump('test descending');
        create(creator, 0, {});
        lufo.addDescending('k'+1, {v:'v'+1, p: 1}, 'p');
        assert(lufo.first(), 'v'+1, 'v');
        lufo.addDescending('k'+2, {v:'v'+2, p: 2}, 'p');
        assert(lufo.first(), 'v'+2, 'v');
        assert(lufo.last(), 'v'+1, 'v');
        lufo.addDescending('k'+3, {v:'v'+3, p: 3}, 'p');
        assert(lufo.first(), 'v'+3, 'v');
        assert(lufo.last(), 'v'+1, 'v');
        lufo.addDescending('k'+4, {v:'v'+4, p: 4}, 'p');
        assert(lufo.first(), 'v'+4, 'v');
        assert(lufo.last(), 'v'+1, 'v');
        lufo.clear();
        create(creator, 0, {});
        lufo.addDescending('k'+4, {v:'v'+4, p: 4}, 'p');
        lufo.addDescending('k'+2, {v:'v'+2, p: 2}, 'p');
        assert(lufo.first(), 'v'+4, 'v');
        assert(lufo.last(), 'v'+2, 'v');
        lufo.addDescending('k'+3, {v:'v'+3, p: 3}, 'p');
        assert(lufo.first(), 'v'+4, 'v');
        assert(lufo.last(), 'v'+2, 'v');
        assert({value: lufo.length()}, 3);
        lufo.addDescending('k'+1, {v:'v'+1, p: 1}, 'p');
        assert(lufo.last(), 'v'+1, 'v');
        assert({value: lufo.length()}, 4);
        lufo.addDescending('k'+5, {v:'v'+5, p: 5}, 'p');
        assert(lufo.first(), 'v'+5, 'v');
        for(let i = 5, k = lufo.first().key; i >= 1; i--, i > 0 && (k = lufo.next(k).key)) assert({value: lufo.getValue(k)}, 'v'+i, 'v');
        lufo.addDescending('k'+6, {v:'v'+5, p: 5}, 'p');
        lufo.addDescending('k'+7, {v:'v'+4, p: 4}, 'p');
        lufo.addDescending('k'+8, {v:'v'+0, p: -1}, 'p');
        assert({value: lufo.first().key}, 'k6');
        assert(lufo.first(), 'v'+5, 'v');
        assert(lufo.last(), 'v'+0, 'v');
        lufo.clear();
    }

    // test: memory lufo
    LOG = 1;
    test(({maxKeys, maxSize}) => {
        return createLufo({maxKeys, maxSize});
    }, 148);

    // test: localstorage lufo
    LOG = 1;
    test(({maxKeys, maxSize}) => {
        //localStorage.clear(); // should not be needed (test-cases clear themselves)
        return createLocalStorageLufo({maxKeys, maxSize, prefix: 'test', isReset: true})
    }, 144);

    // test: combine mem and localstorage
    LOG = 1;
    lufo = createCachedStorageLufo({maxKeys: 5, storageLufo: createLocalStorageLufo({maxKeys: 10, prefix: 'test'})});
    for(let i = 0; i < 10; i++) {
        lufo.add('k'+i, 'v'+i);
    }
    dump('after initial, cacheLufo=', lufo.getCacheLufo());
    dump('after initial, storageLufo=', lufo.getStorageLufo());
    assert({value: lufo.getCacheLufo().length()}, 0);
    assert({value: lufo.getStorageLufo().length()}, 10);
    lufo.use('k5');
    assert({value: lufo.getCacheLufo().length()}, 1);
    assert(lufo.getCacheLufo().first(), 'v5');
    assert(lufo.getStorageLufo().first(), 'v9');
    lufo.use('k8');
    assert(lufo.getCacheLufo().first(), 'v8');
    assert(lufo.getStorageLufo().first(), 'v8');
    lufo.remove('k8');
    dump('after remove k8, cacheLufo=', lufo.getCacheLufo());
    dump('after remove k8, storageLufo=', lufo.getStorageLufo());
    assert(lufo.getCacheLufo().last(), 'v5');
    assert(lufo.getStorageLufo().first(), 'v9');
    assert({value: lufo.getCacheLufo().get('k7')}, undefined);
    assert(lufo.getStorageLufo().get('k7'), 'v7');
    lufo.clear();

    LOG = 1;
    lufo = createCachedStorageLufo({maxKeys: 5, storageLufo: createRamStorageLufo({maxKeys: 10, prefix: 'test'})});
    for(let i = 0; i < 10; i++) {
        lufo.add('k'+i, 'v'+i);
    }
    dump('after initial, cacheLufo=', lufo.getCacheLufo());
    dump('after initial, storageLufo=', lufo.getStorageLufo());
    assert({value: lufo.getCacheLufo().length()}, 0);
    assert({value: lufo.getStorageLufo().length()}, 10);
    lufo.use('k5');
    assert({value: lufo.getCacheLufo().length()}, 1);
    assert(lufo.getCacheLufo().first(), 'v5');
    assert(lufo.getStorageLufo().first(), 'v9');
    lufo.use('k8');
    assert(lufo.getCacheLufo().first(), 'v8');
    assert(lufo.getStorageLufo().first(), 'v8');
    lufo.remove('k8');
    dump('after remove k8, cacheLufo=', lufo.getCacheLufo());
    dump('after remove k8, storageLufo=', lufo.getStorageLufo());
    assert(lufo.getCacheLufo().last(), 'v5');
    assert(lufo.getStorageLufo().first(), 'v9');
    assert({value: lufo.getCacheLufo().get('k7')}, undefined);
    assert(lufo.getStorageLufo().get('k7'), 'v7');
    lufo.clear();
})();

