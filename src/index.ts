import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab_slurm_counter extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_slurm_counter:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab_slurm_counter is activated!');
  }
};

export default plugin;
