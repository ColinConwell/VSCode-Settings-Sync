import vscode from 'vscode';
import pkg from '../package.json';
import { download } from './commands/download';
import { openSettings } from './commands/open-settings';
import { reset } from './commands/reset';
import { upload } from './commands/upload';
import { switchProfile } from './commands/switch-profile';
import { createProfile } from './commands/create-profile';
import { Settings } from './settings';
import { openProfileSettings } from './commands/open-profile-settings';
import { openProfileDirectory } from './commands/open-profile-directory';
import { ThrottledDelayer } from './utils/async';
import { RepositoryFactory } from './repository-factory';
import { Logger } from './utils/logger';
import { viewDifferences } from './commands/view-differences';

const VERSION_KEY = 'version';

async function showWhatsNewMessage(version: string) { // {{{
	const actions: vscode.MessageItem[] = [{
		title: 'Homepage',
	}, {
		title: 'Release Notes',
	}];

	const result = await vscode.window.showInformationMessage(
		`Sync Settings has been updated to v${version} — check out what's new!`,
		...actions,
	);

	if(result !== null) {
		if(result === actions[0]) {
			await vscode.commands.executeCommand(
				'vscode.open',
				vscode.Uri.parse(`${pkg.homepage}`),
			);
		}
		else if(result === actions[1]) {
			await vscode.commands.executeCommand(
				'vscode.open',
				vscode.Uri.parse(`${pkg.homepage}/blob/master/CHANGELOG.md`),
			);
		}
	}
} // }}}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const previousVersion = context.globalState.get<string>(VERSION_KEY);
	const currentVersion = pkg.version;

	const config = vscode.workspace.getConfiguration('syncSettings');

	if(previousVersion === undefined || currentVersion !== previousVersion) {
		void context.globalState.update(VERSION_KEY, currentVersion);

		const notification = config.get<string>('notification');

		if(previousVersion === undefined) {
			// don't show notification on install
		}
		else if(notification === 'major') {
			if(currentVersion.split('.')[0] > previousVersion.split('.')[0]) {
				void showWhatsNewMessage(currentVersion);
			}
		}
		else if(notification === 'minor') {
			if(currentVersion.split('.')[0] > previousVersion.split('.')[0] || (currentVersion.split('.')[0] === previousVersion.split('.')[0] && currentVersion.split('.')[1] > previousVersion.split('.')[1])) {
				void showWhatsNewMessage(currentVersion);
			}
		}
		else if(notification !== 'none') {
			void showWhatsNewMessage(currentVersion);
		}
	}

	await Settings.load(context);

	const disposables: vscode.Disposable[] = [];

	disposables.push(
		vscode.commands.registerCommand('syncSettings.createProfile', createProfile),
		vscode.commands.registerCommand('syncSettings.download', download),
		vscode.commands.registerCommand('syncSettings.openProfileSettings', openProfileSettings),
		vscode.commands.registerCommand('syncSettings.openProfileDirectory', openProfileDirectory),
		vscode.commands.registerCommand('syncSettings.openSettings', openSettings),
		vscode.commands.registerCommand('syncSettings.reset', reset),
		vscode.commands.registerCommand('syncSettings.switchProfile', switchProfile),
		vscode.commands.registerCommand('syncSettings.upload', upload),
		vscode.commands.registerCommand('syncSettings.viewDifferences', viewDifferences),
	);

	const settings = Settings.get();
	const fileChangesDelayer = new ThrottledDelayer<void>(200);
	const watcher = vscode.workspace.createFileSystemWatcher(settings.settingsUri.fsPath);

	watcher.onDidChange(() => {
		void fileChangesDelayer.trigger(async () => {
			try {
				await RepositoryFactory.reload();
			}
			catch (error: unknown) {
				Logger.error(error);
			}
		});
	});

	context.subscriptions.push(...disposables);
}
