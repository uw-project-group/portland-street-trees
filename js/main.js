function initialize(){
    var $infoPanel = $('.infoPanel');
    var $infoPanelToggle = $('.infoPanel__bar');
    var $infoButton = $('#main-header-info-button');
    var $mainHeaderMenu = $('#main-header-menu');

    $infoPanelToggle.click(function () {
        $infoPanel.toggle();
    });

    $infoButton.click(function () {
        $mainHeaderMenu.slideToggle();
    });

    $infoButton.blur(function () {
        $mainHeaderMenu.fadeOut();
    });
}

$(document).ready(initialize);

