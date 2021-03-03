/*
 * v0.0.1-1
 * Settings - Treehut - Treenet
 */

export function Settings({oo, css, go}, {ß, close, log}) {                       log?.n(0, 'create Settings');
    css(`
    Settings {
        z-index: var(--zsettings);
        position: absolute;
        width: 100%;
        transition: 0.1s linear;
        height: calc(var(--heightfull) + var(--barthin));
        /*background-color: #0f0;*/
        background-color: var(--graylight);
    }
    `);
    //const o = settingsId ? ß.settings.get(settingsId) : ß.settings.getDefaultSettings();
    oo('h1', 'Settings');
    oo('br')._('br');
    oo('button', 'close').onclick(() => {
        close();
        //go.back();
    });
};

