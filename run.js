var NOISE_THRESHOLD = 25;
var LOOKBACK_DISTANCE = 3;

var running_text_list = [];
var saved_text_list = [];

// Select the node that will be observed for mutations
const targetNode = document;

// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = function (mutationsList, observer) {
  // Use traditional 'for loops' for IE 11
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      if (mutation.addedNodes.length > 0) {
        if (mutation.addedNodes[0].tagName == 'MSREADOUTSPAN') {
          var el = mutation.addedNodes[0];
          if (el.classList.contains('msreadout-line-highlight')) {
            if (!running_text_list.includes(el.textContent)) {
              running_text_list.push(el.textContent);
              if (running_text_list.length > LOOKBACK_DISTANCE) {
                running_text_list.shift();
              }
            }
          }
        }
      }
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);
// Start observing the target node for configured mutations
observer.observe(targetNode, config);

// Running microphone check
// https://stackoverflow.com/questions/33322681/checking-microphone-volume-in-javascript
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(function (stream) {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);
    javascriptNode.onaudioprocess = function () {
      var array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      var values = 0;

      var length = array.length;
      for (var i = 0; i < length; i++) {
        values += (array[i]);
      }

      var average = values / length;
      // colorPids(average);
      if (Math.round(average) > NOISE_THRESHOLD) {
        var el = document.querySelector('.msreadout-line-highlight');
        if (!el.parentElement.classList.contains('anson-highlight')) {
          var wrapper = document.createElement('anson');
          wrapper.style.background = "#adffa1";
          wrapper.classList.add('anson-highlight');
          el.parentNode.insertBefore(wrapper, el);
          el.parentNode.removeChild(el);
          wrapper.appendChild(el);
          if (!saved_text_list.includes([...running_text_list])) {
            saved_text_list.push([...running_text_list]);
            // Remove duplicates that often happen here
            saved_text_list = [...saved_text_list.filter((t = {}, a => !(t[a] = a in t)))];
          }
        }
      }

    }
  })
  .catch(function (err) {
  });
