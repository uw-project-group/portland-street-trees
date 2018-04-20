function initialize(){
    var $aboutMenuItem = $('#about-menu-item');
    var $infoPanel = $('.infoPanel');
    var $infoPanelToggle = $('.infoPanel__bar');
    var $infoButton = $('#main-header-info-button');
    var $mainHeaderMenu = $('#main-header-menu');
    var $neighborhoodSelectBox = $('#neigbhorbood-select-box');
    var $overlayCloseButton = $('#overlay-close-button');
    var $overlay = $('#overlay');

    $aboutMenuItem.click(function() {
        $overlay.fadeIn('slow');
    });

    $infoPanelToggle.click(function () {
        $infoPanel.toggle();
    });

    $infoButton.click(function () {
        $mainHeaderMenu.slideToggle();
    });

    $neighborhoodSelectBox.click(function() {
        $overlay.fadeOut('slow');
        overlayIsHidden = true;
    });

    $overlayCloseButton.click(function () {
        $overlay.fadeOut('slow');
        overlayIsHidden = true; 
    });
}

$(document).ready(initialize);

