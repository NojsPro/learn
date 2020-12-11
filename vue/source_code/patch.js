/* 调用不同平台的api */
const nodeOps = {
    setTextContent (text) {
        if (platform == 'weex') {
            nodeOps.parentNode.setAttr('value', text);
        } else if (platform === 'web'){
            nodeOps.textContent = text;
        }
    },
    parentNode () {

    },
    removeChild () {

    },
    nextSibing () {

    },
    insertBefore () {

    },
    appendChild () {

    },
    createElement() {

    },
    createTextNode() {

    }
}
/* insert 用来在parent这个父节点下插入一个子节点， 如果指定来ref则插入到ref这个子节点前面 */
function insert (parent, elm, ref) {
    if (parent) {
        if (ref) {
            if (ref.parentNode === parent) {
                nodeOps.insertBefore(parent, elm, ref);
            }
        } else {
            nodeOps.appendChild(parent, elm);
        }
    }
}

/* 新建节点，如果tag存在创建一个标签节点否则创建一个文本节点 */
function createElm (vnode, parentElm, refElm) {
    if (vnode.tag) {
        insert(parentElm, nodeOps.createElement(vnode.tag), refElm);
    } else {
        insert(parentElm, nodeOps.createTextNode(vnode.text), refElm)
    }
}

/* 批量调用createElm新建节点 */
function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx) {
    for (; startIdx < endIdx; ++startIdx){
        createElm(vnodes[startIdx], parentElm, refElm);
    }
}

/* 移除一个节点 */
function removeNode (el) {
    const parent = nodeOps.parentNode(el);
    if(parent) {
        nodeOps.removeChild(parent, el);
    }
}
/* 批量调用removeNode移除节点 */
function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx < endIdx; ++startIdx){
        const ch = vnodes[startIdx];
        if(ch) {
            removeNode(ch.elm);
        }
    }
}

/* patch的主要功能是比对两个VNode节点，将差异更新到视图上 */
function patch(oldVnode, vnode, parentElm) {
    // 没有oldVnode，直接添加vnode节点
    if (!oldVnode) {
        addVnodes(parentElm, null, vnode, 0, vnode.length -1);
    // 如果vnode为空，则删除oldvnode
    } eise if (!vnode) {
        removeVnodes(parentElm, oldVnode, 0, oldVnode.length - 1);
    } else {
        // 如果节点相同则调用patchVnode比对VNode
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode);
        // 不同就移除就得，增加新的
        } else {
            removeVnodes(parentElm, oldVnode, 0, oldVnode.length - 1);
            addVnodes(parentElm, null, vnode, 0, vnode.length - 1)
        }
    }
}
/* 判断两个VNode是否相同 */
function sameVnode(a, b){
    return (
        a.key === b.key &&
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        (!!a.data) === (!!b.data) &&
        sameInputType(a, b)
    )
}
/* 判断input类型的VNode是否相同 */
function sameInputType (a, b) {
    if (a.tag !== 'input') return true;
    let i;
    const typeA = (i = a.data) && (i = i.attrs) && i.type;
    const typeB = (i = b.data) && (i = i.attrs) && i.type;

    return typeA === typeB;
}

/* 比对VNode */
function patchVnode (oldVnode, vnode) {
    // 如果两个节点一样直接返回
    if (oldVnode === vnode) {
        return;
    }
    // 如果两个vnode都是静态且key相同
    if(vnode.isStatic && oldVnode.isStatic && vnode.key === oldVnode.key){
        vnode.elm = oldVnode.elm;
        vnode.componentInstance = oldVnode.componentInstance;
        return;
    }

    // elm 真是dom
    const elm = vnode.elm = oldVnode.elm;
    // 新旧vnode的子节点
    const oldCh = oldVnode.children;
    const ch = vnode.children;
    // 如果是文本直接给节点设置内容
    if(vnode.text) {
        nodeOps.setTextContent(elm, vnode.text)
    } else {
        // 如果新旧子节点都存在且不相等，就更新子节点
        if (oldCh && ch && (oldCh !== ch)) {
            updateChildren(elm, oldCh, ch);
        } else if (ch) { // 如果新子节点存在，添加新节点
            // 如果旧节点类型为文本就清空内容
            if (oldVnode.text) {
                nodeOps.setTextContent(elm, '');
            }
            addVnodes(elm, null, ch, 0, ch.length - 1);
        } else if (oldCh) { // 旧节点有子节点存在且新节点没有子节点，移除旧节点
            removeVnodes(elm, oldCh, 0, oldCh.length - 1);
        } else if (oldVnode.text){ // 如果旧节点是文本就清空
            nodeOps.setTextContent(elm, '');
        }
    }


}

function updateChildren (parentElm, oldCh, newCh) {
    let oldStartIdx = 0; // 开始old vnode索引
    let newStartIdx = 0;// 开始new vnode索引
    let oldEndIdx = oldCh.length -1; // 最后的old vnode索引
    let newEndIdx = newCh.length - 1; // 最后的new vnode索引
    let newEndVnode = newCh[newEndIdx]; // 最后的new vnode
    let oldEndVnode = oldCh[oldEndIdx]; // 最后的old vnode
    let oldStartVnode = oldCh[0]; // 开始的old vnode
    let newStartVnode = newCh[0]; // 开始的new vnode
    let oldKeyToIdx, idxInOld, elmToMove, refElm;
    // 循环过程中 oldStartIdx, newStartIdx,newEndIdx和oldEndIdx会逐渐向中间靠拢
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if(!oldStartVnode) {
            oldStartVnode = oldCh[++oldStartIdx];
        } else if (!oldEndVnode) {
            oldEndVnode = oldCh[--oldEndIdx];
        } else if (sameVnode(oldStartVnode, newStartVnode)){
            patchVnode(oldStartVnode, newStartVnode);
            oldStartVnode = oldCh[++oldStartIdx];
            newStartVnode = newCh[++newStartIdx];
        } else if (sameVnode(oldStartVnode, newEndVnode)){
            patchVnode(oldStartVnode, newEndVnode);
            nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
            oldStartVnode = oldCh[++oldStartIdx];
            newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldEndVnode, newStartVnode)){
            patchVnode(oldStartVnode, newEndVnode);
            nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
            oldStartVnode = oldCh[++oldStartIdx];
            newStartVnode = newCh[++newStartIdx];
        } else {
            let elmToMove = oldCh[idxInOld];
            if (!oldKeyToIdx) {
                oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
            }
            idxInOld = newStartVnode.key ? oldKeyToIdx[newStartVnode.key] : null;
            if (!idxInOld) {
                createElm(newStartVnode, parentElm);
                newStartVnode = newCh[++newStartIdx];
            } else {
                elmToMove = oldCh[idxInOld];
                if (sameVnode(elmToMove, newStartVnode)){
                    patchVnode(elmToMove, newStartVnode);
                    oldCh[idxInOld] = undefined;
                    nodeOps.insertBefore(parentElm, newStartVnode.elm, oldStartVnode.elm);
                    newStartVnode = newCh[++newStartIdx];
                } else {
                    createElm(newStartVnode, parentElm);
                    newStartVnode = newCh[++newStartIdx];
                }
            }
        }
    }

    if (oldStartIdx > oldEndIdx) {
        refElm = (newCh[newEndIdx + 1]) ?newCh[newEndIdx + 1].elm : null;
        addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx);
    } else if (newStartIdx > newEndIdx) {
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
}


function createKeyToOldIdx (children, beginIdx, endIdx) {
    let i, key;
    const map = {};
    for(i = beginIdx; i <= endIdx; ++i) {
        key = children[i].key;
        if(isDef(key)) map[key] = i
    }

    return map
}