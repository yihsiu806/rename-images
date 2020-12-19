#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')

const IMAGE_EXTS = ['png', 'jpg', 'git', 'jpeg']

main()

async function main() {
    targetFolder = checkCommandLineArgument()
    targetFolder = await checkFolder(targetFolder)
    renameImages(targetFolder)
}

function checkCommandLineArgument() {
    let programeName = process.argv[1].replace(/^.*\//, '')
    let target = process.argv[2]

    if (target == undefined || target == '-h' || target == '--help') {
        printHelp()
    }

    return target
    
    function printHelp() {
        console.log('Help:')
        console.log(`    node ${programeName} path-to-target-forder`)
        process.exit(0)
    }
}

async function checkFolder(target) {
    let absolutePath = path.resolve(target)
    try {
        const stats = await getFileStat()
        if (!stats.isDirectory()) {
            console.log(`Error: "${absolutePath}" is not a folder.`)
        }
        return absolutePath
    } catch(err) {
        console.log(err)
        process.exit(1)
    }

    function getFileStat() {
        return new Promise((resolve, reject) => {
            fs.stat(absolutePath, (err, stats) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(stats)
                }
            })
        })
    }
}

async function renameImages(folderPath) {
    let bucket = []
    let files = fs.readdirSync(folderPath)
    files = files.filter(fileName => {
        return IMAGE_EXTS.includes(fileName.replace(/^.*\./, ''))
    })

    console.log(chalk.cyan(`In ${folderPath}:`))
    files.forEach((fileName) => {
        let filePath = path.join(folderPath, fileName)
        let newFileName = getBirthTime(filePath) + '-' + generateRandomName() + path.extname(fileName)
        console.log(chalk.yellow(`Rename ${chalk.gray(`"${fileName}"`)} to ${chalk.white(`${newFileName}`)}`))
        fs.renameSync(filePath, path.join(folderPath, newFileName))
    })
    
    function generateRandomName() {
        const letterStart = 'a'.codePointAt(0)
        const letterSize = 'z'.codePointAt(0) - 'a'.codePointAt(0) + 1
        const letters = Array(letterSize).fill(0).map((_, i) => {
            return String.fromCodePoint(letterStart + i)
        })

        let randomName = getRandomString()
        while (bucket.includes(randomName)) {
            randomName = getRandomString()
        }
        bucket.push(randomName)

        return randomName

        function getRandomString() {
            return Array(7).fill(0).reduce((acc, cur) => {
                return acc + letters[Math.round(Math.random() * letterSize)]
            }, '')
        }
    }

    function getBirthTime(filePath) {
        let stats = fs.statSync(filePath)
        return Math.round(stats.birthtimeMs / 1000)
    }
}

