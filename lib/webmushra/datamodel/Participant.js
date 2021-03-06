/*************************************************************************
         (C) Copyright AudioLabs 2017 

This source code is protected by copyright law and international treaties. This source code is made available to You subject to the terms and conditions of the Software License for the webMUSHRA.js Software. Said terms and conditions have been made available to You prior to Your download of this source code. By downloading this source code You agree to be bound by the above mentionend terms and conditions, which can also be found here: https://www.audiolabs-erlangen.de/resources/webMUSHRA. Any unauthorised use of this source code may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under law. 

**************************************************************************/

/**
 * Represents a participant.
 * @constructor
 * @property {String[]} name - Variable names of the configured questions of the finish page.
 * @property {String[]} response  - Responses of the configured questions of the finish page. "response[i]" is the response to the question with variable name "name[i]". 
 */
function Participant() {
  this.consent = {};
  this.questionnaire = {};
}
