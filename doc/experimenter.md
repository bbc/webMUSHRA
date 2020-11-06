# Documentation for Experimenters

## Configuring an Experiment

### General

An experiment is configured by config files written in YAML. 
The config files must be placed in the subfolder "/configs". 
When the webMUSHRA page (e.g. http://localhost/webMUSHRA) is accessed, default.yaml is loaded. 
In case another config file should be loaded, a parameter "config" must be added to the url. 
E.g. http://localhost/webMUSHRA?config=example.yaml loads the config stored in "/configs/example.yaml". 
Filepaths in the config files are always relative to the root folder "/".

### Configuration

At the top level of the config file, general options of the experiment are stored.

* **testname** Name of your listening test as it is shown to the participants. 
* **testId** Identifier of your listening test which is also stored into the result files.
* **bufferSize** The buffer size that is used for the audio processing. The smaller the buffer size, the smaller is the latency. However, small buffer sizes increase the computational load which can lead to audible artifacts. The buffer size must be one of the following values: 256, 512, 1024, 2048, 4096, 8192 or 16384.
* **stopOnErrors** If set to true, the experiment will stop on any errors (e.g. if samples sizes do not match). Please watch the console log especially when unexpected behaviour occurs.
* **showButtonPreviousPage** If set to true, the participant can navigate to previous pages.
* **remoteService** A service/URL to which the results (JSON object) are sent. A PHP web service ("service/write.php") is available which writes the results into the "/results" folder. 
* **pages** An array of experiment pages, random keyword or an pages array ([Array]). 

#### `random`

If the string "random" is the first element of an pages array, the content of the array is randomized (e.g. used for randomized experiments).

#### `generic` page

A generic page contains any content in HTML (e.g. useful for showing the instructions to the participants).

* **type** must be generic.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **content** Content (HTML) of the page.


#### `volume` page

The volume page can be used to set the volume used in the experiment.

* **type** must be volume.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **content** Content (HTML) of the page.
* **stimulus** Filepath to the stimulus that is used for setting the volume.
* **defaultVolume** Default volume (must be between 0.0 and 1.0).

#### `mushra` page

A mushra page shows a trial according to ITU-R Recommendation BS.1534.

* **type** must be mushra.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **content** Content (HTML) of the page. The content is shown on the upper part of the page.
* **showWaveform** If set to true, the waveform of the reference is shown. 
* **enableLooping** If set to true, the participant can set loops.
* **strict** If set to false, webMUSHRA will not check for a recommendation-compliant listening test.
* **reference** Filepath to the reference stimulus (WAV file).
* **createAnchor35** If set to true, the 3.5 kHZ anchor is automatically generated (Increase loading time of the experiment).
* **createAnchor70** If set to true, the 7 kHZ anchor is automatically generated (Increase loading time of the experiment).
* **randomize** If set to true, the conditions are randomized.
* **showConditionNames** If set to true, the names of the conditions are shown.
* **stimuli** A map of stimuli representing three conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file).  


#### `bs1116` page          

A bs1116 page shows a trial according to ITU-R Recommendation BS.1116.

* **type** must be bs1116.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **content** Content (HTML) of the page. The content is shown on the upper part of the page.
* **showWaveform** If set to true, the waveform of the reference is shown. 
* **enableLooping** If set to true, the participant can set loops.
* **reference** Filepath to the reference stimulus (WAV file).
* **createAnchor35** If set to true, the 3.5 kHZ anchor is automatically generated (Increase loading time of the experiment).
* **createAnchor70** If set to true, the 7 kHZ anchor is automatically generated (Increase loading time of the experiment).
* **stimuli** A map of stimuli representing three conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file).  

#### `paired_comparison` page

A paired comparison page creates a forced or unforced paired comparison (AB/ABX/ABN tests).

* **type** must be paired_comparison.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **unforced** If this option is not set, a forced paired comparison is created. If the option is set to some string, the string is used as a label of the "unforced alternative" 
* **content** Content (HTML) of the page. The content is shown on the upper part of the page.
* **showWaveform** If set to true, the waveform of the reference is shown. 
* **enableLooping** If set to true, the participant can set loops.
* **reference** Filepath to the reference stimulus (WAV file).
* **stimuli** A map of stimuli representing three conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file).  

#### `likert_multi_stimulus` page

A likert multi stimulus page creates a multi-stimulus likert rating.

* **type** must be likert_multi_stimulus.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **mustRate** If set to true, the participant must rate all stimuli.
* **mustPlayback** If set to true, the participant must fully play back all stimuli. 
* **reference** Filepath to the reference stimulus (WAV file).
* **stimuli** A map of stimuli representing three conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file).
* **response** A array which represents the Likert scale, where each array element represents a 'likert point'. The array elements are maps with the keys 'value' (value shown in results), 'label' (label of the likert point), 'img' (path to an image of the likert point), 'imgSelected' (image shown if likert point is selected), and 'imgHigherResponseSelected' (image shown when a 'higher' likert point is selected).  

#### `likert_single_stimulus` page

A likert single stimulus page creates a single-stimulus likert rating.

* **type** must be likert_single_stimulus.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **mustRate** If set to true, the participant must rate all stimuli. 
* **reference** Filepath to the reference stimulus (WAV file).
* **stimuli** A map of stimuli representing three conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file).
* **response** An array which represents the Likert scale, where each array element represents a 'likert point'. The array elements are maps with the keys 'value' (value shown in results), 'label' (label of the likert point), 'img' (path to an image of the likert point), 'imgSelected' (image shown if likert point is selected), and 'imgHigherResponseSelected' (image shown when a 'higher' likert point is selected).  

#### `likert_comparison` page

A paired comparison page with a single Likert scale for rating the differences between a test condition and a reference condition.

* **type** must be likert_comparison.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **content** Content (HTML) of the page. The content is shown on the upper part of the page.
* **showWaveform** If set to true, the waveform of the reference is shown. 
* **enableLooping** If set to true, the participant can set loops.
* **showConditionNames** If set to true, the names of the conditions are shown.
* **mustRate** If set to true, the participant must give a rating. 
* **reference** Filepath to the reference stimulus (WAV file).
* **stimuli** A map of stimuli representing the test conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file). For each stimulus in the map, a separate page is created from the single config, each with a paired comparison to the reference.
* **response** An array which represents the Likert scale, where each array element represents a 'likert point'. The array elements are maps with the keys 'value' (value shown in results), 'label' (label of the likert point), 'img' (path to an image of the likert point), 'imgSelected' (image shown if likert point is selected), and 'imgHigherResponseSelected' (image shown when a 'higher' likert point is selected).

#### `bbc_spatial` page

A page for rating spatial characteristics of a test condition, with comparison to a reference condition. Responses are collected for azimuth, distance, width, and height.

* **type** must be bbc_spatial.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **content** Content (HTML) of the page. The content is shown on the upper part of the page.
* **showWaveform** If set to true, the waveform of the reference is shown. 
* **enableLooping** If set to true, the participant can set loops.
* **showConditionNames** If set to true, the names of the conditions are shown.
* **reference** Filepath to the reference stimulus (WAV file).
* **stimuli** A map of stimuli representing the test conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file). For each stimulus in the map, a separate page is created from the single config, each with a comparison to the reference.
* **referenceParams** A map of the parameters of the reference. The keys are 'azimuth' and 'elevation' and the values should be integers.
* **mustRate** If set to true, the participant must give a rating for all parameters before proceeding. 

#### `consent_form` page

A page for collecting informed consent from participants. The page should give the participant instructions for how to participate in the experiment, inform them of data privacy considerations and how their responses will be used. A set of declarations will then be requested from the user using a form with check-boxes.

* **type** must be consent_form.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **projectName** The name of the project that this experiment relates to. This a reference for participants should they wish to contact the experimenter about the experiment after participation.
* **intro** Introductory content for the consent page (HTML). This should explain the purpose of this page and what the participant needs to do, i.e. read it and decide if they give their consent.
* **instructions** The content for the instructions section of the page (HTML). This should explain to the participant how to perform the experiment.
* **dataPrivacyNotice** The content for the data privacy notice (HTML). This section explains what data will be collected and why. It should also explain how the data will be processed and that they can withdraw their data (if that is possible).
* **responsesNotice** The content for the section that explains how the participant's respones will be used (HTML).
* **declaration** A list of declarations that are requested of the participant in giving their consent. Each item should contain a map with the keys 'name' and 'text', where 'name' is a short identifier for the declaration that is stored in the participant information table on the server, and 'text' is the text that is displayed to the participant alongside a check box.

#### `multi_stimulus_familiarisation` page

A page for familiarising the participant with a set of related stimuli.

* **type** must be multi_stimulus_familiarisation.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **content** Content (HTML) of the page. The content is shown on the upper part of the page.
* **showWaveform** If set to true, the waveform of the reference is shown. 
* **enableLooping** If set to true, the participant can set loops.
* **showConditionNames** If set to true, the names of the conditions are shown.
* **randomize** If set to true, the conditions are randomized.
* **createHiddenReference** If set to true, a hidden reference condition is added to the list of conditions.
* **reference** Filepath to the reference stimulus (WAV file).
* **stimuli** A map of stimuli representing the conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file).

#### `multi_stimulus_likert_familiarisation` page

A page for familiarising the participant with a set of related stimuli, showing a Likert scale underneath.

* **type** must be multi_stimulus_likert_familiarisation.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **content** Content (HTML) of the page. The content is shown on the upper part of the page.
* **showWaveform** If set to true, the waveform of the reference is shown. 
* **enableLooping** If set to true, the participant can set loops.
* **showConditionNames** If set to true, the names of the conditions are shown.
* **randomize** If set to true, the conditions are randomized.
* **createHiddenReference** If set to true, a hidden reference condition is added to the list of conditions.
* **reference** Filepath to the reference stimulus (WAV file).
* **stimuli** A map of stimuli representing the conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file).
* **response** An array which represents the Likert scale, where each array element represents a 'likert point'. The array elements are maps with the keys 'value' (value shown in results), 'label' (label of the likert point), 'img' (path to an image of the likert point), 'imgSelected' (image shown if likert point is selected), and 'imgHigherResponseSelected' (image shown when a 'higher' likert point is selected).
* **mustRate** If set to true, the participant must use the rating scale before progressing.

#### `multi_stimulus_bbc_spatial_familiarisation` page

A page for familiarising the participant with a set of related stimuli, showing a Likert scale underneath.

* **type** must be multi_stimulus_bbc_spatial_familiarisation.
* **id** Identifier of the page.
* **name** Name of the page (is shown as title)
* **content** Content (HTML) of the page. The content is shown on the upper part of the page.
* **showWaveform** If set to true, the waveform of the reference is shown. 
* **enableLooping** If set to true, the participant can set loops.
* **showConditionNames** If set to true, the names of the conditions are shown.
* **randomize** If set to true, the conditions are randomized.
* **createHiddenReference** If set to true, a hidden reference condition is added to the list of conditions.
* **reference** Filepath to the reference stimulus (WAV file).
* **stimuli** A map of stimuli representing the conditions. The key is the name of the condition. The value is the filepath to the stimulus (WAV file).
* **referenceParams** A map of the parameters of the reference. The keys are 'azimuth' and 'elevation' and the values should be integers.
* **mustRate** If set to true, the participant must use the rating scale before progressing.

#### `finish` page

The finish page must be the last page of the experiment.

* **type** must be finish.
* **name** Name of the page (is shown as title).
* **content** Content (HTML) of the page. The content is shown on the upper part of the page.
* **showResults** The results are shown to the participant.  
* **writeResults** The results are sent to the remote service (which writes the results into a file).


## Results

The results are stored in the folder "/results". 
For each experiment, a subfolder is created having the name of the **testid** option. 
For each type of listening test, a CSV (comma separated values) file is created which contains the results.
The data about the participants are collected in a separate CSV file and a unique identifier is used to relate the results files to the participants.
