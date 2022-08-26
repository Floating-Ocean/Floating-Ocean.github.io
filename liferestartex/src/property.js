import { max, min, sum, clone, listRandom, map2json, json2map } from './functions/util.js';

class Property {
    constructor() {}

    TYPES = {
        // 本局
        AGE: "AGE", // 年龄 age AGE
        CCI: "CCI", //当前虚拟章节id Current Chapter Id CCI
        ISVA: "ISVA", //年龄是否虚拟 is virtual age ISVA
        VAR: "VAR", //构建分支 variant
        CRVFR: "CRVFR", //角色值 character value for read
        CHR: "CHR", // 颜值 charm CHR
        INT: "INT", // 智力 intelligence INT
        STR: "STR", // 体质 strength STR
        MNY: "MNY", // 家境 money MNY
        SPR: "SPR", // 快乐 spirit SPR
        LIF: "LIF", // 生命 life LIFE
        TLT: "TLT", // 天赋 talent TLT
        EVT: "EVT", // 事件 event EVT
        TMS: "TMS", // 次数 times TMS

        // Auto calc
        LAGE: "LAGE", // 最低年龄 Low Age
        HAGE: "HAGE", // 最高年龄 High Age
        LCHR: "LCHR", // 最低颜值 Low Charm
        HCHR: "HCHR", // 最高颜值 High Charm
        LINT: "LINT", // 最低智力 Low Intelligence
        HINT: "HINT", // 最高智力 High Intelligence
        LSTR: "LSTR", // 最低体质 Low Strength
        HSTR: "HSTR", // 最高体质 High Strength
        LMNY: "LMNY", // 最低家境 Low Money
        HMNY: "HMNY", // 最高家境 High Money
        LSPR: "LSPR", // 最低快乐 Low Spirit
        HSPR: "HSPR", // 最高快乐 High Spirit

        SUM: "SUM", // 总评 summary SUM

        EXT: "EXT", // 继承天赋

        // 总计
        // Achievement Total
        ATLT: "ATLT", // 拥有过的天赋 Achieve Talent
        AEVT: "AEVT", // 触发过的事件 Achieve Event
        ACHV: "ACHV", // 达成的成就 Achievement
        AEVRFR: "AEVRFR", // 一次重开触发的事件频率 Event Rate for Reading
        AEVRFS: "AEVRFS", // 一次重开触发的事件频率 Event Rate for Saving

        //Event Rate 逻辑：
        //1.第一次所有数组为空;
        //2.在life页将数据存储到 for saving 数组;
        //3.在summary页将 for saving 数组存到 for reading 数组，并清空 for saving 数组;
        //4.重复2,3操作.

        CTLT: "RTLT", // 天赋选择数 Count Talent
        CEVT: "REVT", // 事件收集数 Count Event
        CACHV: "CACHV", // 成就达成数 Count Achievement

        // SPECIAL
        RDM: 'RDM', // 随机属性 random RDM

    };

    // 特殊类型
    SPECIAL = {
        RDM: [ // 随机属性 random RDM
            this.TYPES.CHR,
            this.TYPES.INT,
            this.TYPES.STR,
            this.TYPES.MNY,
            this.TYPES.SPR,
        ]
    }

    #ageData;
    #chapterAgeData;
    #chapterAges;
    #characterValue;
    #initialCharacterValue;
    #data = {};
    #backupData;
    #backupChapterAges;
    #backupCharacterValue;
    #appBranch;
    #variantMap = {};

    initial({age, chapterAge, character, appBranch}) {
        this.#ageData = this.generateAgeData(age);
        this.appBranch = appBranch;
        this.#chapterAgeData = new Map();
        this.#chapterAges = new Map();
        this.#initialCharacterValue = character;
        this.initialChapterAge(chapterAge);
        this.refreshCharacter();
        this.initialVariantMap();
    }

    initialVariantMap(){
        this.#variantMap = {
            "release": 0,
            "beta": 1,
            "dev": 2
        };
    }

    initialChapterAge(chapterAge){
        chapterAge.forEach(each => {
            const [id, backColorDark, backColorLight, data] = each;
            this.#chapterAgeData.set(Number(id), [this.generateAgeData(data), backColorDark, backColorLight]); //读取各章节age数据
            this.#chapterAges.set(Number(id) ,-1); //为虚拟年龄赋初值
        });
    }

    initialCharacter(character){
        for(const each in character){
            const {id, name, initial} = each;
            if(!this.#characterValue.hasOwnProperty(Number(id)))
                this.#characterValue.set(Number(id), initial || 0); //initial value
        }
    }

    cloneEntry(from){
        let to = {};
        for(const key in from)
            to[key] = from[key];
        return to;
    }

    cloneMap(from){
        let to = new Map();
        for(const key in from)
            to.set(key, from[key]);
        return to;
    }

    backupProperties(){
        this.#backupData = this.cloneEntry(this.#data);
        this.#backupCharacterValue = this.cloneMap(this.#characterValue);
        this.#backupChapterAges = this.cloneMap(this.#chapterAges);
    }

    restoreBackup(){
        this.#data = this.cloneEntry(this.#backupData);
        this.#characterValue = this.cloneMap(this.#backupCharacterValue);
        this.#chapterAges = this.cloneMap(this.#backupChapterAges);
    }

    refreshCharacter(){
        this.#characterValue = json2map(this.lsget(this.TYPES.CRVFR) || "[]");
        this.initialCharacter(this.#initialCharacterValue);
    }

    generateAgeData(age){
        for(const a in age) {
            let { event, talent } = age[a];
            if(!Array.isArray(event))
                event = event?.split(',') || [];

            event = event.map(v=>{
                const value = `${v}`.split('*').map(n=>Number(n));
                if(value.length==1) value.push(1);
                return value;
            });

            if(!Array.isArray(talent))
                talent = talent?.split(',') || [];

            talent = talent.map(v=>Number(v));

            age[a] = { event, talent };
        }
        return age;
    }

    restart(data) {
        this.#data = {
            [this.TYPES.AGE]: -1,
            [this.TYPES.CCI]: -1,
            [this.TYPES.ISVA]: false,
            [this.TYPES.VAR]: this.#variantMap[this.#appBranch],

            [this.TYPES.CHR]: 0,
            [this.TYPES.INT]: 0,
            [this.TYPES.STR]: 0,
            [this.TYPES.MNY]: 0,
            [this.TYPES.SPR]: 0,

            [this.TYPES.LIF]: 1,

            [this.TYPES.TLT]: [],
            [this.TYPES.EVT]: [],

            [this.TYPES.LAGE]: Infinity,
            [this.TYPES.LCHR]: Infinity,
            [this.TYPES.LINT]: Infinity,
            [this.TYPES.LSTR]: Infinity,
            [this.TYPES.LSPR]: Infinity,
            [this.TYPES.LMNY]: Infinity,

            [this.TYPES.HAGE]: -Infinity,
            [this.TYPES.HCHR]: -Infinity,
            [this.TYPES.HINT]: -Infinity,
            [this.TYPES.HSTR]: -Infinity,
            [this.TYPES.HMNY]: -Infinity,
            [this.TYPES.HSPR]: -Infinity,
        };
        for(const key in data)
            this.change(key, data[key]);
        this.lsdel(this.TYPES.AEVRFS);
        for(const key in this.#chapterAges.keys()) //reset chapter age.
            this.chapterAge.set(key, -1);
        this.refreshCharacter();
    }

    restartLastStep() {
        this.#data[this.TYPES.LAGE] = this.get(this.TYPES.AGE);
        this.#data[this.TYPES.LCHR] = this.get(this.TYPES.CHR);
        this.#data[this.TYPES.LINT] = this.get(this.TYPES.INT);
        this.#data[this.TYPES.LSTR] = this.get(this.TYPES.STR);
        this.#data[this.TYPES.LSPR] = this.get(this.TYPES.SPR);
        this.#data[this.TYPES.LMNY] = this.get(this.TYPES.MNY);
        this.#data[this.TYPES.HAGE] = this.get(this.TYPES.AGE);
        this.#data[this.TYPES.HCHR] = this.get(this.TYPES.CHR);
        this.#data[this.TYPES.HINT] = this.get(this.TYPES.INT);
        this.#data[this.TYPES.HSTR] = this.get(this.TYPES.STR);
        this.#data[this.TYPES.HMNY] = this.get(this.TYPES.MNY);
        this.#data[this.TYPES.HSPR] = this.get(this.TYPES.SPR);
    }

    callSummary(){ //用于监听转到summary页
        var map = new Map();
        this.get(this.TYPES.AEVRFS)
        .forEach(([id, tick]) => {
            if(!map.has(id)) {
                map.set(id, 1);
            }else{
                map.set(id, map.get(id) + 1);
            }
        });
        this.lsset(this.TYPES.AEVRFR, map2json(map));
        this.lsset(this.TYPES.CRVFR, map2json(this.#characterValue)); //save the crv.
    }

    get(prop) {
        switch(prop) {
            case this.TYPES.AGE:
            case this.TYPES.CCI:
            case this.TYPES.ISVA:
            case this.TYPES.VAR:
            case this.TYPES.CHR:
            case this.TYPES.INT:
            case this.TYPES.STR:
            case this.TYPES.MNY:
            case this.TYPES.SPR:
            case this.TYPES.LIF:
            case this.TYPES.TLT:
            case this.TYPES.EVT:
                return clone(this.#data[prop]);
            case this.TYPES.LAGE:
            case this.TYPES.LCHR:
            case this.TYPES.LINT:
            case this.TYPES.LSTR:
            case this.TYPES.LMNY:
            case this.TYPES.LSPR:
                return min(
                    this.#data[prop],
                    this.get(this.fallback(prop))
                );
            case this.TYPES.HAGE:
            case this.TYPES.HCHR:
            case this.TYPES.HINT:
            case this.TYPES.HSTR:
            case this.TYPES.HMNY:
            case this.TYPES.HSPR:
                return max(
                    this.#data[prop],
                    this.get(this.fallback(prop))
                );
            case this.TYPES.SUM:
                /***
                 * calculate method:
                 * factors:
                 * age 52% current/500
                 * chr, int, str, mny, spr 9.6% each current/1273 (convert negative numbers to 0)
                */
                let age = this.get(this.TYPES.HAGE) / 500 * 0.52;
                let chr = this.get(this.TYPES.HCHR) / 1273 * 0.096;
                let int = this.get(this.TYPES.HINT) / 1273 * 0.096;
                let str = this.get(this.TYPES.HSTR) / 1273 * 0.096;
                let mny = this.get(this.TYPES.HMNY) / 1273 * 0.096;
                let spr = this.get(this.TYPES.HSPR) / 1273 * 0.096;
                return Math.floor(sum(age, chr, int, str, mny, spr) * 1000000);
            case this.TYPES.TMS:
                return this.lsget('times') || 0;
            case this.TYPES.EXT:
                return this.lsget('extendTalent') || null;
            case this.TYPES.ATLT:
            case this.TYPES.AEVT:
            case this.TYPES.ACHV:
            case this.TYPES.AEVRFS:
            case this.TYPES.AEVRFR:
            case this.TYPES.CRVFR:
                return this.lsget(prop) || [];
            case this.TYPES.CTLT:
            case this.TYPES.CEVT:
            case this.TYPES.CACHV:
                return this.get(
                    this.fallback(prop)
                ).length;
            default: return 0;
        }
    }

    getItem(prop, id){
        switch(prop){
            case "AEVR":
                return json2map(this.lsget(this.TYPES.AEVRFR) || "[]").get(id.toString()) || -1;
            case "VAGE": 
                return this.#chapterAges.get(id);
            case "CRV":
                return this.#characterValue.get(id.toString()) || -1;
            default:
                return 0;
        }
    }

    fallback(prop) {
        switch(prop) {
            case this.TYPES.LAGE:
            case this.TYPES.HAGE: return this.TYPES.AGE;
            case this.TYPES.LCHR:
            case this.TYPES.HCHR: return this.TYPES.CHR;
            case this.TYPES.LINT:
            case this.TYPES.HINT: return this.TYPES.INT;
            case this.TYPES.LSTR:
            case this.TYPES.HSTR: return this.TYPES.STR;
            case this.TYPES.LMNY:
            case this.TYPES.HMNY: return this.TYPES.MNY;
            case this.TYPES.LSPR:
            case this.TYPES.HSPR: return this.TYPES.SPR;
            case this.TYPES.CTLT: return this.TYPES.ATLT;
            case this.TYPES.CEVT: return this.TYPES.AEVT;
            case this.TYPES.CACHV: return this.TYPES.ACHV;
            default: return;
        }
    }

    set(prop, value) {
        switch(prop) {
            case this.TYPES.AGE:
            case this.TYPES.CHR:
            case this.TYPES.INT:
            case this.TYPES.STR:
            case this.TYPES.MNY:
            case this.TYPES.SPR:
            case this.TYPES.LIF:
            case this.TYPES.TLT:
            case this.TYPES.EVT:
                this.hl(prop, this.#data[prop] = clone(value));
                this.achieve(prop, value);
                return;
            case this.TYPES.CCI:
            case this.TYPES.ISVA:
                this.#data[prop] = clone(value);
                this.achieve(prop, value);
                return;
            case this.TYPES.TMS:
                this.lsset('times', parseInt(value) || 0);
                return;
            case this.TYPES.EXT:
                this.lsset('extendTalent', value);
                return
            default: return;
        }
    }

    getLastRecord() {
        return clone({
            [this.TYPES.AGE]: this.get(this.TYPES.AGE),
            [this.TYPES.CHR]: this.get(this.TYPES.CHR),
            [this.TYPES.INT]: this.get(this.TYPES.INT),
            [this.TYPES.STR]: this.get(this.TYPES.STR),
            [this.TYPES.MNY]: this.get(this.TYPES.MNY),
            [this.TYPES.SPR]: this.get(this.TYPES.SPR),
        });
    }

    change(prop, value) {
        if(Array.isArray(value)) {
            for(const v of value)
                this.change(prop, Number(v));
            return;
        }
        switch(prop) {
            case this.TYPES.AGE:
            case this.TYPES.CHR:
            case this.TYPES.INT:
            case this.TYPES.STR:
            case this.TYPES.MNY:
            case this.TYPES.SPR:
                this.hl(prop, this.#data[prop] += Number(value));
                return;
            case this.TYPES.LIF:
                if(this.#data[this.TYPES.ISVA] && Number(value) < -1){ //这里用来清零某 chapter 的 age
                    this.#chapterAges.set(this.get(this.TYPES.CCI), -1);
                    this.#data[this.TYPES.CCI] = -1;
                }else
                    this.hl(prop, this.#data[prop] += Number(value));
                return;
            case this.TYPES.CCI:
                this.#data[prop] = Number(value);
                return;
            case this.TYPES.ISVA:
                this.#data[prop] = Boolean(value);
                return;
            case this.TYPES.TLT:
            case this.TYPES.EVT:
                const v = this.#data[prop];
                if(value < 0) {
                    const index = v.indexOf(value);
                    if(index!=-1) v.splice(index,1);
                }
                if(!v.includes(value)) v.push(value);
                this.achieve(prop, value);
                this.achieve(this.TYPES.AEVRFS, value);
                return;
            case this.TYPES.TMS:
                this.set(
                    prop,
                    this.get(prop) + parseInt(value)
                );
                return;
            default: 
                if(prop.search(/VAGE\(\d+\)/) != -1){ //this is vage...
                    let id = Number(prop.replace("VAGE(", "").replace(")", ""));
                    this.#chapterAges.set(id, this.#chapterAges.get(id) + Number(value));
                }else if(prop.search(/CRV\(\d+\)/) != -1){ //needless to say...
                    let id = Number(prop.replace("CRV(", "").replace(")", ""));
                    this.#characterValue.set(id, this.#characterValue.get(id) + Number(value));
                }else return;
        }
    }

    hookSpecial(prop) {
        switch(prop) {
            case this.TYPES.RDM: return listRandom(this.SPECIAL.RDM);
            default: return prop;
        }
    }

    effect(effects) {
        for(let prop in effects){
            this.change(
                this.hookSpecial(prop),
                Number(effects[prop])
            );
        }
    }

    isEnd() {
        return !this.get(this.TYPES.ISVA) && this.get(this.TYPES.LIF) < 1;
    }

    ageNext() {
        if(this.get(this.TYPES.ISVA)){
            let id = this.get(this.TYPES.CCI);
            this.#chapterAges.set(id, this.#chapterAges.get(id) + 1);
            let age = this.#chapterAges.get(id);
            let {event, talent} = this.getChapterAgeData(id, age);
            return {age, backColor: this.getChapterThemeColor(id), virtual: true, event, talent};
        }else{
            this.change(this.TYPES.AGE, 1);
            let age = this.get(this.TYPES.AGE);
            let {event, talent} = this.getAgeData(age);
            return {age, backColor: [], virtual: false, event, talent};
        }
    }

    getAgeData(age) {
        return clone(this.#ageData[age]);
    }

    getChapterAgeData(id, age) {
        return clone(this.#chapterAgeData.get(id)[0][age]);
    }

    getChapterThemeColor(id) {
        return [this.#chapterAgeData.get(id)[1], this.#chapterAgeData.get(id)[2]];
    }

    hl(prop, value) {
        let keys;
        switch(prop) {
            case this.TYPES.AGE: keys = [this.TYPES.LAGE, this.TYPES.HAGE]; break;
            case this.TYPES.CHR: keys = [this.TYPES.LCHR, this.TYPES.HCHR]; break;
            case this.TYPES.INT: keys = [this.TYPES.LINT, this.TYPES.HINT]; break;
            case this.TYPES.STR: keys = [this.TYPES.LSTR, this.TYPES.HSTR]; break;
            case this.TYPES.MNY: keys = [this.TYPES.LMNY, this.TYPES.HMNY]; break;
            case this.TYPES.SPR: keys = [this.TYPES.LSPR, this.TYPES.HSPR]; break;
            default: return;
        }
        const [l, h] = keys;
        this.#data[l] = min(this.#data[l], value);
        this.#data[h] = max(this.#data[h], value);
    }

    //todo: vage and cvr is not included!!!
    achieve(prop, newData) {
        let key;
        switch(prop) {
            case this.TYPES.ACHV:
                const lastData_achv = this.lsget(prop);
                this.lsset(
                    prop,
                    (lastData_achv || []).concat([[newData, Date.now()]])
                );
                return;
            case this.TYPES.AEVRFS:
                if(newData == null) return; //prevent null
                const lastData_AEVRFS = this.lsget(prop);
                this.lsset(
                    prop,
                    (lastData_AEVRFS || []).concat([[newData, Date.now()]])
                );
                return;
            case this.TYPES.TLT: key = this.TYPES.ATLT; break;
            case this.TYPES.EVT: key = this.TYPES.AEVT; break;
            default: return;
        }
        const lastData = this.lsget(key) || [];
        this.lsset(
            key,
            Array.from(
                new Set(
                    lastData
                        .concat(newData||[])
                        .flat()
                )
            )
        )
    }

    lsget(key) { //the method serves as a getter for the data.
        const data = localStorage.getItem(key);
        if(data === null) return;
        return JSON.parse(data);
    }

    lsset(key, value) { //the method serves as a setter for the data.
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    }
    
    lsdel(key) { //the method serves as a way to remove item.
        localStorage.removeItem(key);
    }
    
    lscopy(key, tokey) { 
        this.lsset(tokey, this.lsget(key));
    }
}

export default Property;