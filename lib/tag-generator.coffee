{BufferedProcess, Point} = require 'atom'
path = require 'path'

module.exports =
class TagGenerator
  constructor: (@filepath, @scopeName) ->
    packageRoot = @getPackageRoot()
    @command = path.join(packageRoot, 'vendor', "ctags-#{process.platform}")

    defaultCtagsFile = path.join(packageRoot, 'lib', 'ctags-config')
    @args = ["--options=#{defaultCtagsFile}", '--fields=+KS']
    if atom.config.get('symbols-view-plus.originalConfigurations.useEditorGrammarAsCtagsLanguage')
      if language = @getLanguage()
        @args.push("--language-force=#{language}")

    @options = {}
    @options.cwd = packageRoot if packageRoot = @getProjectRoot()

  getPackageRoot: ->
    packageRoot = path.resolve(__dirname, '..')
    {resourcePath} = atom.getLoadSettings()
    if path.extname(resourcePath) is '.asar'
      if packageRoot.indexOf(resourcePath) is 0
        packageRoot = path.join("#{resourcePath}.unpacked", 'node_modules', 'symbols-view-plus')
    packageRoot

  getProjectRoot: ->
    for directory in atom.project.getDirectories()
      dirPath = directory.getPath()
      if dirPath is @filepath or directory.contains(@filepath)
        return dirPath
    return null

  parseTagLine: (line) ->
    sections = line.split('\t')
    if sections.length > 3
      position: new Point(parseInt(sections[2]) - 1)
      name: sections[0]
      kind: sections[3]
    else
      null

  getLanguage: ->
    return 'Cson' if path.extname(@filepath) in ['.cson', '.gyp']

    switch @scopeName
      when 'source.c'        then 'C'
      when 'source.cpp'      then 'C++'
      when 'source.clojure'  then 'Lisp'
      when 'source.capnp'    then 'Capnp'
      when 'source.coffee'   then 'CoffeeScript'
      when 'source.css'      then 'Css'
      when 'source.css.less' then 'Css'
      when 'source.css.scss' then 'Css'
      when 'source.elixir'   then 'Elixir'
      when 'source.fountain' then 'Fountain'
      when 'source.gfm'      then 'Markdown'
      when 'source.go'       then 'Go'
      when 'source.java'     then 'Java'
      when 'source.js'       then 'JavaScript'
      when 'source.js.jsx'   then 'JavaScript'
      when 'source.jsx'      then 'JavaScript'
      when 'source.json'     then 'Json'
      when 'source.julia'    then 'Julia'
      when 'source.makefile' then 'Make'
      when 'source.objc'     then 'C'
      when 'source.objcpp'   then 'C++'
      when 'source.python'   then 'Python'
      when 'source.ruby'     then 'Ruby'
      when 'source.sass'     then 'Sass'
      when 'source.yaml'     then 'Yaml'
      when 'text.html'       then 'Html'
      when 'text.html.php'   then 'Php'

  generate: ->
    args = Array.from(@args)
    args.push('-nf', '-', @filepath)

    new Promise (resolve) =>
      tags = {}

      new BufferedProcess({
        @command,
        args,
        @options,
        stdout: (lines) =>
          for line in lines.split('\n')
            if tag = @parseTagLine(line)
              tags[tag.position.row] ?= tag
        stderr: ->
        exit: =>
          tags = (tag for row, tag of tags)
          resolve(tags)

          if atom.config.get('symbols-view-plus.plusConfigurations.updateProjectTagsAfterTogglingFileSymbols')
            if @options.cwd
              args = Array.from(@args)
              args.push('--append=yes', '-f', '.tags', @filepath)

              new BufferedProcess({@command, args, @options})
      })

  generateProjectSymbols: ->
    args = Array.from(@args)
    options = Array.from(@options)

    args.push(atom.config.get('symbols-view-plus.plusConfigurations.extraCommandArgumentsWhenGeneratingProjectSymbols'))
    args.push('-f', '.tags', '-R', './')

    atom.project.getDirectories().forEach (directory) =>
      options.cwd = directory.getPath()
      new BufferedProcess({@command, args, options})
