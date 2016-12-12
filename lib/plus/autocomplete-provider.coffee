{CompositeDisposable, File} = require 'atom'
{filter} = require 'fuzzaldrin'
TagReader = require '../tag-reader'
getTagsFile = require '../get-tags-file'

module.exports =
class AutocompleteProvider

  constructor: ->
    @tags = []
    @start()

  start: ->
    @loadTagsTask = TagReader.getAllTags (@tags) =>
    @watchTagsFiles()

  watchTagsFiles: ->
    @unwatchTagsFiles()
    @tagsFileSubscriptions = new CompositeDisposable()

    for projectPath in atom.project.getPaths()
      if tagsFilePath = getTagsFile(projectPath)
        tagsFile = new File(tagsFilePath)
        restart = => @loadTagsTask?.terminate(); @start()
        @tagsFileSubscriptions.add(tagsFile.onDidChange(restart))
        @tagsFileSubscriptions.add(tagsFile.onDidDelete(restart))
        @tagsFileSubscriptions.add(tagsFile.onDidRename(restart))

  unwatchTagsFiles: ->
    @tagsFileSubscriptions?.dispose()
    @tagsFileSubscriptions = null

  selector: '*'

  maxResults: 5
  inclusionPriority: 1
  excludeLowerPriority: false

  getSuggestions: ({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) ->
    # Check the service status
    return null unless atom.config.get('symbols-view-plus.plusConfigurations.provideServiceForAutocomplete')

    # Check the prefix length
    minimumWordLength = atom.config.get('autocomplete-plus.minimumWordLength')
    return null unless minimumWordLength? and prefix.length >= minimumWordLength

    filter(@tags, prefix, key: 'name', maxResults: @maxResults).map (tag) ->
      # Get rid of "/^" and "$/"
      patternStr = tag.pattern.substring(2, tag.pattern.length - 2)

      # Try to make a snippet
      if tag.kind is "require"
        snippet = patternStr
      if tag.kind is "function"
        # Get the return type
        leftLabel = patternStr.substring(0, patternStr.indexOf(tag.name) - 1)
        # Get rid of any chars before the symbol
        snippet = patternStr.substring(patternStr.indexOf(tag.name), patternStr.length)
        # Get rid of the brace at line end if exists
        snippet = snippet.replace(/\s*{\s*/, '')

      return {
        text: tag.name
        type: tag.kind
        rightLabel: tag.kind
        description: tag.file
        leftLabel, snippet
      }
