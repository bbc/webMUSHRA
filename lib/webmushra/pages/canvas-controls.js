// created by Chris Pike <chris.pike@bbc.co.uk>

class CanvasControl {
  constructor(_config) {
    this.mouse = {
      down: false,
      button: 0,
      x: 0,
      y: 0,
      px: 0,
      py: 0,
    };
    this.width = null;
    this.height = null;
    this.originX = null;
    this.originY = null;
    this.canvas = null;
    this.canvasContext = null;
    this.canvasId = null;
    this.resultCallback = undefined;
    this.sourceParams = {};
  }
  init(resultCallback) {
    this.resultCallback = resultCallback;
    this.initCanvas();
    this.setMouseCallbacks();
  }
  initCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.style.left = 0;
    this.canvas.style.top = 0;
    this.canvas.style.zIndex = 0;
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.canvas.width = parseInt(this.width);
    this.canvas.height = parseInt(this.height);
    this.canvas.setAttribute("id", this.canvasId);
    this.canvasContext = this.canvas.getContext("2d");
  }
  render() {
    if (this.canvasContext)
      this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    // do drawing
  }
  drawLine(startX, startY, stepX, stepY) {
    if (this.canvasContext === null) return;
    this.canvasContext.moveTo(startX, startY);
    this.canvasContext.lineTo(startX + stepX, startY + stepY);
  }
  setMouseCallbacks() {
    this.canvas.onmousedown = function (event) {
      this.control.mouse.down = true;
      this.control.mouse.button = event.which;
      this.control.handleMouse(event);
      event.preventDefault();
    }.bind({ control: this });
    this.canvas.onmousemove = function (event) {
      this.control.handleMouse(event);
      event.preventDefault();
    }.bind({ control: this });
    this.canvas.onmouseup = function (event) {
      this.control.mouse.down = false;
      event.preventDefault();
    }.bind({ control: this });
    this.canvas.onmouseout = function (event) {
      this.control.mouse.down = false;
      event.preventDefault();
    }.bind({ control: this });
    this.canvas.oncontextmenu = function (event) {
      event.preventDefault();
    };
  }
  handleMouse(event) {
    this.calcMousePos(event);
    var storeResult = false;
    if (this.mouse.down && this.mouse.button == 1) {
      // if left button down
      // do stuff?
      // storeResult = true;
    }
    if (this.mouse.down && this.mouse.button == 3) {
      // if right button down
      // do stuff?
      // storeResult = true;
    }
    if (storeResult === true && this.resultCallback !== undefined) {
      this.resultCallback(this.sourceParams);
    }
  }
  calcMousePos(event) {
    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    var rect = event.target.getBoundingClientRect();
    // get relative to top-left
    var posX = event.pageX - rect.left - $(window).scrollLeft();
    var posY = event.pageY - rect.top - $(window).scrollTop();
    // relative to origin
    var relX = posX - this.originX;
    var relY = posY - this.originY;
    this.mouse.x = relX;
    this.mouse.y = relY;
  }
}

class HeightSlider extends CanvasControl {
  constructor(_config) {
    super(_config);
    this.width = 300;
    this.height = 300;
    this.canvasId = "slider_canvas";
    this.sourceParams = {
      height: null,
    };
    this.refHeight = 0;
    // TODO: set steps in config?
    var numSteps = 5;
    this.heightResolution = 1.0;

    var outerPad = 20;
    this.originX = 50;
    this.originY = this.height / 2;
    this.halfScaleHeight = (this.height - 2 * outerPad) / 2;
    this.halfScaleSteps = Math.floor((numSteps - 1) / 2);
    this.stepPix = this.halfScaleHeight / this.halfScaleSteps;
    // num steps has to be odd
    this.numSteps = 2 * this.halfScaleSteps + 1;
  }
  render() {
    var canvas = this.canvas;
    var canvasContext = this.canvasContext;
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.fillStyle = "black";
    canvasContext.strokeStyle = "black";
    canvasContext.setLineDash([5, 5]);
    canvasContext.beginPath();
    // down line
    this.drawLine(
      this.originX,
      this.originY - this.halfScaleHeight,
      0,
      2 * this.halfScaleHeight
    );
    // scale markings
    var scaleMarkWidth = 30;
    var scaleMarkHalfWidth = scaleMarkWidth / 2;
    for (let i = -this.halfScaleSteps; i <= this.halfScaleSteps; i++) {
      this.drawLine(
        this.originX - scaleMarkHalfWidth,
        this.originY + i * this.stepPix,
        scaleMarkWidth,
        0
      );
    }
    canvasContext.stroke();
    // ref blob
    var refBlue = "rgba(0,0,150,0.75)";
    var stimGreen = "rgba(0,190,0,0.75)";
    var sourceBlobSize = 10;
    this.drawSource(this.refHeight, refBlue, sourceBlobSize);
    this.drawSource(this.sourceParams["height"], stimGreen, sourceBlobSize);

    canvasContext.font = '16px "Helvetica", sans-serif';
    canvasContext.textBaseline = "middle";
    canvasContext.fillStyle = "black";
    var wordX = this.originX + scaleMarkWidth;
    canvasContext.fillText("Same height as reference", wordX, this.originY);
    canvasContext.fillText(
      "Much higher than reference",
      wordX,
      this.originY - this.halfScaleHeight
    );
    canvasContext.fillText(
      "Much lower than reference",
      wordX,
      this.originY + this.halfScaleHeight
    );
    canvasContext.fillText(
      "Slightly higher than reference",
      wordX,
      this.originY - this.stepPix
    );
    canvasContext.fillText(
      "Slightly lower than reference",
      wordX,
      this.originY + this.stepPix
    );
  }
  drawSource(height, colour, size) {
    if (this.canvasContext === null) return;
    if (height === null) return;
    this.canvasContext.fillStyle = colour;
    this.canvasContext.beginPath();
    // calc position in
    this.canvasContext.arc(
      this.originX,
      this.originY - height * this.stepPix,
      size,
      0,
      2 * Math.PI
    );
    this.canvasContext.fill();
  }
  handleMouse(event) {
    this.calcMousePos(event);
    var storeResult = false;
    if (this.mouse.down && this.mouse.button == 1) {
      // if left button down
      this.calcSourceHeight();
      storeResult = true;
    }
    if (this.mouse.down && this.mouse.button == 3) {
      // if right button down
      //
    }
    if (storeResult === true && this.resultCallback !== undefined) {
      this.resultCallback(this.sourceParams);
    }
  }
  calcSourceHeight() {
    var height = -this.mouse.y / this.stepPix;
    // limit to range +-halfScaleSteps and set limited resolution
    height = Math.round(height / this.heightResolution) * this.heightResolution;
    height = Math.min(this.halfScaleSteps, height);
    height = Math.max(-this.halfScaleSteps, height);
    this.sourceParams["height"] = height;
  }
}

class AzRadRadar extends CanvasControl {
  constructor(_config) {
    super(_config);
    this.width = 650;
    this.height = 400;
    this.canvasId = "radar_canvas";
    this.listenerImg = null;
    this.listenerImgPath = "res/listener.png";
    this.sourceParams = {
      azimuth: null,
      distance: null,
      width: null,
    };
    // TODO: set params from config
    this.refParams = {
      azimuth: _config.referenceParams.azimuth,
      distance: 4,
      width: 0,
    };
    this.distanceResolution = 1.0;

    var canvasMinDim = Math.min(this.width, this.height);
    var outerPad = 20;
    this.originX = canvasMinDim / 2;
    this.originY = canvasMinDim / 2;
    this.maxRadiusPix = (canvasMinDim - outerPad) / 2;
    this.distanceSteps = 7;
    this.dStepPix = this.maxRadiusPix / this.distanceSteps;
  }
  init(resultCallback) {
    super.init(resultCallback);
    this.loadListenerImage();
  }
  render() {
    var canvas = this.canvas;
    var canvasContext = this.canvasContext;

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.fillStyle = "black";
    canvasContext.strokeStyle = "black";
    canvasContext.setLineDash([5, 5]);
    // radar rings
    for (let i = 1; i <= this.distanceSteps; ++i) {
      canvasContext.beginPath();
      canvasContext.arc(
        this.originX,
        this.originY,
        i * this.dStepPix,
        0,
        2 * Math.PI
      );
      canvasContext.stroke();
    }

    // compass lines
    // east-west
    canvasContext.beginPath();
    this.drawLine(
      this.originX - this.maxRadiusPix,
      this.originY,
      2 * this.maxRadiusPix,
      0
    );
    // north-south
    this.drawLine(
      this.originX,
      this.originY - this.maxRadiusPix,
      0,
      2 * this.maxRadiusPix
    );
    // diagonals
    var rad45 = (45 / 180) * Math.PI;
    var diagX = Math.sin(rad45) * this.maxRadiusPix;
    var diagY = Math.cos(rad45) * this.maxRadiusPix;
    this.drawLine(
      this.originX - diagX,
      this.originY - diagY,
      2 * diagX,
      2 * diagY
    );
    this.drawLine(
      this.originX + diagX,
      this.originY - diagY,
      -2 * diagX,
      2 * diagY
    );
    canvasContext.stroke();

    // scale lines
    canvasContext.setLineDash([2, 5]);
    canvasContext.beginPath();
    this.drawLine(
      this.originX,
      this.originY - this.dStepPix,
      this.dStepPix + this.maxRadiusPix,
      0
    );
    this.drawLine(
      this.originX + this.maxRadiusPix,
      this.originY,
      this.dStepPix,
      0
    );
    this.drawLine(
      this.originX,
      this.originY - 4 * this.dStepPix,
      this.dStepPix + this.maxRadiusPix,
      0
    );
    this.drawLine(
      this.originX,
      this.originY - 7 * this.dStepPix,
      this.dStepPix + this.maxRadiusPix,
      0
    );
    canvasContext.stroke();

    canvasContext.font = '16px "Helvetica", sans-serif';
    canvasContext.textBaseline = "middle";
    canvasContext.fillStyle = "black";
    var wordX = this.originX + this.maxRadiusPix + this.dStepPix + 5;
    canvasContext.fillText(
      "Inside the head",
      wordX,
      this.originY - this.dStepPix / 2
    );
    canvasContext.fillText(
      "Nearer than reference",
      wordX,
      this.originY - this.dStepPix * 2.5
    );
    canvasContext.fillText(
      "Same distance as reference",
      wordX,
      this.originY - this.dStepPix * 4
    );
    canvasContext.fillText(
      "Further than reference",
      wordX,
      this.originY - this.dStepPix * 5.5
    );

    var arrowX = this.originX + this.maxRadiusPix + this.dStepPix / 2;
    canvasContext.setLineDash([]);
    canvasContext.beginPath();
    this.drawArrow(
      arrowX,
      this.originY - this.dStepPix * 3.5,
      0,
      2 * this.dStepPix
    );
    this.drawArrow(
      arrowX,
      this.originY - this.dStepPix * 4.5,
      0,
      -2 * this.dStepPix
    );
    canvasContext.stroke();

    // listener
    if (this.listenerImg !== null) {
      var imW = this.listenerImg.width;
      canvasContext.globalCompositeOperation = "destination-over";
      canvasContext.globalAlpha = 0.85;
      canvasContext.drawImage(
        this.listenerImg,
        this.originX - imW / 2,
        this.originY - imW / 2
      );
      canvasContext.globalAlpha = 1.0;
      canvasContext.globalCompositeOperation = "source-over";
    }

    // sources
    var refBlue = "rgba(0,0,150,0.75)";
    var stimGreen = "rgba(0,190,0,0.75)";
    var sourceBlobSize = 10;
    this.drawSource(this.refParams, refBlue, sourceBlobSize);
    this.drawSource(this.sourceParams, stimGreen, sourceBlobSize);
  }
  loadListenerImage() {
    var img = new Image();
    img.src = this.listenerImgPath;
    img.onload = function () {
      this.radar.listenerImg = img;
    }.bind({
      radar: this,
    });
  }
  drawArrow(startX, startY, stepX, stepY) {
    if (this.canvasContext === null) return;
    var headlen = 10; // length of head in pixels
    var endX = startX + stepX;
    var endY = startY + stepY;
    var angle = Math.atan2(stepY, stepX);
    this.canvasContext.moveTo(startX, startY);
    this.canvasContext.lineTo(endX, endY);
    this.canvasContext.lineTo(
      endX - headlen * Math.cos(angle - Math.PI / 6),
      endY - headlen * Math.sin(angle - Math.PI / 6)
    );
    this.canvasContext.moveTo(endX, endY);
    this.canvasContext.lineTo(
      endX - headlen * Math.cos(angle + Math.PI / 6),
      endY - headlen * Math.sin(angle + Math.PI / 6)
    );
  }
  drawSource(sourceParams, colour, size) {
    if (this.canvasContext === null) return;
    var azimuth = sourceParams["azimuth"];
    var distance = sourceParams["distance"];
    var width = sourceParams["width"];
    if (azimuth === null || distance === null) return;
    this.canvasContext.fillStyle = colour;
    this.canvasContext.beginPath();
    var azRadians = (azimuth * Math.PI) / 180;
    var radPix = distance * this.dStepPix;
    // calc position in
    var x = Math.sin(azRadians) * radPix;
    var y = Math.cos(azRadians) * radPix;
    this.canvasContext.arc(
      this.originX - x,
      this.originY - y,
      size,
      0,
      2 * Math.PI
    );
    this.canvasContext.fill();
    // then draw distance circle
    var distCircX = this.originX + this.maxRadiusPix + this.dStepPix * 0.5;
    var distCircY = this.originY - this.dStepPix * distance;
    this.canvasContext.strokeStyle = colour;
    this.canvasContext.beginPath();
    this.canvasContext.arc(distCircX, distCircY, size, 0, 2 * Math.PI);
    this.canvasContext.stroke();
    // source width
    if (width) {
      var arcAz = -(azRadians + Math.PI * 0.5);
      var halfArc = (width * 0.5 * Math.PI) / 180;
      this.canvasContext.lineWidth = 7;
      this.canvasContext.beginPath();
      this.canvasContext.arc(
        this.originX,
        this.originY,
        radPix,
        arcAz - halfArc,
        arcAz + halfArc
      );
      this.canvasContext.stroke();
      this.canvasContext.lineWidth = 1;
    }
  }
  handleMouse(event) {
    this.calcMousePos(event);
    var storeResult = false;
    if (this.mouse.down && this.mouse.button == 1) {
      // if left button down
      this.calcSourcePosition();
      storeResult = true;
    }
    if (this.mouse.down && this.mouse.button == 3) {
      // if right button down
      if (
        this.sourceParams["azimuth"] === null ||
        this.sourceParams["distance"] === null
      )
        this.calcSourcePosition();
      this.calcSourceWidth();
      storeResult = true;
    }
    if (storeResult === true && this.resultCallback !== undefined) {
      this.resultCallback(this.sourceParams);
    }
  }
  calcSourcePosition() {
    var azimuth = (Math.atan2(-this.mouse.x, -this.mouse.y) * 180) / Math.PI;
    // limit to range 0-360 and integer
    azimuth = Math.round(azimuth);
    azimuth = (azimuth + 360) % 360;

    var radius = Math.sqrt(
      this.mouse.x * this.mouse.x + this.mouse.y * this.mouse.y
    ); // currently in pixels
    // limit to range 0 to radiusSteps and set limited resolution
    var distance =
      Math.round(
        (radius * this.distanceSteps) /
          this.maxRadiusPix /
          this.distanceResolution
      ) * this.distanceResolution;
    distance = Math.min(distance, this.distanceSteps);
    this.sourceParams["azimuth"] = azimuth;
    this.sourceParams["distance"] = distance;
  }
  calcSourceWidth() {
    if (this.sourceParams["azimuth"] === null) return;
    var currentWidth = this.sourceParams["width"];
    var widthDiff = this.mouse.py - this.mouse.y;
    var newWidth = currentWidth + widthDiff;
    newWidth = Math.max(newWidth, 0);
    newWidth = Math.min(newWidth, 360);
    this.sourceParams["width"] = newWidth;
  }
}