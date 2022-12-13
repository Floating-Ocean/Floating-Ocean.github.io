window.onresize = function(){
    var nowWidth = $(window).width();
    if(nowWidth > 800){
        const navigator = $(`.navigator-container`);
        navigator.removeClass('visible');
        navigator.removeClass('invisible');
        navigator.addClass('visible');
        const content = $(`.content-container`);
        content.removeClass('visible');
        content.removeClass('invisible');
        content.addClass('visible');
        const title = $(`.title-container`);
        title.removeClass('visible');
        title.removeClass('invisible');
        title.addClass('visible');
    }else{
        const navigator = $(`.navigator-container`);
        navigator.removeClass('visible');
        navigator.removeClass('invisible');
        navigator.addClass('invisible');
        const content = $(`.content-container`);
        content.removeClass('visible');
        content.removeClass('invisible');
        content.addClass('invisible');
        const title = $(`.title-container`);
        title.removeClass('visible');
        title.removeClass('invisible');
        title.addClass('invisible');
    }
};

const themeLink = $(document).find('#themeLink');
if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    themeLink.attr('href', 'style-mobile.css');
} else {
    themeLink.attr('href', 'style.css');
}

function heightToTop(ele){
    //ele为指定跳转到该位置的DOM节点
    let bridge = ele;
    let root = document.body;
    let height = 0;
    do{
        height += bridge.offsetTop;
        bridge = bridge.offsetParent;
    }while(bridge !== root);
    return height;
}
var buttons=[guide_intro, guide_update, guide_tradition, guide_game, 
    guide_main, guide_operate, guide_difficulty, guide_challenge, guide_save, 
    guide_calculate, guide_score, guide_punish, guide_end, guide_other, guide_github, 
    guide_greetings, guide_get, guide_feedback];
const tags=[intro, update, tradition, game, main, operate, difficulty, challenge, save, 
    calculate, score, punish, end, other, github, greetings, get, feedback];
//按钮点击时
for(var i=0;i<18;i++){
    let tag = tags[i];
    buttons[i].addEventListener('click',function(){
        window.scrollTo({
            top:heightToTop(tag) - 40,
            behavior:'smooth'
        })
    })
}