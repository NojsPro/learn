class VNode {
    constructor (tag, data, children, text, elm){
        /* 当前节点的标签名 */
        this.tag = tag;
        /* 当前节点的一些数据信息，比如props、attrs等数据 */
        this.data = data;
        /* 当前节点的子节点，是一个数组 */
        this.children = children;
        /* 当前节点的文本 */
        this.text = text;
        /* 当前虚拟节点对用的真实dom节点 */
        this.elm = elm;
    }
}

/* 匹配任意字符 */
const ncname = '[a-zA-Z_][\\w\\-\\.]*';
/* [^\s"'<>/=] 至少有一个这样的字符 */
const singleAttrIdentifier = /([^\s"'<>/=]+)/;
/* 匹配等于号 */
const singleAttrAssign = /(?:=)/;

const singleAttrValues = [
    /"([^"]*)"+/.source,
    /'([^']*)'+/.source,
    /([^\s"'=<>`]+)/.source,
];

/* 
应该是找到标签上的属性
/^\s*([^\s"'<>/=]+)(?:\s*((?:=))\s*(?:"([^"])"+|'([^'])'+|([^\s"'=<>`]+)))?/
*/
const attribute = new RegExp(
    '^\\s*' + singleAttrIdentifier.source +
    '(?:\\s*(' + singleAttrAssign.source + ')' +
    '\\s*(?:' + singleAttrValues.join('|') + '))?'
);


const qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')';

/* 查找开始标签 */
const startTagOpen = new RegExp('^<' + qnameCapture);
/* 匹配 空格、回车符等字节开头，然后 > 符或者 /> 符结尾 （原来正则 /^\s*(\/?)>/） */
const startTagClose = /^\s*(\/?)>/;

/* 查找关闭标签 */
const endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>');
/* 匹配{{}}双花括号 */
const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g;

/* 匹配for循环 */
const forAliasRE = /(.*?)\s+(?:in|of)\s+(.*)/;

let index = 0;
let html = `<div v-for="item in list" class="one" v-if="show"><span>{{item}}-{{test}}</span></div>`;

/* 移去已经匹配的内容 */
function advance(n) {
    index += n;
    html = html.substring(n)
}

function parseHTML() {
    // console.log(html)
    while (html) {
        let textEnd = html.indexOf('<');
        if (textEnd === 0) {
            const endTagMatch = html.match(endTag)
            if (endTagMatch) {
                // 匹配到结束标签
                advance(endTagMatch[0].length);
                parseEndTag(endTagMatch[1]);
                continue;
            }
            if (html.match(startTagOpen)) {
                // 匹配到开始标签
                const startTagMatch = parseStartTag();

                /* 
                with(startTagMatch){
                    const element = {
                        type: 1,
                        tag: tagName,
                        lowerCasedTag: tagName.toLowerCase(),
                        attrsList: attrs,
                        attrsMap: makeAttrsMap(attrs),
                        parent: currentParent,
                        children: []
                    }
                }
                */
                // console.log( "打印文本 tag", startTagMatch)
                const element = {
                    type: 1,
                    tag: startTagMatch.tagName,
                    lowerCasedTag: startTagMatch.tagName.toLowerCase(),
                    attrsList: startTagMatch.attrs,
                    attrsMap: makeAttrsMap(startTagMatch.attrs),
                    parent: currentParent,
                    children: []
                }
                
                processIf(element);
                processFor(element);

                if (!root) {
                    root = element;
                }

                if(currentParent){
                    currentParent.children.push(element);
                }

                stack.push(element);
                currentParent = element;
                
                
                continue;
            }
        } else {
            // 匹配到文本
            text = html.substring(0, textEnd);
            advance(textEnd);
            let expression;
            if(!currentParent){
                currentParent = {
                    children: []
                };
            }
            
            expression = parseText(text) 
            if(expression) {
                currentParent.children.push({
                    type: 2,
                    text,
                    expression
                });
            } else {
                currentParent.children.push({
                    type: 3,
                    text
                })
            }
            

            continue;
        }
        // html = null;
    }
    
}

function parseStartTag() {
    const start = html.match(startTagOpen);
    // console.log(start, "parseStartTag startTagOpen")
    if (start) {
        const match = {
            tagName: start[1],
            attrs: [],
            start: index
        }
        
        advance(start[0].length);

        // console.log(html, "parseStartTag match", start)
        let end, attr;
        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            advance(attr[0].length)
            match.attrs.push({
                name: attr[1],
                value: attr[3]
            })

            // console.log("come in", match)
        }
        // console.log(html.match(startTagClose), "parseStartTag startTagClose", html)

        if (end) {
            match.unarySlash = end[1];
            advance(end[0].length);
            match.end = index;
            // console.log(match, "parseStartTag return")

            return match;
        }
    }

    return {};
}

function parseEndTag (tagName) {
    let pos;
    for(pos = stack.length - 1; pos >= 0; pos--){
        if(stack[pos].lowerCasedTag === tagName.toLowerCase()){
            break;
        }
    }

    if(pos >= 0) {
        stack.length = pos;
        currentParent = stack[pos];
    }
}

function parseText (text) {
    if(!defaultTagRE.test(text)) return;

    const tokens = [];
    let lastIndex = defaultTagRE.lastIndex = 0;
    let match, index;
    while ((match = defaultTagRE.exec(text))){
        index = match.index;
        if (index > lastIndex){
            tokens.push(JSON.stringify(text.slice(lastIndex, index)))
        }

        const exp = match[1].trim();
        tokens.push(`_s(${exp})`);
        lastIndex = index + match[0].length;
    }

    if(lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)))
    }
    
    return tokens.join('+');
}

/* 从le的attrsMap属性或者attrsList中获取name对应的值 */
function getAndRemoveAttr (el, name) {
    let val;
    // console.log("getAndRemoveAttr 获取name对应的值", el.attrsMap[name])
    if ((val = el.attrsMap[name])){
        const list = el.attrsList;
        for (let i = 0, l = list.length; i < l; i++){
            if (list[i].name === name){
                list.splice(i, 1);
                break;
            }
        }
    }

    return val;
}

function processFor (el) {

    let exp;
    if ((exp = getAndRemoveAttr(el, "v-for")) != null){
        // console.log("==========process for==========")
        const inMatch = exp.match(forAliasRE);
        el.for = inMatch[2].trim();
        el.alias = inMatch[1].trim();
    }
    console.log(exp)
}

function processIf (el) {
    const exp = getAndRemoveAttr(el, 'v-if');
    if(exp) {
        // console.log("==========process if==========")
        el.if = exp;
        if (!el.ifConditions) {
            el.ifConditions = [];
        }

        el.ifConditions.push({
            exp: exp,
            block: el
        });
    }
}

/* 将attrs转换成map格式 */
function makeAttrsMap (attrs) {
    const map = {}
    for (let i = 0, l = attrs.length; i < l; i++){
        map[attrs[i].name] = attrs[i].value;
    }
    return map;
}

/* 存放解析好的标签头 */
const stack = [];
/* currentParent 存放当前标签的父标签节点引用， root指向根标签节点 */
let currentParent, root;

function isStatic (node) {
    if(node.type === 2) {
        return false;
    }
    if (node.type == 3) {
        return true;
    }

    return (!node.if && !node.for);
}

function markStatic (node) {
    node.static = isStatic(node);
    if(node.type === 1) {
        for (let i = 0, l = node.children.length; i < l; i ++) {
            const child = node.children[i];
            markStatic(child);
            if(!child.static) {
                node.static = false;
            }
        }
    }
}

function markStaticRoots (node) {
    if(node.type === 1) {
        if (node.static && node.children.length && !(
            node.children.length === 1 && 
            node.children[0].type === 3 
        )){
            node.staticRoot = true;
            return;
        } else {

            node.staticRoot = false;
        }
    }
}

function optimize (rootAst) {
    markStatic(rootAst);
    markStaticRoots(rootAst);
}


function renderList (val, render) {
    let ret = new Array(val.length);
    for (i = 0, l = val.length; i < l; i++){
        ret[i] = render(val[i], i);
    }
}

function genIf (el) {
    el.ifProcessed = true;
    if(!el.ifConditions.length) {
        return '_e()';
    }
    
    return `(${el.ifConditions[0].exp})?${genElement(el.ifConditions[0].block)}: _e()`
}

function genFor (el) {
    el.forProcessed = true;

    const exp = el.for;
    const alias = el.alias;
    const iterator1 = el.iterator1 ? `,${el.iterator1}` : '';
    const iterator2 = el.iterator2 ? `,${el.iterator2}` : '';

    return `_l((${exp}),` +
           `function(${alias}${iterator1}${iterator2}){`+
           `retrun ${genElement(el)}` +
           '})';
}

function genText (el) {
    return `_v(${el.expression})`
}

function genNode (el) {
    if (el.type === 1) {
        return genElement(el);
    } else {
        return genText(el);
    }
}

function genChildren (el) {
    const children = el.children;
    if (children && children.length > 0) {
        return `${children.map(genNode).join(',')}`;
    }
}

function genElement (el = {}) {
    if (el.if && !el.ifProcessed) {
        return genIf(el);
    } else if (el.for && !el.forProcessed) {
        return genFor(el);
    } else {
        const children = genChildren(el);
        let code;
        code = `_c('${el.tag}', '{
            staticClass: ${el.attrsMap && el.attrsMap[':class']},
            class: ${el.attrsMap && el.attrsMap['class']},
        }${
            children ? `,${children}` : ''
        })`

        return code;
    }
}

function generate (rootAst) {
    const code = rootAst ? genElement(rootAst) : '_c("div")';
    return {
        render: `with(this){return ${code}}`
    }
}



function render () {
    return new VNode(
        'span',
        /* 指令集合数组 */
        {
            directives:[{
                /* v-show指令 */
                rawName: 'v-show',
                expression: 'isShow',
                name: 'show',
                value: true
            }],
            /* 静态class */
            staticClass: 'demo'
        },
        [new VNode(undefined, undefined, undefined, 'This is a span.', undefined)]
    )
}
/* 创建空节点 */
function createEmptyVNode () {
    const node = new VNode();
    node.text = '';
    return node;
}
/* 创建文本节点 */
function createTextVNode (val) {
    return new VNode(undefined, undefined, undefined, String(val));
}
/* 克隆节点 */
function cloneVNode (node) {
    const clone_node = new VNode(
        node.tag,
        node.data,
        node.children,
        node.text,
        node.elm
    )
    return clone_node;
}

parseHTML()
console.log("========= parse html ===========")
console.log(root)
console.log("========= generate ===========")
console.log(generate(root))

