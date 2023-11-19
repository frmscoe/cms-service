import { config } from '../config';
import { LoggerService } from '../utils/logger';
import axios from 'axios';

export const sendReportResult = async (request: any) => {
  const toCreateNote = {
    'entity-type': 'document',
    repository: 'default',
    path: `/${config.nuxeoFolderPath}/null`,
    type: 'Note',
    parentRef: `${config.nuxeoFolderId}`,
    isCheckedOut: true,
    properties: {
      'note:note': null,
      'note:mime_type': 'text/html',
    },
    schemas: [],
    name: `Transaction ID: ${request.transaction.EndToEndId}`,
  };

  const host = config.nuxeoHost;
  const createNoteResponse: any = await axios.post(`${host}/v1/path/${config.nuxeoFolderPath}`, toCreateNote, {
    headers: {
      Authorization: config.nuxeoAuth,
    },
  });

  if (createNoteResponse.status !== 201) {
    LoggerService.error(`Error while sending request to Nuxeo with error: ${createNoteResponse.data}`);
    return;
  }

  let html = `
<h4>Report Details</h4>
<table border="1" style="border: 1px solid #000; border-spacing: 0px; width: 900px; margin-bottom: 25px;">
  <tr>
    <td style="font-weight: bold">Evaluation ID</td>
    <td style="font-weight: bold">Transaction ID</td>
    <td style="font-weight: bold">Report Status</td>
    <td style="font-weight: bold">Report Timestamp</td>
  </tr>
  <tr>
    <td>${request.alert.evaluationID}</td>
    <td>${request.transaction.EndToEndId}</td>
    <td>${request.alert.status}</td>
    <td>${request.alert.timestamp}</td>
  </tr>
</table>
<h4>Channel Results</h4>
<table border="1" style="border: 1px solid #000; border-spacing: 0px; width: 900px; margin-bottom: 25px;">
  <tr>
    <td style="font-weight: bold">Channel ID</td>
    <td style="font-weight: bold">CFG</td>
    <td style="font-weight: bold">Result</td>
    <td style="font-weight: bold">Status</td>
  </tr>
  `;

  for (const channel of request.alert.tadpResult.channelResult) {
    html += `
      <tr>
        <td>${channel.id}</td>
        <td>${channel.cfg}</td>
        <td>${channel.result}</td>
        <td>${channel.status}</td>
      </tr>
    `;
  }
  html += `
  </table>
  <h4>Typology Results</h4>
  <table border="1" style="border: 1px solid #000; border-spacing: 0px; width: 900px; margin-bottom: 25px;">
  <tr>
    <td style="font-weight: bold">Typology ID</td>
    <td style="font-weight: bold">CFG</td>
    <td style="font-weight: bold">Result</td>
    <td style="font-weight: bold">Threshold</td>
  </tr>
  `;

  for (const channel of request.alert.tadpResult.channelResult) {
    for (const typology of channel.typologyResult) {
      html += `
      <tr>
        <td>${typology.id}</td>
        <td>${typology.cfg}</td>
        <td>${typology.result}</td>
        <td>${typology.threshold}</td>
      </tr>
    `;
    }
  }
  html += `
  </table>
  <h4>Rule Results</h4>
  <table border="1" style="border: 1px solid #000; border-spacing: 0px; width: 900px; margin-bottom: 25px;">
  <tr>
    <td style="font-weight: bold">Rule ID</td>
    <td style="font-weight: bold">CFG</td>
    <td style="font-weight: bold">Sub Rule Ref</td>
    <td style="font-weight: bold">Result</td>
    <td style="font-weight: bold">Reason</td>
  </tr>
  `;
  for (const channel of request.alert.tadpResult.channelResult) {
    for (const typology of channel.typologyResult) {
      for (const rule of typology.ruleResults) {
        html += `
          <tr>
            <td>${rule.id}</td>
            <td>${rule.cfg}</td>
            <td>${rule.subRuleRef}</td>
            <td>${rule.result}</td>
            <td>${rule.reason}</td>
          </tr>
        `;
      }
    }
  }
  html += `</table>`;

  const noteId = createNoteResponse.data.uid;
  const toAddReport = {
    'entity-type': 'document',
    uid: `${noteId}`,
    properties: {
      'note:note': html,
    },
  };

  const addReportReponse = await axios.put(`${host}/v1/id/${noteId}`, toAddReport, {
    headers: {
      Authorization: config.nuxeoAuth,
    },
  });

  if (addReportReponse.status !== 200) {
    LoggerService.error(`Error while sending request to Nuxeo with error: ${addReportReponse.data}`);
    return;
  }

  const toIntializeWorkflow = {
    'entity-type': 'workflow',
    workflowModelName: 'SerialDocumentReview',
    attachedDocumentIds: [`${noteId}`],
  };

  const workflowResponse = await axios.post(`${host}/v1/id/${noteId}/@workflow`, toIntializeWorkflow, {
    headers: {
      Authorization: config.nuxeoAuth,
    },
  });

  if (workflowResponse.status !== 201) {
    LoggerService.error(`Error while sending request to Nuxeo with error: ${workflowResponse.data}`);
  }
}
