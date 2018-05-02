function initialize(){
    var $aboutMenuItem = $('#about-menu-item');
    var $filters = $('.filters');
    var $filterFeedback = $('#filter-feedback');
    var $infoPanel = $('.infoPanel');
    var $infoPanelToggle = $('.infoPanel__toggle');
    var $mainHeaderMenu = $('#main-header-menu');
    var $mainHeaderMenuButton = $('#main-header-menu-button');
    var $map = $('#map');
    var $neighborhoodSelectBox = $('#neigbhorbood-select-box');
    var $overlayCloseButton = $('#overlay-close-button');
    var $overlay = $('#overlay');

    $aboutMenuItem.click(function() {
        $overlay.fadeIn('slow');
    });

    $infoPanelToggle.click(function () {
        $infoPanel.toggle();
        if ($infoPanel.is(":visible")) {
            $infoPanelToggle.html('<i class="fas fa-caret-left fa-1x"></i>');
        } else {
            $infoPanelToggle.html('<i class="fas fa-caret-right fa-1x"></i>');
        }

    });

    $filters.click(function() {
        $filterFeedback.fadeOut('slow');
    });

    $mainHeaderMenuButton.click(function () {
        $mainHeaderMenu.slideToggle();
    });

    $map.click(function() {
        $filterFeedback.fadeOut('slow');
    });

    $neighborhoodSelectBox.click(function() {
        $overlay.fadeOut('slow');
        $filterFeedback.fadeOut('slow');
    });

    $overlayCloseButton.click(function () {
        $overlay.fadeOut('slow');
    });
}

$(document).ready(initialize);

