function BBCSpatialPage(_reference, _condition, _pageManager, _pageTemplateRenderer, _audioContext, _bufferSize, _audioFileLoader, _session, _pageConfig, _errorHandler, _language) {
    this.reference = _reference;
    this.condition = _condition;
    this.pageManager = _pageManager;
    this.pageTemplateRenderer = _pageTemplateRenderer;
    this.audioContext = _audioContext;
    this.bufferSize = _bufferSize;
    this.audioFileLoader = _audioFileLoader;
    this.session = _session;
    this.pageConfig = _pageConfig;
    this.errorHandler = _errorHandler;
    this.language = _language;

    this.mushraAudioControl = null;
    this.waveformVisualizer = null;
    this.macic = null;
    this.radar = null;

    this.currentItem = null;
    this.result = undefined;
    this.setResult = (function (result) {
        if (!result) return;
        this.result = result;
    }).bind(this);

    this.renderInterval_ms = 20; // this.pageConfig.renderInterval_ms;

    this.audioFileLoader.addFile(this.reference.getFilepath(), (function (_buffer, _stimulus) { _stimulus.setAudioBuffer(_buffer); }), this.reference);
    this.audioFileLoader.addFile(this.condition.getFilepath(), (function (_buffer, _stimulus) { _stimulus.setAudioBuffer(_buffer); }), this.condition);

    this.loop = { start: null, end: null };
    this.slider = { start: null, end: null };

    this.time = 0; // will store time in ms
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
BBCSpatialPage.prototype.init = function () {
    this.initUI();
    this.initMUSHRAController();
}

BBCSpatialPage.prototype.initMUSHRAController = function () {
    var noCreateAnchor = false;
    var noRandomize = false;
    this.mushraAudioControl = new MushraAudioControl(this.audioContext, this.bufferSize, this.reference, [this.condition], this.errorHandler, noCreateAnchor, noCreateAnchor, noRandomize);
    this.mushraAudioControl.addEventListener((function (_event) {
        if (_event.name == 'stopTriggered') {
            $(".audioControlElement").text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
            if ($('#buttonReference').attr("active") == "true") {
                $.mobile.activePage.find('#buttonReference')  //remove color
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonReference').attr("active", "false");
            }
            if ($('#buttonCondition').attr("active") == "true") {
                $.mobile.activePage.find('#buttonCondition')  //remove color
                    .removeClass('ui-btn-b')
                    .addClass('ui-btn-a').attr('data-theme', 'a');
                $('#buttonCondition').attr("active", "false");
            }
            $.mobile.activePage.find('#buttonStop')    //add color to stop
                .removeClass('ui-btn-a')
                .addClass('ui-btn-b').attr('data-theme', 'b');
            $.mobile.activePage.find('#buttonStop').focus();
            $('#buttonStop').attr("active", "true");

        }
    }).bind(this));
}

BBCSpatialPage.prototype.initUI = function () {
    // init scene
    var img = new Image();
    img.src = 'res/listener.png';
    img.onload = (function () {
        this.page.listenerImg = img;
    }).bind({
        page: this
    });

    this.radar = new AzRadRadar();
    this.radar.init(this.setResult);
};

/**
 * Renders the page. This function might be called multiple times (depending on whether navigation is allowed and on the user behaviour)
 * @param {Object} _parent JQuery element which represent the parent DOM element where the content of the page must be stored.
 */
BBCSpatialPage.prototype.render = function (_parent) {
    var div = $("<div></div>");
    _parent.append(div);

    // add page config description i.e. "content" etc.
    // content
    var content;
    if (this.pageConfig.content !== undefined) {
        content = this.pageConfig.content;
    } else {
        content = "";
    }
    var p = $("<p>" + content + "</p>");
    div.append(p);

    // add stimuli controls in a table
    var tableStimuli = $("<table id='main' align='center'></table>");
    div.append(tableStimuli);

    var trWaveformControl = $("<tr id='trWs'></tr>");
    tableStimuli.append(trWaveformControl);
    var tdStopButton = $("<td class='stopButton'> \
      <button data-role='button' data-inline='true' id='buttonStop' class='center' onclick='"+ this.pageManager.getPageVariableName(this) + ".mushraAudioControl.stop();'>" + this.pageManager.getLocalizer().getFragment(this.language, 'stopButton') + "</button> \
    </td>");
    trWaveformControl.append(tdStopButton);
    var tdWaveformControl = $("<td></td>");
    trWaveformControl.append(tdWaveformControl);
    this.waveformVisualizer = new WaveformVisualizer(this.pageManager.getPageVariableName(this) + ".waveformVisualizer", tdWaveformControl, this.reference, this.pageConfig.showWaveform, this.pageConfig.enableLooping, this.mushraAudioControl);
    this.waveformVisualizer.create();
    this.waveformVisualizer.load();

    var trPlaybackControls = $("<tr></tr>");
    tableStimuli.append(trPlaybackControls);
    var tdPlaybackControls = $("<td id='td_AB' colspan='2'></td>");
    trPlaybackControls.append(tdPlaybackControls);

    var tablePlaybackControls = $("<table id='table_ab' class='center'></table>");
    tdPlaybackControls.append(tablePlaybackControls);
    var conditionLabel = (this.pageConfig.showConditionNames === true) ? this.condition.id : "Condition";
    var trNames = $("<tr><td>" + this.pageManager.getLocalizer().getFragment(this.language, 'reference') + "</td><td>" + conditionLabel + "</td></tr>");
    // TODO: language localisation for "condition"
    tablePlaybackControls.append(trNames);

    var trPlayButtons = $("<tr></tr>");
    tablePlaybackControls.append(trPlayButtons);
    var buttonPlayReference = $("<td><button data-theme='a' id='buttonReference' data-role='button' class='audioControlElement' onclick='" + this.pageManager.getPageVariableName(this) + ".btnCallbackReference()' style='margin : 0 auto;'>" + this.pageManager.getLocalizer().getFragment(this.language, 'playButton') + "</button></td>");
    trPlayButtons.append(buttonPlayReference);
    var buttonPlayCondition = $("<td><button data-theme='a' id='buttonCondition' data-role='button' class='audioControlElement' onclick='" + this.pageManager.getPageVariableName(this) + ".btnCallbackCondition()' style='margin : 0 auto;'>" + this.pageManager.getLocalizer().getFragment(this.language, 'playButton') + "</button></td>");
    trPlayButtons.append(buttonPlayCondition);

    // render controls
    var tableRating = document.createElement("table");
    tableRating.setAttribute("border", "0");
    tableRating.setAttribute("align", "center");
    tableRating.setAttribute("style", "margin-top: 0em;");
    var trRating = document.createElement("tr");
    var td = document.createElement("td");


    var width = this.radar.width;
    var height = this.radar.height;
    var renderDivId = "renderArea";
    var renderDiv = document.createElement("div");
    renderDiv.setAttribute("id", renderDivId);
    renderDiv.setAttribute("style", "border: solid");
    renderDiv.setAttribute("width", width);
    renderDiv.setAttribute("height", height);
    renderDiv.append(this.radar.canvas);
    td.appendChild(renderDiv);

    trRating.appendChild(td);
    tableRating.appendChild(trRating);
    div.append(tableRating);

    this.radar.render();

    this.macic = new MushraAudioControlInputController(this.mushraAudioControl, this.pageConfig.enableLooping);
    this.macic.bind();
};

BBCSpatialPage.prototype.setLoopStart = function () {
    var slider = document.getElementById('slider');
    var startSliderSamples = this.mushraAudioControl.audioCurrentPosition;
    var endSliderSamples = parseFloat(slider.noUiSlider.get()[1]);
    this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
}

BBCSpatialPage.prototype.setLoopEnd = function () {
    var slider = document.getElementById('slider');
    var startSliderSamples = parseFloat(slider.noUiSlider.get()[0]);
    var endSliderSamples = this.mushraAudioControl.audioCurrentPosition;
    this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
}

BBCSpatialPage.prototype.pause = function () {
    this.mushraAudioControl.pause();
};


BBCSpatialPage.prototype.btnCallbackReference = function () {
    this.currentItem = "ref";
    var label = $("#buttonReference").text();
    if (label == this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton')) {
        this.mushraAudioControl.pause();
        $("#buttonReference").text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
    } else if (label == this.pageManager.getLocalizer().getFragment(this.language, 'playButton')) {
        $(".audioControlElement").text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
        this.mushraAudioControl.playReference();
        $("#buttonReference").text(this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton'));

        this.cleanButtons();
        $.mobile.activePage.find('#buttonReference')		// add color to reference
            .removeClass('ui-btn-a')
            .addClass('ui-btn-b').attr('data-theme', 'b');
        $('#buttonReference').focus();
        $('#buttonReference').attr("active", "true");

    }
};

BBCSpatialPage.prototype.btnCallbackCondition = function () {
    this.currentItem = "cond";
    var label = $("#buttonCondition").text();
    if (label == this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton')) {
        this.mushraAudioControl.pause();
        $("#buttonCondition").text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
    } else if (label == this.pageManager.getLocalizer().getFragment(this.language, 'playButton')) {
        $(".audioControlElement").text(this.pageManager.getLocalizer().getFragment(this.language, 'playButton'));
        this.mushraAudioControl.playCondition(0);
        $("#buttonCondition").text(this.pageManager.getLocalizer().getFragment(this.language, 'pauseButton'));

        this.cleanButtons();
        $.mobile.activePage.find('#buttonCondition')		// add color to condition
            .removeClass('ui-btn-a')
            .addClass('ui-btn-b').attr('data-theme', 'b');
        $('#buttonCondition').focus();
        $('#buttonCondition').attr("active", "true");
    }
};

BBCSpatialPage.prototype.cleanButtons = function () {
    if ($('#buttonStop').attr("active") == "true") {
        $.mobile.activePage.find('#buttonStop')  //remove color from Stop
            .removeClass('ui-btn-b')
            .addClass('ui-btn-a').attr('data-theme', 'a');
        $('#buttonStop').attr("active", "false");
    }

    if ($('#buttonReference').attr("active") == "true") {
        $.mobile.activePage.find('#buttonReference')	//remove color from reference
            .removeClass('ui-btn-b')
            .addClass('ui-btn-a').attr('data-theme', 'a');
        $('#buttonReference').attr("active", "false");
    }

    if ($('#buttonCondition').attr("active") == "true") {
        $.mobile.activePage.find('#buttonCondition')	//remove color from condition
            .removeClass('ui-btn-b')
            .addClass('ui-btn-a').attr('data-theme', 'a');
        $('#buttonCondition').attr("active", "false");
    }
};

// BBCSpatialPage.prototype.setResult = function(result) {
//     if (!result) return;
//     this.result = result;
// }

/**
 * This method is called after the page is rendered. The purpose of this method is to load default values or saved values of the input controls. 
 */
BBCSpatialPage.prototype.load = function () {
    this.startTimeOnPage = new Date();
    // TODO: lock next button for now (if not rating yet)

    this.mushraAudioControl.initAudio();
    if (this.loop.start !== null && this.loop.end !== null) {
        this.mushraAudioControl.setLoop(0, 0, this.mushraAudioControl.getDuration(), this.mushraAudioControl.getDuration() / this.waveformVisualizer.stimulus.audioBuffer.sampleRate);
        this.mushraAudioControl.setPosition(0);
    }

    this.frameUpdateInterval = setInterval((function () {
        this.radar.render();
    }).bind(this), this.renderInterval_ms);
};

/**
 * This method is called just before the next page is presented to the user. In case values of input controls are needed for rerendering, they must be saved within in method. 
 */
BBCSpatialPage.prototype.save = function () {
    clearInterval(this.frameUpdateInterval);
    this.time += (new Date() - this.startTimeOnPage);
    this.macic.unbind();
    this.mushraAudioControl.removeEventListener(this.waveformVisualizer.numberEventListener);
    this.mushraAudioControl.freeAudio();
    this.loop.start = parseInt(this.waveformVisualizer.mushraAudioControl.audioLoopStart);
    this.loop.end = parseInt(this.waveformVisualizer.mushraAudioControl.audioLoopEnd);
};

/**
 * @param {ResponsesStorage} _reponsesStorage
 */
BBCSpatialPage.prototype.store = function (_reponsesStorage) {
    var trial = this.session.getTrial(this.pageConfig.type, this.pageConfig.id);
    if (trial === null) {
        trial = new Trial();
        trial.type = this.pageConfig.type;
        trial.id = this.pageConfig.id;
        this.session.trials[this.session.trials.length] = trial;
    }
    var rating = new BBCSpatialRating();
    rating.condition = this.condition.id;

    if (this.result == undefined) {
        rating.azimuth = "NA";
        rating.distance = "NA";
        rating.width = "NA";
        rating.elevation_change = "NA";
    } else {
        rating.azimuth = this.result["azimuth"];
        rating.distance = this.result["distance"];;
        rating.width = this.result["width"];;
        rating.elevation_change = this.result["elevation_change"];;
    }

    rating.time = this.time;
    trial.responses[trial.responses.length] = rating;
};

class AzRadRadar {
    constructor(_config) {
        this.mouse = {
            down: false,
            button: 0,
            x: 0,
            y: 0,
            px: 0,
            py: 0
        };
        this.width = 750;
        this.height = 500;
        this.canvas = null;
        this.canvasContext = null;
        this.canvasId = 'radar_canvas';
        this.listenerImg = null;
        this.listenerImgPath = 'res/listener.png';
        this.resultCallback = undefined;
        this.sourceParams = {
            azimuth: null,
            distance: null,
            width: 0
        }
        // TODO: set params from config
        this.refParams = {
            azimuth: 15,
            distance: 4,
            width: 0
        }

        var canvasMinDim = Math.min(this.width, this.height);
        var outerPad = 20;
        this.originX = canvasMinDim / 2;
        this.originY = canvasMinDim / 2;
        this.maxRadiusPix = (canvasMinDim - outerPad) / 2;
        this.distanceSteps = 7;
        this.dStepPix = this.maxRadiusPix / this.distanceSteps;
    }
    init(resultCallback) {
        this.resultCallback = resultCallback;
        this.canvas = document.createElement("canvas");
        this.canvas.style.left = 0;
        this.canvas.style.top = 0;
        this.canvas.style.zIndex = 0;
        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";
        this.canvas.width = parseInt(this.width);
        this.canvas.height = parseInt(this.height);
        this.canvas.setAttribute("id", this.canvasId);

        this.canvasContext = this.canvas.getContext('2d');
        this.loadListenerImage();
        this.canvas.onmousedown = (function (event) {
            this.radar.mouse.down = true;
            this.radar.mouse.button = event.which;
            this.radar.handleMouse(event);
            event.preventDefault();
        }).bind({ radar: this });
        this.canvas.onmousemove = (function (event) {
            this.radar.handleMouse(event);
            event.preventDefault();
        }).bind({ radar: this });
        this.canvas.onmouseup = (function (event) {
            this.radar.mouse.down = false;
            event.preventDefault();
        }).bind({ radar: this });
        this.canvas.onmouseout = (function (event) {
            this.radar.mouse.down = false;
            event.preventDefault();
        }).bind({ radar: this });
        this.canvas.oncontextmenu = function (event) {
            event.preventDefault();
        };
    }
    render() {
        var canvas = this.canvas;
        var canvasContext = this.canvasContext;

        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.fillStyle = "black";
        canvasContext.strokeStyle = "black";
        canvasContext.setLineDash([5, 5]);
        // radar rings
        for (let i = 1; i <= this.distanceSteps; ++i) {
            canvasContext.beginPath();
            canvasContext.arc(this.originX, this.originY, i * this.dStepPix, 0, 2 * Math.PI);
            canvasContext.stroke();
        }

        // compass lines
        // east-west
        canvasContext.beginPath();
        this.drawLine(this.originX - this.maxRadiusPix, this.originY, 2 * this.maxRadiusPix, 0);
        // north-south
        this.drawLine(this.originX, this.originY - this.maxRadiusPix, 0, 2 * this.maxRadiusPix);
        // diagonals
        var rad45 = 45. / 180. * Math.PI;
        var diagX = Math.sin(rad45) * this.maxRadiusPix;
        var diagY = Math.cos(rad45) * this.maxRadiusPix;
        this.drawLine(this.originX - diagX, this.originY - diagY, 2 * diagX, 2 * diagY);
        this.drawLine(this.originX + diagX, this.originY - diagY, -2 * diagX, 2 * diagY);
        canvasContext.stroke();

        // scale lines
        canvasContext.setLineDash([2, 5]);
        canvasContext.beginPath();
        this.drawLine(this.originX, this.originY - this.dStepPix, this.dStepPix + this.maxRadiusPix, 0);
        this.drawLine(this.originX + this.maxRadiusPix, this.originY, this.dStepPix, 0);
        this.drawLine(this.originX, this.originY - 4 * this.dStepPix, this.dStepPix + this.maxRadiusPix, 0);
        this.drawLine(this.originX, this.originY - 7 * this.dStepPix, this.dStepPix + this.maxRadiusPix, 0);
        canvasContext.stroke();

        canvasContext.font = '18px "Helvetica", sans-serif';
        canvasContext.textBaseline = "middle";
        canvasContext.fillStyle = "black";
        var wordX = this.originX + this.maxRadiusPix + this.dStepPix + 5;
        canvasContext.fillText('Inside the head', wordX, this.originY - this.dStepPix / 2);
        canvasContext.fillText('Nearer than reference', wordX, this.originY - this.dStepPix * 2.5);
        canvasContext.fillText('Reference', wordX, this.originY - this.dStepPix * 4);
        canvasContext.fillText('Further than reference', wordX, this.originY - this.dStepPix * 5.5);


        var arrowX = this.originX + this.maxRadiusPix + this.dStepPix / 2;
        canvasContext.setLineDash([]);
        canvasContext.beginPath();
        this.drawArrow(arrowX, this.originY - this.dStepPix * 3.5, 0, 2 * this.dStepPix);
        this.drawArrow(arrowX, this.originY - this.dStepPix * 4.5, 0, -2 * this.dStepPix);
        canvasContext.stroke();

        // listener
        if (this.listenerImg !== null) {
            var imW = this.listenerImg.width;
            canvasContext.globalCompositeOperation = "destination-over";
            canvasContext.globalAlpha = 0.85;
            canvasContext.drawImage(this.listenerImg, this.originX - imW / 2, this.originY - imW / 2);
            canvasContext.globalAlpha = 1.0;
            canvasContext.globalCompositeOperation = "source-over";
        }

        // sources
        var refBlue = "rgba(0,0,150,0.75)";
        var stimGreen = "rgba(0,190,0,0.75)";
        this.drawSource(this.refParams, refBlue, 10);
        this.drawSource(this.sourceParams, stimGreen, 10);
    }
    loadListenerImage() {
        var img = new Image();
        img.src = this.listenerImgPath;
        img.onload = (function () {
            this.radar.listenerImg = img;
        }).bind({
            radar: this
        });
    }
    drawLine(startX, startY, stepX, stepY) {
        if (this.canvasContext === null) return;
        this.canvasContext.moveTo(startX, startY);
        this.canvasContext.lineTo(startX + stepX, startY + stepY);
    }
    drawArrow(startX, startY, stepX, stepY) {
        if (this.canvasContext === null) return;
        var headlen = 10; // length of head in pixels
        var endX = startX + stepX;
        var endY = startY + stepY;
        var angle = Math.atan2(stepY, stepX);
        this.canvasContext.moveTo(startX, startY);
        this.canvasContext.lineTo(endX, endY);
        this.canvasContext.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        this.canvasContext.moveTo(endX, endY);
        this.canvasContext.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
    }
    drawSource(sourceParams, colour, size) {
        if (this.canvasContext === null) return;
        var azimuth = sourceParams["azimuth"];
        var distance = sourceParams["distance"];
        var width = sourceParams["width"];
        if (azimuth === null || distance === null) return;
        this.canvasContext.fillStyle = colour;
        this.canvasContext.beginPath();
        var azRadians = azimuth * Math.PI / 180.;
        var radPix = distance * this.dStepPix;
        // calc position in 
        var x = Math.sin(azRadians) * radPix;
        var y = Math.cos(azRadians) * radPix;
        this.canvasContext.arc(this.originX - x, this.originY - y, size, 0, 2 * Math.PI);
        this.canvasContext.fill();
        // then draw distance circle
        var distCircX = this.originX + this.maxRadiusPix + this.dStepPix * 0.5;
        var distCircY = this.originY - this.dStepPix * distance;
        this.canvasContext.strokeStyle = colour;
        this.canvasContext.beginPath();
        this.canvasContext.arc(distCircX, distCircY, size, 0, 2 * Math.PI);
        this.canvasContext.stroke();
        // source width
        if (width) {
            var arcAz = -(azRadians + Math.PI * 0.5);
            var halfArc = (width * 0.5) * Math.PI / 180.;
            this.canvasContext.lineWidth = 7.;
            this.canvasContext.beginPath();
            this.canvasContext.arc(this.originX, this.originY, radPix, arcAz - halfArc, arcAz + halfArc);
            this.canvasContext.stroke();
            this.canvasContext.lineWidth = 1.;
        }
    }
    handleMouse(event) {
        this.calcMousePos(event);
        var storeResult = false;
        if (this.mouse.down && this.mouse.button == 1) { // if left button down
            this.calcSourcePosition();
            storeResult = true;
        }
        if (this.mouse.down && this.mouse.button == 3) { // if right button down
            this.calcSourceWidth();
            storeResult = true;
        }
        if (storeResult === true && this.resultCallback !== undefined) {
            this.resultCallback(this.sourceParams)
        }
    }
    calcMousePos(event) {
        this.mouse.px = this.mouse.x;
        this.mouse.py = this.mouse.y;
        // TODO: this is affected by scroll on the window
        var rect = event.target.getBoundingClientRect();
        var posX = event.pageX - rect.left - $(window).scrollLeft();
        var posY = event.pageY - rect.top - $(window).scrollTop();
        var relX = posX - this.originX;
        var relY = posY - this.originY;
        this.mouse.x = relX;
        this.mouse.y = relY;
    }
    calcSourcePosition() {
        var azimuth = Math.atan2(-this.mouse.x, -this.mouse.y) * 180. / Math.PI;
        // limit to range 0-360 and integer
        azimuth = Math.round(azimuth);
        azimuth = (azimuth + 360) % 360;

        var radius = Math.sqrt(this.mouse.x * this.mouse.x + this.mouse.y * this.mouse.y); // currently in pixels
        // limit to range 0 to radiusSteps and set limited resolution
        var resolution = 0.5;
        var distance = Math.round(radius * this.distanceSteps / this.maxRadiusPix / resolution) * resolution;
        distance = Math.min(distance, this.distanceSteps);
        this.sourceParams["azimuth"] = azimuth;
        this.sourceParams["distance"] = distance;
    }
    calcSourceWidth() {
        if (this.sourceParams["azimuth"] === null) return;
        var currentWidth = this.sourceParams["width"];
        var widthDiff = this.mouse.py - this.mouse.y;
        var newWidth = currentWidth + widthDiff;
        newWidth = Math.max(newWidth, 0);
        newWidth = Math.min(newWidth, 360);
        this.sourceParams["width"] = newWidth;
    }
}