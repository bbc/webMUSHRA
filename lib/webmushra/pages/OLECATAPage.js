function OLECATAPage(
  _pageManager,
  _pageTemplateRenderer,
  _pageConfig,
  _audioContext,
  _bufferSize,
  _audioFileLoader,
  _stimulus,
  _session,
  _errorHandler,
  _language
) {
  this.pageManager = _pageManager;
  this.pageTemplateRenderer = _pageTemplateRenderer;
  this.pageConfig = _pageConfig;
  this.audioContext = _audioContext;
  this.bufferSize = _bufferSize;
  this.audioFileLoader = _audioFileLoader;
  this.stimulus = _stimulus;
  this.session = _session;
  this.errorHandler = _errorHandler;
  this.language = _language;
  //this.fpc = null;
  this.attributes = {}; //attributes object (key = attribute name, value = T/F)
  this.audioFileLoader.addFile(
    this.stimulus.getFilepath(),
    function (_buffer, _stimulus) {
      _stimulus.setAudioBuffer(_buffer);
    },
    this.stimulus
  );
  //this.filePlayer = null;
  this.likert = null;
  this.ratingMap = new Array();

  this.time = 0;
  this.startTimeOnPage = null;
  this.result = null;

  if (this.pageConfig.questionnaire === undefined) {
    this.pageConfig.questionnaire = new Array();
  }
}

OLECATAPage.prototype.getName = function () {
  return this.pageConfig.name;
};

// OLECATAPage.prototype.storeParticipantData = function () {
//   for (let i = 0; i < this.pageConfig.questionnaire.length; ++i) {
//     var element = this.pageConfig.questionnaire[i];
//     if (element.type == "heading") continue;
//     if ($("#" + element.name).val()) {
//       this.session.participant.questionnaire[element.name] = $("#" + element.name).val();
//     } else {
//       this.session.participant.questionnaire[element.name] = $("input[name='" + element.name + "__response']:checked").val();
//     }
//   }
// };

OLECATAPage.prototype.init = function (_callbackError) {
  //this.filePlayer = new FilePlayer(this.audioContext, this.bufferSize, [this.stimulus], this.errorHandler, this.language, this.pageManager.getLocalizer());

  var cbk = function (_prefix) {
    this.ratingMap[_prefix] = true;
    if (Object.keys(this.ratingMap).length == 1) {
      this.pageTemplateRenderer.unlockNextButton();
    }
  }.bind(this);

  if (this.pageConfig.mustRate === false) {
    cbk = false;
  }

  this.likert = new LikertScale(
    this.pageConfig.response,
    "1_",
    this.pageConfig.mustPlayback == true,
    cbk
  );

  //if (this.pageConfig.mustPlayback) {
  //this.filePlayer.genericAudioControl.addEventListener((function (_event) {
  //if (_event.name == 'ended') {
  //this.likert.enable();
  //}
  // }).bind(this));

  //}
};

OLECATAPage.prototype.render = function (_parent) {
  var div = $("<div style='padding-bottom:25px'></div>");
  _parent.append(div);
  _parent.append(this.pageConfig.content);

  //this.filePlayer.render(_parent);

  this.likert.render(_parent);

  //this.fpc = new FilePlayerController(this.filePlayer);
  //this.fpc.bind();
  var table1 = $("<table style='padding-top: 25px', align='center'></table>");
  _parent.append(table1);
  var table = $("<table style='padding-top: 25px', align='center'></table>");
  _parent.append(table);

  var i;
  var boxcount = 0;
  var elements = [];

  for (i = 0; i < this.pageConfig.questionnaire.length; ++i) {
    var element = this.pageConfig.questionnaire[i];
    if (element.type === "long_text") {
      table.append(
        $(
          "<tr><td colspan='3'><textarea name='" +
            element.name +
            "' id='" +
            element.name +
            "'></textarea></td></tr>"
        )
      );
      this.textbox = element.name;
      boxcount++;
    } else if (element.type === "notesheading") {
      table.append(
        $(
          "<tr><td colspan=2 id=" +
            element.name +
            " style='vertical-align:top; padding-top:" +
            $("#feedback").css("margin-top") +
            "'><br><strong>" +
            element.label +
            "</strong><br>" +
            element.content +
            "<br><br></td></tr>"
        )
      );
    } else if (element.type === "attributeheading") {
      table1.append(
        $(
          "<tr><td colspan=5 id=" +
            element.name +
            " style='vertical-align:top; padding-top:" +
            $("#feedback").css("margin-top") +
            "'><br><strong>" +
            element.label +
            "</strong><br>" +
            element.content +
            "<br><br></td></tr>"
        )
      );
    }
    //console.log(element);
    //warning if more than one text box on the page
    if (boxcount > 1) {
      console.log(
        "Another textbox already exists on this page. Only the value of the last textbox on the page will be stored."
      );
    }
  }

  for (i = 0; i < this.pageConfig.questionnaire.length; ++i) {
    var element = this.pageConfig.questionnaire[i];
    if (element.type === "checkboxes") {
      elements.push(element);
    }
  }
  shuffle(elements);

  for (k = 0; k < elements.length; ++k) {
    var element1 = elements[k];
    var attribute = $(
      "<td style='padding-left:20px; padding-right:20px'><strong>" +
        element1.label +
        "</strong></td>"
    );
    table1.append(attribute);
    shuffle(element1.response);
    var td2 = $(
      "<td style='display:inline list-item; list-style-type: none'></td>"
    );

    for (let j = 0; j < element1.response.length; ++j) {
      var responseElement = element1.response[j];
      var id_prefix = element1.name + "__response";
      var id = id_prefix + "_" + responseElement.value;
      var checkbox = $(
        "<input type='checkbox' id='" + id + "' name = '" + id_prefix + "'>"
      );
      var label = $(
        "<label for='" +
          id +
          "'>" +
          "<span title='" +
          responseElement.popUp +
          "' style='text-decoration: none; color:black; font-weight: normal'>" +
          responseElement.label +
          "</span>" +
          "</label>"
      );
      td2.append(checkbox);
      td2.append(label);
    }
    attribute.append(td2);
  }

  var content;
  if (this.pageConfig.content === null) {
    content = "";
  } else {
    content = this.pageConfig.content;
  }
};

OLECATAPage.prototype.load = function () {
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

  //this.filePlayer.init();

  if (this.pageConfig.questionnaire.length > 0) {
    this.interval = setInterval(
      function () {
        var counter = 0;
        var i;
        for (i = 0; i < this.pageConfig.questionnaire.length; ++i) {
          var element = this.pageConfig.questionnaire[i];
          if (element.type === "text") {
            if ($("#" + element.name).val() || element.optional == true) {
              ++counter;
            }
          } else if (element.type === "number") {
            if ($("#" + element.name).val() || element.optional == true) {
              ++counter;
            }
          } else if (element.type === "likert") {
            if (
              (this.likert &&
                $(
                  "input[name='" + element.name + "__response']:checked"
                ).val()) ||
              element.optional == true
            ) {
              ++counter;
            }
          } else if (element.type === "long_text") {
            if ($("#" + element.name).val() || element.optional == true) {
              ++counter;
            }
          } else if (element.type === "checkboxes") {
            if (
              $("input[name='" + element.name + "__response']:checked").val() ||
              element.optional == true
            ) {
              ++counter;
            }
          } else if (element.type === "heading") {
            ++counter;
          }
          if (counter == this.pageConfig.questionnaire.length) {
            $("#send_results").removeAttr("disabled");
          } else if (
            i + 1 == this.pageConfig.questionnaire.length &&
            counter != this.pageConfig.questionnaire.length &&
            $("#send_results").is(":enabled")
          ) {
            //$('#send_results').attr('disabled', true);
          }
        }
      }.bind(this),
      50
    );
  } else {
    $("#send_results").removeAttr("disabled");
  }
};

OLECATAPage.prototype.save = function () {
  //this.fpc.unbind();
  this.time += new Date() - this.startTimeOnPage;
  this.result = $(
    "input[name='" + this.likert.prefix + "_response']:checked"
  ).val();

  this.comment = $("#" + this.textbox).val(); //saving the value of the comment

  for (let i = 0; i < this.pageConfig.questionnaire.length; ++i) {
    //loop through all questionnaire items (each item = element)
    var element = this.pageConfig.questionnaire[i];
    if (element.type == "checkboxes") {
      for (let response of element.response) {
        //loop through all attributes and add them to the attribute object
        var id_prefix = element.name + "__response";
        var id = id_prefix + "_" + response.value;
        let checkboxes = $("input[id='" + id + "']");
        this.attributes[response.value] = checkboxes[0].checked; //defining the attribute object (response value = attribute name, checkboxes[0].checked = value of the attribute)
      }
    }
  }
  //this.filePlayer.free();
};

OLECATAPage.prototype.store = function (_reponsesStorage) {
  var trial = this.session.getTrial(this.pageConfig.type, this.pageConfig.id);
  if (trial === null) {
    trial = new Trial();
    trial.type = this.pageConfig.type;
    trial.id = this.pageConfig.id;
    this.session.trials[this.session.trials.length] = trial;
  }

  var rating = new OLECATARating(); //my OLECATA datamodel

  rating.stimulus = this.stimulus.id;

  if (this.result == undefined) {
    rating.stimulusRating = "NA";
  } else {
    rating.stimulusRating = this.result;
  }

  rating.time = this.time;
  rating.comment = this.comment; //storing the comment value (as saved above)
  trial.responses[trial.responses.length] = rating;
  rating.attributes = this.attributes; //storing the attributes as key-value pairs (as defined and saved above)
};
