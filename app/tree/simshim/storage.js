import {createLufo as createDefaultLufo} from '../lufo.js';

export function createStorage({log}) {                              //log(0, 'createStorage');

    const
        PERMANENT = 'PERMANENT',
        lufos = {};
        //db = {};

    //function createDatabase({name, type}) {
    //    log?.n(1, `creating database: ${name}`);
    //    if(!name) throw `bad name. name=${name}`;
    //    else if(db[name]) throw `database already exists. name=${name}`;
    //    switch(type) {
    //       default:
    //            db[name] = {};
    //    }
    //    return db[name];
    //}
    //function getOrCreateDatabase({name, type}) {
    //    return db[name] || createDatabase({name, type});
    //}

    function createLufo({name, type, config={}}) { //console.log(...arguments);
        log?.n(1, `creating lufo: ${name}`);
        if(!name) throw `bad name. name=${name}`;
        else if(lufos[name]) throw `lufo already exists. name=${name}`;
        let lufo;
        switch(type) {
            // TODO
            //case 'cached':
            //    lufo = createCachedStorageLufo,,,,
            //case PERMANENT:
            //    lufo = createLocalStorageLufo(config);
            //    break;
            default:
                lufo = createDefaultLufo(config);
        }
        lufos[name] = lufo;
        return lufo;
    }

    function getOrCreateLufo({name, type, config}) {
        return lufos[name] || createLufo({name, type, config});
    }

    function getLufo(name) {
        return lufos[name];
    }

    function removeLufo(name) {
        let lufo = lufos[name];
        if(lufo) lufo.destroy();
        delete lufos[name];
    }

    return {
        //createDatabase,
        //getOrCreateDatabase,
        createLufo,
        getOrCreateLufo,
        getLufo,
        removeLufo,
        PERMANENT
    };
};

