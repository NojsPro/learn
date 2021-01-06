window.process = window.process || {};
window.process.env = window.process.env || {};
window.process.env.NODE_ENV = "development";
const defines = {"__VUE_OPTIONS_API__":true,"__VUE_PROD_DEVTOOLS__":false};
Object.keys(defines).forEach((key) => {
    const segs = key.split('.');
    let target = window;
    for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        if (i === segs.length - 1) {
            target[seg] = defines[key];
        }
        else {
            target = target[seg] || (target[seg] = {});
        }
    }
});
console.log('[vite] connecting...');
// use server configuration, then fallback to inference
const socketProtocol = null || (location.protocol === 'https:' ? 'wss' : 'ws');
const socketHost = `${null || location.hostname}:${3001}`;
const socket = new WebSocket(`${socketProtocol}://${socketHost}`, 'vite-hmr');
console.log(socket)
socket.addEventListener('message', async ({ data }) => {
    const payload = JSON.parse(data);
    console.log(payload)
    handleMessage(payload)
    /* if (payload.type === 'multi') {
        payload.updates.forEach(handleMessage);
    }
    else {
        handleMessage(payload);
    } */
});

async function handleMessage(payload) {
    const { path, changeSrcPath, timestamp } = payload;
    switch(payload.type) {
        case 'style-update':
            // check if this is referenced in html via <link>
            const el = document.querySelector(`link[href*='${path}']`);
            console.log(el, "style")
            if (el) {
                el.setAttribute('href', `${path}${path.includes('?') ? '&' : '?'}t=${timestamp}`);
                break;
            }
            // imported CSS
            const importQuery = path.includes('?') ? '&import' : '?import';
            await import(`/${path}${importQuery}&t=${timestamp}`);
            console.log(`[vite] ${path} updated.`);
            break;
    }
}