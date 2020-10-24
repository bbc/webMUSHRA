/*************************************************************************
         (C) Copyright AudioLabs 2017 

This source code is protected by copyright law and international treaties. This source code is made available to You subject to the terms and conditions of the Software License for the webMUSHRA.js Software. Said terms and conditions have been made available to You prior to Your download of this source code. By downloading this source code You agree to be bound by the above mentionend terms and conditions, which can also be found here: https://www.audiolabs-erlangen.de/resources/webMUSHRA. Any unauthorised use of this source code may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under law. 

**************************************************************************/

function MultipleStimulusFamiliarisationPage(
  _pageManager,
  _pageTemplateRenderer,
  _audioContext,
  _bufferSize,
  _audioFileLoader,
  _session,
  _pageConfig,
  _mushraValidator,
  _errorHandler,
  _language
) {
  this.pageManager = _pageManager;
  this.pageTemplateRenderer = _pageTemplateRenderer;
  this.audioContext = _audioContext;
  this.bufferSize = _bufferSize;
  this.audioFileLoader = _audioFileLoader;
  this.session = _session;
  this.pageConfig = _pageConfig;
  this.mushraValidator = _mushraValidator;
  this.errorHandler = _errorHandler;
  this.language = _language;
  this.mushraAudioControl = null;
  this.div = null;
  this.waveformVisualizer = null;
  this.macic = null;

  this.currentItem = null;

  this.tdLoop2 = null;

  this.conditions = [];
  for (var key in this.pageConfig.stimuli) {
    this.conditions[this.conditions.length] = new Stimulus(
      key,
      this.pageConfig.stimuli[key]
    );
  }
  this.reference = new Stimulus("reference", this.pageConfig.reference);
  this.audioFileLoader.addFile(
    this.reference.getFilepath(),
    function (_buffer, _stimulus) {
      _stimulus.setAudioBuffer(_buffer);
    },
    this.reference
  );
  for (var i = 0; i < this.conditions.length; ++i) {
    this.audioFileLoader.addFile(
      this.conditions[i].getFilepath(),
      function (_buffer, _stimulus) {
        _stimulus.setAudioBuffer(_buffer);
      },
      this.conditions[i]
    );
  }

  // data
  this.loop = { start: null, end: null };
  this.slider = { start: null, end: null };

  this.time = 0;
  this.startTimeOnPage = null;
}

MultipleStimulusFamiliarisationPage.prototype.getName = function () {
  return this.pageConfig.name;
};

MultipleStimulusFamiliarisationPage.prototype.init = function () {
  var toDisable;
  var td;
  var active;

  this.mushraValidator.checkNumChannels(this.audioContext, this.reference);
  var i;
  for (i = 0; i < this.conditions.length; ++i) {
    this.mushraValidator.checkSamplerate(
      this.audioContext.sampleRate,
      this.conditions[i]
    );
  }
  this.mushraValidator.checkConditionConsistency(
    this.reference,
    this.conditions
  );

  this.mushraAudioControl = new MushraAudioControl(
    this.audioContext,
    this.bufferSize,
    this.reference,
    this.conditions,
    this.errorHandler,
    this.pageConfig.createAnchor35,
    this.pageConfig.createAnchor70,
    this.pageConfig.randomize
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
            .find("#buttonReference") //remove color from Reference
            .removeClass("ui-btn-b")
            .addClass("ui-btn-a")
            .attr("data-theme", "a");
          $("#buttonReference").attr("active", "false");
        }

        for (i = 0; i < _event.conditionLength; i++) {
          active = "#buttonConditions" + i;
          if ($(active).attr("active") == "true") {
            $.mobile.activePage
              .find(active) // remove color from conditions
              .removeClass("ui-btn-b")
              .addClass("ui-btn-a")
              .attr("data-theme", "a");
            $(active).attr("active", "false");
            break;
          }
        }

        $.mobile.activePage
          .find("#buttonStop") //add color to stop
          .removeClass("ui-btn-a")
          .addClass("ui-btn-b")
          .attr("data-theme", "b");
        $.mobile.activePage.find("#buttonStop").focus();
        $("#buttonStop").attr("active", "true");
      } else if (_event.name == "playReferenceTriggered") {
        if ($("#buttonStop").attr("active") == "true") {
          $.mobile.activePage
            .find("#buttonStop") //remove color from Stop
            .removeClass("ui-btn-b")
            .addClass("ui-btn-a")
            .attr("data-theme", "a");
          $("#buttonStop").attr("active", "false");
        }

        var j;
        for (j = 0; j < _event.conditionLength; j++) {
          active = "#buttonConditions" + j;
          if ($(active).attr("active") == "true") {
            $.mobile.activePage
              .find(active) // remove color from conditions
              .removeClass("ui-btn-b")
              .addClass("ui-btn-a")
              .attr("data-theme", "a");
            $(active).attr("active", "false");
            break;
          }
        }

        $.mobile.activePage
          .find("#buttonReference") //add color to reference
          .removeClass("ui-btn-a")
          .addClass("ui-btn-b")
          .attr("data-theme", "b");
        $.mobile.activePage.find("#buttonReference").focus();
        $("#buttonReference").attr("active", "true");
      } else if (_event.name == "playConditionTriggered") {
        var index = _event.index;
        var selector = "#buttonConditions" + index;

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
            .find("#buttonReference") //remove color from Reference
            .removeClass("ui-btn-b")
            .addClass("ui-btn-a")
            .attr("data-theme", "a");
          $("#buttonReference").attr("active", "false");
        }
        var k;
        for (k = 0; k < _event.length; k++) {
          active = "#buttonConditions" + k;
          if ($(active).attr("active") == "true") {
            $.mobile.activePage
              .find(active) // remove color from conditions
              .removeClass("ui-btn-b")
              .addClass("ui-btn-a")
              .attr("data-theme", "a");
            $(active).attr("active", "false");
            break;
          }
        }

        $.mobile.activePage
          .find(selector) //add color to conditions
          .removeClass("ui-btn-a")
          .addClass("ui-btn-b")
          .attr("data-theme", "b");
        $.mobile.activePage.find(selector).focus();
        $(selector).attr("active", "true");
      }
    }.bind(this)
  );
};

MultipleStimulusFamiliarisationPage.prototype.render = function (_parent) {
  var div = $("<div></div>");
  _parent.append(div);
  var content;
  if (this.pageConfig.content === null) {
    content = "";
  } else {
    content = this.pageConfig.content;
  }

  var p = $("<p>" + content + "</p>");
  div.append(p);

  var tableUp = $("<table id='mainUp'></table>");
  var tableDown = $("<table id='mainDown' align = 'center'></table>");
  div.append(tableUp);
  div.append(tableDown);

  var trLoop = $("<tr id='trWs'></tr>");
  tableUp.append(trLoop);

  var tdLoop1 = $(
    " \
    <td class='stopButton'> \
      <button data-role='button' data-inline='true' id='buttonStop' onclick='" +
      this.pageManager.getPageVariableName(this) +
      ".mushraAudioControl.stop();'>" +
      this.pageManager.getLocalizer().getFragment(this.language, "stopButton") +
      "</button> \
    </td> \
  "
  );
  trLoop.append(tdLoop1);

  var tdRight = $("<td></td>");
  trLoop.append(tdRight);

  var trMushra = $("<tr></tr>");
  tableDown.append(trMushra);
  var tdMushra = $("<td id='td_Mushra' colspan='2'></td>");
  trMushra.append(tdMushra);

  var tableMushra = $("<table id='mushra_items'></table>");
  tdMushra.append(tableMushra);

  var trConditionNames = $("<tr></tr>");
  tableMushra.append(trConditionNames);

  var tdConditionNamesReference = $(
    "<td>" +
      this.pageManager.getLocalizer().getFragment(this.language, "reference") +
      "</td>"
  );
  trConditionNames.append(tdConditionNamesReference);

  var tdConditionNamesScale = $("<td id='conditionNameScale'></td>");
  trConditionNames.append(tdConditionNamesScale);

  var conditions = this.mushraAudioControl.getConditions();
  var i;
  for (i = 0; i < conditions.length; ++i) {
    var str = "";
    if (this.pageConfig.showConditionNames === true) {
      if (this.language == "en") {
        str = "<br/>" + conditions[i].id;
      } else {
        if (conditions[i].id == "reference") {
          str =
            "<br/>" +
            this.pageManager
              .getLocalizer()
              .getFragment(this.language, "reference");
        } else if (conditions[i].id == "anchor35") {
          str =
            "<br/>" +
            this.pageManager.getLocalizer().getFragment(this.language, "35");
        } else if (conditions[i].id == "anchor70") {
          str =
            "<br/>" +
            this.pageManager.getLocalizer().getFragment(this.language, "70");
        } else {
          str = "<br/>" + conditions[i].id;
        }
      }
    }
    td = $(
      "<td>" +
        this.pageManager.getLocalizer().getFragment(this.language, "cond") +
        (i + 1) +
        str +
        "</td>"
    );
    trConditionNames.append(td);
  }

  var trConditionPlay = $("<tr></tr>");
  tableMushra.append(trConditionPlay);

  var tdConditionPlayReference = $("<td></td>");
  trConditionPlay.append(tdConditionPlayReference);

  var buttonPlayReference = $(
    "<button data-theme='a' id='buttonReference' data-role='button' class='audioControlElement' onclick='" +
      this.pageManager.getPageVariableName(this) +
      ".btnCallbackReference()' style='margin : 0 auto;'>" +
      this.pageManager.getLocalizer().getFragment(this.language, "playButton") +
      "</button>"
  );
  tdConditionPlayReference.append(buttonPlayReference);

  var tdConditionPlayScale = $("<td></td>");
  trConditionPlay.append(tdConditionPlayScale);

  for (i = 0; i < conditions.length; ++i) {
    td = $("<td></td>");
    var buttonPlay = $(
      "<button data-role='button' class='center audioControlElement' onclick='" +
        this.pageManager.getPageVariableName(this) +
        ".btnCallbackCondition(" +
        i +
        ");'>" +
        this.pageManager
          .getLocalizer()
          .getFragment(this.language, "playButton") +
        "</button>"
    );
    buttonPlay.attr("id", "buttonConditions" + i);
    td.append(buttonPlay);
    trConditionPlay.append(td);
    // (function(i) {
    // Mousetrap.bind(String(i + 1), function() { this.pageManager.getCurrentPage().btnCallbackCondition(i); });
    // })(i);
  }

  this.macic = new MushraAudioControlInputController(
    this.mushraAudioControl,
    this.pageConfig.enableLooping
  );
  this.macic.bind();

  this.waveformVisualizer = new WaveformVisualizer(
    this.pageManager.getPageVariableName(this) + ".waveformVisualizer",
    tdRight,
    this.reference,
    this.pageConfig.showWaveform,
    this.pageConfig.enableLooping,
    this.mushraAudioControl
  );
  this.waveformVisualizer.create();
  this.waveformVisualizer.load();
};

MultipleStimulusFamiliarisationPage.prototype.pause = function () {
  this.mushraAudioControl.pause();
};

MultipleStimulusFamiliarisationPage.prototype.setLoopStart = function () {
  var slider = document.getElementById("slider");
  var startSliderSamples = this.mushraAudioControl.audioCurrentPosition;

  var endSliderSamples = parseFloat(slider.noUiSlider.get()[1]);

  this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

MultipleStimulusFamiliarisationPage.prototype.setLoopEnd = function () {
  var slider = document.getElementById("slider");
  var startSliderSamples = parseFloat(slider.noUiSlider.get()[0]);

  var endSliderSamples = this.mushraAudioControl.audioCurrentPosition;

  this.mushraAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

MultipleStimulusFamiliarisationPage.prototype.btnCallbackReference = function () {
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
  }
};

MultipleStimulusFamiliarisationPage.prototype.btnCallbackCondition = function (
  _index
) {
  this.currentItem = _index;

  var label = $("#buttonConditions" + _index).text();
  if (
    label ==
    this.pageManager.getLocalizer().getFragment(this.language, "pauseButton")
  ) {
    this.mushraAudioControl.pause();
    $("#buttonConditions" + _index).text(
      this.pageManager.getLocalizer().getFragment(this.language, "playButton")
    );
  } else if (
    label ==
    this.pageManager.getLocalizer().getFragment(this.language, "playButton")
  ) {
    $(".audioControlElement").text(
      this.pageManager.getLocalizer().getFragment(this.language, "playButton")
    );
    this.mushraAudioControl.playCondition(_index);
    $("#buttonConditions" + _index).text(
      this.pageManager.getLocalizer().getFragment(this.language, "pauseButton")
    );
  }
};

MultipleStimulusFamiliarisationPage.prototype.load = function () {
  this.startTimeOnPage = new Date();
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

MultipleStimulusFamiliarisationPage.prototype.save = function () {
  this.macic.unbind();
  this.time += new Date() - this.startTimeOnPage;
  this.mushraAudioControl.freeAudio();
  this.mushraAudioControl.removeEventListener(
    this.waveformVisualizer.numberEventListener
  );
  this.loop.start = parseInt(
    this.waveformVisualizer.mushraAudioControl.audioLoopStart
  );
  this.loop.end = parseInt(
    this.waveformVisualizer.mushraAudioControl.audioLoopEnd
  );
};

MultipleStimulusFamiliarisationPage.prototype.store = function () {
  // do nothing
};
