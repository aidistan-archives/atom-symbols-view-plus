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

    filter(@tags, prefix, key: 'name', maxResults: @maxResults)
    .map (tag) =>
      text: tag.name
      description: tag.file
      type: tag.kind
      snippet: @makeSnippet(tag)

  # Try to make a snippet
  makeSnippet: (tag) ->
    snippet = @patternToString(tag.pattern)
    if tag.kind is "require"
      return snippet
    if tag.kind is "function"
      # Get rid of any chars before the symbol
      snippet = snippet.substring(snippet.indexOf(tag.name), snippet.length)
      # Get rid of the brace at line end if exists
      snippet = snippet.replace(/\s*{\s*/, '')
      return snippet

  # Get rid of "/^" and "$/"
  patternToString: (pattern) -> pattern.substring(2, pattern.length - 2)
