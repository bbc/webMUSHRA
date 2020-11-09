
function OLECATAPage(_pageManager, _pageTemplateRenderer, _pageConfig, _audioContext, _bufferSize, _audioFileLoader, _stimulus, _session, _errorHandler, _language) {
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
  
    this.audioFileLoader.addFile(this.stimulus.getFilepath(), (function (_buffer, _stimulus) { _stimulus.setAudioBuffer(_buffer); }), this.stimulus);
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
  
    var cbk = (function (_prefix) {
      this.ratingMap[_prefix] = true;
      if (Object.keys(this.ratingMap).length == 1) {
        this.pageTemplateRenderer.unlockNextButton();
      }
    }).bind(this);
  
  
    if (this.pageConfig.mustRate === false) {
      cbk = false;
    }
  
  
    this.likert = new LikertScale(this.pageConfig.response, "1_", this.pageConfig.mustPlayback == true, cbk);
  
  
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
    var table1 = $("<table style='padding-top: 25px', align='center'></table>")
    _parent.append(table1)
    var table = $("<table style='padding-top: 25px', align='center'></table>");
    _parent.append(table);

    var i;
  for (i = 0; i < this.pageConfig.questionnaire.length; ++i) {
    var element = this.pageConfig.questionnaire[i];
    if (element.type === "long_text") {
      table.append($("<tr><td colspan='3'><textarea name='" + element.name + "' id='" + element.name + "'></textarea></td></tr>"));
    } else if (element.type === "checkboxes") {
      //var tr = $("<tr></tr>");
      var attribute = $("<td><strong>" + element.label + "</strong></td>");
      table1.append(attribute);
      //tr.append(td);

      var td2 = $("<td></td>");
      for (let j = 0; j < element.response.length; ++j) {
        var responseElement = element.response[j];
        var id_prefix = element.name + "__response"
        var id = id_prefix + "_" + responseElement.value;
        var checkbox = $("<input type='checkbox' id='" + id + "' name = '" + id_prefix + "'>");
        var label = $(
          "<label for='" + id + "'>" + "<a href=' ' title='" + responseElement.popUp + "' style='text-decoration: none; color:black; font-weight: normal;'>"+ responseElement.label + "</a>"+ "</label>"
        );
        td2.append(checkbox);
        td2.append(label);
      }
      attribute.append(td2);
    } else if (element.type === "notesheading") {
      table.append($("<tr><td colspan=2 id=" + element.name + " style='vertical-align:top; padding-top:" + $('#feedback').css('margin-top') + "'><br><strong>" + element.label + "</strong><br>" + element.content + "<br><br></td></tr>"));
    }
    else if (element.type === "attributeheading") {
      table1.append($("<tr><td colspan=5 id=" + element.name + " style='vertical-align:top; padding-top:" + $('#feedback').css('margin-top') + "'><br><strong>" + element.label + "</strong><br>" + element.content + "<br><br></td></tr>"));
    }
    console.log(element);
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
      $("input[name='" + this.likert.prefix + "_response'][value='" + this.result + "']").attr("checked", "checked");
      $("input[name='" + this.likert.prefix + "_response'][value='" + this.result + "']").checkboxradio("refresh");
      this.likert.group.change();
    }
  
    //this.filePlayer.init();
    
    if (this.pageConfig.questionnaire.length > 0) {
      this.interval = setInterval((function () {
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
            if (this.likert && $("input[name='" + element.name + "__response']:checked").val() || element.optional == true) {
              ++counter;
            }
          } else if (element.type === "long_text") {
            if ($("#" + element.name).val() || element.optional == true) {
              ++counter;
            }
          } else if (element.type === "checkboxes") {
            if ($("input[name='" + element.name + "__response']:checked").val() || element.optional == true) {
              ++counter;
            }
          } else if (element.type === "heading") {
            ++counter;
          }
          if (counter == this.pageConfig.questionnaire.length) {
            $('#send_results').removeAttr('disabled');
          } else if (i + 1 == this.pageConfig.questionnaire.length && counter != this.pageConfig.questionnaire.length && $('#send_results').is(':enabled')) {
            //$('#send_results').attr('disabled', true);
          }
        }
      }).
        bind(this), 50);
    } else {
      $('#send_results').removeAttr('disabled');
    }
  };
  
  OLECATAPage.prototype.save = function () {
    //this.fpc.unbind();
    this.time += (new Date() - this.startTimeOnPage);
  
    this.result = $("input[name='" + this.likert.prefix + "_response']:checked").val();
  
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
    var rating = new LikertSingleStimulusRating();
    rating.stimulus = this.stimulus.id;
  
    if (this.result == undefined) {
      rating.stimulusRating = "NA";
    } else {
      rating.stimulusRating = this.result;
    }
  
    rating.time = this.time;
    trial.responses[trial.responses.length] = rating;
  
  
  };
  