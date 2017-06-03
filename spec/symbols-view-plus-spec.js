/** @babel */
/* eslint-env jasmine */

import path from 'path';
import fs from 'fs-plus';
import temp from 'temp';

import {it, conditionPromise} from './async-spec-helpers';

describe('SymbolsViewPlus', () => {

  let [symbolsView, activationPromise, directory] = [];

  const getWorkspaceView = () => atom.views.getView(atom.workspace);
  const getEditorView = () => atom.views.getView(atom.workspace.getActiveTextEditor());

  beforeEach(async () => {
    jasmine.unspy(global, 'setTimeout');

    atom.project.setPaths([
      temp.mkdirSync('other-dir-'),
      temp.mkdirSync('atom-symbols-view-plus-'),
    ]);

    directory = atom.project.getDirectories()[1];
    fs.copySync(path.join(__dirname, 'fixtures', 'js'), atom.project.getPaths()[1]);

    activationPromise = atom.packages.activatePackage('symbols-view-plus');
    jasmine.attachToDOM(getWorkspaceView());
  });

  it('generates project symbols', async () => {
    atom.commands.dispatch(getWorkspaceView(), 'symbols-view-plus:generate-project-symbols');
    await conditionPromise(() => fs.existsSync(directory.resolve('.tags')));

    const tags = fs.readFileSync(directory.resolve('.tags'), 'utf8');
    expect(tags.split('\n').length).toBeGreaterThan(13);

    fs.removeSync(directory.resolve('.tags'));
  });

  it('toggles a right panel', async () => {
    await atom.workspace.open(directory.resolve('sample.js'));
    atom.commands.dispatch(getEditorView(), 'symbols-view-plus:toggle-file-symbols');
    await activationPromise;

    symbolsView = atom.workspace.getRightPanels()[0].item;
    await conditionPromise(() => symbolsView.element.querySelectorAll('li').length > 0);

    expect(symbolsView.selectListView.refs.loadingMessage).toBeUndefined();
    expect(document.body.contains(symbolsView.element)).toBe(true);
    expect(symbolsView.element.querySelectorAll('li').length).toBe(2);
  });
});
