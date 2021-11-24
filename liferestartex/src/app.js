import { summary } from './functions/summary.js';
import { getRate, getGrade } from './functions/addition.js';
import Life from './life.js';

class App{
    constructor(){
        this.#life = new Life();
    }

    #life;
    #pages;
    #currentPage;
    #talentSelected = new Set();
    #totalMax = 100; //the total points. Use this to deal the changes caused by talents.
    #isEnd = false;
    #name = "赵家祺"; //default name
    #selectedExtendTalent = new Set(); //todo: add more.
    #hintTimeout;
    #specialthanks;
    #autoTrajectory;

    async initial() {
        this.initPages();
        this.switch('loading');
        const [,specialthanks] = await Promise.all([
            this.#life.initial(),
            json('specialthanks')
        ]);
        this.#specialthanks = specialthanks;
        this.switch('index');
        globalThis.onerror = (event, source, lineno, colno, error) => {
            this.hint(`[ERROR] at (${source}:${lineno}:${colno})\n\n${error?.stack||error||'unknow Error'}`, 'error');
        }
        const keyDownCallback = (keyboardEvent) => {
            if (keyboardEvent.which === 13 || keyboardEvent.keyCode === 13) {
                const pressEnterFunc = this.#pages[this.#currentPage]?.pressEnter;
                pressEnterFunc && typeof pressEnterFunc === 'function' && pressEnterFunc();
            }
        }
        globalThis.removeEventListener('keydown', keyDownCallback);
        globalThis.addEventListener('keydown', keyDownCallback);
    }

    isLightTheme(){
        return localStorage.getItem('theme') == 'light';
    }

    changeBackColor(virtual, backColor) {
        let color = this.isLightTheme() ? '#ffffff' : '#303030';
        if(virtual){
            let [backColorDark, backColorLight] = backColor;
            color = this.isLightTheme() ? backColorLight: backColorDark;
        }
        document.documentElement.style.backgroundColor = color;
    }

    initPages() {

        // Loading
        const loadingPage = $(`
        <div id="main" class="main visible">
            <div id="title" style="font-weight: 700;">
                <span style="letter-spacing:0.2rem">人生重开</span><br>
                <div style="margin-top:0.2rem;font-size:1.3rem;opacity:0.85;letter-spacing:0.08rem;">正在加载，等待片刻</div><br>
            </div>
        </div>
        `);

        // Index
        const indexPage = $(`
        <div id="main" class="main visible" style="align:center">
            <button id="achievement">成就</button>
            <button id="specialthanks">特别感谢</button>
            <button id="about">关于</button>
            <button id="themeToggleBtn">黑</button>
            <button id="save">备份</button>
            <button id="load">导入</button>
            <div id="title" style="font-weight: 700;">
                <span style="letter-spacing:0.2rem">人生重开</span><br>
                <div style="margin-top:0.2rem;font-size:1.3rem;opacity:0.85;letter-spacing:0.08rem;">玩你个头，垃圾人生</div><br>
            </div>
            <button id="restart" class="mainbtn" style="padding-top:0.8rem;padding-bottom:0.8rem;padding-left:2rem;padding-right:2rem; letter-spacing:0.12rem;" >点按开始</button>
        </div>
        `);

        // Init theme
        this.setTheme(localStorage.getItem('theme'))

        indexPage
            .find('#restart')
            .click(()=>{
                this.switch('name');
                if(localStorage.getItem('name') != null){
                    this.#name = localStorage.getItem('name');
                    document.getElementById('nameInput').value = this.#name;
                }
            });

        indexPage
            .find('#achievement')
            .click(()=>this.switch('achievement'));

        indexPage
            .find('#save')
            .click(()=>{
                const data = {};
                Object
                    .keys(localStorage)
                    .filter(v=>v.substr(0,4)!='goog')
                    .forEach(key=>data[key] = localStorage[key]);

                let blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                const slice = blob.slice || blob.webkitSlice || blob.mozSlice;
                blob = slice.call(blob, 0, blob.size, 'application/octet-stream');
                const a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
                a.href = URL.createObjectURL(blob);
                a.download = `Remake_save_${new Date().toISOString().replace(':','.')}.json`;

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            });

        indexPage
            .find('#load')
            .click(()=>{
                const file = $(`<input type="file" name="file" accept="application/json" style="display: none;" />`)
                file.appendTo('body');
                file.click();
                file.on('change', (e)=>{
                    this.switch('loading');
                    const file = e.target.files[0];
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                        const data = JSON.parse(reader.result);
                        for(const key in data) {
                            localStorage[key] = data[key];
                        }
                        this.switch('index');
                        this.setTheme(localStorage.getItem('theme'))
                        indexPage.find('#themeToggleBtn').text(this.isLightTheme() ? '黑' : '白');
                        this.hint('导入存档成功', 'success');
                    }
                    reader.readAsText(file);
                });
            });

        indexPage.find('#themeToggleBtn').text(this.isLightTheme() ? '黑' : '白');

        indexPage
            .find("#themeToggleBtn")
            .click(() => {
                localStorage.setItem('theme', this.isLightTheme() ? 'dark' : 'light');
                indexPage.find('#themeToggleBtn').text(this.isLightTheme() ? '黑' : '白');
                this.setTheme(localStorage.getItem('theme'))
            });

        indexPage
            .find('#specialthanks').hide();

        const specialThanksPage = $(`
        <div id="main" class="main visible">
            <button id="specialthanks">返回</button>
            <div id="spthx">
                <ul class="g1"></ul>
                <ul class="g2"></ul>
            </div>
            <button class="sponsor" onclick="globalThis.open('https://afdian.net/@LifeRestart')" style="background: linear-gradient(90deg,#946ce6,#7e5fd9); left:auto; right:50%; transform: translate(-2rem,-50%);">打赏策划(爱发电)</button>
            <button class="sponsor" onclick="globalThis.open('https://dun.mianbaoduo.com/@vickscarlet')" style="background-color:#c69; left:50%; right:auto; transform: translate(2rem,-50%);">打赏程序(顿顿饭)</button>
        </div>
        `);

        specialThanksPage
            .find('#specialthanks')
            .click(()=>this.switch('index'));

        const aboutPage = $(`
            <div id="main" class="main visible">
                <button id="about">返回</button>
                <div id="title" style="font-weight: 700;top:30%;left:35%;">
                    <span style="letter-spacing:0.2rem">人生重开</span><br>
                    <div style="margin-top:0.2rem;font-size:1.3rem;opacity:0.85;letter-spacing:0.08rem;">玩你个头，垃圾人生</div><br><br>
                    </div>
                    <div class="text" style="font-weight: bold; position: absolute;top:35%;overflow:scroll;text-align:left;padding-left:1.2rem;">
                    <div style="margin-top:0.2rem;font-size:1.2rem;padding-left:1.8rem;">本游戏经过二次修改</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;padding-left:1.8rem;">目前仅供学习和交流</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;padding-left:1.8rem;">Ver. 2.4.0.2111061.beta</div><br><br>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">What's new.</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">1.部分页面微调.</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">2.虚拟年龄玩法拓展，底层支持多支线.</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">3.添加了几个事件.</div><br><br>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">原作者   VickScarlet</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">liferestart.syaro.io</div><br>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">二次修改者</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">程序   Floating Ocean</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">事件   叁胡</div><br>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">二次修改部分</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);"> ©2021 Floating Ocean & 叁胡.</div>
                    <div style="margin-top:0.2rem;font-size:1.2rem;transform:scale(0.8);">Lisence under MIT.</div><br><br>
                </div>
            </div>
            `);

        indexPage
            .find('#about').click(()=>this.switch('about'));

        aboutPage
            .find('#about')
            .click(()=>this.switch('index'));
            
        const achievementPage = $(`
        <div id="main" class="main visible">
            <button id="specialthanks">返回</button>
            <span class="title" style="font-weight: 700; letter-spacing:0.2rem; font-size: 2rem; text-align:left; padding-left:1.4rem; padding-top:3.4rem">统计数据</span>
            <ul id="total"></ul>
            <span style="padding:0.12rem; margin: 0.8rem 1.4rem; border: none; border-radius:2rem; background: #eee;"></span>
            <span class="title" style="font-weight: 700; letter-spacing:0.2rem; font-size: 2rem; text-align:left; padding-left:1.4rem; padding-top:0.8rem">所有成就<button id="rank">排行榜</button></span>
            <ul id="achievements"></ul>
        `)

        achievementPage
            .find('#specialthanks')
            .click(()=>this.switch('index'));

        achievementPage
            .find('#rank')
            .click(()=>this.hint('别卷了，你老牛了'));

        const namePage = $(`
            <div id="main" class="main visible">
                <div class="head" style="font-size: 2rem;font-family: 'OppoSans';padding-left:2rem;padding-top:2rem">
                    <div>你的名字？</div>
                    <div style="font-size:1.2rem; font-weight:normal;font-family: 'OppoSans'">输入一个简简单单的名字以继续</div>
                </div>
                <input id="nameInput" value="赵家祺"/>
                <button id="continue" class="mainbtn" style="position:fixed;width:90%;bottom:0;align-self:center;">来吧，20连抽！</button>
            </div>
        `);

        namePage
            .find('#continue')
            .click(() => {
                this.#name = document.getElementById('nameInput').value;
                if(this.#name == null || this.#name == ''){
                    this.hint('不能没有名字哦');
                    return;
                }
                localStorage.setItem('name', this.#name);
                this.switch('talent');
            });

        // Talent
        const talentPage = $(`
        <div id="main" class="main visible">
            <div class="head" style="font-size: 2rem;font-family: 'OppoSans';padding-left:2rem;padding-top:2rem">
                <div>天赋抽个卡</div>
                <div style="font-size:1.2rem; font-weight:normal;font-family: 'OppoSans'">点按选择4-8个天赋以继续</div>
            </div>
            <button id="random" class="mainbtn" style="position: fixed; top: 44%;align-self:center;">来吧，20连抽！</button>
            <ul id="talents" class="selectlist" style="padding-top:2rem"></ul>
            <button id="next" class="mainbtn">选择4-8个吧</button>
        </div>
        `);

        const createTalent = ({ grade, name, description }) => {
            return $(`<li class="grade${grade}b">${name}（${description}）</li>`)
        };

        talentPage
            .find('#random')
            .click(()=>{
                talentPage.find('#random').hide();
                const ul = talentPage.find('#talents');
                this.#life.talentRandom()
                    .forEach(talent=>{
                        const li = createTalent(talent);
                        ul.append(li);
                        li.click(()=>{
                            if(li.hasClass('selected')) {
                                li.removeClass('selected')
                                this.#talentSelected.delete(talent);
                                if(this.#talentSelected.size < 4) {
                                    talentPage.find('#next').text('请选择至少4个')
                                }
                            } else {
                                if(this.#talentSelected.size == 8) {
                                    this.hint('只能选最多8个天赋');
                                    return;
                                }
                                const exclusive = this.#life.exclusive(
                                    Array.from(this.#talentSelected).map(({id}) => id),
                                    talent.id
                                );
                                if(exclusive != null) {
                                    for(const { name, id } of this.#talentSelected) {
                                        if(id == exclusive) {
                                            this.hint(`与已选择的天赋【${name}】冲突`);
                                            return;
                                        }
                                    }
                                    return;
                                }
                                li.addClass('selected');
                                this.#talentSelected.add(talent);
                                if(this.#talentSelected.size<=8 && this.#talentSelected.size>=4) {
                                    talentPage.find('#next').text('开启新人生')
                                }
                            }
                        });
                    });
                talentPage.find('#next').show()
            });

        talentPage
            .find('#next')
            .click(()=>{
                if(this.#talentSelected.size < 4 || this.#talentSelected.size > 8) {
                    this.hint('请选择4-8个天赋');
                    return;
                }
                talentPage.find('#next').hide()
                this.#totalMax = 100 + this.#life.getTalentAllocationAddition(Array.from(this.#talentSelected).map(({id})=>id));
                this.switch('property');
            })

        // Property
        // hint of extension tobermory.es6-string-html
        const propertyPage = $(/*html*/`
        <div id="main" class="main visible">
            <div class="head" style="font-size: 2rem;font-family: 'OppoSans';padding-left:2rem;padding-top:2rem">
                <div>分配初始属性</div>
                <div id="total" style="font-size:1.2rem; font-weight:normal;font-family: 'OppoSans'">剩余属性点：0</div>
            </div>
            <ul id="propertyAllocation" class="propinitial"></ul>
            <ul class="selectlist" id="talentSelectedView"></ul>
            <div class="btn-area">
                <button id="random" class="mainbtn" style="margin-top:1.2rem;margin-bottom:1.2rem;margin-left:2rem;margin-right:0rem;">随机分配</button>
                <button id="start" class="mainbtn" style="margin-top:1.2rem;margin-bottom:1.2rem;margin-right:2rem;">开启新人生</button>
            </div>
        </div>
        `);
        propertyPage.mounted = ()=>{
            propertyPage
            .find('#talentSelectedView').append(
                `<li class="chosenTitle">已选天赋</li>` +
                Array.from(this.#talentSelected)
                .map(({name,description})=>`<li class="grade0b">${name}(${description})</li>`)
                .join('')
            )
        }
        const groups = {};
        const total = ()=>{
            let t = 0;
            for(const type in groups)
                t += groups[type].get();
            return t;
        }
        const freshTotal = ()=>{
            propertyPage.find('#total').text(`可用属性点：${this.#totalMax - total()}`);
        }
        const getBtnGroups = (name, min, max)=>{
            const group = $(`<li>${name}&nbsp;&nbsp;&nbsp;</li>`);
            const btnSub = $(`<span class="iconfont propbtn">&#xe6a5;</span>`);
            const inputBox = $(`<input value="0" type="number" style="border-radius:1rem" />`);
            const btnAdd = $(`<span class="iconfont propbtn">&#xe6a6;</span>`);
            group.append(btnSub);
            group.append(inputBox);
            group.append(btnAdd);

            const limit = v=>{
                v = Number(v)||0;
                v = Math.round(v);
                return v < min ? min : (
                    v > max ? max : v
                )
            }
            const get = ()=>Number(inputBox.val());
            const set = v=>{
                inputBox.val(limit(v));
                freshTotal();
            }
            btnAdd.click(()=>{
                if(total() >= this.#totalMax) {
                    this.hint('到头了到头了');
                    return;
                }
                set(get()+1);
            });
            btnSub.click(()=>set(get() - 1));
            inputBox.on('input', ()=>{
                const t = total();
                let val = get();
                if(t > this.#totalMax) {
                    val -= t - this.#totalMax;
                }
                val = limit(val);
                if(val != inputBox.val()) {
                    set(val);
                }
                freshTotal();
            });
            return {group, get, set};
        }

        groups.CHR = getBtnGroups("颜值", 0, 50); // 颜值 charm CHR
        groups.INT = getBtnGroups("智力", 0, 50); // 智力 intelligence INT
        groups.STR = getBtnGroups("体质", 0, 50); // 体质 strength ST
        groups.MNY = getBtnGroups("家境", 0, 50); // 家境 money MNY

        const ul = propertyPage.find('#propertyAllocation');

        for(const type in groups) {
            ul.append(groups[type].group);
        }

        propertyPage
            .find('#random')
            .click(()=>{ //a random method to randomize the point (it might have two '0' because of the range)
                let t = this.#totalMax;
                const arr = [50, 50, 50, 50];
                while(t > 0) {
                    const sub = Math.round(Math.random() * (Math.min(t, 50) - 1)) + 1;
                    while(true) {
                        const select = Math.floor(Math.random() * 4) % 4;
                         if(arr[select] - sub < 0) continue;
                        arr[select] -= sub;
                        t -= sub;
                        break;
                    }
                }
                groups.CHR.set(50 - arr[0]);
                groups.INT.set(50 - arr[1]);
                groups.STR.set(50 - arr[2]);
                groups.MNY.set(50 - arr[3]);
            });

        propertyPage
            .find('#start')
            .click(()=>{
                if(total() < this.#totalMax) {
                    this.hint(`你还有${this.#totalMax-total()}属性点没有分配完`);
                    return;
                } else if (total() > this.#totalMax) {
                    this.hint(`你多使用了${total() - this.#totalMax}属性点`);
                    return;
                }
                const contents = this.#life.restart({
                    CHR: groups.CHR.get(),
                    INT: groups.INT.get(),
                    STR: groups.STR.get(),
                    MNY: groups.MNY.get(),
                    SPR: Math.floor(Math.random() * 5) + 5,
                    TLT: Array.from(this.#talentSelected).map(({id})=>id),
                });
                this.switch('trajectory');
                this.#pages.trajectory.born(contents);
                // $(document).keydown(function(event){
                //     if(event.which == 32 || event.which == 13){
                //         $('#lifeTrajectory').click();
                //     }
                // })
            });

        // Trajectory
        const trajectoryPage = $(`
        <div id="main" class="main visible">
            <ul id="lifeProperty" class="lifeProperty"></ul>
            <ul id="lifeTrajectory" class="lifeTrajectory"></ul>
            <div class="btn-area">
                <button id="auto" class="mainbtn" style="margin-right:0rem">自动播放</button>
                <button id="auto50x" class="mainbtn">自动播放50x</button>
                <button id="domToImage" class="mainbtn" style="margin-right:0rem;">人生回放</button>
                <button id="summary" class="mainbtn">人生总结</button>
            </div>
            <div class="domToImage2wx">
                <img src="" id="endImage" />
            </div>
        </div>
        `);

        trajectoryPage
            .find('#lifeTrajectory')
            .click(()=>{
                if(this.#isEnd) return;
                const trajectory = this.#life.next(); //get next event
                const { age, backColor, virtual, content, isEnd } = trajectory; //divide it
                this.changeBackColor(virtual, backColor);
                const li = $(`<li><span>${age}岁`+ (virtual ? `<br><span style="font-size: 0.48rem; opacity: 0.75;">virtual</span>` : ``) + `</span><span>${
                    content.map(
                        ({type, description, grade, name, postEvent}) => {
                            switch(type) {
                                case 'TLT':
                                    return `天赋【${name}】发动了：${description}`;
                                case 'EVT': //replace the name, \n and \r
                                    return description.replace('%name%', this.#name).replace("\n", "<br>").replace("\r", "<br>") + (postEvent?`<br>${postEvent}`:'');
                            }
                        }
                    ).join('<br>')
                }</span></li>`);
                li.appendTo('#lifeTrajectory');
                $("#lifeTrajectory").scrollTop($("#lifeTrajectory")[0].scrollHeight);
                if(isEnd) {
                    $(document).unbind("keydown");
                    this.#isEnd = true;
                    trajectoryPage.find('#summary').show();
                    trajectoryPage.find('#auto').hide();
                    trajectoryPage.find('#auto50x').hide();
                    trajectoryPage.find('#domToImage').show();
                }
                const property = this.#life.getLastRecord();
                $("#lifeProperty").html(`
                <li><span>颜值</span><span>${property.CHR}</span></li>
                <li><span>智力</span><span>${property.INT}</span></li>
                <li><span>体质</span><span>${property.STR}</span></li>
                <li><span>家境</span><span>${property.MNY}</span></li>
                <li><span>快乐</span><span>${property.SPR}</span></li>
                `);
            });
        // html2canvas
        trajectoryPage
            .find('#domToImage') //the method might not be safe because the origin source neglected this.
            .click(()=>{
                $("#lifeTrajectory").addClass("deleteFixed");
                const ua = navigator.userAgent.toLowerCase();
                domtoimage.toJpeg(document.getElementById('lifeTrajectory'))
                    .then(function (dataUrl) {
                        let link = document.createElement('a');
                        link.download = '我的人生回放.jpeg';
                        link.href = dataUrl;
                        link.click();
                        $("#lifeTrajectory").removeClass("deleteFixed");
                        // 微信内置浏览器，显示图片，需要用户单独保存
                        if(ua.match(/MicroMessenger/i)=="micromessenger") {
                            $('#endImage').attr('src', dataUrl);
                        }

                    });
            })
            .hide();

        trajectoryPage
            .find('#summary')
            .click(()=>{
                clearInterval(this.#autoTrajectory);
                this.#autoTrajectory = null;
                this.switch('summary');
            });

        const auto = tick=>{
            if(this.#autoTrajectory) {
                clearInterval(this.#autoTrajectory);
                this.#autoTrajectory = null;
            } else {
                if(!this.isEnd)
                    trajectoryPage
                        .find('#lifeTrajectory')
                        .click();
                this.#autoTrajectory = setInterval(()=>{
                    if(this.isEnd) {
                        clearInterval(this.#autoTrajectory);
                        this.#autoTrajectory = null;
                    } else {
                        trajectoryPage
                            .find('#lifeTrajectory')
                            .click();
                    }
                }, tick);
            }
        };

        trajectoryPage
            .find('#auto')
            .click(()=>auto(1000));
        trajectoryPage
            .find('#auto50x')
            .click(()=>auto(10)); //50x

        // Summary
        const summaryPage = $(`
        <div id="main" class="main visible">
            <div class="head" style="font-size: 2rem;font-family: 'OppoSans';padding-left:2rem;padding-top:2rem">人生总结</div>
            <ul id="judge" class="judge" style="flex: none;margin-left:1.6rem;margin-right:1.6rem;">
                <li class="grade2"><span>颜值：</span><span>9级 美若天仙</span></li><li class="grade0"><span>智力：</span><span>4级 智力一般</span></li>
                <li class="grade0"><span>体质：</span><span>1级 极度虚弱</span></li>
                <li class="grade0"><span>家境：</span><span>6级 小康之家</span></li>
                <li class="grade0"><span>享年：</span><span>3岁 早夭</span></li>
                <li class="grade0"><span>快乐：</span><span></span>3级 不太幸福的人生</li>
            </ul>
            <div class="head" style="padding-left:2rem;padding-top:0.2rem;height:auto;font-size:1.6rem;letter-spacing:0rem;">选择继承天赋</div>
            <div class="head" style="padding-left:2rem;padding-top:0.2rem;height:auto;font-size:1.2rem;letter-spacing:0rem;opacity:0.85">下次重开将默认抽中</div>
            <ul id="talents" class="selectlist" style="flex: 1;padding-top:1.6rem">
                <li class="grade2b">黑幕（面试一定成功）</li>
            </ul>
            <button id="again" class="mainbtn" style="margin-left:2rem;margin-right:2rem;">再次重开</button>
        </div>
        `);

        summaryPage
            .find('#again')
            .click(()=>{
                this.times ++;
                this.#life.talentExtend(Array.from(this.#selectedExtendTalent));
                this.#selectedExtendTalent = new Set();
                this.#talentSelected.clear();
                this.#totalMax = 100;
                this.#isEnd = false;
                this.switch('index');
            });

        this.#pages = {
            loading: {
                page: loadingPage,
                clear: ()=>{
                    this.#currentPage = 'loading';
                },
            },
            index: {
                page: indexPage,
                btnAchievement: indexPage.find('#achievement'),
                btnRestart: indexPage.find('#restart'),
                hint: indexPage.find('.hint'),
                pressEnter: ()=>{
                    this.#pages.index.btnRestart.click();
                },
                clear: ()=>{
                    this.#currentPage = 'index';
                    indexPage.find('.hint').hide();

                    const times = this.times;
                    const about = indexPage.find('#about');
                    const achievement = indexPage.find('#achievement');
                    const specialthanks = indexPage.find('#specialthanks');

                    if(times > 0) {
                        about.show();
                        achievement.show();
                        specialthanks.show();
                        return;
                    }

                    about.hide();
                    achievement.hide();
                    specialthanks.hide();
                },
            },
            specialthanks: { //useless but ...
                page: specialThanksPage,
                clear: () => {
                    const groups = [
                        specialThanksPage.find('#spthx > ul.g1'),
                        specialThanksPage.find('#spthx > ul.g2'),
                    ];
                    groups.forEach(g=>g.empty());
                    this.#specialthanks
                        .sort(()=>0.5-Math.random())
                        .forEach(({group, name, comment, color})=>groups[--group].append(`
                            <li>
                                <span class="name" ${color?('style="color:'+color+'"'):''}>${name}</span>
                                <span class="comment">${comment||''}</span>
                            </li>
                        `))
                }
            },
            about: {
                page: aboutPage,
                clear: () => {}
            },
            name: {
                page: namePage,
                clear: () => {}
            },
            achievement: {
                page: achievementPage,
                clear: () => {
                    const total = achievementPage.find("ul#total");
                    const achievements = achievementPage.find("ul#achievements");
                    total.empty();
                    achievements.empty();

                    const formatRate = (type, value) => {
                        const rate = getRate(type, value);
                        let color = Object.keys(rate)[0];
                        switch(parseInt(color)) {
                            case 0: color = '白色'; break;
                            case 1: color = '蓝色'; break;
                            case 2: color = '紫色'; break;
                            case 3: color = '橙色'; break;
                            default: break;
                        }
                        let r = Object.values(rate)[0];
                        switch(parseInt(r)) {
                            case 10: r = '不变'; break;
                            case 20: r = '翻倍'; break;
                            case 30: r = '三倍'; break;
                            case 40: r = '四倍'; break;
                            case 50: r = '五倍'; break;
                            case 60: r = '六倍'; break;
                            default: break;
                        }
                        return `抽到${color}概率${r}`;
                    }

                    const { times, achievement, talentRate, eventRate } = this.#life.getTotal();
                    total.append(`
                        <li class="achvg${getGrade('times', times)}" style="height:8rem !important"><span class="text" style="font-size: 1.35rem">已重开</span><span class="text" style="font-size: 2rem;font-weight:700">${times}次</span><span class="text">${formatRate('times', times)}</span></li>
                        <li class="achvg${getGrade('achievement', achievement)}" style="height:8rem !important"><span class="text" style="font-size: 1.35rem">成就达成</span><span class="text" style="font-size: 2.4rem;font-weight:700">${achievement}个</span><span class="text">${formatRate('achievement', achievement)}</span></li>
                        <li class="achvg${getGrade('eventRate', eventRate)}" style="height:6rem !important"><span class="text" style="font-size: 1.35rem">事件收集率</span><span class="text" class="achievementtitle" style="font-size: 2.4rem;font-weight:700">${Math.floor(eventRate * 100)}%</span></li>
                        <li class="achvg${getGrade('talentRate', talentRate)}" style="height:6rem !important"><span class="text" style="font-size: 1.35rem">天赋收集率</span><span class="text" class="achievementtitle" style="font-size: 2.4rem;font-weight:700">${Math.floor(talentRate * 100)}%</span></li>
                    `);

                    const achievementsData = this.#life.getAchievements();
                    achievementsData.forEach(({
                        name, description, hide,
                        grade, isAchieved
                    })=>{
                        if(hide && !isAchieved) name = description = '???';
                        achievements.append(
                            `<li class="achvg${grade} ${isAchieved?'':'mask'}"><span class="achievementtitle">${name}</span>${description}</li>`
                        );
                    })

                }
            },
            talent: {
                page: talentPage,
                talentList: talentPage.find('#talents'),
                btnRandom: talentPage.find('#random'),
                btnNext: talentPage.find('#next'),
                pressEnter: ()=>{
                    const talentList = this.#pages.talent.talentList;
                    const btnRandom = this.#pages.talent.btnRandom;
                    const btnNext = this.#pages.talent.btnNext;
                    if (talentList.children().length) {
                        btnNext.click();
                    } else {
                        btnRandom.click();
                    }
                },
                clear: ()=>{
                    this.#currentPage = 'talent';
                    talentPage.find('ul.selectlist').empty();
                    this.#totalMax = 100;
                    setTimeout(() => talentPage.find('#random').click(), 10);
                },
            },
            property: {
                page: propertyPage,
                btnStart: propertyPage.find('#start'),
                pressEnter: ()=>{
                    this.#pages.property.btnStart.click();
                },
                clear: ()=>{
                    this.#currentPage = 'property';
                    freshTotal();
                    propertyPage
                        .find('#talentSelectedView')
                        .empty();
                },
            },
            trajectory: {
                page: trajectoryPage,
                lifeTrajectory: trajectoryPage.find('#lifeTrajectory'),
                pressEnter: ()=>{
                    this.#pages.trajectory.lifeTrajectory.click();
                },
                clear: ()=>{
                    this.#currentPage = 'trajectory';
                    trajectoryPage.find('#lifeTrajectory').empty();
                    trajectoryPage.find('#domToImage').hide();
                    trajectoryPage.find('#summary').hide();
                    trajectoryPage.find('#auto').show();
                    trajectoryPage.find('#auto50x').show();
                    this.#isEnd = false;
                },
                born: contents => {
                    if(contents.length > 0)
                        $('#lifeTrajectory')
                            .append(`<li><span>初始</span><span>${
                                contents.map(
                                    ({source, target}) => `天赋【${source.name}】发动：替换为天赋【${target.name}】`
                                ).join('<br>')
                            }</span></li>`);

                    trajectoryPage.find('#lifeTrajectory').trigger("click");
                }
            },
            summary: {
                page: summaryPage,
                clear: ()=>{
                    this.#currentPage = 'summary';
                    const judge = summaryPage.find('#judge');
                    const talents = summaryPage.find('#talents');
                    judge.empty();
                    talents.empty();
                    const lastExtendTalent = this.#life.getLastExtendTalent();
                    Array
                        .from(this.#talentSelected)
                        .sort((
                            {id:a, grade:ag},
                            {id:b, grade:bg},
                        )=>{
                            if(lastExtendTalent.includes(a)) return -1;
                            if(lastExtendTalent.includes(b)) return 1;
                            return bg - ag;
                        })
                        .forEach((talent, i)=>{
                            const li = createTalent(talent);
                            talents.append(li);
                            li.click(()=>{
                                if(li.hasClass('selected')) {
                                    this.#selectedExtendTalent.delete(talent.id);
                                    li.removeClass('selected');
                                } else {
                                    this.#selectedExtendTalent.add(talent.id);
                                    li.addClass('selected');
                                }
                            });
                            if(!i) li.click();
                        });

                    const summaryData = this.#life.getSummary();
                    const format = (discription, type)=>{
                        const value = summaryData[type];
                        const { judge, grade } = summary(type, value);
                        return `<li class="grade${grade}"><span>${discription}：</span><span>${value} ${judge}</span></li>`;
                    };

                    judge.append(`
                        ${format('颜值', 'CHR')}
                        ${format('智力', 'INT')}
                        ${format('体质', 'STR')}
                        ${format('家境', 'MNY')}
                        ${format('快乐', 'SPR')}
                        ${format('享年', 'AGE')}
                        ${format('总评', 'SUM')}
                    `);
                }
            },
        }

        $$on('achievement', ({name})=>{
            this.hint(`解锁成就【${name}】`, 'success');
        })
    }

    switch(page) {
        const p = this.#pages[page];
        if(!p) return;
        $('#main').detach();
        p.clear();
        p.page.appendTo('body');
        if(typeof p.page.mounted === 'function'){
            p.page.mounted()
        }
    }

    hint(message, type='info') {
        if(this.#hintTimeout) {
            clearTimeout(this.#hintTimeout);
            this.#hintTimeout = null;
        }
        if(hideBanners()){ //if it is visible, close it and wait its animation ended.
            var that = this;
            setTimeout(function(){
                that.toShow(message, type);
            }, 300);
        }else this.toShow(message, type); 
    }

    toShow(message, type){
        requestAnimationFrame(() => {
            const banner = $(`.banner.${type}`);
            banner.removeClass('visible');
            banner.removeClass('invisible');
            banner.addClass('visible');
            banner.find('.banner-message').text(message);
            if(type != 'error') {
                this.#hintTimeout = setTimeout(hideBanners, 3000);
            }
        });
    }

    setTheme(theme) {
        const themeLink = $(document).find('#themeLink');

        if(theme == 'light') {
            themeLink.attr('href', 'light.css');
        } else {
            themeLink.attr('href', 'dark.css');
        }
    }

    get times() {return this.#life?.times || 0;}
    set times(v) { if(this.#life) this.#life.times = v };

}

export default App;
