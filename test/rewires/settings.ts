import rewiremock from 'rewiremock';
import { fs } from '../mocks/fs';
import { vscode } from '../mocks/vscode';

rewiremock('fs').with(fs);
rewiremock('fs/promises').with(fs.promises);
rewiremock('vscode').with(vscode);

rewiremock.enable();

// eslint-disable-next-line import/first, import/order
import { Settings } from '../../src/settings';

rewiremock.disable();

export {
	// eslint-disable-next-line unicorn/prefer-export-from
	Settings,
};
