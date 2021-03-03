/**
 * The purpose of the preloader is to observe and anticipate user behaviour.
 * If the user does something that looks like it will user content which are not yet downloaded,
 * the preloader will try to preload this content. However, if the user does something that indicates
 * a change in the predicted behavour, the download will be aborted.
 * Provide means of preventing spamming.
 */

export function createPreload({ttlMillis=1000, ß, log}) {

    const mem = {};

    function bestBranchCards(sha256, max=ß.config.DOWNLOAD_MAX_CARDS) {
        const o = memHelper(mem.bestBranchCards, sha256);
        if(o) {
            o.max = max;
            mem.bestBranchCards = o;
            ß.grapevine.getTreeTalk().retrieveBestBranchCardsAsync(o);
        }
    }

    function bestSiblingCards(sha256, max=ß.config.DOWNLOAD_MAX_CARDS) {
        const o = memHelper(mem.bestSiblingCards, sha256);
        if(o) {
            o.max = max;
            mem.bestSiblingCards = o;
            ß.grapevine.getTreeTalk().retrieveBestSiblingCardsAsync(o);
        }
    }

    function bestAncestorCards(sha256, max=ß.config.DOWNLOAD_MAX_CARDS) {
        const o = memHelper(mem.bestAncestorCards, sha256);
        if(o) {
            o.max = max;
            mem.bestAncestorCards = o;
            ß.grapevine.getTreeTalk().retrieveBestAncestorCardsAsync(o);
        }
    }

    //function bestSubtreeCards(sha256, maxDepth=ß.config.DOWNLOAD_MAX_CARDS, maxWidth=ß.config.DOWNLOAD_MAX_CARDS) {
    //    const o = memHelper(mem.bestSubtreeCards, sha256);
    //    if(o) {
    //        o.maxDepth = maxDepth;
    //        o.maxWidth = maxWidth;
    //        mem.bestSubtreeCards = o;
    //        ß.grapevine.getTreeTalk().retrieveBestSubtreeCardsAsync(o);
    //    }
    //}

    function memHelper(o, sha256) {
        if(o) {
            if(o.sha256 === sha256 && Date.now() < o.ttlMillis) return; // already asked for this and not enough time has passed to ask for it again
            o.controller.abort();
        }
        return {
            sha256,
            controller: { ondemand: true },
            ttlMillis: Date.now() + ttlMillis
        };
    }

    return {
        bestBranchCards,
        bestSiblingCards,
        bestAncestorCards
        //bestSubtreeCards
    };
};
 
