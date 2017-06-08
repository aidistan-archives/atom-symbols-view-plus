/** @babel */
/* eslint-env jasmine */

import path from 'path';
import fs from 'fs-plus';
import temp from 'temp';

import {it, beforeEach, conditionPromise} from './async-spec-helpers';

describe('SymbolsViewPlus', () => {
  let directory;

  const getWorkspaceView = () => atom.views.getView(atom.workspace);

  beforeEach(async () => {
    jasmine.unspy(global, 'setTimeout');

    atom.project.setPaths([
      temp.mkdirSync('other-dir-'),
      temp.mkdirSync('atom-symbols-view-plus-'),
    ]);

    directory = atom.project.getDirectories()[1];
    fs.copySync(path.join(__dirname, 'fixtures', 'js'), atom.project.getPaths()[1]);

    await atom.packages.activatePackage('symbols-view-plus');
  });

  it('generates project symbols', async () => {
    if (process.platform == 'win32') { return; } // not supported

    atom.commands.dispatch(getWorkspaceView(), 'symbols-view-plus:generate-project-symbols');
    await conditionPromise(() => fs.existsSync(directory.resolve('.tags')));

    const tags = fs.readFileSync(directory.resolve('.tags'), 'utf8');
    expect(tags.split(/\n|\r\n/).length).toBeGreaterThan(13);

    fs.removeSync(directory.resolve('.tags'));
  });
});
