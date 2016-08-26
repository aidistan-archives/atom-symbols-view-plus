{CompositeDisposable, File} = require 'atom'
{filter} = require 'fuzzaldrin'
TagReader = require '../tag-reader'
getTagsFile = require '../get-tags-file'

module.exports =
class AutocompleteProvider

  constructor: ->
    @tags = []
    @startTask()

  stopTask: ->
    @loadTagsTask?.terminate()

  startTask: ->
    @stopTask()
    @loadTagsTask = TagReader.getAllTags (@tags) =>
    @watchTagsFiles()

  watchTagsFiles: ->
    @unwatchTagsFiles()

    @tagsFileSubscriptions = new CompositeDisposable()

    for projectPath in atom.project.getPaths()
      if tagsFilePath = getTagsFile(projectPath)
        tagsFile = new File(tagsFilePath)
        @tagsFileSubscriptions.add(tagsFile.onDidChange(@startTask))
        @tagsFileSubscriptions.add(tagsFile.onDidDelete(@startTask))
        @tagsFileSubscriptions.add(tagsFile.onDidRename(@startTask))

  unwatchTagsFiles: ->
    @tagsFileSubscriptions?.dispose()
    @tagsFileSubscriptions = null

  selector: '*'

  maxResults: 5
  inclusionPriority: 1
  excludeLowerPriority: false

  getSuggestions: ({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) ->
    return null unless atom.config.get('symbols-view-plus.plusConfigurations.provideServiceForAutocomplete')

    filter(@tags, prefix, key: 'name', maxResults: @maxResults)
      .map (tag) ->
        text: tag.name
        type: tag.kind
        description: tag.file
