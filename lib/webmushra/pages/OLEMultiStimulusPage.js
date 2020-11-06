function OLEMultiStimulusPage(
  _pageManager,
  _pageTemplateRenderer,
  _pageConfig,
  _audioContext,
  _bufferSize,
  _audioFileLoader,
  _session,
  _errorHandler,
  _language
) {
  this.pageManager = _pageManager;
  this.pageConfig = _pageConfig;
  this.pageTemplateRenderer = _pageTemplateRenderer;
  this.audioContext = _audioContext;
  this.bufferSize = _bufferSize;
  this.audioFileLoader = _audioFileLoader;
  this.session = _session;
  this.errorHandler = _errorHandler;
  this.language = _language;
  this.fpc = null;

  this.results = [];
  this.time = 0;
  this.startTimeOnPage = null;

  this.ratingMap = new Array();

  this.stimuli = [];
  for (var key in _pageConfig.stimuli) {
    this.stimuli[this.stimuli.length] = new Stimulus(
      key,
      _pageConfig.stimuli[key]
    );
  }
  shuffle(this.stimuli);

  for (var i = 0; i < this.stimuli.length; ++i) {
    this.audioFileLoader.addFile(
      this.stimuli[i].getFilepath(),
      function (_buffer, _stimulus) {
        _stimulus.setAudioBuffer(_buffer);
      },
      this.stimuli[i]
    );
  }
  //this.filePlayer = null;
  this.likerts = [];
}

OLEMultiStimulusPage.prototype.getName = function () {
  return this.pageConfig.name;
};

OLEMultiStimulusPage.prototype.init = function (_callbackError) {
  this.likerts = [];

  var cbk = function (_prefix) {
    this.ratingMap[_prefix] = true;
    if (Object.keys(this.ratingMap).length == this.stimuli.length) {
      this.pageTemplateRenderer.unlockNextButton();
    }
  }.bind(this);

  if (this.pageConfig.mustRate === false) {
    cbk = false;
    //this.pageTemplateRenderer.unlockNextButton();
  }

  for (var i = 0; i < this.stimuli.length; ++i) {
    this.likerts[i] = new LikertScale(
      this.pageConfig.response,
      i + "_",
      this.pageConfig.mustPlayback == true,
      cbk
    );
  }
  //this.filePlayer = new FilePlayer(this.audioContext, this.bufferSize, this.stimuli, this.errorHandler, this.language, this.pageManager.getLocalizer());
  //if (this.pageConfig.mustPlayback) {
  // this.filePlayer.genericAudioControl.addEventListener((function (_event) {
  //if (_event.name == 'ended') {
  // this.likerts[_event.index].enable();
  //}
  //}).bind(this));

  //	}
};
OLEMultiStimulusPage.prototype.render = function (_parent) {
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
  var table = $(
    "<table style='margin-left: auto; margin-right: auto;'></table>"
  );
  // this.filePlayer.render(_parent)
  for (var i = 0; i < this.stimuli.length; ++i) {
    var tableCell = $("<td></td>");
    this.likerts[i].render(tableCell);
    stimuliIndex = i + 1;
    var stimuliLabel = $("<h3>" + "Stimuli " + stimuliIndex + "</h3>");

    var tr = $("<tr></tr>");
    table.append(tr);
    var labelCell = $("<td></td>");
    labelCell.append(stimuliLabel);
    tr.append(labelCell);
    tr.append(tableCell);

    // table.append(
    //   $("<tr></tr>").append(
    //       tableCell
    //     $("<td></td>").append(
    //       stimuliLabel
    //     )
    //   ) )
  }
  div.append(table);

  //this.fpc = new FilePlayerController(this.filePlayer);
  //this.fpc.bind();
};

OLEMultiStimulusPage.prototype.load = function () {
  this.startTimeOnPage = new Date();
  if (this.pageConfig.mustRate == true) {
    this.pageTemplateRenderer.lockNextButton();
  }
  for (var i = 0; i < this.stimuli.length; ++i) {
    if (this.results[i]) {
      $(
        "input[name='" +
          this.likerts[i].prefix +
          "_response'][value='" +
          this.results[i] +
          "']"
      ).attr("checked", "checked");
      $(
        "input[name='" +
          this.likerts[i].prefix +
          "_response'][value='" +
          this.results[i] +
          "']"
      ).checkboxradio("refresh");
      this.likerts[i].group.change();
    }
  }

  //this.filePlayer.init();
};

OLEMultiStimulusPage.prototype.save = function () {
  //this.fpc.unbind();
  this.time += new Date() - this.startTimeOnPage;
  for (var i = 0; i < this.stimuli.length; ++i) {
    this.results[i] = $(
      "input[name='" + this.likerts[i].prefix + "_response']:checked"
    ).val();
  }
  //this.filePlayer.free();
};

OLEMultiStimulusPage.prototype.store = function (_reponsesStorage) {
  if (this.pageConfig.response != null) {
    trial = new Trial();
    trial.type = this.pageConfig.type;
    trial.id = this.pageConfig.id;

    for (var i = 0; i < this.stimuli.length; ++i) {
      var rating = new LikertMultiStimulusRating();

      rating.stimulus = this.stimuli[i].id;
      if (this.results[i] == undefined) {
        rating.stimulusRating = "NA";
      } else {
        rating.stimulusRating = this.results[i];
      }

      rating.time = this.time;
      trial.responses[trial.responses.length] = rating;
    }

    this.session.trials[this.session.trials.length] = trial;
  }
};
