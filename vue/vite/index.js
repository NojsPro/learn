const fs = require('fs')
const path = require('path')
const Koa = require('koa')
const app = new Koa()
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')

const chokidar = require('chokidar');
const WebSocket = require('ws');



app.use(async ctx => {
    const {
        request: {
            url,
            query
        }
    } = ctx
    // console.log(JSON.stringify(ctx), url, query)

    if (url.startsWith('/@modules/')) {
        // 这是一个node_module里的东西
        const prefix = path.resolve(__dirname, 'node_modules', url.replace('/@modules/', ''))
        const module = require(prefix + '/package.json').module
        const p = path.resolve(prefix, module)
        const ret = fs.readFileSync(p, 'utf-8')
        ctx.type = 'application/javascript'
        ctx.body = rewriteImport(ret)
    }


    // 首页
    if (url == '/') {
        ctx.type = "text/html"
        let content = fs.readFileSync('./index.html', 'utf-8')
        content = content.replace('<script ', `
<script>
    window.process = {env:{ NODE_ENV:'dev'}}
</script>
<script src="/wsclient.js" type="module"></script>
<script `)
        ctx.body = content
    } else if (url.endsWith('.js')) {
        // js文件
        const p = path.resolve(__dirname, url.slice(1))
        ctx.type = 'application/javascript'
        const content = fs.readFileSync(p, 'utf-8')
        ctx.body = rewriteImport(content)
    } else if (url.indexOf('.vue') > -1) {
        // vue单文件组件
        const p = path.resolve(__dirname, url.split('?')[0].slice(1))
        const {
            descriptor
        } = compilerSfc.parse(fs.readFileSync(p, 'utf-8'))
        // console.log(p, descriptor.script)
        if (!query.type) {
            ctx.type = 'application/javascript'
            // 借用vue自导的compile框架 解析单文件组件，其实相当于vue-loader做的事情
            ctx.body = `
// option组件
${rewriteImport(descriptor.script.content.replace('export default ','const __script = '))}
import { render as __render } from "${url}?type=template"
__script.render = __render
export default __script`

        }

        if (query.type === 'template') {
            // 模板内容
            const template = descriptor.template
            // 要在server端吧compiler做了
            const render = compilerDom.compile(template.content, {
                mode: "module"
            }).code
            ctx.type = 'application/javascript'
            ctx.body = rewriteImport(render)
        }
    } else if (url.endsWith('.css') || url.indexOf('.css') > -1) {
        /* let base = url;
        if(url.indexOf('?') > -1){
            base = url.substring(0, url.indexOf('?'))
        }
        console.log(base) */
        const p = path.resolve(__dirname, url.split('?')[0].slice(1))
        const file = fs.readFileSync(p, 'utf-8')


        const content = `const css = "${ClearBrTrim(file)}"
let link = document.createElement('style')
link.setAttribute('type', 'text/css')
document.head.appendChild(link)
link.innerHTML = css
export default css`

        ctx.type = 'application/javascript'
        ctx.body = content
    }
})

/* app.listen(3001, () => {
    console.log('听我口令，3001端口，起~~')
}) */

let server = app.listen(3001, () => {
    console.log('http://127.0.0.1:3001')
})
const wss = new WebSocket.Server({
    server
});


// console.log(server.address(), wss)
// One-liner for current directory
// 监听整个项目根目录。忽略 node_modules 和 .git 文件夹
const watcher = chokidar.watch('.', {
    ignored: [/\bnode_modules\b/, /\b\.git\b/]
});
watcher.send = function (message){
    wss.clients.forEach((client) => {
        client.send(JSON.stringify(message));
    });
}
const log = console.log.bind(console);
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    /* watcher
        .on('change', (filePath) => {
            console.log(filePath, "change")
            ws.send(JSON.stringify({
                changeSrcPath: filePath,
                path: filePath,
                timestamp: (new Date()).getTime(),
                type: "change"
            }));
        })
        .on('add', (filePath) => {
            ws.send(JSON.stringify({
                changeSrcPath: filePath,
                path: filePath,
                timestamp: (new Date()).getTime(),
                type: "add"
            }));
        }) */
    /* watcher
        .on('addDir', path => log(`Directory ${path} has been added`))
        .on('unlinkDir', path => log(`Directory ${path} has been removed`))
        .on('error', error => log(`Watcher error: ${error}`))
        .on('ready', () => log('Initial scan complete. Ready for changes'))
        .on('raw', (event, path, details) => { // internal
            log('Raw event info:', event, path, details);
        }); */
});

console.log(watcher.send)
// 调试文件修改
watcher
    .on('change', (filePath) => {
        // css 文件更新
        if(filePath.endsWith('.css')){
            filePath = filePath.replace(/\\/g, "/");
            console.log(filePath, "change")
            // sendUpdateMessage(filePath)
            watcher.send({
                changeSrcPath: filePath,
                path: filePath,
                timestamp: (new Date()).getTime(),
                type: "style-update"
            })
        }
    })
    .on('add', (filePath) => {
        
        console.log(filePath, "add")
    })
    /*  */
function rewriteImport(content) {
    return content.replace(/from ['"]([^'"]+)['"]/g, function (s0, s1) {
        // . ../ /开头的，都是相对路径
        if (s1[0] !== '.' && s1[1] !== '/') {
            return `from '/@modules/${s1}'`
        } else {
            return s0
        }
    })
}
// 去回车和空格
function ClearBrTrim(key) {
    key = key.replace(/\s+/g, "");
    key = key.replace(/<\/?.+?>/g, "");
    key = key.replace(/[\r\n]/g, "");
    return key;
}

/* function sendUpdateMessage(filePath){
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({
            changeSrcPath: filePath,
            path: filePath,
            timestamp: (new Date()).getTime(),
            type: "style-update"
        }));
    });
} */

