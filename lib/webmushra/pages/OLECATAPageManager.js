

function OLECATAPageManager() {
  
}

OLECATAPageManager.prototype.createPages = function (_pageManager, pageTemplateRenderer, _pageConfig, _audioContext, _bufferSize, _audioFileLoader, _session, _errorHandler, _language) {
  this.stimuli = [];
  for (var key in _pageConfig.stimuli) {
    this.stimuli[this.stimuli.length] = new Stimulus(key, _pageConfig.stimuli[key]);
  }
  shuffle(this.stimuli);
  
  for (var i = 0; i < this.stimuli.length; ++i) {    
    var page = new OLECATAPage(_pageManager, pageTemplateRenderer, _pageConfig, _audioContext, _bufferSize, _audioFileLoader, this.stimuli[i], _session, _errorHandler, _language);
    _pageManager.addPage(page);
  }  
};
