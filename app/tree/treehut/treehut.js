// fix
// refactor
//
/*
 * v0.0.1-1
 * Treehut - App client (client(example: browser)+host(exampe:nodejs)) - Treenet
 * Light client that offers graphical user interaction with content on Treenet.
 * Depends on a host running Grapevine for serving content.
 */
let DEBUG_AUTOGENERATE_TREE = 4; /* those NOT autogenerating will not start server either */;
let DEBUG_AUTOGENERATE_THEN_GO = false;// TODO improve debug

const WIDTH = 360,
      HEIGHT = 640;

import {CANOPY_UPDATED} from '../canopy/canopy.js';
import {createStage} from './stage.js';

export function createTreehut(root, ß, log) {
    const ooptions = {
        debugRoute: 10,
        globalProps: {ß, log}
    };
    const {oo, on, $:{$, set, drop, prepend, push}} = OO(root, undefined, undefined, ooptions)('div'),
          treehut = oo(Treehut);
    createStage(treehut, ß, log);

    //  DEV: start balloon list
    setTimeout(() => {
        while(DEBUG_AUTOGENERATE_TREE > 0) {
            DEBUG_AUTOGENERATE_TREE--;
            ß.canopy.on(CANOPY_UPDATED, (data) => { //log('--- Mockup tree ---');
                if(DEBUG_AUTOGENERATE_THEN_GO) {
                    ß.canopy.eachTopmost(({cardNode, score}, i) => {
                        if(i === 0) oo.go(`/card/${cardNode.card.data.sha256}`);
                    });
                }
            });
            //console.log('asdadjwihfewhiufewhiuefwuhifewuhifewuih', DEBUG_AUTOGENERATE_TREE);
            ß.canopy.debug.createMockupTree()();
            //ß.grapevine.getUploadManager().start({
            //    timeslotDurationMs: 1000 * Math.ceil(  (Math.random() * ß.config.UPLOAD_INTERVAL_SECONDS) + (ß.config.UPLOAD_INTERVAL_SECONDS*0.5)  ),
            //    delayStartMs: 1000, uploadQuota: ß.config.UPLOAD_QUOTA
            //});
            //ß.grapevine.getCardTalk().startDownloadManager({internvalMs: 1000 * 3});
        }
    }, 200);
    //  DEV: end balloon list

    return treehut;
};

function createRootstyle(oo) {
    oo.stylesheet(`
    :root {
        /* app */
        --widthfull: ${WIDTH}px;
        --heightfull: ${HEIGHT}px;
        --heightballoon: ${HEIGHT*0.22}px;
        /*--transition: 2s;*/
        --transition: 0.15s;
        /* colors */
        --grayspace: #202020;
        --graydark: #2e2e2eff;
        --graymedium: #323232;
        --graylight: #343434;
        --whitelight: #f0f0f0;
        /* tugs */
        --barthick: 50px;
        --barthin: 25px;
        /* layers */
        --ztree: 100;
        --ztreebar: 110;
        --zdashboard: 200;
        --zfollowing: 325;
        --zfollowingbar: 326;
        --zsigners: 325;
        --zsignersbar: 326;
        --zsigner: 400;
        --zprofile: 500;
        --zcompose: 600;
        --zsettings: 700;
    }

    Button {
        cursor: pointer;
        border: 0;
        color: inherit;
        padding: inherit;
        border-radius: inherit;
        background-color: inherit;
    }

    .show {
        visibility: visible;
    }

    .hide {
        visibility: hidden;
    }
   `, 'Root');
}

function Treehut(oo) {
    createRootstyle(oo);
    oo.stylesheet(`
    Treehut {
        position: relative;
        overflow: hidden;
        margin: 0;
        margin-top: 0;
        height: var(--heightfull);
        background-color: var(--graydark);
        color: #ffffec;
        display: block;
    }
    `);
}

 
// * https://www.toptal.com/designers/htmlarrows/symbols/
// *      star: &#9734;
// *      ballotbox: &#9744;  &#9745;     &#9746;
// *      shamrock:   &#9752;
// *      biohazard:  &#9763;    
// *      ying yang: &#9775;
// *      heart: &#9825;
// *      flag: &#9872;
// *      gear: &#9881;
// *      warning: &#9888;
// *      refresh: &#10227;
// *      <: &#10094;     &#8592;                 &#8678; &#8679; &#8680;             &#8681;
// *                                              &#8592; &#8593; &#8594;
// *                                              &#60;           &#62;       &#128770;
// *      >: &#10095;     &#8594;
// *
// *
// 
