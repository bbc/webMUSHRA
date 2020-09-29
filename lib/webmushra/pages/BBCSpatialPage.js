function BBCSpatialPage(_pageManager, _audioContext, _bufferSize, _audioFileLoader, _session, _pageConfig, _mushraValidator, _errorHandler, _language) {
    this.pageManager = _pageManager;
    this.audioContext = _audioContext;
    this.bufferSize = _bufferSize;
    this.audioFileLoader = audioFileLoader;
    this.session = _session;
    this.pageConfig = _pageConfig;
    this.mushraValidator = _mushraValidator;
    this.errorHandler = errorHandler;
    this.language = _language;

    this.mushraAudioControl = null;
    // this.div = null; <- is this used?
    this.waveformVisualizer = null;
    this.macic = null;
    this.currentItem = null;

    // copying from MUSHRA page but we actually only have one condition per page
    this.conditions = [];
    for (var key in this.pageConfig.stimuli) {
        this.conditions[this.conditions.length] = new Stimulus(key, this.pageConfig.stimuli[key]);
    }

    this.reference = new Stimulus("reference", this.pageConfig.reference);
    this.audioFileLoader.addFile(this.reference.getFilepath(), (function (_buffer, _stimulus) { _stimulus.setAudioBuffer(_buffer); }), this.reference);
    for (var i = 0; i < this.conditions.length; ++i) {
        this.audioFileLoader.addFile(this.conditions[i].getFilepath(), (function (_buffer, _stimulus) { _stimulus.setAudioBuffer(_buffer); }), this.conditions[i]);
    }

    // data
    this.ratings = [];    
    this.loop = { start: null, end: null };
    this.slider = { start: null, end: null };

    this.time = 0;
    this.startTimeOnPage = null;
}

/**
 * @return {String} Returns the name of the page. Objects of a Page class might have different names.  
 */
BBCSpatialPage.prototype.getName = function () {
    return this.pageConfig.name;
};

/**
 * The init method is called before the pages are rendered. The method is called only once.
 * @param {Function} _callbackError The function that must be called if an error occurs. The function has one argument which is the error message.
 */
BBCSpatialPage.prototype.init = function (_callbackError) {
    var active; // keeps track of active condition
    var toDisable; // keeps track of which to disable
    // validation of configuration
    this.mushraValidator.checkNumChannels(this.audioContext, this.reference);
    for (let i = 0; i < this.conditions.length; ++i) {
        this.mushraValidator.checkSamplerate(this.audioContext.sampleRate, this.conditions[i]);
    }
    this.mushraValidator.checkConditionConsistency(this.reference, this.conditions);
    // file player/controller initialisation
    var noCreateAnchor = false;
    var noRandomizeConditions = false;
    this.mushraAudioControl = new MushraAudioControl(this.audioContext, this.bufferSize, this.reference, this.conditions, this.errorHandler, noCreateAnchor, noCreateAnchor, noRandomizeConditions);
    this.mushraAudioControl.addEventListener((function (_event) {
        // TODO: can button colour updates be moved into function?
        if (_event.name == 'stopTriggered') {
            let locPlayText = this.pageManager.getLocalizer().getFragment(this.language, 'playButton');
            $(".audioControlElement").text(locPlayText);
            // update button colours
            // remove color from reference if active
            if ($('#buttonReference').attr("active") == "true") {
                $.mobile.activePage.find('#buttonReference')
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonReference').attr("active", "false");
            }
            // remove color from conditions if active
            for (let i = 0; i < _event.conditionLength; i++) {
                active = '#buttonConditions' + i;
                toDisable = $(".scales").get(i);
                if ($(active).attr("active") == "true") {
                    $.mobile.activePage.find(active)
                        .removeClass('ui-btn-b')
                        .addClass('ui-btn-a').attr('data-theme', 'a');
                    $(toDisable).slider('disable');
                    $(toDisable).attr("active", "false");
                    $(active).attr("active", "false");
                    break;
                }
            }
            // add colour to stop
            $.mobile.activePage.find('#buttonStop')
                .removeClass('ui-btn-a')
                .addClass('ui-btn-b').attr('data-theme', 'b');
            $.mobile.activePage.find('#buttonStop').focus();
            $('#buttonStop').attr("active", "true");
        } else if (_event.name == 'playReferenceTriggered') {
            // remove colour from stop
            if ($('#buttonStop').attr("active") == "true") {
                $.mobile.activePage.find('#buttonStop')
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonStop').attr("active", "false");
            }
            // remove color from conditions if active
            for (let j = 0; j < _event.conditionLength; j++) {
                active = '#buttonConditions' + j;
                toDisable = $(".scales").get(j);
                if ($(active).attr("active") == "true") {
                    $.mobile.activePage.find(active)
                        .removeClass('ui-btn-b')
                        .addClass('ui-btn-a').attr('data-theme', 'a');
                    $(active).attr("active", "false");
                    $(toDisable).slider('disable');
                    $(toDisable).attr("active", "false");
                    break;
                }
            }
            // add colour to reference
            $.mobile.activePage.find('#buttonReference')
                .removeClass('ui-btn-a')
                .addClass('ui-btn-b').attr('data-theme', 'b');
            $.mobile.activePage.find('#buttonReference').focus();
            $('#buttonReference').attr("active", "true");
        } else if (_event.name == 'playConditionTriggered') {

            var index = _event.index;
            var activeSlider = $(".scales").get(index);
            var selector = '#buttonConditions' + index;
            // remove color from stop if active
            if ($('#buttonStop').attr("active") == "true") {
                $.mobile.activePage.find('#buttonStop')
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonStop').attr("active", "false");
            }
            // remove colour from reference if active
            if ($('#buttonReference').attr("active") == "true") {
                $.mobile.activePage.find('#buttonReference')
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonReference').attr("active", "false");
            }
            // remove colour from conditions if active
            for (let k = 0; k < _event.length; k++) {
                active = '#buttonConditions' + k;
                toDisable = $(".scales").get(k);
                if ($(active).attr("active") == "true") {
                    $.mobile.activePage.find(active)
                        .removeClass('ui-btn-b')
                        .addClass('ui-btn-a').attr('data-theme', 'a');
                    $(toDisable).slider('disable');
                    $(active).attr("active", "false");
                    $(toDisable).attr("active", "false");
                    break;
                }
            }
            // add color to conditions if active
            $(activeSlider).slider('enable');
            $(activeSlider).attr("active", "true");
            $.mobile.activePage.find(selector)
                .removeClass('ui-btn-a')
                .addClass('ui-btn-b').attr('data-theme', 'b');
            $.mobile.activePage.find(selector).focus();
            $(selector).attr("active", "true");
        }
    }).bind(this));
};

/**
 * Renders the page. Should just be called once.
 * @param {Object} _parent JQuery element which represent the parent DOM element where the content of the page must be stored.
 */
BBCSpatialPage.prototype.render = function (_parent) {
    // define and draw GUI
    var div = document.createElement("div");
    // page instructions
    var content;
    if (this.pageConfig.content !== undefined) {
        content = this.pageConfig.content;
        var text = document.createElement("div");
        text.innerHTML = content;
        div.appendChild(text);
    }
    _parent.append(div);

    // playback controls table
    var tablePlaybackControls = $("<table id='mainUp'></table>");
    div.append(tablePlaybackControls);

    // waveform control row
    var trWaveformControl = $("<tr id='trWaveformControl'></tr>");
    tablePlaybackControls.append(trWaveformControl);
    var tdWaveformControl = $("<td></td>");
    trWaveformControl.append(tdWaveformControl);

    // transport controls row
    var trTransportControls = document.createElement("tr");
    tablePlaybackControls.appendChild(trTransportControls);
    // TODO: use language localisation for button text
    var locPlayText = this.pageManager.getLocalizer().getFragment(this.language, 'playButton');
    var locStopText = this.pageManager.getLocalizer().getFragment(this.language, 'stopButton');
    var tdPlayRef = $(" \
        <td class='playRefButton'> \
            <p>Reference</p><button data-role='button' data-inline='true' id='buttonPlayRef' class='audioControlElement' onclick='"+ this.pageManager.getPageVariableName(this) + ".btnCallbackReference();'>" + locPlayText + "</button> \
        </td> \
    ");
    trTransportControls.append(tdPlayRef);
    var stim_ix = 0;
    var tdPlayCondition = $(" \
        <td class='stopButton'> \
            <p>Condition</p><button data-role='button' data-inline='true' id='buttonStop' class='audioControlElement' onclick='"+ this.pageManager.getPageVariableName(this) + ".btnCallbackCondition(" + stim_ix + ");'>" + locPlayText + "</button> \
        </td> \
    ");
    trTransportControls.append(tdPlayCondition);
    var tdStop = $(" \
        <td class='stopButton'> \
            <button data-role='button' data-inline='true' id='buttonStop' onclick='"+ this.pageManager.getPageVariableName(this) + ".mushraAudioControl.stop();'>" + locStopText + "</button> \
        </td> \
    ");
    trTransportControls.append(tdStop);

    // create rating cells
    var trRatings = document.createElement("tr");
    var tdSpatialRating = document.createElement("td");
    var tdTimbralRating = document.createElement("td");
    trRatings.appendChild(tdSpatialRating);
    trRatings.appendChild(tdTimbralRating);
    tablePlaybackControls.appendChild(trRatings);

    // create table within for spatial rating
    var tableSpatial = document.createElement("table");
    tdSpatialRating.appendChild(tableSpatial);
    // tdSpatialHeading contains title and description of spatial rating task
    var trSpatialHeading = document.createElement("tr");
    var tdSpatialHeading = document.createElement("td");
    trSpatialHeading.appendChild(tdSpatialHeading);
    tableSpatial.appendChild(trSpatialHeading);
    // td*ResponseHeading cells contain descriptions of each response scale
    var trSpatialResponseHeadings = document.createElement("tr");
    var tdHeightResponseHeading = document.createElement("td");
    var tdRadarResponseHeading = document.createElement("td");
    trSpatialResponseHeadings.appendChild(tdHeightResponseHeading);
    trSpatialResponseHeadings.appendChild(tdRadarResponseHeading);
    tableSpatial.appendChild(trSpatialResponseHeadings);
    // create table row for the canvas
    var trSpatialResponse = createElement("tr", tableSpatial, "trSpatialResponse");
    var tdHeightResponse = createElement("td", trSpatialResponse, "tdHeightResponse");
    var tdRadarResponse = createElement("td", trSpatialResponse, "tdRadarResponse");

    // controller and visualiser
    this.macic = new MushraAudioControlInputController(this.mushraAudioControl, this.pageConfig.enableLooping);
    this.macic.bind();

    this.waveformVisualizer = new WaveformVisualizer(this.pageManager.getPageVariableName(this) + ".waveformVisualizer", tdWaveformControl, this.reference, this.pageConfig.showWaveform, this.pageConfig.enableLooping, this.mushraAudioControl);
    this.waveformVisualizer.create();
    this.waveformVisualizer.load();

};

/**
 * Renders the canvas area for responses. This function might be called multiple times (depending on whether navigation is allowed and on the user behaviour)
 * @param {Object} _parentId ID string for the parent element.
 */
BBCSpatialPage.prototype.renderCanvas = function (_parentId) {
    $('#response_canvas').remove();
    parent = $('#' + _parentId);
    var canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.zIndex = 0;
    canvas.setAttribute("id", "response_canvas");
    parent.get(0).appendChild(canvas);

    var canvasContext = canvas.getContext('2d');

    // start with height canvas


    // offset to spatial canvas position
    $('#response_canvas').offset({ top: $('#heightCanvas').offset().top, left: $('#heightCanvas').offset().left });
    canvas.height = parent.get(0).offsetHeight - (parent.get(0).offsetHeight - $('#trSpatialResponse').height());
    canvas.width = parent.get(0).offsetWidth;
}

function createElement(type, parent, id) {
    var element = document.createElement(type);
    if (id !== undefined) element.setAttribute("id", id);
    parent.appendChild(element);
    return element;
}

BBCSpatialPage.prototype.pause = function () {
    this.mushraAudioControl.pause();
};

BBCSpatialPage.prototype.setLoopStart = function () {
    var slider = document.getElementById('slider');
    var startSliderSamples = this.mushraAudioControl.audioCurrentPosition;
    var endSliderSamples = parseFloat(slider.noUiSlider.get()[1]);
    this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

BBCSpatialPage.prototype.setLoopEnd = function () {
    var slider = document.getElementById('slider');
    var startSliderSamples = parseFloat(slider.noUiSlider.get()[0]);
    var endSliderSamples = this.mushraAudioControl.audioCurrentPosition;
    this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

BBCSpatialPage.prototype.btnCallbackReference = function () {
    this.currentItem = "ref";
    var label = $("#buttonReference").text();
    var playLabel = this.pageManager.getLocalizer().getFragment(this.language, 'playButton');
    var pauseLabel = this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton');
    if (label == pauseLabel) {
        this.mushraAudioControl.pause();
        $("#buttonReference").text(playLabel);
    } else if (label == playLabel) {
        $(".audioControlElement").text(playLabel);
        this.mushraAudioControl.playReference();
        $("#buttonReference").text(pauseLabel);
    }
};

BBCSpatialPage.prototype.btnCallbackCondition = function (_index) {
    this.currentItem = _index;

    var label = $("#buttonConditions" + _index).text();
    var playLabel = this.pageManager.getLocalizer().getFragment(this.language, 'playButton');
    var pauseLabel = this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton');
    if (label == pauseLabel) {
        this.mushraAudioControl.pause();
        $("#buttonConditions" + _index).text(playLabel);
    } else if (label == playLabel) {
        $(".audioControlElement").text(playLabel);
        this.mushraAudioControl.playCondition(_index);
        $("#buttonConditions" + _index).text(pauseLabel);
    }
};

/**
 * This method is called after the page is rendered. The purpose of this method is to load default values or saved values of the input controls. 
 */
BBCSpatialPage.prototype.load = function () {
    this.startTimeOnPage = new Date();
    this.renderCanvas('response_canvas');
    this.mushraAudioControl.initAudio();
    if (this.ratings.length !== 0) {
        var scales = $(".scales");
        for (let i = 0; i < scales.length; ++i) {
            // TODO: should this be scales.eq(i)?
            $(".scales").eq(i).val(this.ratings[i].value).slider("refresh");
        }
    }
    if (this.loop.start !== null && this.loop.end !== null) {
        this.mushraAudioControl.setLoop(0, 0, this.mushraAudioControl.getDuration(), this.mushraAudioControl.getDuration() / this.waveformVisualizer.stimulus.audioBuffer.sampleRate);
        this.mushraAudioControl.setPosition(0);
    }
};

/**
 * This method is called just before the next page is presented to the user. In case values of input controls are needed for rerendering, they must be saved within in method. 
 */
BBCSpatialPage.prototype.save = function () {
    this.macic.unbind();
    this.time += (new Date() - this.startTimeOnPage);
    this.mushraAudioControl.freeAudio();
    this.mushraAudioControl.removeEventListener(this.waveformVisualizer.numberEventListener);
    var scales = $(".scales");
    this.ratings = [];
    var i;
    for (i = 0; i < scales.length; ++i) {
      this.ratings[i] = { name: scales[i].name, value: scales[i].value };
    }
  
    this.loop.start = parseInt(this.waveformVisualizer.mushraAudioControl.audioLoopStart);
    this.loop.end = parseInt(this.waveformVisualizer.mushraAudioControl.audioLoopEnd);
};

/**
 * @param {ResponsesStorage} _reponsesStorage
 */
BBCSpatialPage.prototype.store = function (_reponsesStorage) {
    // store the results
    var trial = new Trial();
    trial.type = this.pageConfig.type;
    trial.id = this.pageConfig.id;

    // populate list of responses here
    trial.responses[0] = 0;

    this.session.trials[this.session.trials.length] = trial;
};