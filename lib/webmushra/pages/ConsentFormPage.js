/**
 * @class ConsentFormPage
 * @property {object} _pageManager The page manager instance for this session.
 * @property {object} _session The experiment session.
 * @property {object} _pageConfig The configuration parameters for the page.
 * @property {object} _pageTemplateRenderer The page template renderer.
 */
function ConsentFormPage(
  _pageManager,
  _session,
  _pageConfig,
  _pageTemplateRenderer
) {
  this.pageManager = _pageManager;
  this.session = _session;
  this.pageConfig = _pageConfig;
  this.pageTemplateRenderer = _pageTemplateRenderer;
  this.name = _pageConfig.name;
  // pageConfig fields:
  //    name
  //    projectName
  //    intro
  //    dataPrivacyNotice
  //    responsesNotice
  //    declaration [array]
  //    language
  this.language = _pageConfig.language;
  this.agreeButton = null;
  this.withdrawButton = null;
  this.agreed = false;
  this.declaration = {};
  this.statusDiv = null;

  this.resetDeclaration();
  this.declarationCallback = function (event) {
    this.declaration[event.target.id] = event.target.checked;
    if (this.checkDeclarationAllChecked()) {
      this.agreeButton.prop("disabled", false);
    } else {
      this.agreeButton.prop("disabled", true);
    }
  }.bind(this);

  this.checkDeclarationAllChecked = function () {
    for (const [key, value] of Object.entries(this.declaration)) {
      if (value === false) return false;
    }
    return true;
  };

  this.onAgreed = function () {
    this.agreed = true;
    // store data when participant clicks I Agree
    this.session.participant.consent = this.declaration;
    this.pageTemplateRenderer.unlockNextButton();
    this.agreeButton.prop("disabled", true);
    this.disableCheckboxes(true);
    this.agreeButton.text("Agreed");
    if (this.statusDiv) {
      this.statusDiv.append(
        $(
          "<p>Thank you for agreeing to participate in this experiment. We recommend saving a copy of this declaration and the contact information for your records.</p>"
        )
      );
      this.statusDiv.append(
        $(
          "<p>You may withdraw your consent before completing the experiment by clicking the button below. After completing the experiment, please follow the instructions given above if you wish to withdraw your consent.</p>"
        )
      );
      this.withdrawButton.bind("click", this.onWithdraw);
      this.withdrawButton.prop("disabled", false);
      this.statusDiv.append(this.withdrawButton);
      this.statusDiv.append(
        $(
          "<p>When you are ready to begin the experiment, please click the 'Next' button.</p>"
        )
      );
    }
  }.bind(this);

  this.onWithdraw = function () {
    this.agreed = false;
    this.resetDeclaration();
    this.session.participant.consent = this.declaration;
    // reset GUI components
    this.pageTemplateRenderer.lockNextButton();
    this.agreeButton.prop("disabled", false);
    this.agreeButton.text("I Agree");
    this.disableCheckboxes(false);
    this.updateCheckboxStates();
    this.statusDiv.empty();
  }.bind(this);
}

/**
 * Returns the page title.
 * @memberof ConsentFormPage
 * @returns {string}
 */
ConsentFormPage.prototype.getName = function () {
  return this.name;
};

/**
 * Renders the page
 * @memberof ConsentFormPage
 */
ConsentFormPage.prototype.render = function (_parent) {
  _parent.append($("<h3>Experiment title: " + this.pageConfig.projectName + "</h3>"));
  _parent.append($("<p align=left>" + this.pageConfig.intro + "</p>"));
  _parent.append($("<h3>Experiment instructions</h3>"));
  _parent.append($("<p align=left>" + this.pageConfig.instructions + "</p>"));
  _parent.append($("<h3>Personal data and privacy notice</h3>"));
  _parent.append($("<p align=left>" + this.pageConfig.dataPrivacyNotice + "</p>"));
  _parent.append($("<h3>Listening experiment responses</h3>"));
  _parent.append($("<p align=left>" + this.pageConfig.responsesNotice + "</p>"));
  _parent.append($("<h3>Declaration</h3>"));
  for (let i = 0; i < this.pageConfig.declaration.length; ++i) {
    var element = this.pageConfig.declaration[i];
    var checkbox = $("<input type='checkbox' id='" + element.name + "'>");
    var label = $(
      "<label for='" + element.name + "'>" + element.text + "</label>"
    );
    _parent.append(checkbox);
    _parent.append(label);
    checkbox.change(this.declarationCallback);
  }
  // TODO: language localisation on I Agree
  this.agreeButton = $(
    "<button id='i_agree' data-role='button' data-inline='true' disabled='disabled'>I Agree</button>"
  );
  this.agreeButton.bind("click", this.onAgreed);
  _parent.append(this.agreeButton);
  this.statusDiv = $("<div></div>");
  _parent.append(this.statusDiv);
  // create withdraw button but don't add
  this.withdrawButton = $(
    "<button id='withdraw' data-role='button' data-inline='true' disabled='disabled'>Withdraw Consent</button>"
  );
  return;
};

ConsentFormPage.prototype.load = function () {
  this.updateCheckboxStates();
  if (this.checkDeclarationAllChecked())
    this.agreeButton.prop("disabled", false);
  if (this.agreed) {
    this.onAgreed();
  } else {
    this.pageTemplateRenderer.lockNextButton();
  }
};

ConsentFormPage.prototype.save = function () {};

ConsentFormPage.prototype.store = function () {
  // consent form results stored when user clicks I Agree
};

ConsentFormPage.prototype.resetDeclaration = function() {
  for (let i = 0; i < this.pageConfig.declaration.length; ++i) {
    this.declaration[this.pageConfig.declaration[i].name] = false;
  }
}

ConsentFormPage.prototype.updateCheckboxStates = function() {
  for (let i = 0; i < this.pageConfig.declaration.length; ++i) {
    var id = this.pageConfig.declaration[i].name;
    var val = this.declaration[id];
    var chkbx = $("input:checkbox[id='" + id + "']");
    chkbx.prop("checked", val).checkboxradio("refresh");
  }
};

ConsentFormPage.prototype.disableCheckboxes = function(isDisabled) {
  for (let i = 0; i < this.pageConfig.declaration.length; ++i) {
    var id = this.pageConfig.declaration[i].name;
    var chkbx = $("input:checkbox[id='" + id + "']");
    chkbx.prop("disabled", isDisabled).checkboxradio("refresh");
  }
};
