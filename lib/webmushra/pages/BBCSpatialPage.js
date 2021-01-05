function BBCSpatialPage(
  _reference,
  _condition,
  _pageManager,
  _pageTemplateRenderer,
  _audioContext,
  _bufferSize,
  _audioFileLoader,
  _session,
  _pageConfig,
  _errorHandler,
  _language
) {
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
  this.slider = null;

  this.currentItem = null;
  this.refParams = this.pageConfig.referenceParams;
  this.result = {
    azimuth: null,
    distance: null,
    width: null,
    height: null,
  };
  this.setResult = function (result) {
    if (!result) return;
    if ("azimuth" in result) this.result["azimuth"] = result["azimuth"];
    if ("distance" in result) this.result["distance"] = result["distance"];
    if ("width" in result) this.result["width"] = result["width"];
    if ("height" in result) this.result["height"] = result["height"];
    this.checkCompleteResponse();
  }.bind(this);
  this.checkCompleteResponse = function () {
    if (
      this.result["azimuth"] !== null &&
      this.result["distance"] !== null &&
      this.result["width"] !== null &&
      this.result["height"] !== null
    )
      this.pageTemplateRenderer.unlockNextButton();
  }.bind(this);

  this.renderInterval_ms = 20; // this.pageConfig.renderInterval_ms;

  this.audioFileLoader.addFile(
    this.reference.getFilepath(),
    function (_buffer, _stimulus) {
      _stimulus.setAudioBuffer(_buffer);
    },
    this.reference
  );
  this.audioFileLoader.addFile(
    this.condition.getFilepath(),
    function (_buffer, _stimulus) {
      _stimulus.setAudioBuffer(_buffer);
    },
    this.condition
  );

  this.loop = { start: null, end: null };

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
  // prevent context menu to avoid it popping up when you're setting width
  document.oncontextmenu = function (ev) {
    ev.preventDefault();
  };
  this.initMUSHRAController();
  this.initUI();
};

BBCSpatialPage.prototype.initMUSHRAController = function () {
  var noCreateAnchor = false;
  var noRandomize = false;
  this.mushraAudioControl = new MushraAudioControl(
    this.audioContext,
    this.bufferSize,
    this.reference,
    [this.condition],
    this.errorHandler,
    noCreateAnchor,
    noCreateAnchor,
    noRandomize
  );
  this.mushraAudioControl.addEventListener(
    function (_event) {
      if (_event.name == "stopTriggered") {
        $(".audioControlElement").text(
          this.pageManager
            .getLocalizer()
            .getFragment(this.language, "playButton")
        );
        if ($("#buttonReference").attr("active") == "true") {
          $.mobile.activePage
            .find("#buttonReference") //remove color
            .removeClass("ui-btn-b")
            .addClass("ui-btn-a")
            .attr("data-theme", "a");
          $("#buttonReference").attr("active", "false");
        }
        if ($("#buttonConditions0").attr("active") == "true") {
          $.mobile.activePage
            .find("#buttonConditions0") //remove color
            .removeClass("ui-btn-b")
            .addClass("ui-btn-a")
            .attr("data-theme", "a");
          $("#buttonConditions0").attr("active", "false");
        }
        $.mobile.activePage
          .find("#buttonStop") //add color to stop
          .removeClass("ui-btn-a")
          .addClass("ui-btn-b")
          .attr("data-theme", "b");
        $.mobile.activePage.find("#buttonStop").focus();
        $("#buttonStop").attr("active", "true");
      }
    }.bind(this)
  );
};

BBCSpatialPage.prototype.initUI = function () {
  this.radar = new AzRadRadarRel(this.pageConfig);
  this.radar.init(this.setResult);
  this.slider = new HeightSliderRel(this.pageConfig);
  this.slider.init(this.setResult);
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
  var tdStopButton = $(
    "<td class='stopButton'> \
      <button data-role='button' data-inline='true' id='buttonStop' class='center' onclick='" +
      this.pageManager.getPageVariableName(this) +
      ".mushraAudioControl.stop();'>" +
      this.pageManager.getLocalizer().getFragment(this.language, "stopButton") +
      "</button> \
    </td>"
  );
  trWaveformControl.append(tdStopButton);
  var tdWaveformControl = $("<td></td>");
  trWaveformControl.append(tdWaveformControl);
  this.waveformVisualizer = new WaveformVisualizer(
    this.pageManager.getPageVariableName(this) + ".waveformVisualizer",
    tdWaveformControl,
    this.reference,
    this.pageConfig.showWaveform,
    this.pageConfig.enableLooping,
    this.mushraAudioControl
  );
  this.waveformVisualizer.create();
  this.waveformVisualizer.load();

  var trPlaybackControls = $("<tr></tr>");
  tableStimuli.append(trPlaybackControls);
  var tdPlaybackControls = $("<td id='td_AB' colspan='2'></td>");
  trPlaybackControls.append(tdPlaybackControls);

  var tablePlaybackControls = $("<table id='table_ab' class='center'></table>");
  tdPlaybackControls.append(tablePlaybackControls);
  var conditionLabel =
    this.pageConfig.showConditionNames === true
      ? this.condition.id
      : "Condition";
  var trNames = $(
    "<tr><td>" +
      this.pageManager.getLocalizer().getFragment(this.language, "reference") +
      "</td><td>" +
      conditionLabel +
      "</td></tr>"
  );
  // TODO: language localisation for "condition"
  tablePlaybackControls.append(trNames);

  var trPlayButtons = $("<tr></tr>");
  tablePlaybackControls.append(trPlayButtons);
  var buttonPlayReference = $(
    "<td><button data-theme='a' id='buttonReference' data-role='button' class='audioControlElement' onclick='" +
      this.pageManager.getPageVariableName(this) +
      ".btnCallbackReference()' style='margin : 0 auto;'>" +
      this.pageManager.getLocalizer().getFragment(this.language, "playButton") +
      "</button></td>"
  );
  trPlayButtons.append(buttonPlayReference);
  var buttonPlayCondition = $(
    "<td><button data-theme='a' id='buttonConditions0' data-role='button' class='audioControlElement' onclick='" +
      this.pageManager.getPageVariableName(this) +
      ".btnCallbackCondition()' style='margin : 0 auto;'>" +
      this.pageManager.getLocalizer().getFragment(this.language, "playButton") +
      "</button></td>"
  );
  trPlayButtons.append(buttonPlayCondition);

  // render controls
  var tableRating = document.createElement("table");
  div.append(tableRating);
  tableRating.setAttribute("border", "0");
  tableRating.setAttribute("align", "center");
  tableRating.setAttribute("style", "margin-top: 0em;");

  var trRatingHeading = document.createElement("tr");
  trRatingHeading.setAttribute("style", "vertical-align:top");
  tableRating.appendChild(trRatingHeading);

  var tdSH = document.createElement("td");
  tdSH.innerHTML =
    "<h3>Height</h3>Use the primary mouse button to indicate the perceived source height (green) relative to the reference (blue).";
  trRatingHeading.appendChild(tdSH);

  var tdRH = document.createElement("td");
  tdRH.innerHTML =
    "<h3>Azimuth, Distance, and Width</h3>Use the primary mouse button to indicate the perceived source azimuth and distance (green) relative to the reference (blue).<br/>Use the secondary mouse button to indicate the perceived source width (dragging up to increase it and down to decrease it).";
  trRatingHeading.appendChild(tdRH);

  var trRating = document.createElement("tr");
  tableRating.appendChild(trRating);

  var tdS = document.createElement("td");
  var sWidth = this.slider.width;
  var sHeight = this.slider.height;
  var sliderDivId = "sliderArea";
  var sliderDiv = document.createElement("div");
  sliderDiv.setAttribute("id", sliderDivId);
  sliderDiv.setAttribute("width", sWidth);
  sliderDiv.setAttribute("height", sHeight);
  sliderDiv.append(this.slider.canvas);
  tdS.appendChild(sliderDiv);
  trRating.appendChild(tdS);

  var tdR = document.createElement("td");
  var rWidth = this.radar.width;
  var rHeight = this.radar.height;
  var radarDivId = "radarArea";
  var radarDiv = document.createElement("div");
  radarDiv.setAttribute("id", radarDivId);
  radarDiv.setAttribute("width", rWidth);
  radarDiv.setAttribute("height", rHeight);
  radarDiv.append(this.radar.canvas);
  tdR.appendChild(radarDiv);
  trRating.appendChild(tdR);

  var trCompletionMsg = document.createElement("tr");
  var tdCM = document.createElement("td");
  tdCM.colSpan = 2;
  tdCM.innerHTML =
    "Please set the height, azimuth, distance, and width before clicking 'Next'";
  trCompletionMsg.append(tdCM);
  tableRating.append(trCompletionMsg);

  this.slider.render();
  this.radar.render();

  this.macic = new MushraAudioControlInputController(
    this.mushraAudioControl,
    this.pageConfig.enableLooping
  );
  this.macic.bind();
};

BBCSpatialPage.prototype.setLoopStart = function () {
  var slider = document.getElementById("slider");
  var startSliderSamples = this.mushraAudioControl.audioCurrentPosition;
  var endSliderSamples = parseFloat(slider.noUiSlider.get()[1]);
  this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

BBCSpatialPage.prototype.setLoopEnd = function () {
  var slider = document.getElementById("slider");
  var startSliderSamples = parseFloat(slider.noUiSlider.get()[0]);
  var endSliderSamples = this.mushraAudioControl.audioCurrentPosition;
  this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

BBCSpatialPage.prototype.pause = function () {
  this.mushraAudioControl.pause();
};

BBCSpatialPage.prototype.btnCallbackReference = function () {
  this.currentItem = "ref";
  var label = $("#buttonReference").text();
  if (
    label ==
    this.pageManager.getLocalizer().getFragment(this.language, "pauseButton")
  ) {
    this.mushraAudioControl.pause();
    $("#buttonReference").text(
      this.pageManager.getLocalizer().getFragment(this.language, "playButton")
    );
  } else if (
    label ==
    this.pageManager.getLocalizer().getFragment(this.language, "playButton")
  ) {
    $(".audioControlElement").text(
      this.pageManager.getLocalizer().getFragment(this.language, "playButton")
    );
    this.mushraAudioControl.playReference();
    $("#buttonReference").text(
      this.pageManager.getLocalizer().getFragment(this.language, "pauseButton")
    );

    this.cleanButtons();
    $.mobile.activePage
      .find("#buttonReference") // add color to reference
      .removeClass("ui-btn-a")
      .addClass("ui-btn-b")
      .attr("data-theme", "b");
    $("#buttonReference").focus();
    $("#buttonReference").attr("active", "true");
  }
};

BBCSpatialPage.prototype.btnCallbackCondition = function () {
  this.currentItem = "cond";
  var label = $("#buttonConditions0").text();
  if (
    label ==
    this.pageManager.getLocalizer().getFragment(this.language, "pauseButton")
  ) {
    this.mushraAudioControl.pause();
    $("#buttonConditions0").text(
      this.pageManager.getLocalizer().getFragment(this.language, "playButton")
    );
  } else if (
    label ==
    this.pageManager.getLocalizer().getFragment(this.language, "playButton")
  ) {
    $(".audioControlElement").text(
      this.pageManager.getLocalizer().getFragment(this.language, "playButton")
    );
    this.mushraAudioControl.playCondition(0);
    $("#buttonConditions0").text(
      this.pageManager.getLocalizer().getFragment(this.language, "pauseButton")
    );

    this.cleanButtons();
    $.mobile.activePage
      .find("#buttonConditions0") // add color to condition
      .removeClass("ui-btn-a")
      .addClass("ui-btn-b")
      .attr("data-theme", "b");
    $("#buttonConditions0").focus();
    $("#buttonConditions0").attr("active", "true");
  }
};

BBCSpatialPage.prototype.cleanButtons = function () {
  if ($("#buttonStop").attr("active") == "true") {
    $.mobile.activePage
      .find("#buttonStop") //remove color from Stop
      .removeClass("ui-btn-b")
      .addClass("ui-btn-a")
      .attr("data-theme", "a");
    $("#buttonStop").attr("active", "false");
  }

  if ($("#buttonReference").attr("active") == "true") {
    $.mobile.activePage
      .find("#buttonReference") //remove color from reference
      .removeClass("ui-btn-b")
      .addClass("ui-btn-a")
      .attr("data-theme", "a");
    $("#buttonReference").attr("active", "false");
  }

  if ($("#buttonConditions0").attr("active") == "true") {
    $.mobile.activePage
      .find("#buttonConditions0") //remove color from condition
      .removeClass("ui-btn-b")
      .addClass("ui-btn-a")
      .attr("data-theme", "a");
    $("#buttonConditions0").attr("active", "false");
  }
};

/**
 * This method is called after the page is rendered. The purpose of this method is to load default values or saved values of the input controls.
 */
BBCSpatialPage.prototype.load = function () {
  this.startTimeOnPage = new Date();

  if (this.pageConfig.mustRate == true) {
    this.pageTemplateRenderer.lockNextButton();
    this.checkCompleteResponse();
  }

  this.mushraAudioControl.initAudio();
  if (this.loop.start !== null && this.loop.end !== null) {
    this.mushraAudioControl.setLoop(
      0,
      0,
      this.mushraAudioControl.getDuration(),
      this.mushraAudioControl.getDuration() /
        this.waveformVisualizer.stimulus.audioBuffer.sampleRate
    );
    this.mushraAudioControl.setPosition(0);
  }

  this.frameUpdateInterval = setInterval(
    function () {
      this.slider.render();
      this.radar.render();
    }.bind(this),
    this.renderInterval_ms
  );
};

/**
 * This method is called just before the next page is presented to the user. In case values of input controls are needed for rerendering, they must be saved within in method.
 */
BBCSpatialPage.prototype.save = function () {
  clearInterval(this.frameUpdateInterval);
  this.time += new Date() - this.startTimeOnPage;
  this.macic.unbind();
  this.mushraAudioControl.removeEventListener(
    this.waveformVisualizer.numberEventListener
  );
  this.mushraAudioControl.freeAudio();
  this.loop.start = parseInt(
    this.waveformVisualizer.mushraAudioControl.audioLoopStart
  );
  this.loop.end = parseInt(
    this.waveformVisualizer.mushraAudioControl.audioLoopEnd
  );
};

BBCSpatialPage.prototype.store = function () {
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
    rating.height = "NA";
    rating.width = "NA";
    rating.height = "NA";
  } else {
    rating.azimuth = this.result["azimuth"];
    rating.distance = this.result["distance"];
    rating.width = this.result["width"];
    rating.height = this.result["height"];
  }

  rating.time = this.time;
  trial.responses[trial.responses.length] = rating;
};

BBCSpatialPage.prototype.updateReferenceParams = function (refParams) {
  // refParams (object): azimuth, distance, width, height
  if ("azimuth" in refParams && refParams["azimuth"] !== null)
    this.refParams["azimuth"] = refParams["azimuth"];
  if ("distance" in refParams && refParams["distance"] !== null)
    this.refParams["distance"] = refParams["distance"];
  if ("width" in refParams && refParams["width"] !== null)
    this.refParams["width"] = refParams["width"];
  if ("height" in refParams && refParams["height"] !== null)
    this.refParams["height"] = refParams["height"];
  this.radar.updateRefParams(this.refParams);
};
