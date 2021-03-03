export function Compose({oo, css, go}, {ß, parentCardId}) {
    css(`
    Compose {
        z-index: var(--zcompose);
        position: absolute;
        width: 100%;
        transition: 0.1s linear;
        height: calc(var(--heightfull) + var(--barthin));
        /*background-color: #0f0;*/
        background-color: var(--graylight);
    }

    Compose textarea {
        border: 0;
        margin: 20px;
        width: 85%;
        height: 50%;
        color: var(--whitelight);
        font-size: 20px;
        background-color: var(--graydark);
    }
    
    Compose button {
        font-size: 15px;
        background-color: var(--grayspace);
    }
    `);
    oo('b', 'Compose');
    oo('br');

    const selectProfile = oo('select');
    let currProfile;
    ß.profile.each((o, i) => { //console.warn({o}, o.getName());
        if(i === 0) currProfile = o;
        selectProfile('option', {value: o.getId()}).text(o.getId());
    });

    //const selectSigner = oo('select');
    let pub = currProfile.getPublicKey();
    //currProfile.eachSigner((o, i) => { //console.warn({o}, o.getName());
    //    if(i === 0) currSigner = o;
    //    selectSigner('option', {value: o.data.pub}).text(o.data.pub);
    //});


    const input = oo('textarea');
    input.elm.value = ß.canopy.debug.createMockupSentence()();
    oo('br');
    oo('span', `Parent card id: ${parentCardId}`);
    oo('br');
    // TODO if no parentCardId add canopy as root, 
    let label = parentCardId ? 'Grow' : 'Create new';
    oo('button', label).onclick(() => {
        const text = input.elm.value; //console.log({parentCardId, text});
        const card = ß.canopy.createCard({prev: parentCardId, text, pub}); //log({card});
        ß.canopy.addCard(card, 'top', undefined, 1);
        go('/card/' + card.data.sha256);
    });
};


