<?php

/*************************************************************************
         (C) Copyright AudioLabs 2017 

This source code is protected by copyright law and international treaties. This source code is made available to You subject to the terms and conditions of the Software License for the webMUSHRA.js Software. Said terms and conditions have been made available to You prior to Your download of this source code. By downloading this source code You agree to be bound by the above mentionend terms and conditions, which can also be found here: https://www.audiolabs-erlangen.de/resources/webMUSHRA. Any unauthorised use of this source code may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under law. 

 **************************************************************************/



function sanitize($string = '', $is_filename = FALSE)
{
	// Replace all weird characters with dashes
	$string = preg_replace('/[^\w\-' . ($is_filename ? '~_\.' : '') . ']+/u', '-', $string);
	// Only allow one dash separator at a time (and make string lowercase)
	return strtolower(preg_replace('/--+/u', '-', $string));
}

$sessionParam = null;
if (get_magic_quotes_gpc()) {
	$sessionParam = stripslashes($_POST['sessionJSON']);
} else {
	$sessionParam = $_POST['sessionJSON'];
}
$session = json_decode($sessionParam);

$filepathPrefix = "../results/" . sanitize($string = $session->testId, $is_filename = FALSE) . "/";
$filepathPostfix = ".csv";

$participantID = uniqid();

if (!is_dir($filepathPrefix)) {
	mkdir($filepathPrefix);
}

// store participant details in separate table
$participantCsvData = array();
// headings from participant questionnaire and consent data
$input = array("session_test_id", "participant_id");
foreach ($session->participant->questionnaire as $question => $answer) {
	array_push($input, $question);
}
foreach ($session->participant->consent as $decl => $resp) {
	array_push($input, $decl);
}
array_push($participantCsvData, $input);
// push participant data
$partData = array($session->testId, $participantID);
foreach ($session->participant->questionnaire as $question => $answer) {
	array_push($partData, $answer);
}
foreach ($session->participant->consent as $decl => $resp) {
	array_push($partData, $resp);
}
array_push($participantCsvData, $partData);
// write it
$filename = $filepathPrefix . "participants" . $filepathPostfix;
$isFile = is_file($filename);
$fp = fopen($filename, 'a');
foreach ($participantCsvData as $row) {
	if ($isFile) {
		$isFile = false;
	} else {
		fputcsv($fp, $row);
	}
}
fclose($fp);

// mushra
$write_mushra = false;
$mushraCsvData = array();

$input = array("session_test_id", "participant_id");
array_push($input, "trial_id", "rating_stimulus", "rating_score", "rating_time", "rating_comment");
array_push($mushraCsvData, $input);

foreach ($session->trials as $trial) {
	if ($trial->type == "mushra") {
		$write_mushra = true;

		foreach ($trial->responses as $response) {
			$results = array($session->testId, $participantID);
			array_push($results, $trial->id, $response->stimulus, $response->score, $response->time, $response->comment);
			array_push($mushraCsvData, $results);
		}
	}
}

if ($write_mushra) {
	$filename = $filepathPrefix . "mushra" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($mushraCsvData as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}

//bbcspatial
$write_bbc_spatial = false;
$bbc_spatialCsvData = array();

$input = array("session_test_id", "participant_id");
array_push($input, "trial_id", "condition", "response_azimuth", "response_distance", "response_width", "response_height", "response_time");
array_push($bbc_spatialCsvData, $input);

foreach ($session->trials as $trial) {
	if ($trial->type == "bbc_spatial") {
		foreach ($trial->responses as $response) {
			$write_bbc_spatial = true;
			$results = array($session->testId, $participantID);
			array_push($results, $trial->id, $response->condition, $response->azimuth, $response->distance, $response->width, $response->height, $response->time);
			array_push($bbc_spatialCsvData, $results);
		}
	}
}

if ($write_bbc_spatial) {
	$filename = $filepathPrefix . "bbc_spatial" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($bbc_spatialCsvData as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}

// paired comparison

$write_pc = false;
$pcCsvData = array();
// array_push($pcCsvData, array("session_test_id", "participant_email", "participant_age", "participant_gender", "trial_id", "choice_reference", "choice_non_reference", "choice_answer", "choice_time", "choice_comment"));

$input = array("session_test_id", "participant_id");
array_push($input, "trial_id", "choice_reference", "choice_non_reference", "choice_answer", "choice_time", "choice_comment");
array_push($pcCsvData, $input);



foreach ($session->trials as $trial) {
	if ($trial->type == "paired_comparison") {
		foreach ($trial->responses as $response) {
			$write_pc = true;
			$results = array($session->testId, $participantID);
			array_push($results, $trial->id, $response->reference, $response->nonReference, $response->answer, $response->time, $response->comment);
			array_push($pcCsvData, $results);
		}
	}
}

if ($write_pc) {
	$filename = $filepathPrefix . "paired_comparison" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($pcCsvData as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}

// bs1116

$write_bs1116 = false;
$bs1116CsvData = array();

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "rating_reference", "rating_non_reference", "rating_reference_score", "rating_non_reference_score", "rating_time", "choice_comment");
array_push($bs1116CsvData, $input);

// array_push($bs1116CsvData, array("session_test_id", "participant_email", "participant_age", "participant_gender", "trial_id", "rating_reference", "rating_non_reference", "rating_reference_score", "rating_non_reference_score", "rating_time", "choice_comment"));
foreach ($session->trials as $trial) {
	if ($trial->type == "bs1116") {
		foreach ($trial->responses as $response) {
			$write_bs1116 = true;

			$results = array($session->testId, $participantID);
			array_push($results, $trial->id, $response->reference, $response->nonReference, $response->referenceScore, $response->nonReferenceScore, $response->time, $response->comment);

			array_push($bs1116CsvData, $results);

			// array_push($bs1116CsvData, array($session->testId, $session->participant->email, $session->participant->age, $session->participant->gender, $trial->id, $response->reference, $response->nonReference, $response->referenceScore, $response->nonReferenceScore, $response->time, $response->comment));    
		}
	}
}

if ($write_bs1116) {
	$filename = $filepathPrefix . "bs1116" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($bs1116CsvData as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}

//lms

$write_lms = false;
$lmsCSVdata = array();
// array_push($lmsCSVdata, array("session_test_id", "participant_email", "participant_age", "participant_gender", "trial_id", "stimuli_rating", "stimuli", "rating_time"));

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "stimuli_rating", "stimuli", "rating_time");
array_push($lmsCSVdata, $input);


foreach ($session->trials as $trial) {
	if ($trial->type == "likert_multi_stimulus") {
		foreach ($trial->responses as $response) {
			$write_lms = true;
			$results = array($session->testId, $participantID);
			array_push($results,  $trial->id, " $response->stimulusRating ", $response->stimulus, $response->time);
			array_push($lmsCSVdata, $results);
		}
	}
}

if ($write_lms) {
	$filename = $filepathPrefix . "lms" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($lmsCSVdata as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}


//lss


$write_lss = false;
$lssCSVdata = array();
// array_push($lssCSVdata, array("session_test_id", "participant_email", "participant_age", "participant_gender", "trial_id", "stimuli_rating", "stimuli", "rating_time"));

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "stimuli_rating", "stimuli", "rating_time");
array_push($lssCSVdata, $input);

foreach ($session->trials as $trial) {

	if ($trial->type == "likert_single_stimulus") {
		foreach ($trial->responses as $response) {
			$write_lss = true;
			$results = array($session->testId, $participantID);
			array_push($results,  $trial->id, " $response->stimulusRating ", $response->stimulus, $response->time);
			array_push($lssCSVdata, $results);
		}
	}
}

if ($write_lss) {
	$filename = $filepathPrefix . "lss" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($lssCSVdata as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}

// likert comparison
$write_lc = false;
$lcCSVdata = array();

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "response", "condition", "rating_time");
array_push($lcCSVdata, $input);

foreach ($session->trials as $trial) {

	if ($trial->type == "likert_comparison") {
		foreach ($trial->responses as $response) {
			$write_lc = true;

			$results = array($session->testId, $participantID);
			array_push($results,  $trial->id, " $response->stimulusRating ", $response->stimulus, $response->time);
			array_push($lcCSVdata, $results);
		}
	}
}

if ($write_lc) {
	$filename = $filepathPrefix . "likert_comparison" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($lcCSVdata as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}

//spatial
//localization
$write_spatial_localization = false;
$spatial_localizationData = array();

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "name", "stimulus", "position_x", "position_y", "position_z");
array_push($spatial_localizationData, $input);


// 
foreach ($session->trials as $trial) {

	if ($trial->type == "localization") {

		foreach ($trial->responses as $response) {
			$write_spatial_localization = true;

			$results = array($session->testId, $participantID);
			array_push($results, $trial->id, $response->name, $response->stimulus, $response->position[0], $response->position[1], $response->position[2]);


			array_push($spatial_localizationData, $results);
		}
	}
}

if ($write_spatial_localization) {

	$filename = $filepathPrefix . "spatial_localization" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($spatial_localizationData as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}

//asw
$write_spatial_asw = false;
$spatial_aswData = array();

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "name", "stimulus", "position_outerRight_x", "position_outerRight_y", "position_outerRight_z", "position_innerRight_x", "position_innerRight_y", "position_innerRight_z", "position_innerLeft_x", "position_innerLeft_y", "position_innerLeft_z", "position_outerLeft_x", "position_outerLeft_y", "position_outerLeft_z");
array_push($spatial_aswData, $input);


// 
foreach ($session->trials as $trial) {

	if ($trial->type == "asw") {

		foreach ($trial->responses as $response) {
			$write_spatial_asw = true;

			$results = array($session->testId, $participantID);
			array_push($results, $trial->id, $response->name, $response->stimulus, $response->position_outerRight[0], $response->position_outerRight[1], $response->position_outerRight[2], $response->position_innerRight[0], $response->position_innerRight[1], $response->position_innerRight[2], $response->position_innerLeft[0], $response->position_innerLeft[1], $response->position_innerLeft[2], $response->position_outerLeft[0], $response->position_outerLeft[1], $response->position_outerLeft[2]);

			array_push($spatial_aswData, $results);
		}
	}
}

if ($write_spatial_asw) {

	$filename = $filepathPrefix . "spatial_asw" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($spatial_aswData as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}


//hwd
$write_spatial_hwd = false;
$spatial_hwdData = array();

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "name", "stimulus", "position_outerRight_x", "position_outerRight_y", "position_outerRight_z", "position_innerRight_x", "position_innerRight_y", "position_innerRight_z", "position_innerLeft_x", "position_innerLeft_y", "position_innerLeft_z", "position_outerLeft_x", "position_outerLeft_y", "position_outerLeft_z", "height", "depth");
array_push($spatial_hwdData, $input);


// 
foreach ($session->trials as $trial) {

	if ($trial->type == "hwd") {

		foreach ($trial->responses as $response) {
			$write_spatial_hwd = true;

			$results = array($session->testId, $participantID);
			array_push($results, $trial->id, $response->name, $response->stimulus, $response->position_outerRight[0], $response->position_outerRight[1], $response->position_outerRight[2], $response->position_innerRight[0], $response->position_innerRight[1], $response->position_innerRight[2], $response->position_innerLeft[0], $response->position_innerLeft[1], $response->position_innerLeft[2], $response->position_outerLeft[0], $response->position_outerLeft[1], $response->position_outerLeft[2], $response->height, $response->depth);

			array_push($spatial_hwdData, $results);
		}
	}
}

if ($write_spatial_hwd) {

	$filename = $filepathPrefix . "spatial_hwd" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($spatial_hwdData as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}

//lev
$write_spatial_lev = false;
$spatial_levData = array();

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "name", "stimulus", "position_center_x", "position_center_y", "position_center_z", "position_height_x", "position_height_y", "position_height_z", "position_width1_x", "position_width1_y", "position_width1_z", "position_width2_x", "position_width2_y", "position_width2_z");
array_push($spatial_levData, $input);


// 
foreach ($session->trials as $trial) {

	if ($trial->type == "lev") {

		foreach ($trial->responses as $response) {
			$write_spatial_lev = true;

			$results = array($session->testId, $participantID);
			array_push($results, $trial->id, $response->name, $response->stimulus, $response->position_center[0], $response->position_center[1], $response->position_center[2], $response->position_height[0], $response->position_height[1], $response->position_height[2], $response->position_width1[0], $response->position_width1[1], $response->position_width1[2], $response->position_width2[0], $response->position_width2[1], $response->position_width2[2]);

			array_push($spatial_levData, $results);
		}
	}
}

if ($write_spatial_lev) {
	$filename = $filepathPrefix . "spatial_lev" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($spatial_levData as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}

//OLE_multi

$write_OLE_multi = false;
$OLE_multiCSVdata = array();
// array_push($lmsCSVdata, array("session_test_id", "participant_email", "participant_age", "participant_gender", "trial_id", "stimuli_rating", "stimuli", "rating_time"));

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "stimuli_rating", "stimuli", "rating_time");
array_push($OLE_multiCSVdata, $input);


foreach ($session->trials as $trial) {
	if ($trial->type == "OLE_multi") {
		foreach ($trial->responses as $response) {
			$write_OLE_multi = true;
			$results = array($session->testId, $participantID);
			array_push($results,  $trial->id, " $response->stimulusRating ", $response->stimulus, $response->time);
			array_push($OLE_multiCSVdata, $results);
		}
	}
}

if ($write_OLE_multi) {
	$filename = $filepathPrefix . "OLE_multi" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($OLE_multiCSVdata as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}


//OLE_CATA

$write_OLE_CATA = false;
$OLE_CATACSVdata = array();
// array_push($lssCSVdata, array("session_test_id", "participant_email", "participant_age", "participant_gender", "trial_id", "stimuli_rating", "stimuli", "rating_time"));

$input = array("session_test_id", "participant_id");
array_push($input,  "trial_id", "stimuli_rating", "stimuli", "rating_time", "comment");
foreach ($session->trials as $trial) {

	if ($trial->type == "OLE_CATA") {
		foreach ($trial->responses as $response) {
			foreach ($response->attributes as $attrname => $value) { //looping through all attributes as defined in .yaml and pushing the attribute name to the array of csv file headders 
				array_push($input, $attrname);
			}
			continue;
		}
	}
}

array_push($OLE_CATACSVdata, $input);

foreach ($session->trials as $trial) {

	if ($trial->type == "OLE_CATA") {
		foreach ($trial->responses as $response) {
			$write_OLE_CATA = true;
			$results = array($session->testId, $participantID);
			array_push($results,  $trial->id, " $response->stimulusRating ", $response->stimulus, $response->time, $response->comment);
			foreach ($response->attributes as $attrname => $value) { //not push the value of each attribute
				array_push($results, (int)$value);
			}
			array_push($OLE_CATACSVdata, $results);
		}
	}
}

if ($write_OLE_CATA) {
	$filename = $filepathPrefix . "OLE_CATA" . $filepathPostfix;
	$isFile = is_file($filename);
	$fp = fopen($filename, 'a');
	foreach ($OLE_CATACSVdata as $row) {
		if ($isFile) {
			$isFile = false;
		} else {
			fputcsv($fp, $row);
		}
	}
	fclose($fp);
}