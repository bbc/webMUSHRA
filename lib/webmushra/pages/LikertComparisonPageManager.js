function LikertComparisonPageManager() {
  
}

LikertComparisonPageManager.prototype.createPages = function (_pageManager, _pageTemplateRenderer, _pageConfig, _audioContext, _bufferSize, _audioFileLoader, _session, _errorHandler, _language) {
  this.conditions = [];
  for (var key in _pageConfig.stimuli) {
    this.conditions[this.conditions.length] = new Stimulus(key, _pageConfig.stimuli[key]);
  }
  this.reference = new Stimulus("reference", _pageConfig.reference);
  shuffle(this.conditions);
  
  for (var i = 0; i < this.conditions.length; ++i) {
  	var page = new LikertComparisonPage(this.reference, this.conditions[i], _pageManager, _pageTemplateRenderer, _audioContext, _bufferSize, _audioFileLoader, _session, _pageConfig, _errorHandler, _language);
  	_pageManager.addPage(page);
  }  
};
