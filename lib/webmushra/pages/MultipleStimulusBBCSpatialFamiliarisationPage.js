function extend(base, constructor) {
  var prototype = new Function();
  prototype.prototype = base.prototype;
  constructor.prototype = new prototype();
  constructor.prototype.constructor = constructor;
}

function MultipleStimulusBBCSpatialFamiliarisationPage(
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
  this.refParams = this.pageConfig.referenceParams;
  this.result = {
    azimuth: null,
    distance: null,
    width: null,
    height: null,
  };
  this.setResult = function (result) {
    if (!result) return;
    if ("azimuth" in result) this.result["azimuth"] = result["azimuth"];
    if ("distance" in result) this.result["distance"] = result["distance"];
    if ("width" in result) this.result["width"] = result["width"];
    if ("height" in result) this.result["height"] = result["height"];
    this.checkCompleteResponse();
  }.bind(this);
  this.checkCompleteResponse = function () {
    if (
      this.result["azimuth"] !== null &&
      this.result["distance"] !== null &&
      this.result["width"] !== null &&
      this.result["height"] !== null
    )
      this.pageTemplateRenderer.unlockNextButton();
  }.bind(this);

  this.renderInterval_ms = 20; // this.pageConfig.renderInterval_ms;
}

extend(
  MultipleStimulusFamiliarisationPage,
  MultipleStimulusBBCSpatialFamiliarisationPage
);

MultipleStimulusBBCSpatialFamiliarisationPage.prototype.init = function () {
  MultipleStimulusFamiliarisationPage.prototype.init.call(this);
  this.initUI();
};

MultipleStimulusBBCSpatialFamiliarisationPage.prototype.initUI = function () {
  this.radar = new AzRadRadarRel(this.pageConfig);
  this.radar.init(this.setResult);
  this.slider = new HeightSliderRel(this.pageConfig);
  this.slider.init(this.setResult);
};

MultipleStimulusBBCSpatialFamiliarisationPage.prototype.render = function (
  _parent
) {
  MultipleStimulusFamiliarisationPage.prototype.render.call(this, _parent);
  var control_div = $("<div></div>");
  _parent.append(control_div);

  // render controls
  var tableRating = document.createElement("table");
  control_div.append(tableRating);
  tableRating.setAttribute("border", "0");
  tableRating.setAttribute("align", "center");
  tableRating.setAttribute("style", "margin-top: 0em;");

  var trRatingHeading = document.createElement("tr");
  trRatingHeading.setAttribute("style", "vertical-align:top");
  tableRating.appendChild(trRatingHeading);

  var tdSH = document.createElement("td");
  tdSH.innerHTML =
    "<h3>Height</h3>Use the primary mouse button to indicate the perceived source height (green) relative to the reference (blue).";
  trRatingHeading.appendChild(tdSH);

  var tdRH = document.createElement("td");
  tdRH.innerHTML =
    "<h3>Azimuth, Distance, and Width</h3>Use the primary mouse button to indicate the perceived source azimuth and distance (green) relative to the reference (blue).<br/>Use the secondary mouse button to indicate the perceived source width (dragging up to increase it and down to decrease it).";
  trRatingHeading.appendChild(tdRH);

  var trRating = document.createElement("tr");
  tableRating.appendChild(trRating);

  var tdS = document.createElement("td");
  var sWidth = this.slider.width;
  var sHeight = this.slider.height;
  var sliderDivId = "sliderArea";
  var sliderDiv = document.createElement("div");
  sliderDiv.setAttribute("id", sliderDivId);
  sliderDiv.setAttribute("width", sWidth);
  sliderDiv.setAttribute("height", sHeight);
  sliderDiv.append(this.slider.canvas);
  tdS.appendChild(sliderDiv);
  trRating.appendChild(tdS);

  var tdR = document.createElement("td");
  var rWidth = this.radar.width;
  var rHeight = this.radar.height;
  var radarDivId = "radarArea";
  var radarDiv = document.createElement("div");
  radarDiv.setAttribute("id", radarDivId);
  radarDiv.setAttribute("width", rWidth);
  radarDiv.setAttribute("height", rHeight);
  radarDiv.append(this.radar.canvas);
  tdR.appendChild(radarDiv);
  trRating.appendChild(tdR);

  this.slider.render();
  this.radar.render();
};

MultipleStimulusBBCSpatialFamiliarisationPage.prototype.load = function () {
  MultipleStimulusFamiliarisationPage.prototype.load.call(this);
  if (this.pageConfig.mustRate == true) {
    this.pageTemplateRenderer.lockNextButton();
    this.checkCompleteResponse();
  }
  this.frameUpdateInterval = setInterval(
    function () {
      this.slider.render();
      this.radar.render();
    }.bind(this),
    this.renderInterval_ms
  );
};

MultipleStimulusBBCSpatialFamiliarisationPage.prototype.save = function () {
  clearInterval(this.frameUpdateInterval);
  MultipleStimulusFamiliarisationPage.prototype.save.call(this);
};

MultipleStimulusBBCSpatialFamiliarisationPage.prototype.updateReferenceParams = function (
  refParams
) {
  // refParams (object): azimuth, distance, width, height
  if ("azimuth" in refParams && refParams["azimuth"] !== null)
    this.refParams["azimuth"] = refParams["azimuth"];
  if ("distance" in refParams && refParams["distance"] !== null)
    this.refParams["distance"] = refParams["distance"];
  if ("width" in refParams && refParams["width"] !== null)
    this.refParams["width"] = refParams["width"];
  if ("height" in refParams && refParams["height"] !== null)
    this.refParams["height"] = refParams["height"];
  this.radar.updateRefParams(this.refParams);
};
