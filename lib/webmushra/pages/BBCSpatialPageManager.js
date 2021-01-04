function BBCSpatialPageManager() {}

BBCSpatialPageManager.prototype.createPages = function (
  _pageManager,
  _pageTemplateRenderer,
  _pageConfig,
  _audioContext,
  _bufferSize,
  _audioFileLoader,
  _session,
  _mushraValidator,
  _errorHandler,
  _language
) {
  this.reference = new Stimulus("reference", _pageConfig.reference);

  // page to set reference conditions
  if (_pageConfig.evaluateReference) {
    let page = new BBCSpatialReferencePage(
      this.reference,
      _pageManager,
      _pageTemplateRenderer,
      _audioContext,
      _bufferSize,
      _audioFileLoader,
      _session,
      _pageConfig,
      _errorHandler,
      _language,
      this.updateReferenceParams.bind(this)
    );
    _pageManager.addPage(page);
  }

  // create familiarisation page if needed
  if (_pageConfig.familiarisation) {
    let familiarisationConfig = this.createFamiliarisationPageConfig(
      _pageConfig
    );
    // create page
    this.familPage = new MultipleStimulusBBCSpatialFamiliarisationPage(
      _pageManager,
      _pageTemplateRenderer,
      _audioContext,
      _bufferSize,
      _audioFileLoader,
      _session,
      familiarisationConfig,
      _mushraValidator,
      _errorHandler,
      _language
    );
    _pageManager.addPage(this.familPage);
  }

  // create and then randomise stimuli
  this.conditions = [];
  for (let key in _pageConfig.stimuli) {
    this.conditions[this.conditions.length] = new Stimulus(
      key,
      _pageConfig.stimuli[key]
    );
  }
  shuffle(this.conditions);

  // create rating pages
  this.ratingPages = [];
  for (let i = 0; i < this.conditions.length; ++i) {
    let page = new BBCSpatialPage(
      this.reference,
      this.conditions[i],
      _pageManager,
      _pageTemplateRenderer,
      _audioContext,
      _bufferSize,
      _audioFileLoader,
      _session,
      _pageConfig,
      _errorHandler,
      _language
    );
    _pageManager.addPage(page);
    this.ratingPages[i] = page;
  }
};

BBCSpatialPageManager.prototype.createFamiliarisationPageConfig = function (
  _pageConfig
) {
  // set defaults
  let defaultConf = {
    type: "multi_stimulus_bbc_spatial_familiarisation",
    createHiddenReference: false,
    mustRate: false,
    randomize: true,
  };
  for (const [key, value] of Object.entries(defaultConf)) {
    if (!(key in _pageConfig.familiarisationConfig)) {
      _pageConfig.familiarisationConfig[key] = value;
    }
  }
  // copy config elements across
  for (const [key, value] of Object.entries(_pageConfig)) {
    if (
      !(key in _pageConfig.familiarisationConfig) &&
      !["familiarisationConfig", "familiarisation", "type"].includes(key)
    ) {
      _pageConfig.familiarisationConfig[key] = value;
    }
  }
  return _pageConfig.familiarisationConfig;
};

BBCSpatialPageManager.prototype.updateReferenceParams = function (params) {
  // params (object): azimuth, distance, width, height
  this.familPage.updateReferenceParams(params);
  for (const page of this.ratingPages) page.updateReferenceParams(params);
};
