/*************************************************************************
         (C) Copyright AudioLabs 2017 

This source code is protected by copyright law and international treaties. This source code is made available to You subject to the terms and conditions of the Software License for the webMUSHRA.js Software. Said terms and conditions have been made available to You prior to Your download of this source code. By downloading this source code You agree to be bound by the above mentionend terms and conditions, which can also be found here: https://www.audiolabs-erlangen.de/resources/webMUSHRA. Any unauthorised use of this source code may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under law. 

**************************************************************************/

// TODO for RAO test:
//  * ensure all sliders touched

function MusPage(
  _pageManager,
  _audioContext,
  _bufferSize,
  _audioFileLoader,
  _session,
  _pageConfig,
  _mushraValidator,
  _errorHandler,
  _language
) {
  this.isMushra = true;
  this.pageManager = _pageManager;
  this.audioContext = _audioContext;
  this.bufferSize = _bufferSize;
  this.audioFileLoader = _audioFileLoader;
  this.session = _session;
  this.pageConfig = _pageConfig;
  this.mushraValidator = _mushraValidator;
  this.errorHandler = _errorHandler;
  this.language = _language;
  this.musAudioControl = null;
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
  this.references = [];
  for (var key in this.pageConfig.references) {
    this.references[this.references.length] = new Stimulus(
      key,
      this.pageConfig.references[key]
    );
  }

  for (var i = 0; i < this.references.length; ++i) {
    this.audioFileLoader.addFile(
      this.references[i].getFilepath(),
      function (_buffer, _stimulus) {
        _stimulus.setAudioBuffer(_buffer);
      },
      this.references[i]
    );
  }
  for (var i = 0; i < this.conditions.length; ++i) {
    this.audioFileLoader.addFile(
      this.conditions[i].getFilepath(),
      function (_buffer, _stimulus) {
        _stimulus.setAudioBuffer(_buffer);
      },
      this.conditions[i]
    );
  }

  if (this.pageConfig.extra_inputs !== undefined) {
    this.numExtraInputs = this.pageConfig.extra_inputs.length;
  } else this.numExtraInputs = 0;

  // data
  this.ratings = [];
  this.loop = { start: null, end: null };
  this.slider = { start: null, end: null };

  this.time = 0;
  this.startTimeOnPage = null;
}

MusPage.prototype.getName = function () {
  return this.pageConfig.name;
};

MusPage.prototype.init = function () {
  var ref0 = this.references[0];
  var condRefs = this.references.slice(1).concat(this.conditions);
  if (this.pageConfig.strict !== false) {
    this.mushraValidator.checkNumConditions(condRefs);
    this.mushraValidator.checkStimulusDuration(ref0);
  }

  this.mushraValidator.checkNumChannels(this.audioContext, ref0);
  var i;
  for (i = 0; i < condRefs.length; ++i) {
    this.mushraValidator.checkSamplerate(
      this.audioContext.sampleRate,
      condRefs[i]
    );
  }
  this.mushraValidator.checkConditionConsistency(ref0, condRefs);
  this.musAudioControl = new MusAudioControl(
    this.audioContext,
    this.bufferSize,
    this.references,
    this.conditions,
    this.errorHandler,
    this.pageConfig.randomize,
    this.pageConfig.createHiddenReferences,
    this.pageConfig.restartForReference,
  );
  this.addmusAudioControlEventListeners();
};

MusPage.prototype.getCheckboxState = function (name, index) {
  let cb = $("input[name=" + name + "]").get(index);
  return $(cb).prop("checked");
};

MusPage.prototype.setCheckboxState = function (name, index, state) {
  let cb = $("input[name=" + name + "]").get(index);
  $(cb).prop("checked", state).checkboxradio("refresh");
};

MusPage.prototype.activateCheckbox = function (name, index) {
  let cb = $("input[name=" + name + "]").get(index);
  $(cb).removeAttr("disabled").checkboxradio("refresh");
  $(cb).attr("active", "true");
};

MusPage.prototype.deactivateCheckbox = function (name, index) {
  let cb = $("input[name=" + name + "]").get(index);
  $(cb).attr("disabled", "true").checkboxradio("refresh");
  $(cb).attr("active", "false");
};

MusPage.prototype.activateButton = function (id) {
  $.mobile.activePage
    .find(id)
    .removeClass("ui-btn-a")
    .addClass("ui-btn-b")
    .attr("data-theme", "b");
  $(id).attr("active", "true");
};

MusPage.prototype.deactivateButton = function (id) {
  if ($(id).attr("active") == "true") {
    $.mobile.activePage
      .find(id) //remove color from Stop
      .removeClass("ui-btn-b")
      .addClass("ui-btn-a")
      .attr("data-theme", "a");
    $(id).attr("active", "false");
  }
};

MusPage.prototype.activateScale = function (index) {
  let scale = $(".scales").get(index);
  $(scale).slider("enable");
  $(scale).attr("active", "true");
};

MusPage.prototype.deactivateScale = function (index) {
  let scale = $(".scales").get(index);
  $(scale).slider("disable");
  $(scale).attr("active", "false");
};

MusPage.prototype.activateCondition = function (index) {
  let id = "#buttonConditions" + index;
  this.activateButton(id);
  if (this.pageConfig.playToRate !== false) this.activateScale(index);
  this.setConditionExtrasStatus(index, true);
};

MusPage.prototype.deactivateCondition = function (index) {
  let id = "#buttonConditions" + index;
  this.deactivateButton(id);
  if (this.pageConfig.playToRate !== false) this.deactivateScale(index);
  this.setConditionExtrasStatus(index, false);
};

MusPage.prototype.setConditionExtrasStatus = function (index, activate) {
  for (let i = 0; i < this.numExtraInputs; ++i) {
    if (this.pageConfig.extra_inputs[i].type !== "checkbox") continue;
    let name = this.pageConfig.extra_inputs[i].name;
    if (activate === true) this.activateCheckbox(name, index);
    else this.deactivateCheckbox(name, index);
  }
};

MusPage.prototype.stopTriggered = function (_event) {
  $(".audioControlElement").text(
    this.pageManager.getLocalizer().getFragment(this.language, "playButton")
  );
  for (let i = 0; i < _event.referenceLength; i++) {
    let id = "#buttonReference" + i;
    this.deactivateButton(id);
  }
  for (let i = 0; i < _event.conditionLength; i++) {
    this.deactivateCondition(i);
  }
  this.activateButton("#buttonStop");
};

MusPage.prototype.referenceTriggered = function (_event) {
  this.deactivateButton("#buttonStop");
  for (let j = 0; j < _event.conditionLength; j++) {
    this.deactivateCondition(j);
  }
  for (let j = 0; j < _event.referenceLength; j++) {
    let id = "#buttonReference" + j;
    if (j == _event.index) this.activateButton(id);
    else this.deactivateButton(id);
  }
};

MusPage.prototype.conditionTriggered = function (_event) {
  this.deactivateButton("#buttonStop");

  for (let k = 0; k < _event.referenceLength; k++) {
    let id = "#buttonReference" + k;
    this.deactivateButton(id);
  }

  for (let k = 0; k < _event.conditionLength; k++) {
    if (k == _event.index) this.activateCondition(k);
    else this.deactivateCondition(k);
  }
};

MusPage.prototype.addmusAudioControlEventListeners = function () {
  this.musAudioControl.addEventListener(
    function (_event) {
      if (_event.name == "stopTriggered") {
        this.stopTriggered(_event);
      } else if (_event.name == "playReferenceTriggered") {
        this.referenceTriggered(_event);
      } else if (_event.name == "playConditionTriggered") {
        this.conditionTriggered(_event);
      }
    }.bind(this)
  );
};

MusPage.prototype.render = function (_parent) {
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

  var tableUp = $("<table id='mainUp' align = 'center'></table>");
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
      ".musAudioControl.stop();'>" +
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

  var trConditionNames = this.renderNamesLabelsRow();
  tableMushra.append(trConditionNames);

  var trConditionPlay = this.renderPlayButtonsRow();
  tableMushra.append(trConditionPlay);

  // ratings
  var trConditionRatings = $("<tr id='tr_ConditionRatings'></tr>");
  tableMushra.append(trConditionRatings);

  var references = this.musAudioControl.getReferences();
  var tdExtraContent = $(
    "<td id='refCanvas' align = 'center' colspan='" +
      references.length +
      "' class='refCanvas'></td>"
  );
  if (this.pageConfig.img) {
    tdExtraContent.append($("<p>" + this.pageConfig.img.label + "</p>"));
    var img = $("<img id='content_img'>");
    img.attr("alt", this.pageConfig.img.label);
    img.attr("src", this.pageConfig.img.file);
    tdExtraContent.append(img);
    // wait until image load is complete and then re-render canvas
    let cb = () => {
      if (img[0].complete && img[0].naturalHeight !== 0)
        this.renderCanvas("mushra_items");
      else window.setTimeout(cb, 500);
    };
    img.one("load", cb);
  }
  if (this.pageConfig.enableStimulusSort) {
    tdExtraContent.append(this.renderSortButton());
  }
  trConditionRatings.append(tdExtraContent);

  var tdConditionRatingsScale = $(
    "<td id='spaceForScale' class='scaleCanvas'></td>"
  );
  trConditionRatings.append(tdConditionRatingsScale);

  var conditions = this.musAudioControl.getConditions();
  for (let i = 0; i < conditions.length; ++i) {
    td = $(
      "<td class='spaceForSlider'> \
        <span><input type='range' name='" +
        conditions[i].getId() +
        "' class='scales' value='100' min='0' max='100' data-vertical='true' data-highlight='true' style='display : inline-block; float : none;'/></span> \
      </td>"
    );
    $(".ui-slider-handle").unbind("keydown");
    trConditionRatings.append(td);
  }

  // extra inputs
  for (let i = 0; i < this.numExtraInputs; ++i) {
    let extraInput = this.pageConfig.extra_inputs[i];
    let extraInputIdPrefix = "conditionExtraInput_" + extraInput.name;
    // currently we only support checkbox
    if (extraInput.type !== "checkbox") continue;
    // create row for this
    let trConditionExtra = $("<tr id='tr_" + extraInputIdPrefix + "'></tr>");
    tableMushra.append(trConditionExtra);
    // spacer for references
    for (let j = 0; j < references.length; ++j) {
      let tdReferenceExtra = $(
        "<td id='td_refExtra_" + i.toString() + "_" + j.toString() + "'></td>"
      );
      trConditionExtra.append(tdReferenceExtra);
    }
    // scale spacer
    let tdConditionExtraScale = $(
      "<td id='td_conditionExtraScale" + i + "'></td>"
    );
    tdConditionExtraScale.text(extraInput.description);
    trConditionExtra.append(tdConditionExtraScale);
    // conditions
    for (let j = 0; j < conditions.length; ++j) {
      let cb_id = extraInputIdPrefix + "_" + conditions[j].getId();
      let tdConditionExtra = $("<td id='td_" + cb_id + "'></td>");
      let checkbox = $(
        "<input type='checkbox' id='" +
          cb_id +
          "' name = '" +
          extraInput.name +
          "'>"
      );
      var label = $(
        "<label for='" + cb_id + "'>" + extraInput.label + "</label>"
      );

      tdConditionExtra.append(checkbox);
      tdConditionExtra.append(label);
      trConditionExtra.append(tdConditionExtra);
    }
  }

  this.macic = new MusAudioControlInputController(
    this.musAudioControl,
    this.pageConfig.enableLooping
  );
  this.macic.bind();

  this.setupWaveformVisualizer(tdRight);
};

MusPage.prototype.setupWaveformVisualizer = function (td) {
  this.waveformVisualizer = new WaveformVisualizer(
    this.pageManager.getPageVariableName(this) + ".waveformVisualizer",
    td,
    this.references[0],
    this.pageConfig.showWaveform,
    this.pageConfig.enableLooping,
    this.musAudioControl
  );
  this.waveformVisualizer.create();
  this.waveformVisualizer.load();
};

MusPage.prototype.renderNamesLabelsRow = function () {
  var trConditionNames = $("<tr id='trNamesLabels'></tr>");

  var references = this.musAudioControl.getReferences();
  for (let i = 0; i < references.length; ++i) {
    var tdConditionNamesReference = $("<td>" + this.references[i].id + "</td>");
    trConditionNames.append(tdConditionNamesReference);
  }

  // spacer
  var tdConditionNamesScale = $("<td id='conditionNameScale'></td>");
  trConditionNames.append(tdConditionNamesScale);

  var conditions = this.musAudioControl.getConditions();
  for (let i = 0; i < conditions.length; ++i) {
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
    var condNum = conditions[i].initIndex;
    td = $(
      "<td>" +
        this.pageManager.getLocalizer().getFragment(this.language, "cond") +
        (condNum + 1) +
        str +
        "</td>"
    );
    trConditionNames.append(td);
  }
  return trConditionNames;
};

MusPage.prototype.renderPlayButtonsRow = function () {
  var trConditionPlay = $("<tr id='trPlayButtons'></tr>");

  var references = this.musAudioControl.getReferences();
  for (let i = 0; i < references.length; ++i) {
    var tdConditionPlayReference = $("<td></td>");
    trConditionPlay.append(tdConditionPlayReference);
    var buttonPlayReference = $(
      "<button data-theme='a' data-role='button' class='audioControlElement' onclick='" +
        this.pageManager.getPageVariableName(this) +
        ".btnCallbackReference(" +
        i +
        ");' style='margin : 0 auto;'>" +
        this.pageManager
          .getLocalizer()
          .getFragment(this.language, "playButton") +
        "</button>"
    );
    buttonPlayReference.attr("id", "buttonReference" + i);
    tdConditionPlayReference.append(buttonPlayReference);
  }

  // spacer
  var tdConditionPlayScale = $("<td></td>");
  trConditionPlay.append(tdConditionPlayScale);

  var conditions = this.musAudioControl.getConditions();
  for (let i = 0; i < conditions.length; ++i) {
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
  }
  return trConditionPlay;
};

MusPage.prototype.renderSortButton = function () {
  var trSortStimuli = $("<tr></tr>");
  var tdSortStimuli = $("<td></td>");
  trSortStimuli.append(tdSortStimuli);
  var buttonSortStimuli = $(
    "<button data-theme='a' data-role='button' onclick='" +
      this.pageManager.getPageVariableName(this) +
      ".btnCallbackSortStimuli();' style='margin : 0 auto;'>Sort</button>"
  );
  buttonSortStimuli.attr("id", "buttonSortStimuli");
  tdSortStimuli.append(buttonSortStimuli);
  return trSortStimuli;
};

MusPage.prototype.pause = function () {
  this.musAudioControl.pause();
};

MusPage.prototype.setLoopStart = function () {
  var slider = document.getElementById("slider");
  var startSliderSamples = this.musAudioControl.audioCurrentPosition;

  var endSliderSamples = parseFloat(slider.noUiSlider.get()[1]);

  this.musAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

MusPage.prototype.setLoopEnd = function () {
  var slider = document.getElementById("slider");
  var startSliderSamples = parseFloat(slider.noUiSlider.get()[0]);

  var endSliderSamples = this.musAudioControl.audioCurrentPosition;

  this.musAudioControl.setLoop(startSliderSamples, endSliderSamples);
};

MusPage.prototype.btnCallbackReference = function (_index) {
  this.currentItem = { type: "reference", index: _index };
  var id = "#buttonReference" + _index;
  var label = $(id).text();
  var playText = this.pageManager
    .getLocalizer()
    .getFragment(this.language, "playButton");
  var pauseText = this.pageManager
    .getLocalizer()
    .getFragment(this.language, "pauseButton");
  if (label == pauseText) {
    this.musAudioControl.pause();
    $(id).text(playText);
  } else if (label == playText) {
    $(".audioControlElement").text(playText);
    this.musAudioControl.playReference(_index);
    $(id).text(pauseText);
  }
};

MusPage.prototype.btnCallbackCondition = function (_index) {
  this.currentItem = { type: "condition", index: _index };
  var id = "#buttonConditions" + _index;
  var label = $(id).text();
  var playText = this.pageManager
    .getLocalizer()
    .getFragment(this.language, "playButton");
  var pauseText = this.pageManager
    .getLocalizer()
    .getFragment(this.language, "pauseButton");
  if (label == pauseText) {
    this.musAudioControl.pause();
    $(id).text(playText);
  } else if (label == playText) {
    $(".audioControlElement").text(playText);
    this.musAudioControl.playCondition(_index);
    $(id).text(pauseText);
  }
};

MusPage.prototype.btnCallbackSortStimuli = function () {
  this.sortRatings();
};

MusPage.prototype.getRefCanvasOffset = function () {
  var leftOffset = 0;
  rfcs = $(".refCanvas");
  rfcs.each((index, element) => {
    leftOffset = Math.max($(element).offset().left, leftOffset);
  });
  var topOffset = rfcs.first().offset().top;
  return { left: leftOffset, top: topOffset };
};

MusPage.prototype.getRefCanvasWidth = function () {
  var refCanvasWidth = 0;
  $(".refCanvas").each((index, element) => {
    refCanvasWidth += $(element).width();
  });
  return refCanvasWidth;
};

MusPage.prototype.renderCanvas = function (_parentId) {
  $("#mushra_canvas").remove();
  parent = $("#" + _parentId);
  var canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.zIndex = 0;
  canvas.setAttribute("id", "mushra_canvas");
  parent.get(0).appendChild(canvas);
  $("#mushra_canvas").offset($(".scaleCanvas").offset());

  canvas.height = $("#tr_ConditionRatings").height();
  canvas.width = parent.get(0).offsetWidth - this.getRefCanvasWidth();

  $(".scales").siblings().css("zIndex", "1");

  var canvasContext = canvas.getContext("2d");

  var YfreeCanvasSpace =
    $(".scales").prev().offset().top - $(".scales").parent().offset().top;
  var YfirstLine =
    $(".scales").parent().get(0).offsetTop +
    parseInt($(".scales").css("borderTopWidth"), 10) +
    YfreeCanvasSpace;
  var prevScalesHeight = $(".scales").prev().height();
  var xDrawingStart = canvasContext.measureText("100 ").width * 1.5;
  var xAbsTableOffset =
    -$("#mushra_items").offset().left -
    ($("#mushra_canvas").offset().left - $("#mushra_items").offset().left);
  var xDrawingBeforeScales =
    $(".scales").first().prev().children().eq(0).offset().left +
    xAbsTableOffset;
  var xDrawingEnd =
    $(".scales").last().offset().left -
    $("#mushra_canvas").offset().left +
    $(".scales").last().width() / 2;

  if (this.pageConfig.scale.lines !== false) {
    this.renderScaleLines(
      canvasContext,
      prevScalesHeight,
      YfirstLine,
      xAbsTableOffset,
      xDrawingStart,
      xDrawingEnd,
      xDrawingBeforeScales
    );
  }

  this.renderScaleLabels(canvasContext, prevScalesHeight, YfirstLine);

  if (this.pageConfig.scale.numbers !== false) {
    this.renderScaleNumbers(
      canvasContext,
      prevScalesHeight,
      YfirstLine,
      xDrawingStart
    );
  }
};

MusPage.prototype.renderScaleLines = function (
  canvasContext,
  prevScalesHeight,
  YfirstLine,
  xAbsTableOffset,
  xDrawingStart,
  xDrawingEnd,
  xDrawingBeforeScales
) {
  canvasContext.beginPath();
  canvasContext.moveTo(xDrawingStart, YfirstLine);
  canvasContext.lineTo(xDrawingEnd, YfirstLine);
  canvasContext.stroke();

  var scaleSegments = [0.2, 0.4, 0.6, 0.8];
  var i;
  for (i = 0; i < scaleSegments.length; ++i) {
    canvasContext.beginPath();
    canvasContext.moveTo(
      xDrawingStart,
      prevScalesHeight * scaleSegments[i] + YfirstLine
    );
    canvasContext.lineTo(
      xDrawingBeforeScales,
      prevScalesHeight * scaleSegments[i] + YfirstLine
    );
    canvasContext.stroke();

    var predecessorXEnd = null;
    $(".scales").each(function (index) {
      var sliderElement = $(this).prev().first();
      if (index > 0) {
        canvasContext.beginPath();
        canvasContext.moveTo(
          predecessorXEnd,
          prevScalesHeight * scaleSegments[i] + YfirstLine
        );
        canvasContext.lineTo(
          sliderElement.offset().left + xAbsTableOffset,
          prevScalesHeight * scaleSegments[i] + YfirstLine
        );
        canvasContext.stroke();
      }
      predecessorXEnd =
        sliderElement.offset().left +
        sliderElement.width() +
        xAbsTableOffset +
        1;
    });
  }

  canvasContext.beginPath();
  canvasContext.moveTo(xDrawingStart, prevScalesHeight + YfirstLine);
  canvasContext.lineTo(xDrawingEnd, prevScalesHeight + YfirstLine);
  canvasContext.stroke();
};

MusPage.prototype.renderScaleLabels = function (
  canvasContext,
  prevScalesHeight,
  YfirstLine
) {
  canvasContext.font = "1.25em Calibri";
  canvasContext.textBaseline = "middle";
  canvasContext.textAlign = "center";

  const xLetters =
    ($("#spaceForScale").width() + canvasContext.measureText("1 ").width) / 2.0;

  scaleConfig = this.pageConfig.scale;

  let scaleY = (score) => prevScalesHeight * (1.0 - score / 100) + YfirstLine;

  if (!scaleConfig.labels) return;
  for (i = 0; i < scaleConfig.labels.length; ++i) {
    let scaleLabelConfig = scaleConfig.labels[i];
    canvasContext.fillText(
      scaleLabelConfig.label,
      xLetters,
      scaleY(scaleLabelConfig.value)
    );
  }

  this.drawScaleArrow(canvasContext, scaleY);
};

MusPage.prototype.renderScaleNumbers = function (
  canvasContext,
  prevScalesHeight,
  YfirstLine,
  xDrawingStart
) {
  canvasContext.font = "1em Calibri";
  canvasContext.textAlign = "right";
  var xTextScoreRanges =
    xDrawingStart - canvasContext.measureText("100 ").width * 0.25;
  canvasContext.fillText("100", xTextScoreRanges, YfirstLine);
  canvasContext.fillText(
    "80",
    xTextScoreRanges,
    prevScalesHeight * 0.2 + YfirstLine
  );
  canvasContext.fillText(
    "60",
    xTextScoreRanges,
    prevScalesHeight * 0.4 + YfirstLine
  );
  canvasContext.fillText(
    "40",
    xTextScoreRanges,
    prevScalesHeight * 0.6 + YfirstLine
  );
  canvasContext.fillText(
    "20",
    xTextScoreRanges,
    prevScalesHeight * 0.8 + YfirstLine
  );
  canvasContext.fillText("0", xTextScoreRanges, prevScalesHeight + YfirstLine);
};

MusPage.prototype.load = function () {
  this.startTimeOnPage = new Date();

  this.renderCanvas("mushra_items");
  var conditions = this.musAudioControl.getConditions();
  for (let i = 0; i < conditions.length; ++i) {
    this.deactivateCondition(i);
  }

  this.musAudioControl.initAudio();

  this.setRatingsOnScales();

  if (this.loop.start !== null && this.loop.end !== null) {
    this.musAudioControl.setLoop(
      0,
      0,
      this.musAudioControl.getDuration(),
      this.musAudioControl.getDuration() /
        this.waveformVisualizer.stimulus.audioBuffer.sampleRate
    );
    this.musAudioControl.setPosition(0);
  }
};

MusPage.prototype.save = function () {
  this.macic.unbind();
  this.time += new Date() - this.startTimeOnPage;
  this.musAudioControl.freeAudio();
  this.musAudioControl.removeEventListener(
    this.waveformVisualizer.numberEventListener
  );
  this.getRatingsFromScales();
  console.log("Save", this.ratings);
  this.loop.start = parseInt(this.musAudioControl.audioLoopStart);
  this.loop.end = parseInt(this.musAudioControl.audioLoopEnd);
};

MusPage.prototype.getRatingsFromScales = function () {
  var scales = $(".scales");
  this.ratings = [];
  for (let i = 0; i < scales.length; ++i) {
    this.ratings[i] = { name: scales[i].name, value: scales[i].value };
    for (let j = 0; j < this.numExtraInputs; ++j) {
      if (this.pageConfig.extra_inputs[j].type === "checkbox") {
        let extraInputName = this.pageConfig.extra_inputs[j].name;
        let extraInputValue = this.getCheckboxState(extraInputName, i);
        this.ratings[i][extraInputName] = extraInputValue;
      }
    }
  }
};

MusPage.prototype.setRatingsOnScales = function () {
  if (this.ratings.length !== 0) {
    var scales = $(".scales");
    var i;
    for (i = 0; i < scales.length; ++i) {
      const r = this.ratings[i];
      $(".scales").eq(i).attr("name", r.name).val(r.value).slider("refresh");
      for (let j = 0; j < this.numExtraInputs; ++j) {
        if (this.pageConfig.extra_inputs[j].type === "checkbox") {
          let extraInputName = this.pageConfig.extra_inputs[j].name;
          let extraInputValue = r[extraInputName];
          this.setCheckboxState(extraInputName, i, extraInputValue);
        }
      }
    }
  }
};

MusPage.prototype.sortRatings = function () {
  if (this.pageConfig.enableStimulusSort !== true) return;
  this.musAudioControl.stop();
  this.getRatingsFromScales();
  this.ratings.sort((a, b) => b.value - a.value);
  var conditions = this.musAudioControl.getConditions();
  var conditionsSorted = [];
  for (const r of this.ratings)
    for (const c of conditions)
      if (r.name === c.id) {
        conditionsSorted.push(c);
        break;
      }
  this.musAudioControl.setConditions(conditionsSorted);
  // update condition labels
  $("tr#trNamesLabels").replaceWith(this.renderNamesLabelsRow());
  this.setRatingsOnScales();
};

MusPage.prototype.store = function () {
  var trial = new Trial();
  trial.type = this.pageConfig.type;
  trial.id = this.pageConfig.id;
  var i;
  for (i = 0; i < this.ratings.length; ++i) {
    var rating = this.ratings[i];
    var ratingObj = new MUSRating();
    ratingObj.stimulus = rating.name;
    ratingObj.score = rating.value;
    ratingObj.time = this.time;
    for (let j = 0; j < this.numExtraInputs; ++j) {
      let name = this.pageConfig.extra_inputs[j].name;
      ratingObj.extra_responses[name] = rating[name];
    }
    trial.responses[trial.responses.length] = ratingObj;
  }
  this.session.trials[this.session.trials.length] = trial;
};

MusPage.prototype.drawScaleArrow = function (canvasContext, scaleY) {
  const arrowOpts = ["up", "down"];
  if (
    this.pageConfig.scale.arrow &&
    arrowOpts.includes(this.pageConfig.scale.arrow)
  ) {
    const arrowX = $("#spaceForScale").width();
    const arrowYs = [scaleY(20), scaleY(80)];
    this.drawArrow(
      canvasContext,
      arrowX,
      arrowYs[0],
      arrowX,
      arrowYs[1],
      5,
      10,
      this.pageConfig.scale.arrow === "down",
      this.pageConfig.scale.arrow === "up"
    );
  }
};

// x0,y0: the line's starting point
// x1,y1: the line's ending point
// width: the distance the arrowhead perpendicularly extends away from the line
// height: the distance the arrowhead extends backward from the endpoint
// arrowStart: true/false directing to draw arrowhead at the line's starting point
// arrowEnd: true/false directing to draw arrowhead at the line's ending point

MusPage.prototype.drawArrow = function (
  ctx,
  x0,
  y0,
  x1,
  y1,
  aWidth,
  aLength,
  arrowStart,
  arrowEnd
) {
  var dx = x1 - x0;
  var dy = y1 - y0;
  var angle = Math.atan2(dy, dx);
  var length = Math.sqrt(dx * dx + dy * dy);
  
  ctx.translate(x0, y0);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  if (arrowStart) {
    ctx.moveTo(aLength, -aWidth);
    ctx.lineTo(0, 0);
    ctx.lineTo(aLength, aWidth);
  }
  if (arrowEnd) {
    ctx.moveTo(length - aLength, -aWidth);
    ctx.lineTo(length, 0);
    ctx.lineTo(length - aLength, aWidth);
  }
  
  ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
