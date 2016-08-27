TagGenerator = require './tag-generator'
AutocompleteProvider = require './plus/autocomplete-provider'
OnFileChangeUpdater = require './plus/on-file-change-updater'

module.exports =
  activate: ->
    @stack = []

    if not atom.packages.isPackageDisabled("symbols-view")
      atom.packages.disablePackage("symbols-view")

    @workspaceSubscription = atom.commands.add 'atom-workspace',
      'symbols-view-plus:toggle-project-symbols': => @createProjectView().toggle()
      'symbols-view-plus:generate-project-symbols': ->
        new TagGenerator(atom.workspace.getActiveTextEditor()?.getPath()).generateProjectSymbols()

    @editorSubscription = atom.commands.add 'atom-text-editor',
      'symbols-view-plus:toggle-file-symbols': => @createFileView().toggle()
      'symbols-view-plus:go-to-declaration': => @createGoToView().toggle()
      'symbols-view-plus:return-from-declaration': => @createGoBackView().toggle()

    @onFileChangeUpdater = new OnFileChangeUpdater()

    atom.config.observe 'symbols-view-plus.plusConfigurations.symbolsViewTheme', =>
      @fileView?.destroy();    @fileView = null
      @projectView?.destroy(); @projectView = null
      @goToView?.destroy();    @goToView = null
      @goBackView?.destroy();  @goBackView = null

  deactivate: ->
    if @fileView?
      @fileView.destroy()
      @fileView = null

    if @projectView?
      @projectView.destroy()
      @projectView = null

    if @goToView?
      @goToView.destroy()
      @goToView = null

    if @goBackView?
      @goBackView.destroy()
      @goBackView = null

    if @workspaceSubscription?
      @workspaceSubscription.dispose()
      @workspaceSubscription = null

    if @editorSubscription?
      @editorSubscription.dispose()
      @editorSubscription = null

    @onFileChangeUpdater.disable()

  createFileView: ->
    unless @fileView?
      FileView  = require './file-view'
      @fileView = new FileView(@stack)
    @fileView

  createProjectView: ->
    unless @projectView?
      ProjectView  = require './project-view'
      @projectView = new ProjectView(@stack)
    @projectView

  createGoToView: ->
    unless @goToView?
      GoToView = require './go-to-view'
      @goToView = new GoToView(@stack)
    @goToView

  createGoBackView: ->
    unless @goBackView?
      GoBackView = require './go-back-view'
      @goBackView = new GoBackView(@stack)
    @goBackView

  provideAutocomplete: ->
    @autocompleteProvider ||= new AutocompleteProvider()
