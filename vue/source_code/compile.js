/* 匹配任意字符 */
const ncname = '[a-zA-Z_][\\w\\-\\.]*';
/* [^\s"'<>/= 至少有一个这样的字符 */
const singleAttrIdentifier = /([[^\s"'<>/=]+)/;
/* 匹配等于号 */
const singleAttrAssign = /(?:=)/;

const singleAttrValues = [
    /"([^"])"+/.source,
    /'([^'])'+/.source,
    /([^\s"'=<>`]+)/.source,
];

/* 
应该是找到标签上的属性
/^\s*([[^\s"'<>/=]+)(?:\s*((?:=))\s*(?:"([^"])"+|'([^'])'+|([^\s"'=<>`]+)))?/
*/
const attribute = new RegExp(
    '^\\s*' + singleAttrIdentifier.source +
    '(?:\\s*(' + singleAttrAssign.source + ')' +
    '\\s*(?:' + singleAttrValues.join('|') + '))?'
);


const qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')';

/* 查找开始标签 */
const startTagOpen = new RegExp('^<' + qnameCapture);
/* 匹配 > 符 */
const startTagClose = /^\s*(\/?)>/;

/* 查找关闭标签 */
const endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>');
/* 匹配{{}}双花括号 */
const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g;

/* 匹配for循环 */
const forAliasRE = /(.*?)\s+(?:in|of)\s+(.*)/;

let index = 0;
let html = `<div>
            <span>{{item}}</span>
        </div>`;

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
                const element = {
                    type: 1,
                    tag: startTagMatch.tagName,
                    lowerCasedTag: startTagMatch.tagName.toLowerCase(),
                    attrsList: startTagMatch.attrs,
                    attrsMap: makeAttrsMap(startTagMatch.attrs),
                    parent: currentParent,
                    children: []
                }
                
                /* processIf(element);
                processFor(element); */

                if (!root) {
                    root = element;
                }

                if(currentParent){
                    currentParent.children.push(element);
                }

                stack.push(element);
                currentParent = element;
                
                console.log(stack, currentParent, html + 'hello', "打印文本 tag")
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
            console.log(parseText(text), "打印文本 text")
            if(expression == parseText(text)) {
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
    if (start) {
        const match = {
            tagName: start[1],
            attrs: [],
            start: index
        }

        advance(start[0].length);

        let end, attr;
        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            advance(attr[0].length)
            match.attrs.push({
                name: attr[1],
                value: attr[3]
            })
        }
        // console.log(attribute)

        if (end) {
            match.unarySlash = end[1];
            advance(end[0].length);
            match.end = index;

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
    console.log(text, "parse Text 格式化文本")
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
    if ((val = el.attrsMap[name]) != null){
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
        
        /* const inMatch = exp.match(forAliasRE)；
        el.for = inMatch[2].trim();
        el.alias = inMatch[1].trim(); */
    }
    console.log(exp)
}

function processIf (el) {
    const exp = getAndRemoveAttr(el, 'v-if');
    if(exp) {
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

parseHTML()