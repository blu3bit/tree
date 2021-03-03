export function Icon(oo, {i}) {
    oo.stylesheet(`
    Icon {
        z-index: 100;
        color: #585858;
        font-size: 30px;
        font-style: normal;
        text-shadow: 0px 0px 2px #585858;
    }

    Icon:hover {
        color: #ffffff;
    }
    `);
    oo.html(i);
};

