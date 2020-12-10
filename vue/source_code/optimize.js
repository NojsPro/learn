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

    return `(${el.ifConditions[0].exp})?${genElement(el.ifConditions[0].Block)}: _e()`
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
        return `${children.map(genNode).json(',')}`;
    }
}

function genElement (el) {
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