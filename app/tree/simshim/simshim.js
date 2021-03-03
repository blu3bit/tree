// TODO
//      fix:
//
//      fr:
//
//      roadmap:
//
/*
 * v0.0.1-2
 * Simshim - Development environment - Treenet
 */
window.__SIMSHIM__ = {
    debug: {
        deterministicScoring: true
    }
};

const AUTO_CREATE_NUMBER_OF_NODES = 2;
const LOG_LEVEL_GRAPEVINE = 0;

const cn = ({name, isOnline}) => { return {name, isOnline}; },
      cm = (message) => { return JSON.parse(JSON.stringify(message)); };

import {config} from './config.js';
import {createStorage} from './storage.js';
import {createLog} from './log.js';
import {createGrapevine, PING, DESCRIPTION_UPDATED, PEER_UPDATED, PEER_CREATED, PEER_DESTROYED, MESSAGE_SEND, MESSAGE_RECEIVED} from '../grapevine/grapevine.js';
import {createProfileStorage} from '../profile-storage.js';
import {createCanopy} from '../canopy/canopy.js';
import {createTreehut} from '../treehut/treehut.js';
import {createTreetalkLog} from './treetalk-log.js';
import {createSignertalkLog} from './signertalk-log.js';

export function createSimshim(root) {
    const {oo, $:{$, set, drop}} = OO(root)('div'),
          IS_MOCKUP_SCORING = 'simshimNode/isMockupScoring',
          manager = {
              NODE_REMOVED: 'NODE_REMOVED',
              NODE_UPDATED: 'NODE_UPDATED',
              MESSAGE: 'MESSAGE',
              listeners: [],
              on: (name, on) => { //log('add ' + name + ' as manaer listener');
                  const l = {name, on};
                  manager.listeners.push(l);
                  return () => {
                      const i = manager.listeners.findIndex(o => o === l);
                      if(i >= 0) manager.listeners.splice(i, 1);
                      else throw 'did not find listener';
                  };
              },
              sendMessage: (message, cb) => { //log('posting message to', message.to, message);
                  const l = manager.listeners.find(l => l.name === message.to);
                  if(l) l.on(manager.MESSAGE, message, cb);
                  else cb('not on simshim net');
              },
              updateNode: (node, isCreated) => {
                  set('node/'+node.name, node); //log('addNode=', node);
                  manager.listeners.forEach(l => { console.log('notify ' + l.name + ' that ' + node.name + ' is updated');
                      l.on(manager.NODE_UPDATED, node);
                  });
                  if(isCreated) {
                      const l = manager.listeners.find(l => l.name === node.name).on;
                      $.each('node', node => l(manager.NODE_UPDATED, node));
                  }
              },
              removeNode: (name) => { //log('removepNode=', name);
                  drop('node/'+name);
                  manager.listeners.forEach(l => l.on(manager.NODE_REMOVED, name));
              }
          };

    // manager view
    const managerView = oo('div'),
          nodesView = oo('table')('tr');
    oo.stylesheet(
        `Body {
            background-color: #333333;
            color: #595959;
            font-family: Arial;
        }
        .clearBtn {
            margin-left: 7px;
        }
        .redBtn {
            background-color: red;
        }
        .orangeBtn {
            background-color: orange;
        }
        Span {
            font-variant: small-caps;
        }
        `, 'Body'
     );
     const createNode = () => {
        //const name = prompt('Create node\r\n\r\nName:', 'node-' + Date.now());
        const name = 'node-' + Date.now().toString().substring(9) + '-' +Math.random().toString().substring(2, 6);
        if(name && !$('nodes/'+name)) {
            const nodeCol = nodesView('td').style({verticalAlign:'top'});
            createSimshimNode(name, manager, nodeCol('div').elm, () => {
                nodeCol.destroy();
            });
        }
     };
     managerView(SimshimButton, 'Create node').onclick(createNode);


     managerView(SimshimButton).on(IS_MOCKUP_SCORING, (is, o) => is ? o.text('Disable mockup scoring') : o.text('Enable mockup scoring')).onclick(o => {
        const is = !window.__SIMSHIM__.debug.deterministicScoring
        window.__SIMSHIM__.debug.deterministicScoring = is;
        set(IS_MOCKUP_SCORING, is, true);
    }).className('$'+IS_MOCKUP_SCORING, {when:{false: 'noclass', true: 'orangeBtn'}})._;
    set(IS_MOCKUP_SCORING, window.__SIMSHIM__.debug.deterministicScoring, true);

    for(let i = 0; i < AUTO_CREATE_NUMBER_OF_NODES; i++) createNode();
};

function createSimshimNode(originalName, manager, root, destroyCb) {
    // system
    const
        ß = {},
        oo = OO(root, null, null, {globalProps: {ß}})('div'),
        logger = createLog({ß, name: originalName}, [createTreetalkLog({ß}), createSignertalkLog({ß})]);
    ß.config = config;
    ß.storage = createStorage({log: logger.createLog({suffix: ' - STORAGE', level:10})});
    ß.profile = createProfileStorage({ß, log: logger.createLog({suffix: ' - PROFILES', level:10})});
    const
        log =  logger.createLog({suffix: ' - SIMSHIM', level:1}),
        //user = User();
        canopy = createCanopy({ß, log: logger.createLog({suffix: ' - CANOPY', level:1})}),
        grapevine = createGrapevine({ß, log: logger.createLog({suffix: ' - GRAPEVINE', level:LOG_LEVEL_GRAPEVINE})});
    ß.canopy = canopy;
    ß.grapevine = grapevine;
    ß.grapevine.createNode(originalName); // XXX if name changes everything breaks

    // user
    ß.profile.create({desc: 'd-' + Math.random(), priv: 'xxx', pub: 'simbo:' + originalName})
        .save()
        .setAsDefault(); // add a default user profile 

    // treehut
    const {oo: ooTreehut} = createTreehut(oo('div',
                                {style:{boxShadow: '0px 0px 20px 2px rgba(0,0,0,0.69)'}}).elm, ß, log);
    ooTreehut.context.history = (function() {
            let onpopstate, on;
            const arr = [],
                  curr = {};
            function replaceState(state, title, href) {
                setHref(href);
                curr.title = title;
                curr.href = href;
                arr[arr.length-1] = state;
            }
            function pushState(state, title, href) {
                setHref(href);
                curr.title = title;
                curr.href = href;
                arr.push(state);
            }
            function popState() {
                arr.pop();
                return arr[arr.length-1];
            }
            function back() {
                const state = popState();
                if(onpopstate) onpopstate({state});
            }
            return {
                onpopstate: l => { onpopstate = l; },
                replaceState,
                pushState,
                back
            };
    })();
    oo('br')._('br');
    oo(SimshimButton, 'Back').onclick(() => {
        ooTreehut.context.history.back();
    });
    const ooInput = oo('input'),
          setHref = s => {
              if(s.startsWith('http://')) {
                  s = s.substring(s.indexOf('/', 7), s.length);
              }
              ooInput.elm.value = s;
          };
    oo(SimshimButton, 'Go').onclick(() => {
        ooTreehut.go(ooInput.elm.value);
    });
    oo(SimshimNode, {ß, manager, originalName, destroyCb, log});
    ooTreehut.go('/'); // ENTRY PAGE
}

function SimshimNode(oo, {ß, manager, originalName, treehutView, destroyCb, log}) {
    OO.gesture.scrollWheel(oo, () => {}, true);
    const {on, go, $:{$, set, drop, prepend, push}} = oo,
          SIMSHIMNODE = 'simshimNode',
          SENT = 'simshimNode/message/sent',
          RECEIVED = 'simshimNode/message/received',
          IS_ONLINE = 'simshimNode/isOnline';
    // shim history. (all SimshimNode instances depend on having their own location)
    // store
    set(SIMSHIMNODE, {
        isOnline: Math.random() > 0.2,
        message: {
            received: [],
            sent: []
        },
        name: originalName
    });
    const WIDTH = '360px',
          HEIGHT = '640px';
    oo.stylesheet(
        `SimshimNode {
            display: block;
            width: ${WIDTH};
            height: ${HEIGHT};
            background-color: #333333;
        }

        SimshimNode span:hover {
            color: #fff;
        }
        
        Input {
            color: #777;
            background-color: #333333;
        }

        `, 'SimshimNode'

    );
    oo('div', {style:{marginTop: '20px'}});
    oo(SimshimButton).on(IS_ONLINE, (isOnline, o) => isOnline ? o.text('Online') : o.text('Offline')).onclick(o => {
        set(IS_ONLINE, !$(IS_ONLINE), true);
        manager.updateNode($(SIMSHIMNODE));
    }).className('$'+IS_ONLINE, {when:{false: 'redBtn', true: 'noclass'}})._
    (SimshimButton, originalName).onclick(() => {
        if(confirm('Are you sure you want to delete this node?\r\n\r\n'+originalName)) {
            removeManagerListener();
            manager.removeNode(originalName);
            destroyCb();
        }
    }).elm.title = 'Grapevine ' + ß.grapevine.debug.debugId;
    oo(SimshimButton, 'Dump canopy').onclick(() => {
        let o = [];
        ß.canopy.debug.dump(function(){ o.push({...arguments}); });
        log(o);
    });

    oo('br')._('br');

    const descBtn = oo(SimshimButton, 'Set description').onclick(() => {
        const s = prompt('Enter description:');
        if(s) ß.grapevine.setDescription(s);
    });
    ß.grapevine.on(DESCRIPTION_UPDATED, data => descBtn.text(data));
    oo('br')._('br');

    oo(GrapevineView, {ß, manager, log});

    // list online nodes
    const addPeer = (name) => {
        if(ß.grapevine.hasPeer(name)) return;
        const peerProxy = ß.grapevine.addPeer(name);
        // register peer event handlers
        peerProxy.on(MESSAGE_RECEIVED, message => prepend(RECEIVED,  cm(message)));
    };
    oo('div')('span', 'Simshim nodes').on('$node $node/: $node/:/:', 'ul', true, ([nodes], o) => {
        nodes.each(({name, isPeer, isOnline}) => { // console.log({name, isPeer, isOnline});
            if(!isPeer && isOnline) o('li')(SimshimButton, name).onclick(() => addPeer(name));
        });
    });
    setTimeout(() => {
        oo.context.each($('node'), ({name, isPeer}) => {
            if(!isPeer) addPeer(name);
        });
    }, 200);

    // message
    oo('div')('span', 'Received messages')._
        (SimshimButton, 'Clear', {className: 'clearBtn'}).onclick(() => set(RECEIVED, []))._
        ('div').on(RECEIVED, 'ul', true, (arr, o) => !arr.size() ? o('li')('i', 'empty') :
            arr.each(({from, created, type, data}) => {
                o('li')('span', from + ' ' + type).elm.title =
                    'From: ' + from + '\r\nCreated: ' +  new Date(created) + '\r\n\r\nType: ' +  type + '\r\n\r\n' + JSON.stringify(data);
            }));
    oo('div')('span', 'Sent messages')._
        (SimshimButton, 'Clear', {className: 'clearBtn'}).onclick(() => set(SENT, []))._
        ('div').on(SENT, 'ul', true, (arr, o) => !arr.size() ? o('li')('i', 'empty') :
            arr.each(({to, type, data, created}) => {
                o('li')('span', to + ' ' + type).elm.title =
                    'To: ' + to + '\r\nCreated: ' +  new Date(created) + '\r\n\r\nType: ' +  type + '\r\n\r\n' + JSON.stringify(data);
            }));
    ß.grapevine.on(MESSAGE_SEND, (message, cb) => {
        prepend(SENT, cm(message));
        manager.sendMessage(message, cb);
    });

    // marry with manager
    const removeManagerListener = manager.on(originalName, (event, data, cb) => { //console.log('event from manager', {event, data});
        switch(event) {
            case manager.NODE_REMOVED:
                if(data !== originalName) drop('node/'+data, true);
                break;
            case manager.NODE_UPDATED:
                if(data.name !== originalName) {
                    const {name, isOnline} = data,
                          NODE = 'node/'+name;
                    if(!$(NODE)) set(NODE, {name}, true);
                    set(NODE+'/isOnline', isOnline, true);
                }
                break;
            case manager.MESSAGE:
                if($(IS_ONLINE)) {
                    ß.grapevine.addMessage(data);
                    cb();
                } else cb('offline');
                break;
        }
    });
    manager.updateNode($(SIMSHIMNODE), true);

}

function GrapevineView(oo, {ß, manager, log}) {
    const {set, drop, push, $} = oo.$;
    oo('div')('span', 'Grapevine peers');

    // list peers, destroy peer
    const peerList = oo('ul');
    [PEER_CREATED, PEER_UPDATED, PEER_DESTROYED].forEach(event => {
        ß.grapevine.on(event, () => {
            peerList.clear();
            ß.grapevine.getPeerProxies().each(peerProxy => {
                const {name, description} = peerProxy;
                set('node/'+name+'/isPeer', true);
                peerList('li')
                (SimshimButton, name + ' [' + description + ']').onclick(() => {
                    const s = prompt(`Ping ${peerProxy.name}\r\n\r\nSend message:`, 'ping');
                    (async () => {
                        const inMessage = await peerProxy.ping(s)
                            .catch(({err, msg}) => {
                                alert(`Pong from ${peerProxy.name}\r\n\r\nError: ${err}\r\n${msg}`);
                            });
                        alert(`Pong from ${peerProxy.name}\r\n\r\n${JSON.stringify(inMessage)}`);
                    })();
                })._
                (SimshimButton, 'X', {className: 'clearBtn'}).onclick(() => {
                    ß.grapevine.destroyPeer(name);
                    set('node/'+name+'/isPeer', false);
                });
            });
        });
    });
}

function SimshimButton({oo, css}, {text}) {
    css(`
    SimshimButton {
        display: inline-block;
        margin: 2px;
        font: 15px "Fira Sans", sans-serif;
        border-radius: 5px;
        padding: 2px 5px 2px 5px;
        color: #000;
        background-color: #3b3b3b;
        border: 0;
        font-variant: petite-caps;
    }
    SimshimButton:hover {
        color: #fff;
    }
    SimshimButton:active {
        background-color: #000;
        transform: translateY(2px);
    }
    `);
    oo('button', text);
}

