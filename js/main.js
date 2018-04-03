function initialize(){
    var $infoPanel = $('.infoPanel');
    var $infoPanelToggle = $('.infoPanel__bar');

    $infoPanelToggle.click(function () {
        $infoPanel.toggle();
    });
}

$(document).ready(initialize);

