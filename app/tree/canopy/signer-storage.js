/*
 * Store card signers.
 * Does _not_ store signers with privkeys.
 */
//import {normCardLevel} from '../norm.js';

export function createSignerStorage({ß, log}) {

    const
        LUFO_PREFIX = 'signerstorage:',
        getLufo = (name) => ß.storage.getLufo(LUFO_PREFIX + name),
        getOrCreateLufo = (name, o={}) => ß.storage.getOrCreateLufo({log, ...o, name: LUFO_PREFIX + name, type: ß.storage.PERMANENT}),
        signersLufo = getOrCreateLufo('signers');

    function addCard(card) {
        const {pub, sha256, ms} = card.data;                        //log?.n(0, '---->', {pub, sha256, ms});
        if(!signersLufo.has(pub)) {
            // foreign signer, so add it
            const node = createSignerNode({pub});
            addSignerNode(pub, node);
        }
        const lufo = getOrCreateLufo(pub); // note: if not found, will create lufo dedicated to signer
        lufo.addDescending(sha256, {sha256, ms}, 'ms');
    }

    function SignerProxy(pub, node, sort) {
        if(node) {
            this.node = node;
            pub = node.signer.data.pub;
        } else if(pub) {
            if(sort) {
                this.node = signersLufo.useValue(pub, sort);
            } else {
                this.node = signersLufo.getValue(pub);
            }
        } else {
            log.e(...arguments);
            throw `bad args.`;
        }
        this.lufo = getOrCreateLufo(pub);
    }
    SignerProxy.prototype.destroy = function() {
        remove(this.node.signer.data.pub);
    };
    //SignerProxy.prototype.save = function() {
    //    this.node = createSignerNode({node: this.node});
    //    addSignerNode(null, this.node);
    //};
    SignerProxy.prototype.getPublicKey = function() {
        return this.node.signer.data.pub;
    };
    SignerProxy.prototype.getDescription = function() {
        return this.node.signer.data.desc;
    };
    SignerProxy.prototype.getSignedMillis = function() {
        return this.node.signer.data.ms;
    };
    SignerProxy.prototype.getFirstCard = function() {
        const first = this.lufo.first();
        if(first) { console.log({first})
            return ß.canopy.getCard(first.value.sha256);
        }
    };
    SignerProxy.prototype.getPrevCard = function(sha256) {
        const prev = this.lufo.prev(sha256);
        if(prev) {
            return ß.canopy.getCard(prev.value.sha256);
        }
    };
    SignerProxy.prototype.getNextCard = function(sha256) {
        const next = this.lufo.next(sha256);
        if(next) {
            return ß.canopy.getCard(next.value.sha256);
        }
    };
    SignerProxy.prototype.getCardLength = function() {
        return this.lufo.length();
    };
    //SignerProxy.prototype.asJson = function() {
    //    return JSON.stringify(this.node.signer);
    //};

    function addSigner(signer) {                                   log?.n(0, 'addSigner', signer);
        if(signer.data.priv) throw `not allowed. signer has privkey: ${signer.data.priv}`;
        // verify integrity
        const {pub} = signer.data;
        let node = signersLufo.getValue(pub);                      log?.n(10, `-signer does ${!signersLufo.has(pub)?'NOT':''} exists`);
        if(node) node.signer = signer;
        else node = createSignerNode({signer});
        addSignerNode(pub, node);
        return grabProxy(pub);
    }

    function addSignerNode(pub, node) {
        signersLufo.add(pub ? pub : node.signer.data.pub, node);
    }

    function getSigner(pub) {
        const node = signersLufo.getValue(pub);
        if(node) return node.signer;
    }

    function grabNode(pub, sort) {
        const o = signersLufo.getValue(pub);
        //console.log('getSigner', o);
        return o; // TODO add sort
    }

    function grabProxy(pub, sort) {
        return new SignerProxy(pub, null, sort);
    }

    function eachProxy(startIndex, cb) {
        eachNode(startIndex, (o, i) => cb(new SignerProxy(o.signer.data.pub), i));
    }

    function eachNode(startIndex, cb) {  //console.log('forEach', signersLufo.debugName, signersLufo.length(), length());
        signersLufo.forEach(startIndex, ({value}, i) => { //log(value);
            return cb(value, i);
        });
    }

    function remove(pub) {
        signersLufo.remove(pub);
        const lufo = getOrCreateLufo(pub);
        lufo.destroy();
    }

    //function clear() { //console.log('clear', signersLufo.debugName, signersLufo.length());
    //    each(0, ({pub}) => {
    //        const lufo = getOrCreateLufo(pub);
    //        lufo.clear();
    //    });
    //    signersLufo.clear();
    //}

    //function has(pub) {
    //    return !!get(pub); // TODO optmz, signersLufo have to know about placeholders and non-placeholders
    //}

    function length() {
        return signersLufo.length();
    }

    return {
        // card
        addCard,
        // signer
        addSigner,
        getSigner,
        grabNode,
        grabProxy,
        eachProxy,
        eachNode,
        remove,
        length,
        debug: {
            signersLufo
        }
    };
}

export function createSignerNode({node, signer, pub, desc, ms, signature}) {
    //console.log('createSignerNode', {signer, pub, desc, ms, priv});
    if(node) signer = node.signer;
    if(signer) {
        if(pub || desc || ms) throw 'bad arg.';
        const {data} = signer;
        pub = data.pub;
        desc = data.desc;
        ms = data.ms;
    }
    // TODO 
    //      verify props
    //      verify consensus
    const o = {
        ...node, // TODO verify node
        signer: {
            data: {
                pub,
                desc,
                ms
            },
            signature
        }
    };
    return o;
};

