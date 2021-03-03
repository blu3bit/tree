export function Bar({oo, css, go}, {ß}) { //console.log('DASHBOARD', canopy);
    css(`
    Bar {
        position: absolute;
        height: var(--barthick);
        top: calc(var(--heightfull) - var(--barthick));
        width: 100%;
        /*background-color: #050;*/
        background-color: var(--graylight);
        box-shadow: 0px -8px 10px -8px rgba(0,0,0,0.4);
    }

    Bar Icon {
        position: absolute;
        font-size: 36px;
    }

    Bar .disabled {
        pointer-events: none;
        opacity: 0.2;
    }

    Bar .center {
        text-align: center;
        display: block;
    }
    `);
};

