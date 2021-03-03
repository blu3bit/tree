/*
 * v0.0.1-1
 * Signer - Treehut - Treenet
 */

import {CANOPY_ADD_SIGNER, CANOPY_FOLLOW_SIGNER} from '../canopy/canopy.js';
import {SignerCards} from './signer-cards.js';

function createController(controller) {
    controller?.abort?.();
    controller = {
        ondemand: true
    };
    return controller;
}

export function Signer({oo, css, go}, {ß, close, signerId, log}) {                       log?.n(0, 'create Signer');
    css(`
    Signer {
        z-index: var(--zsigner);
        position: absolute;
        width: 100%;
        transition: 0.1s linear;
        height: calc(var(--heightfull) + var(--barthin));
        /*background-color: #0f0;*/
        background-color: var(--graylight);
    }
    `);
    oo('h1', 'SignerId: ' + signerId);
    oo('br');
    let o = ß.canopy.grabSignerProxy(signerId, 'bubble');
    oo('span', `pub ${o.getPublicKey()}`)('br');
    const descSpan = oo('span', `desc ${o.getDescription()}`);
    oo('br');
    oo('br');
    oo('br');
    const followBtn = oo('button', 'FOLLOW').onclick(async () => {
        if(ß.canopy.isFollowingSigner({pub: signerId})) {
            ß.canopy.unfollowSigner({pub: signerId});
        } else {
            ß.canopy.followSigner({pub: signerId});
        }
    });
    followBtn.style({color: ß.canopy.isFollowingSigner({pub: signerId}) ? '#0f0' : '#999'});
    oo('br');
    oo('br');
    let controller;
    oo('button', 'DOWNLOAD: SIGNER DATA').onclick(async () => {
        ß.grapevine.getPeerProxies().each(async peerProxy => {
            controller = createController(controller);
            await ß.grapevine.getSignerTalk().retrieveSignersAsync({peerProxy, pubs: [signerId], controller}).catch(log?.c);
        });
        //go.back();
    });
    oo('br');
    oo('button', 'DOWNLOAD: SIGNER CARDS').onclick(async () => {
        ß.grapevine.getPeerProxies().each(async peerProxy => {
            controller = createController(controller);
            await ß.grapevine.getSignerTalk().retrieveSignerCardsAsync({peerProxy, pub, controller});
        });
        //go.back();
    });
    oo('br');
    oo('br');
    oo('button', '< - BACK ').onclick(() => {
        controller?.abort?.(); // retrieval will set abort
        close();
        //go.back();
    });
    const removeSignerCardsener = ß.canopy.on(CANOPY_ADD_SIGNER + '/' + signerId, (signerProxy) => {
        descSpan.text(signerProxy.getDescription());
    });
    const removeFollowSignerCardsener = ß.canopy.on(CANOPY_FOLLOW_SIGNER + '/' + signerId, () => {
        followBtn.style({color: ß.canopy.isFollowingSigner({pub: signerId}) ? '#0f0' : 'fff'});
    });

    oo.onDestroy(() => {
        removeSignerCardsener();
        removeFollowSignerCardsener();
    });

    oo('br');
    oo('br');
    oo('button', 'OPEN SIGNER CARD LIST').onclick(() => {
        oo(SignerCards, {signerId});
    });
};

