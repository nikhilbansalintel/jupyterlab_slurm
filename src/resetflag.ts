import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
  } from '@jupyterlab/application';
  
  import { IStateDB } from '@jupyterlab/statedb';
  
  import { DOMUtils } from '@jupyterlab/apputils';
  
  import { Widget } from '@lumino/widgets';
  
  const TOP_AREA_CSS_CLASS = 'jp-TopAreaText';
  const START_TIME_KEY = 'startTime';
  const FOUR_HOURS_IN_SECONDS = 14400;
  const SERVER_SHUTDOWN_KEY = 'serverShutdown';
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
        let startTime = await state.fetch(START_TIME_KEY);
        if (startTime !== undefined ) {
          const currentTime = new Date().getTime();
          const elapsedTimeInSeconds = Math.floor((currentTime - Number(startTime)) / 1000);
          if (elapsedTimeInSeconds >= FOUR_HOURS_IN_SECONDS) {
            startTime = currentTime;
            await state.save(START_TIME_KEY, startTime);
            await state.save(SERVER_SHUTDOWN_KEY, true);
          }
          const displayTime = elapsedTimeInSeconds % FOUR_HOURS_IN_SECONDS;
          const hrs = Math.floor(displayTime / 3600).toString().padStart(2, '0');
          const mins = Math.floor((displayTime % 3600) / 60).toString().padStart(2, '0');
          const secs = (displayTime % 60).toString().padStart(2, '0');
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
        const keys= await state.list();
        console.log("restored is called", keys);
        // Start the counter when the notebook is opened
        let startTime = await state.fetch(START_TIME_KEY);
        let reset = await state.fetch(SERVER_SHUTDOWN_KEY);
        if (reset === false) {
          startTime = new Date().getTime();
          await state.save(START_TIME_KEY, startTime);
          await state.save(SERVER_SHUTDOWN_KEY, true);
        }
        if (startTime === undefined) {
          startTime = new Date().getTime();
          await state.save(START_TIME_KEY, startTime);
          await state.save(SERVER_SHUTDOWN_KEY, true);
        }
        startCounter();
  
      });
  
      app.serviceManager.connectionFailure.connect(async () => {
        console.log("connectionFailure is called");
  
        let startTimebefore = await state.fetch(START_TIME_KEY);
        const keys= await state.list();
        console.log("connectionFailure before is called ->", startTimebefore, keys);
  
        await Promise.all(keys.ids.map(key => state.remove(key)));
  
        // await state.remove(START_TIME_KEY);
  
          // Set the server shutdown key to false
          await state.save(SERVER_SHUTDOWN_KEY, false);
  
        const keysafter = await state.list();
        let startTimeafter = await state.fetch(START_TIME_KEY);
        console.log("connectionFailure after is called ->", startTimeafter, keysafter);
        stopCounter();
      });
  
      // app.started.then(() => {
      //   // Stop the counter when the application is shut down
      //   stopCounter();
      // });
  
    }
  };
  
  export default plugin;