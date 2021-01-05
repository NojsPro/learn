const ws = new WeakSet();

var val1 = {id: 1},
      val2 = {id: 2},
      val3 = {id: 3},
      val4 = {id: 3};
const ws1 = new WeakSet([val1, val2, val3])

console.log(ws1.has(val4))
val1 = null
console.log(ws1.has(val1))
val1 = {id: 1}

console.log(ws1.has(val1))


/**
* 声明之后，构造函数就有了一个
* 与之关联的原型对象：
*/
function Person() {}
console.log(typeof Person.prototype);
console.log(Person.prototype);