window.onresize = onResize;

function onResize(){
    var nowWidth = $(window).width();
    console.log(nowWidth);
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