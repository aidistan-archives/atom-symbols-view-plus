TagReader = require './tag-reader'
{filter} = require 'fuzzaldrin'

module.exports =
class AutocompleteProvider
  selector: '*'

  inclusionPriority: 1
  excludeLowerPriority: false

  defaultOptions:
    maxResults: 5

  constructor: (@projectView, options = {}) ->
    @projectView.startTask()
    @options =
      maxResults: options.maxResults or @defaultOptions.maxResults

  getSuggestions: ({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) ->
    filter(@projectView.tags, prefix, key: 'name', maxResults: @options.maxResults)
      .map (tag) ->
        text: tag.name
        type: tag.kind
        description: tag.file
