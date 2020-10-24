function extend(base, constructor) {
  var prototype = new Function();
  prototype.prototype = base.prototype;
  constructor.prototype = new prototype();
  constructor.prototype.constructor = constructor;
}

function MultipleStimulusLikertFamiliarisationPage(
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
  // call the super constructor
  MultipleStimulusFamiliarisationPage.call(
    this,
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
  );
  // do some other stuff
  this.likert = null;
  this.result = null;
  this.likertCallback = function (prefix) {
    if (!prefix) return;
    this.result = $("input[name='" + prefix + "_response']:checked").val();
    this.pageTemplateRenderer.unlockNextButton();
  }.bind(this);
}

extend(
  MultipleStimulusFamiliarisationPage,
  MultipleStimulusLikertFamiliarisationPage
);

MultipleStimulusLikertFamiliarisationPage.prototype.init = function () {
  MultipleStimulusFamiliarisationPage.prototype.init.call(this);
  var likertDisabledOnStartFalse = false;
  this.likert = new LikertScale(
    this.pageConfig.response,
    "timbral_quality",
    likertDisabledOnStartFalse,
    this.likertCallback
  );
};

MultipleStimulusLikertFamiliarisationPage.prototype.render = function (
  _parent
) {
  MultipleStimulusFamiliarisationPage.prototype.render.call(this, _parent);
  var control_div = $("<div></div>");
  _parent.append(control_div);
  this.likert.render(control_div);
};

MultipleStimulusLikertFamiliarisationPage.prototype.load = function () {
  MultipleStimulusFamiliarisationPage.prototype.load.call(this);
  if (this.pageConfig.mustRate == true) {
    this.pageTemplateRenderer.lockNextButton();
  }
};
