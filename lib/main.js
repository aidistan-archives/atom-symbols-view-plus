/** @babel */
import TagGenerator from './tag-generator';
import AutocompleteProvider from './plus/autocomplete-provider';
import OnFileChangeUpdater from './plus/on-file-change-updater';

export default {
  activate() {
    this.stack = [];

    if (!atom.packages.isPackageDisabled('symbols-view')) {
      atom.packages.disablePackage('symbols-view');
    }

    this.workspaceSubscription = atom.commands.add('atom-workspace', {
      'symbols-view-plus:toggle-project-symbols': () => {
        this.createProjectView().toggle();
      },
    });

    // NOTE: `ctags -R` is not supported on Windows
    if (process.platform != 'win32') {
      this.workspaceSubscription = atom.commands.add('atom-workspace', {
        'symbols-view-plus:generate-project-symbols': () => {
          new TagGenerator(null).generateProjectSymbols();
        },
      });
    }

    this.editorSubscription = atom.commands.add('atom-text-editor', {
      'symbols-view-plus:toggle-file-symbols': () => {
        this.createFileView().toggle();
      },
      'symbols-view-plus:go-to-declaration': () => {
        this.createGoToView().toggle();
      },
      'symbols-view-plus:return-from-declaration': () => {
        this.createGoBackView().toggle();
      },
    });

    this.onFileChangeUpdater = new OnFileChangeUpdater();

    atom.config.observe('symbols-view-plus.plusConfigurations.symbolsViewTheme', () => {
      if (this.fileView != null) {
        this.fileView.destroy();
        this.fileView = null;
      }

      if (this.projectView != null) {
        this.projectView.destroy();
        this.projectView = null;
      }

      if (this.goToView != null) {
        this.goToView.destroy();
        this.goToView = null;
      }

      if (this.goBackView != null) {
        this.goBackView.destroy();
        this.goBackView = null;
      }
    });
  },

  deactivate() {
    if (this.fileView != null) {
      this.fileView.destroy();
      this.fileView = null;
    }

    if (this.projectView != null) {
      this.projectView.destroy();
      this.projectView = null;
    }

    if (this.goToView != null) {
      this.goToView.destroy();
      this.goToView = null;
    }

    if (this.goBackView != null) {
      this.goBackView.destroy();
      this.goBackView = null;
    }

    if (this.workspaceSubscription != null) {
      this.workspaceSubscription.dispose();
      this.workspaceSubscription = null;
    }

    if (this.editorSubscription != null) {
      this.editorSubscription.dispose();
      this.editorSubscription = null;
    }

    if (this.onFileChangeUpdater != null) {
      this.onFileChangeUpdater.disable();
      this.onFileChangeUpdater = null;
    }

    if (this.busySignalConsumer != null) {
      this.busySignalConsumer.dispose();
      this.busySignalConsumer = null;
    }
  },

  createFileView() {
    if (this.fileView) {
      return this.fileView;
    }
    const FileView  = require('./file-view');
    this.fileView = new FileView(this.stack);
    return this.fileView;
  },

  createProjectView() {
    if (this.projectView) {
      return this.projectView;
    }
    const ProjectView  = require('./project-view');
    this.projectView = new ProjectView(this.stack);
    return this.projectView;
  },

  createGoToView() {
    if (this.goToView) {
      return this.goToView;
    }
    const GoToView = require('./go-to-view');
    this.goToView = new GoToView(this.stack);
    return this.goToView;
  },

  createGoBackView() {
    if (this.goBackView) {
      return this.goBackView;
    }
    const GoBackView = require('./go-back-view');
    this.goBackView = new GoBackView(this.stack);
    return this.goBackView;
  },

  provideAutocomplete() {
    return this.autocompleteProvider ||
      (this.autocompleteProvider = new AutocompleteProvider());
  },

  consumeBusySignal(registry) {
    return this.busySignalConsumer ||
      (this.busySignalConsumer = registry.create());
  },
};
