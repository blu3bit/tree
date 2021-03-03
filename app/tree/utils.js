export function createUid(debugTag) {
    // TODO 
    return debugTag + '-' + Date.now().toString().substring(9) + '-' +Math.random().toString().substring(2, 6);
};

