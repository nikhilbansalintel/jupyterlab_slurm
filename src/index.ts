import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IStateDB } from '@jupyterlab/statedb';

import { DOMUtils, Dialog, showDialog } from '@jupyterlab/apputils';

import { Widget } from '@lumino/widgets';

const TOP_AREA_CSS_CLASS = 'jp-TopAreaText';
const START_TIME_KEY = 'startTime';
const PLUGIN_ID = 'jupyterlab_slurm_counter:plugin';

/**
 * Initialization data for the jupyterlab_slurm_counter extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [IStateDB],
  activate: async (app: JupyterFrontEnd, state: IStateDB) => {
    console.log('JupyterLab extension jupyterlab_slurm_counter is activated!');

    // Show an announcement dialog with line breaks
    showAnnouncementDialog(
      'Announcement!!',
      `IDC Slurm cluster for Training and Workshop will be exclusively reserved for Gen AI Hackathon Workshop on 2/21- 2/23. System will be reset in preparation for this event.
      Event starts on Wednesday 8:00 PM and ends on Friday 6:00 AM PDT.<br>
      <br>
      Cluster maintenance planned for Monday 26th February from 9 AM to 5 PM PDT.
      Slurm cluster for Training and Workshop will be down. All jobs will be stopped before 9:00 AM Monday.`
    );

    // Create the HTML content of the widget
    const node = document.createElement('div');
    const counterDisplay = document.createElement('span');
    counterDisplay.className = 'elapsed-time';
    node.appendChild(counterDisplay);

    // Create the widget
    const widget = new Widget({ node });
    widget.id = DOMUtils.createDomID();
    widget.addClass(TOP_AREA_CSS_CLASS);

    // Add the widget to the top area
    app.shell.add(widget, 'top', { rank: 1000 });

    let intervalId: number | null = null;

    const updateCounter = async () => {
      const startTime = await state.fetch(START_TIME_KEY);
      if (startTime !== undefined) {
        const currentTime = new Date().getTime();
        const elapsedTimeInSeconds = Math.floor((currentTime - Number(startTime)) / 1000);
        const hrs = Math.floor(elapsedTimeInSeconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((elapsedTimeInSeconds % 3600) / 60).toString().padStart(2, '0');
        const secs = (elapsedTimeInSeconds % 60).toString().padStart(2, '0');
        counterDisplay.textContent = `${hrs}:${mins}:${secs}`;
      }
    };

    const startCounter = () => {
      if (intervalId === null) {
        intervalId = window.setInterval(updateCounter, 1000);
        updateCounter(); // Update counter immediately when starting
      }
    };

    const stopCounter = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    app.restored
      .then(() => state.fetch(PLUGIN_ID))
      .then(async () => {
        // Start the counter when the notebook is opened
        let startTime = await state.fetch(START_TIME_KEY);
        if (startTime === undefined) {
          startTime = new Date().getTime();
          await state.save(START_TIME_KEY, startTime);
        }
        startCounter();
      });

    app.started.then(() => {
      // Stop the counter when the application is shut down
      stopCounter();
    });

    app.serviceManager.connectionFailure.connect(async () => {
      console.log('connectionFailure is called');

      let startTimebefore = await state.fetch(START_TIME_KEY);
      const keys = await state.list();
      console.log('connectionFailure before is called ->', startTimebefore, keys);

      await Promise.all(keys.ids.map((key) => state.remove(key)));

      await state.remove(START_TIME_KEY);


      let startTimeafter = await state.fetch(START_TIME_KEY);
      const keysafter = await state.list();
      console.log('connectionFailure after is called ->', startTimeafter, keysafter);
      stopCounter();
    });
  }
};

const showAnnouncementDialog = async (title: string, body: string) => {
  const bodyNode = document.createElement('div');
  bodyNode.innerHTML = `
    <div style="padding: 1px; font-size: 14px; line-height: 1.5;">
      <p>${body}</p>
    </div>
  `;

  await showDialog({
    title,
    body: new Widget({ node: bodyNode }),
    buttons: [Dialog.okButton({ label: 'OK' })]
  });
};

export default plugin;
