{CompositeDisposable} = require 'atom'
TagGenerator = require './tag-generator'

module.exports =
class ProjectSymbolsManager
  constructor: ->
    @onFileChangeUpdater = new OnFileChangeUpdater()

  retire: ->
    @onFileChangeUpdater.disable()

class OnFileChangeUpdater
  constructor: ->
    @toggle(atom.config.get('symbols-view-plus.plusConfigurations.updateProjectTagsOnFileChange'))
    atom.config.observe 'symbols-view-plus.plusConfigurations.updateProjectTagsOnFileChange', (newValue) => @toggle(newValue)

  toggle: (val) =>
    if val
      @enable()
    else
      @disable()

  enable: =>
    unless @editorsSubscription?
      @editorsSubscription = atom.workspace.observeTextEditors (editor) ->
        generateFileSymbols = ->
          new TagGenerator(editor.getPath(), editor.getGrammar()?.scopeName).generateFileSymbols()
        generateProjectSymbols = ->
          new TagGenerator(null, null).generateProjectSymbols()

        editorSubscriptions = new CompositeDisposable()
        editorSubscriptions.add(editor.onDidChangeGrammar(generateFileSymbols))
        editorSubscriptions.add(editor.onDidSave(generateFileSymbols))
        editorSubscriptions.add(editor.onDidChangePath(generateProjectSymbols))
        editorSubscriptions.add(editor.getBuffer().onDidReload(generateFileSymbols))
        editorSubscriptions.add(editor.getBuffer().onDidDestroy(generateProjectSymbols))
        editor.onDidDestroy -> editorSubscriptions.dispose()

  disable: =>
    if @editorsSubscription?
      @editorsSubscription.dispose()
      @editorsSubscription = null
