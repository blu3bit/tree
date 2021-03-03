/*
 * A Profile is a Signer with a private key.
 * TODO
 *      a profile should be able to have many private keys and derivatives of a master key,
*/
//import {normCardLevel} from '../norm.js';

import {createUid} from './utils.js';

export function createProfileStorage({ß, log}) {

    let defaultProfileId;

    const
        lufo = ß.storage.createLufo({name: 'profiles', type: ß.storage.CACHED, log});

    function create({desc, priv, pub}) {
        const
            id = createUid(pub),
            o = {
                id,             // unique
                desc,           // human friendly
                priv,
                pub

            };
        return new Profile(o);
    }

    function Profile(o) {                                           log('new Profile', {o});
        this.o = o;
    }
    Profile.prototype.getId = function() {
        return this.o.id;
    };
    Profile.prototype.setId = function(v) {
        this.o.id = v;
    };
    Profile.prototype.getPublicKey = function() {
        return this.o.pub;
    };
    Profile.prototype.getPrivateKey = function() {
        return this.o.priv;
    };
    Profile.prototype.getDescription = function() { //console.log(this.o);
        return this.o.desc;
    };
    Profile.prototype.setDescription = function(v) {
        this.o.desc = v;
    };
    Profile.prototype.setAsDefault = function() {
        setDefaultProfile({id: this.o.id});
        return this;
    };
    Profile.prototype.save = function() {
        this.o = add(this.o);
        const signature = 'TODOsign'; // TODO sign
        ß.canopy.addSigner({
            data: {
                desc: this.o.desc,
                pub: this.o.pub,
                ms: Date.now()
            },
            signature
        });
        return this;
    };
    Profile.prototype.destroy = function() {
        remove(this.o.id);
        this.o = null;
    };

    function add(o) {                                   //log&&log.n(2, 'ad');
        lufo.add(o.id, o);                              //log?.n(10, `-profile does ${!lufo.has(id)?'NOT':''} exists`); 
        return o;
    }

    function get(id) {
        const o = lufo.getValue(id);                    //console.log('get', id, o);
        return new Profile(o);
    }

    function use(id, sort) {
        const o = lufo.useValue(id, sort);
        return new Profile(o);
    }

    function each(cb) {                                     //console.warn('forEach', length());
        lufo.forEach(0, ({value}, i) => {                           //log('--->', value, i);
            return cb(new Profile(value), i);
        });
    }

    function remove(id) {
       lufo.remove(id);
    }

    function clear() { //console.log('clear', lufo.debugName, lufo.length());
        lufo.clear();
    }

    function has(id) {
        return !!get(id); // TODO optmz, lufo have to know about placeholders and non-placeholders
    }

    function length() {
        return lufo.length();
    }

    function setDefaultProfile({id, profile}) {
        defaultProfileId = id || profile.getId();
    }

    function getDefaultProfile() {
        return get(defaultProfileId);
    }

    return {
        setDefaultProfile,
        getDefaultProfile,
        create,
        has,        //
        add,        //
        each,       //
        get,        //
        use,        //
        //remove,     //
        length,     //
        clear,      //storages
        debug: {
            lufo
        }
    };
}

