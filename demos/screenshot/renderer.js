// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { desktopCapturer } = require('electron');

/**
 * Create a screenshot of the entire screen using the desktopCapturer module of Electron.
 *
 * @param callback {Function} callback receives as first parameter the base64 string of the image
 * @param imageFormat {String} Format of the image to generate ('image/jpeg' or 'image/png')
 **/
function fullscreenScreenshot(callback, imageFormat) {
  var _this = this;
  imageFormat = imageFormat || 'image/jpeg';

  this.handleStream = (stream) => {
    // Create hidden video tag
    var video = document.createElement('video');
    video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';



    // Event connected to stream
    video.onloadedmetadata = function () {
      // Set video ORIGINAL height (screenshot)
      video.style.height = this.videoHeight + 'px'; // videoHeight
      video.style.width = this.videoWidth + 'px'; // videoWidth

      video.play();

      // Create canvas
      var canvas = document.createElement('canvas');
      canvas.width = this.videoWidth;
      canvas.height = this.videoHeight;
      var ctx = canvas.getContext('2d');
      // Draw video on canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (callback) {
        // Save screenshot to base64
        callback(canvas.toDataURL(imageFormat));
      } else {
        console.log('Need callback!');
      }

      // Remove hidden video tag
      video.remove();
      try {
        // Destroy connect to stream
        stream.getTracks()[0].stop();
      } catch (e) { }
    }

    video.srcObject = stream;
    document.body.appendChild(video);
  };

  this.handleError = function (e) {
    console.log(e);
  };

  desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    console.log(sources);

    for (const source of sources) {
      // Filter: main screen
      if ((source.name === "Entire screen") || (source.name === "Screen 1") || (source.name === "Screen 2")) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
                minWidth: 1280,
                maxWidth: 4000,
                minHeight: 720,
                maxHeight: 4000
              }
            }
          });

          handleStream(stream);
        } catch (e) {
          handleError(e);
        }
      }
    }
  });
}

/**
* Create a screenshot of your electron app. You can modify which process to render in the conditional line #61.
* In this case, filtered using the title of the document.
*
* @param callback {Function} callback receives as first parameter the base64 string of the image
* @param imageFormat {String} Format of the image to generate ('image/jpeg' or 'image/png')
**/
function appScreenshot(callback, imageFormat) {
  imageFormat = imageFormat || 'image/jpeg';

  let handleStream = (stream) => {
    // Create hidden video tag
    var video = document.createElement('video');
    video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
    // Event connected to stream
    video.onloadedmetadata = function () {
      // Set video ORIGINAL height (screenshot)
      video.style.height = this.videoHeight + 'px'; // videoHeight
      video.style.width = this.videoWidth + 'px'; // videoWidth

      video.play();

      // Create canvas
      var canvas = document.createElement('canvas');
      canvas.width = this.videoWidth;
      canvas.height = this.videoHeight;
      var ctx = canvas.getContext('2d');
      // Draw video on canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (callback) {
        // Save screenshot to jpg - base64
        callback(canvas.toDataURL(imageFormat));
      } else {
        console.log('Need callback!');
      }

      // Remove hidden video tag
      video.remove();

      try {
        // Destroy connect to stream
        stream.getTracks()[0].stop();
      } catch (e) { }
    }

    video.srcObject = stream;
    document.body.appendChild(video);
  };

  let handleError = function (e) {
    console.log(e);
  };

  desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    console.log(sources);

    for (const source of sources) {
      // Filter: main screen
      if (source.name === document.title) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
                minWidth: 1280,
                maxWidth: 4000,
                minHeight: 720,
                maxHeight: 4000
              }
            }
          });

          handleStream(stream);
        } catch (e) {
          handleError(e);
        }
      }
    }
  });
}

const img = document.getElementsByClassName('res')[0];
document.getElementById('screenshot').onclick = () => {
  appScreenshot((res) => {
    console.log(img)
    img.setAttribute('src', 'res')
  })
}