function LikertComparisonPageManager() {}

LikertComparisonPageManager.prototype.createPages = function (
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
  // create and then randomise stimuli
  this.conditions = [];
  for (var key in _pageConfig.stimuli) {
    this.conditions[this.conditions.length] = new Stimulus(
      key,
      _pageConfig.stimuli[key]
    );
  }
  this.reference = new Stimulus("reference", _pageConfig.reference);
  shuffle(this.conditions);

  // create familiarisation page if needed
  if (_pageConfig.familiarisation) {
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
    // create page
    let familPage = new MultipleStimulusLikertFamiliarisationPage(
      _pageManager,
      _pageTemplateRenderer,
      _audioContext,
      _bufferSize,
      _audioFileLoader,
      _session,
      _pageConfig.familiarisationConfig,
      _mushraValidator,
      _errorHandler,
      _language
    );
    _pageManager.addPage(familPage);
  }

  // create rating pages
  for (var i = 0; i < this.conditions.length; ++i) {
    var page = new LikertComparisonPage(
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
  }
};
