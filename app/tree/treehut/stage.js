export const
      //CARD_SCROLL = CARD + '/scroll',
      STAGE_CARD = 'stage/card',
      STAGE_CARD_NAV = STAGE_CARD + '/nav',
      STAGE_CARD_HISTORY = STAGE_CARD + '/history',
      STAGE_CARD_ROUTE = STAGE_CARD + '/route';

import {CANOPY_UPDATED} from '../canopy/canopy.js';
import {Icon} from './icon.js';
import {Tree} from './tree.js';
import {Signer} from './signer.js';
import {Signers} from './signers.js';
import {Profile} from './profile.js';
import {Settings} from './settings.js';
import {Following} from './following.js';
import {Dashboard} from './dashboard.js';
import {Compose} from './compose.js';

export function createStage({oo, on, route, go, $:{$, set}, createCue}, ß, log) {
    /*
     * A stage is created by fusing intentions (routes, gestures, etc)
     * and presentation (transition between views).
     */
    oo.css(`
    .teleportLeft {
        transition: 0.00001s linear;
        transform: translateX(100%);
    }

    .teleportRight {
        transition: 0.00001s linear;
        transform: translateX(-100%);
     }

    .teleportAbove {
        transition: 0.00001s linear;
        transform: translateY(-100%);
    }

    .teleportBelow {
        transition: 0.00001s linear;
        transform: translateY(100%);
    }

    .exitLeft {
        transition: var(--transition) linear;
        transform: translateX(100%);
    }

    .exitRight {
        transition: var(--transition) linear;
        transform: translateX(-100%);
    }

    .exitAbove {
        transition: var(--transition) linear;
        transform: translateY(-100%);
    }

    .exitBelow {
        transition: var(--transition) linear;
        transform: translateY(100%);
    }

    .enter {
        transition: var(--transition) linear;
        transform: translateX(0%);
        transform: translateY(0%);
    }

    .fadeIn {
        opacity: 1;
    }

    .fadeOut {
        opacity: 0;
    }

    `, 'Stage');

    const cue = createCue(oo);

    //
    //
    //      /
    //
    const
        dashboard = {Dashboard, props:{ß}};
    route('/', ({props, hints}) => {
        cue({...dashboard, className: 'enter', replace: hints.debugReplace});
    });

    const
        following = {Following},
        exitFollowing = (cb) => cue({...following, regenerate: false, className: 'exitBelow'})({destroy: true}, () => {
            // TODO is if(oo) needed, etc?! when is exitFollowing used really? fix when where view is opened from which views
            if(cb) cb();
        }),
        closeFollowing = () => {
            exitFollowing(() => go.back());
        };
    route('/following', ({props:{}}) => {
        cue({...following, replace: true, className: 'teleportBelow', props:{close:closeFollowing}})({className: 'enter'}, () => {
        });
    });

 
    const
        signers = {Signers},
        exitSigners = (cb) => cue({...signers, regenerate: false, className: 'exitBelow'})({destroy: true}, () => {
            // TODO is if(oo) needed, etc?! when is exitSigners used really? fix when where view is opened from which views
            if(cb) cb();
        }),
        closeSigners = () => {
            exitSigners(() => go.back());
        };
    route('/signers', ({props:{}}) => {
        cue({...signers, replace: true, className: 'teleportBelow', props:{close:closeSigners}})({className: 'enter'}, () => {
        });
    });


    //
    //      /compose
    //
    const compose = {Compose};
    route('/compose/:parentCardId', ({props:{parentCardId}}) => { //console.log(o);
        cue({...compose, replace: true, className: 'teleportAbove', props:{parentCardId}})({className: 'enter'});
    });

    //
    //      /signer
    //
    const
        signer = {Signer},
        exitSigner = (cb) => cue({...signer, regenerate: false, className: 'fadeOut'})({destroy: true}, () => {
            // TODO is if(oo) needed, etc?! when is exitSigner used really? fix when where view is opened from which views
            if(cb) cb();
        }),
        closeSigner = () => {
            exitSigner(() => go.back());
        };
    route('/signer/:signerId', ({props:{signerId}}) => {
        cue({...signer, replace: true, className: 'fadeIn', props:{signerId, close:closeSigner}})(() => {
        });
    });

    //
    //      /profile
    //
    const
        profile = {Profile},
        exitProfile = (cb) => cue({...profile, regenerate: false, className: 'fadeOut'})({destroy: true}, () => {
            // TODO is if(oo) needed, etc?! when is exitProfile used really? fix when where view is opened from which views
            if(cb) cb();
        }),
        closeProfile = () => {
            exitProfile(() => go.back());
        };
    route('/profile', ({props:{}}) => {
        cue({...profile, replace: true, className: 'fadeIn', props:{close:closeProfile}})(() => {
        });
    });

    //
    //      /settings
    //
    const
        settings = {Settings},
        exitSettings = (cb) => cue({...settings, regenerate: false, className: 'fadeOut'})({destroy: true}, () => {
            // TODO is if(oo) needed, etc?! when is exitSettings used really? fix when where view is opened from which views
            if(cb) cb();
        }),
        closeSettings = () => {
            exitSettings(() => go.back());
        };
    route('/settings', ({props:{}}) => {
        cue({...settings, replace: true, className: 'fadeIn', props:{close:closeSettings}})(() => {
        });
    });

    //
    //      /card
    //
    set('stage/card', {
        history: [],
        index: 0,
        nav: null,
        route: null   // last routed to card id
        //scroll: null    // last scrolled to card id
    });
    route('/card/:cardId', ({props, hints}) => { console.log({props, hints});
        // TODO remove props cardId, swipe etc..... 
        cue({...compose, className: 'exitAbove', regenerate: false});
        const cardId = props.cardId,
              cardStage = $(STAGE_CARD),
              replace = $(STAGE_CARD_ROUTE) !== cardId;
        if(!hints.dontPushHistory && cardStage.route != cardId) { //  && !hints.popstate
            const index = cardStage.index; //console.log(index, cardStage.history.length);
            let history = cardStage.history.slice(0, index+1);
            history.push(cardId);
            if(history.length > 4200 /* magic: remember no more history */) history.shift();
            cardStage.index = history.length-1;
            set(STAGE_CARD_HISTORY, history);
        }
        set(STAGE_CARD_ROUTE, cardId); //console.log($(STAGE_CARD_HISTORY));
        if(hints.swipe) {
            cue({Tree, className: 'enter', props:{cardId}}, ({oo}) => {
                oo.init(cardId, hints.swipe);
            });
        } else {
            cue({...dashboard, className: 'exitBelow'});
            exitSigner();
            cue({Tree, className: 'enter', replace: true, props:{cardId}}, ({oo}) => {
                oo.init(cardId, null);
            });
        }
        //} else {
        //    cue({Tree, className: 'enter', replace, props:{cardId, canopy, log}}, ({oo}) => {
        //        oo.init(cardId, hints.swipe, replace);
        //    });
        //}
    });

// TODO    dashboard toplists
////            cue({...tree, replace}, ({oo}) => {
////                oo.init(cardId);
////            });
////        } else {
////            const exitClassName = hints.swipe === 'left' ? 'exitLeft' : 'exitRight',
////                  teleportClassName = hints.swipe === 'left' ? 'teleportRight' : 'teleportLeft';
////            //cue({...tree, className: exitClassName, id: treeId, regenerate: false});
////            //cue({...tree, className: teleportClassName, autoId: true, props:{cardId, canopy}})(({id, oo}) => {
////            //    // TODO oo.setCardId(cardId);
////            //    cue({id, className: 'enter'})(() => {
////            //        cue({id: treeId, destroy: true});
////            //        treeId = id;
////            //    });
////            //});
////        }

    route('/*', () => {
        cue('all', {destroy:true}, () => {
            cue({NotFound404});
        });
    });
};

function NotFound404(oo) {
    oo('h2', '404: Not Found');
}
