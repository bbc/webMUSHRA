function BBCSpatialPage(_pageManager, _pageConfig, _session, _audioContext, _bufferSize, _audioFileLoader, _errorHandler, _language) {
    this.pageManager = _pageManager;
    this.pageConfig = _pageConfig;
    this.session = _session;
    this.audioContext = _audioContext;
    this.bufferSize = _bufferSize;
    this.audioFileLoader = audioFileLoader;
    this.errorHandler = errorHandler;
    this.language = _language;

    this.stimuli = [];

    this.time = 0; // will store time in ms
    this.div = null;
    this.renderDiv = null;
    this.canvas = null;
    this.canvasContext = null;
    this.filePlayer = null;
    this.listenerImg = null;
    this.radar = null;

    this.activeResponse = null;
    this.responses = {};
    this.mouseDown = false;

    this.renderInterval_ms = 20; // this.pageConfig.renderInterval_ms;
    this.filePlayer = null;

    // create stimuli objects and load files
    for (var key in _pageConfig.stimuli) {
        this.stimuli[this.stimuli.length] = new Stimulus(key, _pageConfig.stimuli[key]);
    }
    shuffle(this.stimuli);

    for (var i = 0; i < this.stimuli.length; ++i) {
        this.audioFileLoader.addFile(this.stimuli[i].getFilepath(), (function (_buffer, _stimulus) {
            _stimulus.setAudioBuffer(_buffer);
        }), this.stimuli[i]);
    }
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
    this.filePlayer = new FilePlayer(this.audioContext, this.bufferSize, this.stimuli, this.errorHandler, this.language, this.pageManager.getLocalizer());
}


BBCSpatialPage.prototype.initUI = function () {
    var width = 750;
    var height = 500;
    var renderDivId = "renderArea";
    this.renderDiv = document.createElement("div");
    this.renderDiv.setAttribute("id", renderDivId);
    this.renderDiv.setAttribute("style", "border: solid");
    this.renderDiv.setAttribute("width", width);
    this.renderDiv.setAttribute("height", height);

    // init scene
    var img = new Image();
    img.src = 'res/listener.png';
    img.onload = (function () {
        this.page.listenerImg = img;
    }).bind({
        page: this
    });

    this.radar = new AzRadRadar();
    this.radar.init(this.renderDiv);
};
BBCSpatialPage.prototype.mousePosToAzRad = function (event) {
    var rect = event.target.getBoundingClientRect();
    var relX = event.pageX - rect.left;
    var relY = event.pageY - rect.top;
    var azimuth = 0, radius = 1;
    return { azimuth: azimuth, radius: radius };
}
/**
 * Renders the page. This function might be called multiple times (depending on whether navigation is allowed and on the user behaviour)
 * @param {Object} _parent JQuery element which represent the parent DOM element where the content of the page must be stored.
 */
BBCSpatialPage.prototype.render = function (_parent) {
    var div = document.createElement("div");

    // add page config description i.e. "content" etc.
    // content
    var content;
    if (this.pageConfig.content !== undefined) {
        content = this.pageConfig.content;
        var text = document.createElement("div");
        text.innerHTML = content;
        div.appendChild(text);
    }

    _parent.append(div);

    // add stimuli controls in a table
    // use file player to add a render element to each
    var tableStimuli = document.createElement("table");
    tableStimuli.setAttribute("border", "0");
    tableStimuli.setAttribute("align", "center");
    tableStimuli.setAttribute("style", "margin-top: 0em;");
    var trStimuli = document.createElement("tr");
    for (var i = 0; i < this.stimuli.length; ++i) {
        var td = $("<td></td>");
        var divStimulus = $("<div id='spatial_stimuli_" + i + "' class='ui-body ui-body-a ui-corner-all'></div>");
        td.append(divStimulus);
        this.filePlayer.renderElement(divStimulus, i);
        trStimuli.appendChild(td.get(0));
    }
    tableStimuli.appendChild(trStimuli);
    div.appendChild(tableStimuli);

    // stim
    var stimulus = null;
    var stimulusIndex = null;
    for (var j = 0; j < this.stimuli.length; ++j) {
        // TODO: link up with colour of balls on display
        var c = 0xff7029;
        var color = "#" + ((1 << 24) + c).toString(16).substr(1);
        var label = "Pos";
        button = $("<button id='" + this.stimuli[j] + "' data-inline='true' style='background-color:#" + ((1 << 24) + c).toString(16).substr(1) + "; background-image:radial-gradient(#ffffff 0%, " + color + " 100%)'>" + label + "</button>");
        button.on("click", (function () {
            this.page.setBoxShadow(this.page.activeResponse, this.name, "#555555");
            this.page.activeResponse = this.name;
        }).bind({
            page: this,
            // label: respConfig.label,
            name: this.stimuli[j],
            button: button
        }));
        $("#spatial_stimuli_" + j).append(button);
    }

    // render controls
    var tableRating = document.createElement("table");
    tableRating.setAttribute("border", "0");
    tableRating.setAttribute("align", "center");
    tableRating.setAttribute("style", "margin-top: 0em;");
    var trRating = document.createElement("tr");
    var td = document.createElement("td");
    td.appendChild(this.renderDiv);
    trRating.appendChild(td);
    tableRating.appendChild(trRating);
    div.appendChild(tableRating);

    this.radar.render();
};

BBCSpatialPage.prototype.setBoxShadow = function (_lastActiveButton, _currentActiveButton, color) {
    if (_lastActiveButton != null) {
        document.getElementById(_lastActiveButton).style.boxShadow = "0 0 0 white , 0 0 0 white";

    }
    document.getElementById(_currentActiveButton).style.boxShadow = "0 0 30px " + color + " , 0 0 30px " + color;
};

/**
 * This method is called after the page is rendered. The purpose of this method is to load default values or saved values of the input controls. 
 */
BBCSpatialPage.prototype.load = function () {
    this.startTimeOnPage = new Date();
    this.frameUpdateInterval = setInterval((function () {
        this.radar.render();
    }).bind(this), this.renderInterval_ms);
    this.filePlayer.init();
};

/**
 * This method is called just before the next page is presented to the user. In case values of input controls are needed for rerendering, they must be saved within in method. 
 */
BBCSpatialPage.prototype.save = function () {
    clearInterval(this.frameUpdateInterval);
    this.time += (new Date() - this.startTimeOnPage);
    this.filePlayer.free();
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
    rating.stimulus = this.stimulus.id;

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
        this.parent = null;
        this.sourceParams = {
            azimuth: null,
            radius: null,
            width: 0
        }
        this.refParams = {
            azimuth: 20,
            radius: 4,
            width: 0
        }

        var canvasMinDim = Math.min(this.width, this.height);
        var outerPad = 20;
        this.originX = canvasMinDim / 2;
        this.originY = canvasMinDim / 2;
        this.maxRadiusPix = (canvasMinDim - outerPad) / 2;
        this.radiusSteps = 7;
        this.rStepPix = this.maxRadiusPix / this.radiusSteps;
    }
    init(parent) {
        this.parent = parent;

        this.canvas = document.createElement("canvas");
        this.canvas.style.left = 0;
        this.canvas.style.top = 0;
        this.canvas.style.zIndex = 0;
        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";
        this.canvas.width = parseInt(this.width);
        this.canvas.height = parseInt(this.height);
        this.canvas.setAttribute("id", this.canvasId);
        this.parent.append(this.canvas);

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
        for (let i = 1; i <= this.radiusSteps; ++i) {
            canvasContext.beginPath();
            canvasContext.arc(this.originX, this.originY, i * this.rStepPix, 0, 2 * Math.PI);
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
        this.drawLine(this.originX, this.originY - this.rStepPix, this.rStepPix + this.maxRadiusPix, 0);
        this.drawLine(this.originX + this.maxRadiusPix, this.originY, this.rStepPix, 0);
        this.drawLine(this.originX, this.originY - 4 * this.rStepPix, this.rStepPix + this.maxRadiusPix, 0);
        this.drawLine(this.originX, this.originY - 7 * this.rStepPix, this.rStepPix + this.maxRadiusPix, 0);
        canvasContext.stroke();

        canvasContext.font = '18px sans';
        canvasContext.textBaseline = "middle";
        canvasContext.fillStyle = "black";
        var wordX = this.originX + this.maxRadiusPix + this.rStepPix + 5;
        canvasContext.fillText('Inside the head', wordX, this.originY - this.rStepPix / 2);
        canvasContext.fillText('Nearer than reference', wordX, this.originY - this.rStepPix * 2.5);
        canvasContext.fillText('Reference', wordX, this.originY - this.rStepPix * 4);
        canvasContext.fillText('Further than reference', wordX, this.originY - this.rStepPix * 5.5);


        var arrowX = this.originX + this.maxRadiusPix + this.rStepPix / 2;
        canvasContext.setLineDash([]);
        canvasContext.beginPath();
        this.drawArrow(arrowX, this.originY - this.rStepPix * 3.5, 0, 2 * this.rStepPix);
        this.drawArrow(arrowX, this.originY - this.rStepPix * 4.5, 0, -2 * this.rStepPix);
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
        var radius = sourceParams["radius"];
        var width = sourceParams["width"];
        if (azimuth === null || radius === null) return;
        this.canvasContext.fillStyle = colour;
        this.canvasContext.beginPath();
        var azRadians = azimuth * Math.PI / 180.;
        var radPix = radius * this.rStepPix;
        // calc position in 
        var x = Math.sin(azRadians) * radPix;
        var y = Math.cos(azRadians) * radPix;
        this.canvasContext.arc(this.originX - x, this.originY - y, size, 0, 2 * Math.PI);
        this.canvasContext.fill();
        // then draw distance circle
        var distCircX = this.originX + this.maxRadiusPix + this.rStepPix * 0.5;
        var distCircY = this.originY - this.rStepPix * radius;
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
        if (this.mouse.down && this.mouse.button == 1) // if left button down
            this.calcSourcePosition();
        if (this.mouse.down && this.mouse.button == 3) // if right button down
            this.calcSourceWidth();
    }
    calcMousePos(event) {
        this.mouse.px = this.mouse.x;
        this.mouse.py = this.mouse.y;
        var rect = event.target.getBoundingClientRect();
        var posX = event.pageX - rect.left;
        var posY = event.pageY - rect.top;
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
        radius = Math.round(radius * this.radiusSteps / this.maxRadiusPix / resolution) * resolution;
        radius = Math.min(radius, this.radiusSteps);
        this.sourceParams["azimuth"] = azimuth;
        this.sourceParams["radius"] = radius;
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