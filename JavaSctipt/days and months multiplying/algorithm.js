/* 
类似逆波兰表达式的算法题
将字符串HG[3|B[2|AC]]F按照括号里的数量展开 --> HG[3|BACAC]F --> HGBACACBACACBACACF
*/

let test = 'HG[3|B[2|AC]]F';


function changString(str) {
    console.time("string")
    let oldStr = str;
    let newStr = str;
    let startTag = [];
    let start = -1;
    let end = str.indexOf(']');
    do {
        start = str.indexOf('[', start + 1);
        if(start !== -1){
            startTag.unshift(start)
        } else {
            break
        }
    } while (start !== -1);
    for (const startIdx of startTag) {
        if(end !== -1 && startIdx !== -1){
            let value = str.substring(startIdx + 1, end)
            let idx = value.indexOf('|')
            if(idx !== -1 && idx !== 0){
                let s = ''
                for(let i = 0, l = parseInt(value.substring(0, idx)); i < l; i++) {
                    s += value.substring(idx + 1)
                }

                newStr = str.substring(0,startIdx) + s + str.substring(end+1)

            }
        }
        str = newStr;
        end = str.indexOf(']')
    }

    console.timeEnd("string")
    return newStr;
}

function changString2(str) {
    const alp = [];
    let temp = [];
    for (let i = 0; i < str.length; i++) {
      if (str[i] !== "[" && str[i] !== "]") {
        alp.push(str[i]);
      } else if (str[i] === "]") {
        while (alp[alp.length - 1] !== "|") {
          temp.push(alp.pop());
        }
        alp.pop(); //将符号|去掉
        const time = Number(alp.pop());//拿到数字
        temp = temp.reverse().join("").repeat(time);
        alp.push(temp);
        temp = [];
      }
    }
    const res = alp.join("");
    return res;
  }

console.log(changString(test));