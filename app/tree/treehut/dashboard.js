import {CANOPY_UPDATED} from '../canopy/canopy.js';
import {createVeritcalList, createHorizontalList} from './infinite-list.js';
import {Icon} from './icon.js';
import {Bar} from './bar.js';
import {STAGE_CARD_ROUTE} from './stage.js';

const
    X_DURATION = 350, // TODO swipe speed
    ITEM_WIDTH = 200, // TODO
    ROW_HEIGHT = 150, // TODO
    ROW_MARGIN = 20, // TODO
    ITEM_MARGIN = 20; // TODO

export function Dashboard({oo, css, go}, {ß}) { //console.log('DASHBOARD', canopy);
    css(`
    Dashboard {
        z-index: var(--zdashboard);
        position: absolute;
        width: 100%;
        transition: 0.1s linear;
        height: calc(var(--heightfull) + var(--barthick));
        /*background-color: #0f0;*/
        background-color: var(--graylight);
    }

    `);
    oo(Explorer);
    oo(DashboardBard);
};

export function Explorer({oo, css}, {ß, log}) {
    css(`
    Explorer {
        display: block;
        overflow: hidden;
        position: absolute;
        width: var(--widthfull);
        height: var(--heightfull);
        /*background-color: var(--darkgray);*/
        background-color: #550;
    }

    Explorer Panel,Devpanel {
        background-color: #f0f;
        width: var(--widthfull);
        position: absolute;
        left: 0;
    }

    Explorer Row {
        background-color: #f0f;
        height: ${ROW_HEIGHT};
        width: var(--widthfull);
        position: absolute;
        left: 0;
    }

    Explorer Row ArrowIcon {
        /*background-color: #f0f;*/
        z-index: calc(var(--zdashboard) + 1);
        display: flex;
        height: var(--heightballoon);
        align-items: center;
        text-align: center;
        position: absolute;
        color: var(--grayspace);
        font-size: 36px;
    }

    Explorer Row ArrowIcon:hover {
        color: var(--whitelight);
    }

    Explorer Row CardItem,SignerItem {
        /*background-color: #0f0;*/
        overflow: hidden;
        position: absolute;
        color: #f0f0f0;
        width: ${ITEM_WIDTH}px;
        height: var(--heightballoon);
        display: grid;
        grid-template-columns: ${40}px calc(var(--widthfull) - 80px) ${40}px;
    }

    Explorer Row CardItem,SignerItem .middle {
        overflow: hidden;
        border-radius: 3px;
        padding: 10px;
        height: 80%;
        background-color: var(--graymedium);
    }

    Explorer Row CardItem,SignerItem .side {
        /*background-color: #f0f;*/
        display: flex;
        align-items: center;
        text-align: center;
    }

    `);
     oo('span', ' E X P L O R E R');

    const
        verticalList = createVeritcalList(oo, log);

    function createRowItem(oo, index) { //log({index, oo}, oo.elm);
        // TODO use session instead
        switch(index) {
            case 0: return createDevpanelRow(oo);
            case 1: return createPanelRow(oo);
            case 2: return createTopmostCardsRow(oo);
            case 3: return createTopmostSignersRow(oo);
        }
    }

    function createPanelRow(oo) {
        return oo(Panel);
    }

    function createDevpanelRow() {
        return oo(Devpanel);
    }

    function createTopmostCardsRow(oo) {
        const cardNodes = createTopmostCardNodes(ß);
        oo = oo(Row),
        oo.init('Topmost cards', (oo, index) => {
            const cardNode = cardNodes[index];
            if(cardNode) {
                oo = oo(CardItem);
                oo.set({cardNode});
                return oo;
            }
        });                                   //log(0, 'create row as child to', oo.elm);
        return oo;
    }

    function createTopmostSignersRow(oo, index, prev, next) {
        const signers = createTopmostSigners(ß);
        oo = oo(Row),
        oo.init('Topmost signers', (oo, index) => {
            const signer = signers[index];
            if(signer) {
                oo = oo(SignerItem);
                oo.set({signer});
                return oo;
            }
        });
        return oo;
    }

    const removeCanopyUpdatedListener = ß.canopy.on(CANOPY_UPDATED, () => {
        verticalList.init(createRowItem, true);
    });
    oo.onDestroy(() => {
        removeCanopyUpdatedListener();
    });
    OO.gesture.scrollWheel(oo, event => verticalList.scrollY(event.deltaY));

    verticalList.init(createRowItem, true);

    // render
//    render();
};

function Panel({oo, css, go}, {ß, log}) {
    oo('br');
    oo('button', 'Following').onclick(async () => {
        go('/following');
    }).style({backgroundColor: '#000'});
    oo('br');
    oo('button', 'Signers').onclick(async () => {
        go('/signers');
    }).style({backgroundColor: '#000'});
    oo('br');
    oo('button', 'Download following from all peers').onclick(async () => {
        ß.grapevine.getPeerProxies().forEach(async peerProxy => { log(peerProxy);
            const result = await ß.grapevine.getSignerTalk().retrieveFollowedSignersAsync({peerProxy}).catch(log.e);
            console.log({result});
        });
    }).style({backgroundColor: '#000'});
}

function Devpanel({oo, css}, {ß, log}) {
    oo('br');
    oo('br');
    oo('br');
    oo('button', 'Download once').onclick(async () => {
        ß.grapevine.getPeerProxies().each(async peerProxy => {
            await ß.grapevine.getTreeTalk().retrieveScoresAsync({peerProxy, max:ß.config.DOWNLOAD_MAX_SCORES});
            await ß.grapevine.getTreeTalk().retrieveBestCardsAsync({peerProxy, max:ß.config.DOWNLOAD_MAX_CARDS});
        });
    }).style({backgroundColor: '#000'});
    oo('button', 'Start download manager').onclick(() => {
        ß.grapevine.getDownloadManager().start(ß.config.DOWNLOAD_INTERVAL_SECONDS * 1000);
    }).style({backgroundColor: '#000'});
    oo('button', 'Create mockup tree').onclick(() => {
        ß.canopy.debug.createMockupTree()();
        //go('/', undefined, {debugReplace:true});
    }).style({backgroundColor: '#000'});
    //oo(TopmostList, {ß});
    //oo(TopmostSigner, {ß});
}

function Row({oo, css}, {ß, log}) {
    const horizontalList = createHorizontalList(oo, X_DURATION);
    // elements
    const label = oo('span');
    oo(ArrowIcon, '<').style({left: '0px'}).onclick(horizontalList.scrollLeft);
    oo(ArrowIcon, '>').style({right: '0px'}).onclick(horizontalList.scrollRight);

    // expose
    oo.x('init', (s, createItem) => {
        label.html(s);
        horizontalList.init(createItem, true);
    });
}

function ArrowIcon({oo}, {i}) {
    oo.html(i);
}

function SignerItem({oo, css, go}, {ß, log}) {
    let pub = 'no id';
    const left = oo('div', {className: 'side'})('div', {style:{width:'100%'}}),
          inner = oo('div', {className: 'middle'}),
          right = oo('div', {className: 'side'})('div', {style:{width:'100%'}});
    const text2Span = inner('span');
    const textSpan = inner('span', {style:{color: '#888'}});
    inner('br');
    inner('span', 'goto page').onclick(() => {
        go(`/signer/${pub}`);
    });
    inner('br');
    oo.x('set', ({signer}) => {                                                   //log({cardNode});
        pub = signer.getPublicKey();
        oo.refresh();
    });
    oo.x('refresh', () => {                                                         //console.log({node});
        text2Span.html('pub:'+ pub);
    });
}

function CardItem({oo, css, go}, {ß, log}) {
    let sha256 = 'no id';
    const left = oo('div', {className: 'side'})('div', {style:{width:'100%'}}),
          inner = oo('div', {className: 'middle'}),
          right = oo('div', {className: 'side'})('div', {style:{width:'100%'}});
    // TODO change to oo.xx
    //const leftButton = left(ItemPageButton, {swipe});//.onclick(() => swipeCb('left', id));
    //const rightButton = right(ItemPageButton, {swipe});//.onclick(() => swipeCb('right', id));
    //oo.x('onswipe', (cb) => { 
    //    swipeCb = cb;
    //});
    inner('br');
    inner('span', 'goto page').onclick(() => {
        go(`/card/${sha256}`);
    });
    const text2Span = inner('span');
    const textSpan = inner('span', {style:{color: '#888'}});
    inner('br');
    //inner(Icon, {i:'&#10000;'}).onclick(() => {
    //    go('/compose/' + sha256);
    //});
    //let pub;
    //inner(Icon, {i:'&#9787;'}).onclick(() => {
    //    go(`/signer/${pub}`);
    //});
    oo.x('set', ({cardNode}) => {                                                   //log({cardNode});
        sha256 = cardNode.card.data.sha256;
        oo.refresh();
    });
    oo.x('refresh', () => {                                                         //console.log({node});
        const
            node = ß.canopy.grabNode(null, sha256);
        let text = ` self:${sha256}--${node.card.data.text}`;
        const {peerScore, score, heightScore} = ß.canopy.debug.getScore(sha256);
        text += ` PeerScore:${peerScore} Score:${score} HeightScore:${heightScore}`;
        text2Span.html(text);
    });
}

function createTopmostCardNodes(ß) {
    const arr = [];
    ß.canopy.eachTopmost(({cardNode, score}, i) => {
        arr.push(cardNode);
    });
    return arr;
}

function createTopmostSigners(ß) {
    const arr = [];
    ß.canopy.eachSignerProxy(0, (o) => {
        arr.push(o); //go(`/signer/${pub}`); const pub = o.getPublicKey(); 
    });
    return arr;
}

export function DashboardBard({oo, x, css, go}) {
    oo = oo(Bar);
    oo('div')(Icon, {i:'&#9776'}).style({left: '10px'}).onclick(() => {
        go('/settings');
    });
    oo(UpDownIcon, {isDown: true}).classList('$'+STAGE_CARD_ROUTE, {swap: 'hide'}, v => v ? 'center' : 'hide').style({}).onclick(go.back);
    oo('div')(Icon, {i:'&#9731'}).style({right: '10px'}).onclick(() => {
        go('/profile');
    });
}

function UpDownIcon({oo, css}, {isDown}) {
    css(`
    UpDownIcon {
        font-family: Times New Roman;
    }

    UpDownIcon .down {
        position: absolute;
        transform: rotate(-180deg) translate(50%, 20%);
    }
    `);
    //console.log({isDown});
    oo(Icon, {i:'^', className: isDown ? 'down' : undefined});
}

