/*
 * v0.0.1-1
 * Signers - Treehut - Treenet
 */
import {createVeritcalList} from './infinite-list.js';
import {Icon} from './icon.js';
import {Bar} from './bar.js';

export function Signers({oo, css, go}, {ß, close, log}) {                       log?.n(0, 'create Signers');
    css(`
    Signers {
        z-index: var(--zsigners);
        display: block;
        overflow: hidden;
        position: absolute;
        width: var(--widthfull);
        height: var(--heightfull);
        /*background-color: var(--darkgray);*/
        background-color: var(--graylight);
    }

    Signers Row {
        background-color: #f0f;
        height: 10%;
        width: var(--widthfull);
        position: absolute;
        left: 0;
    }

    Signers Bar {
        z-index: var(--zsignersbar);
    }

    `);

    //const o = signersId ? ß.signers.get(signersId) : ß.signers.getDefaultSigners();
    oo(Signersbar, {close});
    oo('h1', 'Signers');
    oo('br')._('br');
    oo('button', 'close').onclick(() => {
        close();
        //go.back();
    });

    const
        verticalList = createVeritcalList(oo);

    const signers = [];
    ß.canopy.eachSignerProxy(0, (o) => {
        signers.push(o); //go(`/signer/${pub}`); const pub = o.getPublicKey(); 
    });


    function createRow(oo, index) {
        const signer = signers[index];
        if(signer) {
            return oo(Row, {signer});
        }
    }

    //const removeCanopyUpdatedListener = ß.canopy.on(CANOPY_UPDATED, () => {
        verticalList.init(createRow, true);
    //});
    //oo.onDestroy(() => {
    //    removeCanopyUpdatedListener();
    //});
    OO.gesture.scrollWheel(oo, event => verticalList.scrollY(event.deltaY));

};

function Row({oo, go}, {signer}) {
    oo('span', 'pubkey' + signer.getPublicKey()).onclick(() => {
        const pub = signer.getPublicKey(); 
        go(`/signer/${pub}`);
    });
}

function Signersbar({oo, css, on, go, x, $:{$, set}}, {close}) {
    oo = oo(Bar);
    //const backBtn = oo('div')(Icon, {i:'&#8592;'}).onclick(() => set(STAGE_CARD_NAV, 'back'));
    //const forwardBtn = oo('div')(Icon, {i:'&#8594;'}).onclick(() => set(STAGE_CARD_NAV, 'forward'));
    oo('div')(Icon, {i:'&#9744;'}).onclick(() => close()); //.onclick(x('onBack'));
    //oo('div')(Icon, {i:''}); // 4
    //oo('div')(Icon, {i:''}); // 5

    //const updateNavHistory = () => {
    //    const card = $(STAGE_CARD),
    //          history = card.history; //console.log(card.index, card.history.length);
    //    if(!(card.index >= 1)) backBtn.classList({add:'disabled'});
    //    else backBtn.classList({remove:'disabled'});
    //    if(card.history.length > 0 && card.index+1 < card.history.length) forwardBtn.classList({remove:'disabled'});
    //    else forwardBtn.classList({add:'disabled'});
    //};
    //on(STAGE_CARD_ROUTE, (r) => updateNavHistory());
    //on(STAGE_CARD_NAV, {when:['back','forward']}, nav => {
    //    const card = $(STAGE_CARD),
    //          history = card.history,
    //          cardId = history[card.index];
    //    let isGo;
    //    if(nav === 'back' && card.index > 0) {
    //        card.index--;
    //        isGo = true;
    //    } else if(nav === 'forward' && card.index+1 < history.length) {
    //        card.index++;
    //        isGo = true;
    //    }
    //    if(isGo) {
    //        go('/card/' + history[card.index], undefined, {dontPushHistory: true});
    //    }
    //});
}


