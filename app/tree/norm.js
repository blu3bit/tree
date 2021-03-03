/*
 * v0.0.1-1
 * Consensus - Lib - Treenet
 * Similar to Bitcoin, data propagated in the network should adhere to certain consensus rules.
 * Data will only be propagated among nodes that adhere to the same consensus rules.
 * It is likely that those that agree on the consensus rules, achieve greatest network effect.
 **/

export function normCardLevel(parentCard, childCard) {
    return childCard.data.lvl === parentCard.data.lvl + 1;
};

export function normCardScore({card, peerScores, score=0}) {
    // TODO add if following author etc
    let avgPeerScore = 0, // cards with a higher peer score gets a higher score
        sumScore = 0,
        cntScores;
    peerScores.forEach(v => {
            // note:
            // when a node uploads a card or score to a peer,
            // the peer is unlikely to share its score back to the peer.
            // actually it might be that it never create a score for card,
            // so it will not even share it. hence it makes sense to use 
            // zero is a default score for this card.
            //
            // because a node is using the peer scores to find out if a peer
            // is likely to have a card or not, score with zero should be
            // excluded. otherwise sharing a score to many peers, will drive
            // down the avg score of the card.
        if(v > 0) {
            // sum valid (greater than zero) scores.
            sumScore += v;
            cntScores++;
        }
    });
    if(cntScores > 0) avgPeerScore = sumScore / cntScores;

    const timeScore = card.data.ms / Date.now(); // recently created cards gets a higher score
         // useScore =, // TODO cards used often gets a higher score
        // TODO cards that belong to a long chain of cards, should also get a higher score
    score = (score + timeScore + avgPeerScore) / 3;
    return Math.floor(score); // TODO value between 0-1
};
 
//function validateCardScore(score) {
//    // card scores not out of bounds
//    return score >= 1 || score <= 10
//}
//
//function validateCardCreated(ms) {
//    // cards that not created in the future
//    return Date.now
//}

