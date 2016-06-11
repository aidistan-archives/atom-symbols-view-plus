TagReader = require '../tag-reader'
{filter} = require 'fuzzaldrin'

module.exports =
class AutocompleteProvider
  maxResults: 5

  constructor: (@projectView) ->
    @projectView.startTask()

  update: (@projectView) ->
    @projectView.startTask()

  selector: '*'

  inclusionPriority: 1
  excludeLowerPriority: false

  getSuggestions: ({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) ->
    return null unless atom.config.get('symbols-view-plus.plusConfigurations.provideServiceForAutocomplete')

    filter(@projectView.tags, prefix, key: 'name', maxResults: @maxResults)
      .map (tag) ->
        text: tag.name
        type: tag.kind
        description: tag.file
