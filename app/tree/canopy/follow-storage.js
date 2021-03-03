export function createFollowStorage({ß, log}) {

    const
        LUFO_PREFIX = 'followstorage:',
        getLufo = (name) => ß.storage.getLufo(LUFO_PREFIX + name),
        getOrCreateLufo = (name, o={}) => ß.storage.getOrCreateLufo({log, ...o, name: LUFO_PREFIX + name, type: ß.storage.PERMANENT}),
        //treeLufo = getOrCreateLufo('tree'),
        signerLufo = getOrCreateLufo('signer');

    function addSigner({signer, pub}) {                 log?.n(0, {signer, pub});
        if(!pub) {
            pub = signer.data.pub;
        }
        signerLufo.add(pub, pub); //console.log({pub});
        return pub;
    }

    function hasSigner({signer, pub}) {
        if(!pub) {
            pub = signer.data.pub;
        }
        return signerLufo.has(pub);
    }

    function eachSigner(cb) {
        signerLufo.forEachValue(0, cb);
    }

    function removeSigner({signer, pub}) {
        if(!pub) {
            pub = signer.data.pub;
        }
        signerLufo.remove(pub);
        return pub;
    }

//    function getSigner(pub) {
//        const o = signerLufo.getValue(pub); //console.log('get', pub, o);
//        return o;
//    }
//
//    function useSigner(pub, sort) {
//        return signerLufo.useValue(pub, sort);
//    }
//
//    function eachSigner(startIndex, cb) {  //console.log('forEach', followsLufo.debugName, followsLufo.length(), length());
//        signerLufo.forEach(startIndex, ({value}, i) => { //log(value);
//            return cb(value, i);
//        });
//    }
//
//    //function clearSigners() { //console.log('clear', followsLufo.debugName, followsLufo.length());
//    //    signerLufo.clear();
//    //}
//
//    //function lengthSingers() {
//    //    return signerLufo.length();
//    //}
//
    return {
        addSigner,
        hasSigner,
        removeSigner,
        eachSigner
//        getSigner,
//        useSigner,
//        removeSigner,
//        clearSigners,
//        lengthSingers,
//        debug: {
//            signerLufo
//        }
    };
};

