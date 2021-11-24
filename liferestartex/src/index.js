import App from '../src/app.js';

globalThis.$$eventMap = new Map();
globalThis.$$event = (tag, data) => {
    const listener = $$eventMap.get(tag);
    if(listener) listener.forEach(fn=>fn(data));
}
globalThis.$$on = (tag, fn) => {
    let listener = $$eventMap.get(tag);
    if(!listener) {
        listener = new Set();
        $$eventMap.set(tag, listener);
    }
    listener.add(fn);
}
globalThis.$$off = (tag, fn) => {
    const listener = $$eventMap.get(tag);
    if(listener) listener.delete(fn);
}

globalThis.json = async fileName => await (await fetch(`../data/${fileName}.json`)).json();

// Pssst, I've created a github package - https://github.com/brookesb91/dismissible
globalThis.hideBanners = (e) => {
    let play = false;
    document
        .querySelectorAll(".banner.visible")
        .forEach((b) => {
            play = true;
            requestAnimationFrame(() => {
                b.classList.remove("visible");
                b.classList.add("toInvisible");
                setTimeout(function(){
                    b.classList.remove("toInvisible");
                    b.classList.add("invisible");
                }, 300);
            });
        });
    return play;
};

const app = new App();
app.initial();