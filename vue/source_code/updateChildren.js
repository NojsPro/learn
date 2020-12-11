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