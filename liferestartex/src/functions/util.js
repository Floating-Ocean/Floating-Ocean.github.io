function clone(value) {
    switch(typeof value) {
        case 'object':
            if(Array.isArray(value)) return value.map(v=>clone(v));
            const newObj = {};
            for(const key in value) newObj[key] = clone(value[key]);
            return newObj;
        default: return value;
    }
}

function max(...arr) {
    return Math.max(...arr.flat());
}

function min(...arr) {
    return Math.min(...arr.flat());
}

function sum(...arr) {
    let s = 0;
    arr.flat().forEach(v=>s+=v);
    return s;
}

function average(...arr) {
    const s = sum(...arr);
    return s / arr.flat().length;
}

function weightRandom(list) {
    let totalWeights = 0;
    for(const [, weight] of list)
        totalWeights += weight;

    let random = Math.random() * totalWeights;
    for(const [id, weight] of list)
        if((random-=weight)<0)
            return id;
    return list[list.length-1];
}

function listRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function map2json(map){
    let obj= Object.create(null);
    for (let[k,v] of map)
        obj[k] = v;
    return obj;
}

function obj2strMap(obj){
    let strMap = new Map();
    for (let k of Object.keys(obj)) {
      strMap.set(k,obj[k]);
    }
    return strMap;
  }

function json2map(jsonStr){
    return obj2strMap(jsonStr);
}

//Fisher–Yates shuffle
function shuffleSelf(array, size) {
    var index = -1,
        length = array.length,
        lastIndex = length - 1;
    size = size === undefined ? length : size;
    while (++index < size) {
        // var rand = baseRandom(index, lastIndex),
        var rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
        var value = array[rand];
        array[rand] = array[index];
        array[index] = value;
    }
    array.length = size;
    return array;
}

export { clone, max, min, sum, average, weightRandom, listRandom, map2json, json2map, shuffleSelf };