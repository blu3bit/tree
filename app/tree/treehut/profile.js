/*
 * v0.0.1-1
 * Profile - Treehut - Treenet
 */

export function Profile({oo, css, go}, {ß, close, profileId, log}) {                       log?.n(0, 'create Profile');
    css(`
    Profile {
        z-index: var(--zprofile);
        position: absolute;
        width: 100%;
        transition: 0.1s linear;
        height: calc(var(--heightfull) + var(--barthin));
        /*background-color: #0f0;*/
        background-color: var(--graylight);
    }
    `);
    const o = profileId ? ß.profile.get(profileId) : ß.profile.getDefaultProfile();
    oo('h1', 'Profile: ' + o.getId());
    const nameInput = oo('input');
    nameInput.elm.value = o.getId();
    oo('br');
    oo('br');

    //const selectSigner = oo('select');
    //o.eachSigner((o, i) => { //console.warn({o}, o.getName());
    //    if(i === 0) currSigner = o;
    //    selectSigner('option', {value: o.getPublicKey()}).text(o.getPublicKey());
    //});

    oo('br')._('br');
    const descInput = oo('input');
    descInput.elm.value = o.getDescription();

    oo('br')._('br');
    oo('button', 'save and close').onclick(() => {
        //if(currSigner.desc !== descInput.elm.value) {
         o.setDescription(descInput.elm.value);
            //o.addSigner(currSigner);
        //}
        o.setId(nameInput.elm.value);
        o.save();
        close();
    });
    oo('br')._('br');

    oo('button', 'close').onclick(() => {
        close();
        //go.back();
    });
};

