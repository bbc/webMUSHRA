function LikertComparisonPage(
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
  this.likert = null;

  this.currentItem = null;
  this.result = null;
  this.likertCallback = function (prefix) {
    if (!prefix) return;
    this.result = $("input[name='" + prefix + "_response']:checked").val();
    this.pageTemplateRenderer.unlockNextButton();
  }.bind(this);

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
  this.slider = { start: null, end: null };

  this.time = 0; // will store time in ms
  this.startTimeOnPage = null;
}
/**
 * @return {String} Returns the name of the page. Objects of a Page class might have different names.
 */
LikertComparisonPage.prototype.getName = function () {
  return this.pageConfig.name;
};
/**
 * The init method is called before the pages are rendered. The method is called only once.
 * @param {Function} _callbackError The function that must be called if an error occurs. The function has one argument which is the error message.
 */
LikertComparisonPage.prototype.init = function () {
  this.initMUSHRAController();
  var likertDisabledOnStart = false;
  this.likert = new LikertScale(
    this.pageConfig.response,
    "timbral_quality",
    likertDisabledOnStart,
    this.likertCallback
  );
};

LikertComparisonPage.prototype.initMUSHRAController = function () {
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

/**
 * Renders the page. This function might be called multiple times (depending on whether navigation is allowed and on the user behaviour)
 * @param {Object} _parent JQuery element which represent the parent DOM element where the content of the page must be stored.
 */
LikertComparisonPage.prototype.render = function (_parent) {
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
    "<td><button data-theme='a' id='buttonCondition' data-role='button' class='audioControlElement' onclick='" +
      this.pageManager.getPageVariableName(this) +
      ".btnCallbackCondition()' style='margin : 0 auto;'>" +
      this.pageManager.getLocalizer().getFragment(this.language, "playButton") +
      "</button></td>"
  );
  trPlayButtons.append(buttonPlayCondition);

  this.likert.render(div);

  this.macic = new MushraAudioControlInputController(
    this.mushraAudioControl,
    this.pageConfig.enableLooping
  );
  this.macic.bind();
};

LikertComparisonPage.prototype.setLoopStart = function () {
  var slider = document.getElementById("slider");
  var startSliderSamples = this.mushraAudioControl.audioCurrentPosition;
  var endSliderSamples = parseFloat(slider.noUiSlider.get()[1]);
  this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

LikertComparisonPage.prototype.setLoopEnd = function () {
  var slider = document.getElementById("slider");
  var startSliderSamples = parseFloat(slider.noUiSlider.get()[0]);
  var endSliderSamples = this.mushraAudioControl.audioCurrentPosition;
  this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

LikertComparisonPage.prototype.pause = function () {
  this.mushraAudioControl.pause();
};

LikertComparisonPage.prototype.btnCallbackReference = function () {
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

LikertComparisonPage.prototype.btnCallbackCondition = function () {
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

LikertComparisonPage.prototype.cleanButtons = function () {
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
LikertComparisonPage.prototype.load = function () {
  this.startTimeOnPage = new Date();

  if (this.pageConfig.mustRate == true) {
    this.pageTemplateRenderer.lockNextButton();
  }

  if (this.result) {
    $(
      "input[name='" +
        this.likert.prefix +
        "_response'][value='" +
        this.result +
        "']"
    ).attr("checked", "checked");
    $(
      "input[name='" +
        this.likert.prefix +
        "_response'][value='" +
        this.result +
        "']"
    ).checkboxradio("refresh");
    this.likert.group.change();
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
};

/**
 * This method is called just before the next page is presented to the user. In case values of input controls are needed for rerendering, they must be saved within in method.
 */
LikertComparisonPage.prototype.save = function () {
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

/**
 * @param {ResponsesStorage} _reponsesStorage
 */
LikertComparisonPage.prototype.store = function (_reponsesStorage) {
  var trial = this.session.getTrial(this.pageConfig.type, this.pageConfig.id);
  if (trial === null) {
    trial = new Trial();
    trial.type = this.pageConfig.type;
    trial.id = this.pageConfig.id;
    this.session.trials[this.session.trials.length] = trial;
  }
  var rating = new LikertSingleStimulusRating();
  rating.stimulus = this.condition.id;

  if (this.result == undefined) {
    rating.stimulusRating = "NA";
  } else {
    rating.stimulusRating = this.result;
  }

  rating.time = this.time;
  trial.responses[trial.responses.length] = rating;
};
