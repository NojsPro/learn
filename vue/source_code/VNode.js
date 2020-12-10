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

/* 
render() 对应的vue组件
<template>
    <span class="demo" v-show="isShow">this is a span</span>
</template> 
*/

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

console.log(JSON.stringify(render()))