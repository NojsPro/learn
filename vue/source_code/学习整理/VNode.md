## 流程图

![vue](./image/vue.jpg)

## 编译

compile 编译可以分成`parse`、`optimize`与`generate`三个阶段，最终得到`render function`。

### parse

`parse`会用正则等方式解析`template`模板中的指令、`class`、`style`等数据，形成`AST`（抽象语法树）。

> It is a hierarchical program representation that presents source code structure according to the grammar of a programming language, each `AST` node corresponds to an item of a source code.
>
> 它是一种分层的程序表示，它根据编程语言的语法来表示源代码结构，每个`AST`节点对应一个源代码项。





