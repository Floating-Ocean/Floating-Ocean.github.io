import { clone, shuffleSelf } from './functions/util.js';
import { checkCondition } from './functions/condition.js';

class Event {
    constructor() {}

    #events;

    initial({events}) {
        this.#events = events;
        const variantMap = {
            "release": 0,
            "beta": 1,
            "dev": 2
        };
        for(const id in events) {
            const event = events[id];
            if(event.variant) event.include = event.include ? '(' + event.include + ')&(VAR=' + variantMap[String(event.variant)] + ')' : 'VAR=' + variantMap[String(event.variant)];
            if(!event.branch) continue;
            event.branch = event.branch.map(b=>{
                b = b.split(':');
                b[1] = Number(b[1]);
                return b;
            });
        }
    }

    count() {
        return Object.keys(this.#events).length;
    }

    check(eventId, property) {
        const { include, exclude, NoRandom } = this.get(eventId);
        if(NoRandom) return false;
        if(exclude && checkCondition(property, exclude)) return false;
        if(include) return checkCondition(property, include);
        return true;
    }

    get(eventId) {
        const event = this.#events[eventId];
        if(!event) throw new Error(`[ERROR] No Event[${eventId}]`);
        return clone(event);
    }

    information(eventId) {
        const { event: description } = this.get(eventId)
        return { description };
    }

    //update: add random support for top events.
    do(eventId, property) {
        let dealtAppend;
        const { effect, branch, event: description, postEvent, append, appendRandom, appendCount } = this.get(eventId);
        ap: if(append){
            const reverseAppend = clone(append);
            if(appendRandom) shuffleSelf(reverseAppend);
            dealtAppend = new Array();
            property.backupProperties();
            for(const id of append)
                if(this.check(id, property)){
                    property.change(property.TYPES.EVT, id);
                    const { effect, next, postEvent, description, dealtAppend: tmp } = this.do(id, property);
                    dealtAppend.push({effect, next, postEvent, description, id});
                }
            property.restoreBackup();
            let maxSize = appendCount ? Math.min(Math.max(appendCount, 1), 12) : 12;
            if(dealtAppend.length > maxSize) dealtAppend.splice(maxSize);
            if(dealtAppend.length <= 0) break ap;
            //deal month
            let month = new Array();
            for(let i=1; i<13; i++)
                month.push(i + "月");
            for(let i=0;i<12-dealtAppend.length;i++){
                let random = Math.floor(Math.random() * 12);
                if(!month[random]) i--; //prevent repetition.
                month[random] = undefined;
            }
            month = month.filter(m => m != undefined); //reserve the available month.
            for(let i=0;i<dealtAppend.length;i++){
                const {effect, next, postEvent, description, id} = dealtAppend[i];
                dealtAppend[i] = {effect, next, postEvent, description, id, month:month[i]};
            }
        }
        if(branch){
            const reverseBranch = clone(branch);
            reverseBranch.reverse();
            const list = new Array();
            for(const [cond, next] of reverseBranch)
                if(checkCondition(property, cond)){
                    if(list.length > 0 && list[0][0] != cond) list.length = 0;
                    list.push([cond, next]);
                }
            if(list.length > 0){
                let [cond, next] = list[Math.floor(Math.random() * list.length)];
                return { effect, next, description, dealtAppend };
            }
        }
        return { effect, postEvent, description, dealtAppend };
    }

}

export default Event;