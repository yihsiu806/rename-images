#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')

main()

function main() {
    targetFolder = checkCommandLineArgument()
    targetFolder = checkFolder(targetFolder)
    renameImages(targetFolder)
}

function checkCommandLineArgument() {
    let programName = process.argv[1].replace(/^.*\//, '')
    let target = process.argv[2]

    if (target == undefined || target == '-h' || target == '--help') {
        printHelp()
    }

    return target
    
    function printHelp() {
        console.log('Usage')
        console.log(`    node ${programName} <path-to-target-folder>`)
        process.exit(0)
    }
}

function checkFolder(target) {
    let absolutePath = path.resolve(target)
    let stats = fs.statSync(absolutePath)
    if (!stats.isDirectory()) {
        console.log(`Error: "${absolutePath}" is not a folder.`)
        process.exit(1)
    }
    return absolutePath
}

function renameImages(folderPath) {
    let files = fs.readdirSync(folderPath)

    files.forEach((fileName, i) => {
        let filePath = path.join(folderPath, fileName)
        files[i] = {
            fileName: fileName,
            filePath: filePath,
            fileType: getFileType(filePath)
        }
    })

    files.filter((fObj) => {
        return fObj.fileType != null
    })

    function getFileType(path) {
        let data = fs.readFileSync(path)
        let bytes = []
        for (let i = 0; i < 4; i++) {
            bytes.push(data[i].toString(16))
        }
        let signature = bytes.join('').toUpperCase()
        switch(signature) {
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

    let bucket = []

    console.log(chalk.cyan(`In ${folderPath}:`))
    files.forEach((fObj) => {
        let newFileName = getBirthTime(fObj.filePath) + '-' + generateRandomName() + '.' + fObj.fileType
        console.log(chalk.yellow(`Rename ${chalk.gray(`"${fObj.fileName}"`)} to ${chalk.white(`${newFileName}`)}`))
        fs.renameSync(fObj.filePath, path.join(folderPath, newFileName))
    })
    
    function generateRandomName() {
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

        let randomName = getRandomString()
        while (bucket.includes(randomName)) {
            randomName = getRandomString()
        }
        bucket.push(randomName)

        return randomName

        function getRandomString() {
            return Array(8).fill(0).reduce((acc, cur) => {
                return acc + letters[Math.round(Math.random() * letterSize)]
            }, '')
        }
    }

    function getBirthTime(filePath) {
        let stats = fs.statSync(filePath)
        return Math.round(stats.birthtimeMs / 1000)
    }
}