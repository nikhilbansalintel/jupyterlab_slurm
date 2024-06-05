import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IStateDB } from '@jupyterlab/statedb';

import { DOMUtils } from '@jupyterlab/apputils';

import { Widget } from '@lumino/widgets';

const TOP_AREA_CSS_CLASS = 'jp-TopAreaText';
const START_TIME_KEY = 'startTime';

/**
 * Initialization data for the jupyterlab_slurm_counter extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_slurm_counter:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [IStateDB],
  activate: async (app: JupyterFrontEnd, state: IStateDB) => {
    console.log('JupyterLab extension jupyterlab_slurm_counter is activated!');

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

    app.restored.then(async () => {
      // Start the counter when the notebook is opened
      let startTime = await state.fetch(START_TIME_KEY);
      if (startTime === undefined) {
        startTime = new Date().getTime();
        await state.save(START_TIME_KEY, startTime);
      }
      startCounter();
    });

    // Stop the counter when the application's shell widget is disposed
    widget.disposed.connect(() => {
      console.log('widget disposed!!');
      stopCounter();
    });
  }
};

export default plugin;
