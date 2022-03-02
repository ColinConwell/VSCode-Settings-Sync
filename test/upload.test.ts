import { expect } from 'chai';
import { vol } from 'memfs';
import { context } from './mocks/context';
import * as vscode from './mocks/vscode';
import { RepositoryFactory, Settings } from './rewires/repository';
import { fixtures } from './utils/fixtures';

describe('upload', () => {
	const keybindingsFxt = fixtures('keybindings');
	const profilesFxt = fixtures('profiles');
	const settingsFxt = fixtures('settings');
	const snippetsFxt = fixtures('snippets');
	const userSettingsFxt = fixtures('user-settings');

	beforeEach(async () => { // {{{
		vol.reset();
		vscode.reset();

		vol.fromJSON({
			'/globalStorage/extension/settings.yml': settingsFxt.yml.default,
		});

		await RepositoryFactory.reset();
		await Settings.load(context);
	}); // }}}

	it('empty', async () => { // {{{
		const repository = await RepositoryFactory.get();

		await repository.upload();

		expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

		expect(vol.readFileSync('/repository/profiles/main/data/extensions.yml', 'utf-8')).to.eql(vscode.ext2yml({
			disabled: [],
			enabled: [],
		}));
	}); // }}}

	it('extensions', async () => { // {{{
		vscode.setExtensions({
			disabled: ['pub1.ext3', 'pub3.ext1'],
			enabled: ['pub1.ext1', 'pub1.ext2', 'pub2.ext1', 'pub2.ext2'],
		});

		const repository = await RepositoryFactory.get();

		await repository.upload();

		expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

		expect(vol.readFileSync('/repository/profiles/main/data/extensions.yml', 'utf-8')).to.eql(vscode.ext2yml({
			disabled: ['pub1.ext3', 'pub3.ext1'],
			enabled: ['pub1.ext1', 'pub1.ext2', 'pub2.ext1', 'pub2.ext2'],
		}));
	}); // }}}

	describe('keybindings', () => {
		it('all', async () => { // {{{
			vscode.setSettings({
				'syncSettings.keybindingsPerPlatform': false,
			});
			vscode.setKeybindings(keybindingsFxt.json.gotoline);

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/keybindings.json', 'utf-8')).to.eql(keybindingsFxt.json.gotoline);
		}); // }}}

		it('linux', async () => { // {{{
			vscode.setKeybindings(keybindingsFxt.json.gotoline);
			vscode.setPlatform('linux');

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/keybindings-linux.json', 'utf-8')).to.eql(keybindingsFxt.json.gotoline);
		}); // }}}

		it('macos', async () => { // {{{
			vscode.setKeybindings(keybindingsFxt.json.gotoline);
			vscode.setPlatform('darwin');

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/keybindings-macos.json', 'utf-8')).to.eql(keybindingsFxt.json.gotoline);
		}); // }}}

		it('windows', async () => { // {{{
			vscode.setKeybindings(keybindingsFxt.json.gotoline);
			vscode.setPlatform('win32');

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/keybindings-windows.json', 'utf-8')).to.eql(keybindingsFxt.json.gotoline);
		}); // }}}
	});

	describe('profile', () => {
		it('empty', async () => { // {{{
			vol.fromJSON({
				'/repository/profiles/main/profile.yml': profilesFxt.yml.empty,
			});

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/extensions.yml', 'utf-8')).to.eql(vscode.ext2yml({
				disabled: [],
				enabled: [],
			}));
		}); // }}}
	});

	describe('settings', () => {
		it('base', async () => { // {{{
			vscode.setSettings(userSettingsFxt.json.basics);

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/settings.json', 'utf-8')).to.eql(userSettingsFxt.json.basics);
		}); // }}}

		it('attr', async () => { // {{{
			vscode.setPlatform('linux');
			vscode.setSettings(userSettingsFxt.json.attrOsTmpl);

			expect(vol.readFileSync('/user/settings.json', 'utf-8')).to.eql(userSettingsFxt.json.attrOsLinux);

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/settings.json', 'utf-8')).to.eql(userSettingsFxt.json.attrOsTmpl);
		}); // }}}
	});

	describe('snippets', () => {
		it('one', async () => { // {{{
			vscode.addSnippet('loop', snippetsFxt.json.loop);

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/snippets/loop.json', 'utf-8')).to.eql(snippetsFxt.json.loop);
		}); // }}}

		it('some', async () => { // {{{
			vscode.addSnippet('loop', snippetsFxt.json.loop);
			vscode.addSnippet('loop2', snippetsFxt.json.loop);
			vscode.addSnippet('loop3', snippetsFxt.json.loop);

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/snippets/loop.json', 'utf-8')).to.eql(snippetsFxt.json.loop);
			expect(vol.readFileSync('/repository/profiles/main/data/snippets/loop2.json', 'utf-8')).to.eql(snippetsFxt.json.loop);
			expect(vol.readFileSync('/repository/profiles/main/data/snippets/loop3.json', 'utf-8')).to.eql(snippetsFxt.json.loop);
		}); // }}}
	});

	describe('additionals', () => {
		it('globalStorage', async () => { // {{{
			vol.fromJSON({
				'/globalStorage/alefragnani.project-manager/projects.json': keybindingsFxt.json.gotoline,
			});

			vscode.setSettings({
				'syncSettings.additionalFiles': [
					'~globalStorage/alefragnani.project-manager/projects.json',
				],
			});

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/additionals/~globalStorage-alefragnani.project-manager-projects.json', 'utf-8')).to.eql(keybindingsFxt.json.gotoline);
		}); // }}}

		it('home', async () => { // {{{
			vol.fromJSON({
				'/home/projects.json': keybindingsFxt.json.gotoline,
			});

			vscode.setSettings({
				'syncSettings.additionalFiles': [
					'~/projects.json',
				],
			});

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/additionals/~-projects.json', 'utf-8')).to.eql(keybindingsFxt.json.gotoline);
		}); // }}}

		it('both', async () => { // {{{
			vol.fromJSON({
				'/globalStorage/alefragnani.project-manager/projects.json': keybindingsFxt.json.gotoline,
				'/home/projects.json': keybindingsFxt.json.gotoline,
			});

			vscode.setSettings({
				'syncSettings.additionalFiles': [
					'~globalStorage/alefragnani.project-manager/projects.json',
					'~/projects.json',
				],
			});

			const repository = await RepositoryFactory.get();

			await repository.upload();

			expect(vscode.outputLines.pop()).to.eql('[info] serialize done');

			expect(vol.readFileSync('/repository/profiles/main/data/additionals/~globalStorage-alefragnani.project-manager-projects.json', 'utf-8')).to.eql(keybindingsFxt.json.gotoline);
			expect(vol.readFileSync('/repository/profiles/main/data/additionals/~-projects.json', 'utf-8')).to.eql(keybindingsFxt.json.gotoline);
		}); // }}}
	});
});
