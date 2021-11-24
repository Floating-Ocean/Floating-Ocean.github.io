function parseCondition(condition) {

    const conditions = [];
    const length = condition.length;
    const stack = [];
    stack.unshift(conditions);
    let cursor = 0;
    const catchString = i => {
        const str = condition.substring(cursor, i).trim();
        cursor = i;
        if(str) stack[0].push(str);
    };
    let reserved = ["AEVR", "VAGE"];
    let ignore = false;
    for(let i=0; i<length; i++) {
        let flag = false;
        reserved.forEach(each => {
            if(!flag && (i + each.length <= length && condition[i] == each.substring(0, 1))){
                if(condition.substring(i, i + each.length) == each){
                    ignore = true;
                    i = i + each.length - 1;
                    flag = true;
                }
            }
        });
        if(flag) continue;
        switch(condition[i]) {
            case ' ': continue;

            case '(':
                if(ignore) continue;
                catchString(i);
                cursor ++;
                const sub = [];
                stack[0].push(sub);
                stack.unshift(sub);
                break;

            case ')':
                if(ignore){
                    ignore = false;
                    continue;
                }
                catchString(i);
                cursor ++;
                stack.shift();
                break;

            case '|':
            case '&':
                catchString(i);
                catchString(i+1);
                break;
            default: continue;
        }
    }

    catchString(length);

    return conditions;
}

function checkCondition(property, condition) {
    const conditions = parseCondition(condition);
    return checkParsedConditions(property, conditions);
}

function checkParsedConditions(property, conditions) {
    if(!Array.isArray(conditions)) return checkProp(property, conditions);
    if(conditions.length == 0) return true;
    if(conditions.length == 1) return checkParsedConditions(property, conditions[0]);

    let ret = checkParsedConditions(property, conditions[0]);
    for(let i=1; i<conditions.length; i+=2) {
        switch(conditions[i]) {
            case '&':
                if(ret) ret = checkParsedConditions(property, conditions[i+1]);
                break;
            case '|':
                if(ret) return true;
                ret = checkParsedConditions(property, conditions[i+1]);
                break;
            default: return false;
        }
    }
    return ret;
}

function checkProp(property, condition) {

    const length = condition.length;
    let i = condition.search(/[><\!\?=]/);

    const prop = i > 0 ? condition.substring(0,i) : condition;
    const symbol = condition.substring(i, i+=(condition[i+1]=='='?2:1));
    const d = condition.substring(i, length);

    let propData = property.get(prop);
    [
        [/AEVR\(\d+\)/, "AEVR"],
        [/VAGE\(\d+\)/, "VAGE"]
    ].forEach(each => {
        const [exp, tp] = each;
        if(prop.search(exp) != -1){
            propData = property.getItem(tp, parseInt(prop.replace(tp + "(", "").replace(")", "")));
        } 
    });

    const conditionData = d[0]=='['? JSON.parse(d): Number(d);

    switch(symbol) {
        case '>':  return propData >  conditionData;
        case '<':  return propData <  conditionData;
        case '>=': return propData >= conditionData;
        case '<=': return propData <= conditionData;
        case '=':
            if(Array.isArray(propData))
                return propData.includes(conditionData);
            return propData == conditionData;
        case '!=':
            if(Array.isArray(propData))
                return !propData.includes(conditionData);
            return propData == conditionData;
        case '?':
            if(Array.isArray(propData)) {
                for(const p of propData)
                    if(conditionData.includes(p)) return true;
                return false;
            }
            return conditionData.includes(propData);
        case '!':
            if(Array.isArray(propData)) {
                for(const p of propData)
                    if(conditionData.includes(p)) return false;
                return true;
            }
            return !conditionData.includes(propData);
        case '':
            return Boolean(propData);
        default: return false;
    }
}

function extractMaxTriggers(condition) {
    // Assuming only age related talents can be triggered multiple times.
    const RE_AGE_CONDITION = /AGE\?\[([0-9\,]+)\]/;
    const match_object = RE_AGE_CONDITION.exec(condition);
    if (match_object == null) {
        // Not age related, single trigger.
        return 1;
    }
    
    const age_list = match_object[1].split(",");
    return age_list.length;
}

export { checkCondition, extractMaxTriggers };