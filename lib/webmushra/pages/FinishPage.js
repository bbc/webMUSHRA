/*************************************************************************
         (C) Copyright AudioLabs 2017 

This source code is protected by copyright law and international treaties. This source code is made available to You subject to the terms and conditions of the Software License for the webMUSHRA.js Software. Said terms and conditions have been made available to You prior to Your download of this source code. By downloading this source code You agree to be bound by the above mentionend terms and conditions, which can also be found here: https://www.audiolabs-erlangen.de/resources/webMUSHRA. Any unauthorised use of this source code may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under law. 

**************************************************************************/

function FinishPage(_pageManager, _session, _dataSender, _pageConfig, _language) {
  this.pageManager = _pageManager;
  this.session = _session;
  this.dataSender = _dataSender;
  this.pageConfig = _pageConfig;
  this.language = _language;

  this.likert = null;
  this.interval = null;

  this.errorDiv = $("<div style='color:red; font-weight:bold;'></div>");



  if (this.pageConfig.questionnaire === undefined) {
    this.pageConfig.questionnaire = new Array();
  }




}

FinishPage.prototype.getName = function () {
  return this.pageConfig.name;
};

FinishPage.prototype.storeParticipantData = function () {
  for (let i = 0; i < this.pageConfig.questionnaire.length; ++i) {
    var element = this.pageConfig.questionnaire[i];
    if (element.type == "heading") continue;
    if ($("#" + element.name).val()) {
      this.session.participant.questionnaire[element.name] = $("#" + element.name).val();
    } else {
      this.session.participant.questionnaire[element.name] = $("input[name='" + element.name + "__response']:checked").val();
    }
  }
};

FinishPage.prototype.sendResults = function () {
  var err = this.dataSender.send(this.session);
  if (err == true) {
    this.errorDiv.text("An error occured while sending your data to the server! Please contact the experimenter.");
  }
  clearInterval(this.interval);
};

FinishPage.prototype.render = function (_parent) {
  _parent.append(this.pageConfig.content);

  var table = $("<table align='center'></table>");
  _parent.append(table);

  var i;
  for (i = 0; i < this.pageConfig.questionnaire.length; ++i) {
    var element = this.pageConfig.questionnaire[i];
    if (element.type === "text") {
      table.append($("<tr><td><strong>" + element.label + "</strong></td><td><input id='" + element.name + "' /></td></tr>"));
    } else if (element.type === "number") {
      table.append($("<tr><td><strong>" + element.label + "</strong></td><td><input id='" + element.name + "' min='" + element.min + "' max='" + element.max + "' value='" + element.default + "' data-inline='true'/></td></tr>"));
    } else if (element.type === "likert") {
      this.likert = new LikertScale(element.response, element.name + "_");
      var td = $("<td></td>");
      table.append($("<tr></tr>").append(
        $("<td><strong>" + element.label + "</strong></td>"),
        td
      ));
      this.likert.render(td);
    } else if (element.type === "long_text") {
      table.append($("<tr><td id='labeltd' style='vertical-align:top; padding-top:" + $('#feedback').css('margin-top') + "'><strong>" + element.label + "</strong></td><td><textarea name='" + element.name + "' id='" + element.name + "'></textarea></td></tr>"));
    } else if (element.type === "checkboxes") {
      var tr = $("<tr></tr>");
      var td = $("<td><strong>" + element.label + "</strong></td>");
      table.append(tr);
      tr.append(td);
      var td2 = $("<td></td>");
      for (let j = 0; j < element.response.length; ++j) {
        var responseElement = element.response[j];
        var id_prefix = element.name + "__response"
        var id = id_prefix + "_" + responseElement.value;
        var checkbox = $("<input type='checkbox' id='" + id + "' name = '" + id_prefix + "'>");
        var label = $(
          "<label for='" + id + "'>" + responseElement.label + "</label>"
        );
        td2.append(checkbox);
        td2.append(label);
      }
      tr.append(td2);
    } else if (element.type === "heading") {
      table.append($("<tr><td colspan=2 id=" + element.name + " style='vertical-align:top; padding-top:" + $('#feedback').css('margin-top') + "'><br><strong>" + element.label + "</strong><br>" + element.content + "<br><br></td></tr>"));
    }
    console.log(element);
  }
  var button = $("<button id='send_results' data-role='button' data-inline='true' disabled='disabled'>" + this.pageManager.getLocalizer().getFragment(this.language, 'sendButton') + "</button>");
  button.bind("click", (function (event, ui) {
    this.storeParticipantData();
    this.sendResults();

    $("#popupDialog").popup("open");
  }).bind(this));
  _parent.append(button);

  $("#popHeader").text(this.pageManager.getLocalizer().getFragment(this.language, 'attending'));

  var table = $("<table align='center'> </table>");
  var trHeader = document.createElement("tr");
  var trT;
  var trRatings;
  var thSecondContent = $("<th colspan='2' align='center'> </th>");

  $(thSecondContent).append(this.pageConfig.popupContent);
  $(table).append(thSecondContent);
  $(table).append(trHeader);
  

  var thHeader;
  //var thT;
  var text;
  //var tdRatingStimulus;
  //var tdRatingScore;
  if (this.pageConfig.showResults) {
    th = $("<th colspan='3'> </th>");
    $(th).append($("<h3>" + "Your results have sucessfully been submitted!" + "</h3>"));
    $(trHeader).append(th);
    //trT = document.createElement("tr");
    row = $("<tr></tr>")
    text = $("<p colspan='3'>"+"You can now close this page."+"</p>");
    row.append(text)
    $(table).append(row);


    // var trials = this.session.trials;
    // for (i = 0; i < trials.length; ++i) {
    //   var trial = trials[i];
    //   if (trial.type === "mushra") {
    //     trT = document.createElement("tr");
    //     thT = $("<th colspan='2'>"+"you can now close this page"+"</th>");
    //     $(thT).append(trial.id + " (MUSHRA)");
    //     $(trT).append(thT);
    //     $(table).append(trT);

    //     var ratings = trial.responses;
    //     for (var j = 0; j < ratings.length; ++j) {
    //       trRatings = document.createElement("tr");
    //       tdRatingStimulus = document.createElement("td");
    //       tdRatingScore = document.createElement("td");

    //       tdRatingStimulus.width = "50%";
    //       tdRatingScore.width = "50%";

    //       var rating = ratings[j];

    //       $(tdRatingStimulus).append(rating.stimulus + ": ");
    //       $(tdRatingScore).append(rating.score);
    //       $(trRatings).append(tdRatingStimulus);
    //       $(trRatings).append(tdRatingScore);
    //       $(table).append(trRatings);

    //     }
    //     trEmpty = $("<tr height='8px'></tr>");
    //     $(table).append(trEmpty);
    //   } else if (trial.type === "paired_comparison") {

    //     trPaired = document.createElement("tr");
    //     thT = $("<th colspan='2'></th>");
    //     $(thT).append(trial.id + " (Paired Comparison)");
    //     $(trPaired).append(thT);
    //     $(table).append(trPaired);
    //     var j;
    //     for (j = 0; j < trial.responses.length; ++j) {
    //       trPC = document.createElement("tr");
    //       tdPCReference = document.createElement("td");
    //       tdPCres = document.createElement("td");

    //       var response = trial.responses[j];


    //       $(tdPCres).append(response.answer);
    //       $(tdPCReference).append(response.nonReference);
    //       $(trPC).append(tdPCReference);
    //       $(trPC).append(tdPCres);
    //       $(table).append(trPC);
    //     }
    //     trEmpty = $("<tr height='8px'></tr>");
    //     $(table).append(trEmpty);

    //   } else if (trial.type === "bs1116") {
    //     trPaired = document.createElement("tr");
    //     thT = $("<th colspan='2'></th>");
    //     $(thT).append(trial.id + " (BS1116)");
    //     $(trPaired).append(thT);
    //     $(table).append(trPaired);

    //     var j;
    //     for (j = 0; j < trial.responses.length; ++j) {
    //       var response = trial.responses[j];


    //       trBS1 = document.createElement("tr");
    //       trBS2 = document.createElement("tr");
    //       tdBSReference = document.createElement("td");
    //       tdBSRefValue = document.createElement("td");
    //       tdBSCondition = document.createElement("td");
    //       tdBSConValue = document.createElement("td");

    //       $(tdBSReference).append(response.reference + ": ");
    //       $(tdBSRefValue).append(response.referenceScore);
    //       $(trBS1).append(tdBSReference);
    //       $(trBS1).append(tdBSRefValue);

    //       $(tdBSCondition).append(response.nonReference + ": ");
    //       $(tdBSConValue).append(response.nonReferenceScore);
    //       $(trBS2).append(tdBSCondition);
    //       $(trBS2).append(tdBSConValue);

    //       trEmpty = $("<tr height='5px'></tr>");

    //       $(table).append(trBS1);
    //       $(table).append(trBS2);
    //       $(table).append(trEmpty);
    //     }
    //     trEmpty = $("<tr height='3px'></tr>");
    //     $(table).append(trEmpty);
    //   } else if (trial.type === "likert_multi_stimulus") {
    //     trLMSH = document.createElement("tr");
    //     thT = $("<th colspan='2'></th>");
    //     $(thT).append(trial.id + " (LMS)");
    //     $(trLMSH).append(thT);
    //     $(table).append(trLMSH);
    //     var j;
    //     for (j = 0; j < trial.responses.length; ++j) {
    //       trLMS = document.createElement("tr");

    //       tdStimulus = document.createElement("td");
    //       tdRating = document.createElement("td");

    //       $(tdStimulus).append(trial.responses[j].stimulus + ": ");
    //       $(tdRating).append(trial.responses[j].stimulusRating);

    //       $(trLMS).append(tdStimulus);
    //       $(trLMS).append(tdRating);

    //       $(table).append(trLMS);

    //     }
    //   } else if (trial.type === "OLE_multi") {
    //     trLMSH = document.createElement("tr");
    //     thT = $("<th colspan='2'></th>");
    //     $(thT).append(trial.id + " (LMS)");
    //     $(trLMSH).append(thT);
    //     $(table).append(trLMSH);
    //     var j;
    //     for (j = 0; j < trial.responses.length; ++j) {
    //       trLMS = document.createElement("tr");

    //       tdStimulus = document.createElement("td");
    //       tdRating = document.createElement("td");

    //       $(tdStimulus).append(trial.responses[j].stimulus + ": ");
    //       $(tdRating).append(trial.responses[j].stimulusRating);

    //       $(trLMS).append(tdStimulus);
    //       $(trLMS).append(tdRating);

    //       $(table).append(trLMS);

    //     }
    //   }
    //   else if (trial.type === "likert_single_stimulus") {
    //     trLSSH = document.createElement("tr");
    //     thT = $("<th colspan='2'></th>");
    //     $(thT).append(trial.id + " (LSS)");
    //     $(trLSSH).append(thT);
    //     $(table).append(trLSSH);

    //     var j;
    //     for (j = 0; j < trial.responses.length; ++j) {
    //       trLSS = document.createElement("tr");

    //       tdStimuli = document.createElement("td");
    //       tdRating = document.createElement("td");

    //       $(tdStimuli).append(trial.responses[j].stimulus + ": ");
    //       $(tdRating).append(trial.responses[j].stimulusRating);

    //       $(trLSS).append(tdStimuli);
    //       $(trLSS).append(tdRating);

    //       $(table).append(trLSS);
    //     }
    //   } else if (trial.type === "OLE_CATA") {
    //     trLSSH = document.createElement("tr");
    //     thT = $("<th colspan='2'></th>");
    //     $(thT).append(trial.id + " (LSS)");
    //     $(trLSSH).append(thT);
    //     $(table).append(trLSSH);

    //     var j;
    //     for (j = 0; j < trial.responses.length; ++j) {
    //       trLSS = document.createElement("tr");

    //       tdStimuli = document.createElement("td");
    //       tdRating = document.createElement("td");

    //       $(tdStimuli).append(trial.responses[j].stimulus + ": ");
    //       $(tdRating).append(trial.responses[j].stimulusRating);

    //       $(trLSS).append(tdStimuli);
    //       $(trLSS).append(tdRating);

    //       $(table).append(trLSS);
    //     }
    //   }
    //   else if (trial.type === "likert_comparison") {
    //     trLCH = document.createElement("tr");
    //     thT = $("<th colspan='2'></th>");
    //     $(thT).append(trial.id + " (LC)");
    //     $(trLCH).append(thT);
    //     $(table).append(trLCH);

    //     var j;
    //     for (j = 0; j < trial.responses.length; ++j) {
    //       trLC = document.createElement("tr");

    //       tdStimuli = document.createElement("td");
    //       tdRating = document.createElement("td");

    //       $(tdStimuli).append(trial.responses[j].stimulus + ": ");
    //       $(tdRating).append(trial.responses[j].stimulusRating);

    //       $(trLC).append(tdStimuli);
    //       $(trLC).append(tdRating);

    //       $(table).append(trLC);
    //     }
    //   } else if (trial.type === "bbc_spatial") {
    //     trBBCSH = document.createElement("tr");
    //     thT = $("<th colspan='5'></th>");
    //     $(thT).append(trial.id + " (BBC Spatial)");
    //     $(trBBCSH).append(thT);
    //     $(table).append(trBBCSH);

    //     trBBCSH2 = document.createElement("tr");

    //     tdCondition = document.createElement("td");
    //     tdAz = document.createElement("td");
    //     tdDist = document.createElement("td");
    //     tdWidth = document.createElement("td");
    //     tdHeight = document.createElement("td");

    //     $(tdAz).append("Az");
    //     $(tdDist).append("Dist");
    //     $(tdWidth).append("Width");
    //     $(tdHeight).append("Height");

    //     $(trBBCSH2).append(tdCondition);
    //     $(trBBCSH2).append(tdAz);
    //     $(trBBCSH2).append(tdDist);
    //     $(trBBCSH2).append(tdWidth);
    //     $(trBBCSH2).append(tdHeight);

    //     $(table).append(trBBCSH2);

    //     var j;
    //     for (j = 0; j < trial.responses.length; ++j) {
    //       trBBCS = document.createElement("tr");

    //       tdCondition = document.createElement("td");
    //       tdAz = document.createElement("td");
    //       tdDist = document.createElement("td");
    //       tdWidth = document.createElement("td");
    //       tdHeight = document.createElement("td");

    //       $(tdCondition).append(trial.responses[j].condition + ": ");
    //       $(tdAz).append(trial.responses[j].azimuth + "˚");
    //       $(tdDist).append(trial.responses[j].distance);
    //       $(tdWidth).append(trial.responses[j].width + "˚");
    //       $(tdHeight).append(trial.responses[j].height);

    //       $(trBBCS).append(tdCondition);
    //       $(trBBCS).append(tdAz);
    //       $(trBBCS).append(tdDist);
    //       $(trBBCS).append(tdWidth);
    //       $(trBBCS).append(tdHeight);

    //       $(table).append(trBBCS);
    //     }
    //   }
    // }
  }

  if (this.pageConfig.showErrors == true) {
    $("#popupResultsContent").append(this.errorDiv);
  }

  $("#popupResultsContent").append(table);

};

FinishPage.prototype.load = function () {
  $('#labeltd').css('padding-top', $("#feedback").css("margin-top"));
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
          $('#send_results').attr('disabled', true);
        }
      }
    }).
      bind(this), 50);
  } else {
    $('#send_results').removeAttr('disabled');
  }
};
