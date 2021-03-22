#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')

main()

function main() {
  let [target, prefix] = getCommandLineArgument()
  target = checkFolderIsValid(target)
  rename(target, prefix)
}

function getCommandLineArgument() {
  let target = process.argv[2]
  let prefix = process.argv[3]
  let rule = /^[a-zA-Z0-9.-_]+$/

  if (target == undefined || target == '-h' || target == '--help') {
    exitHelp()
  }

  if (prefix !== undefined && !rule.test(prefix)) {
    exitHelp(chalk.red(`Error: Prefix only allow "a-z A-Z 0-9 . - _".`))
  }

  return [target, prefix]

}

function checkFolderIsValid(target) {
  let absolutePath = path.resolve(target)
  let stats = fs.statSync(absolutePath)
  if (!stats.isDirectory()) {
    exitHelp(`Error: "${absolutePath}" is not a folder.`)
  }
  return absolutePath
}

function rename(folder, prefix) {
  let files = fs.readdirSync(folder)

  files.forEach((filename, i) => {
    let filepath = path.join(folder, filename)
    files[i] = {
      filename,
      filepath,
      fileType: getFileType(filepath),
      created: getBirthTime(filepath)
    }
  })

  files = files.filter((file) => {
    return file.fileType != null
  })

  files.sort(function(a, b) {
    return b.created - a.created
  })

  console.log(chalk.cyan(`In ${folder}:`))

  files.forEach((file, index) => {
    let newName = getNewName(file.fileType, file.created, prefix, index+1)
    console.log(chalk.yellow(`Rename ${chalk.gray(`"${file.filename}"`)} to ${chalk.white(`${newName}`)}`))
    fs.renameSync(file.filepath, path.join(folder, newName))
  })
}

function exitHelp(message) {
  let programName = process.argv[1].replace(/^.*\//, '')

  if (message) {
    console.log(message)
  }

  console.log(chalk.yellow('Usage:'))
  console.log(chalk.yellow(`    node ${programName} <path-to-target-folder> [prefix]`))

  process.exit(0)
}

function getFileType(filePath) {
  let data = fs.readFileSync(filePath)
  let bytes = []
  for (let i = 0; i < 4; i++) {
    bytes.push(data[i].toString(16))
  }
  let signature = bytes.join('').toUpperCase()
  switch (signature) {
    case '89504E47':
      return 'png'
    case '47494638':
      return 'gif'
    case 'FFD8FFDB':
    case 'FFD8FFE0':
    case 'FFD8FFE1':
      return 'jpg'
    default:
      return null
  }
}

function getNewName(extname, created, prefix, index) {
  if (prefix !== undefined) {
    return `${prefix}-${index}.${extname}`
  } else {
    return `${created}-${generateRandomAlphabet()}.${extname}`
  }
}

function getBirthTime(filepath) {
  let stats = fs.statSync(filepath)
  return Math.round(stats.birthtimeMs / 1000)
}

function generateRandomAlphabet() {
  let letterStart = 'a'.codePointAt(0)
  let letterSize = 'z'.codePointAt(0) - 'a'.codePointAt(0) + 1
  let letters = Array(letterSize).fill(0).map((_, i) => {
    return String.fromCodePoint(letterStart + i)
  })
  letterStart = 'A'.codePointAt(0)
  letterSize = 'Z'.codePointAt(0) - 'A'.codePointAt(0) + 1
  letters = letters.concat(Array(letterSize).fill(0).map((_, i) => {
    return String.fromCodePoint(letterStart + i)
  }))

  return Array(8).fill(0).reduce((acc, cur) => {
    return acc + letters[Math.round(Math.random() * letterSize)]
  }, '')
}