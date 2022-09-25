#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { cli } from './cli.js'

const envVarsPrefix =
  process.env['NOTION2CONTENT_ENV_VARS_PREFIX'] || 'NOTION2CONTENT'

;(async () => {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('notion2content')
    .env(envVarsPrefix)
    .usage('$0 [OPTIONS]...')
    .demand(0)
    .options({
      'api-key': {
        type: 'string',
        array: false,
        required: true,
        description: 'API Key to API endpoint'
      },
      'database-id': {
        type: 'string',
        array: false,
        required: true,
        description: 'The id of database in Notion'
      },
      'workers-num': {
        type: 'number',
        array: false,
        required: false,
        default: 1,
        description: 'The number of workers to fetch pages'
      },
      limit: {
        type: 'number',
        array: false,
        required: false,
        default: -1,
        description: 'Maximum number of pages to print'
      },
      skip: {
        type: 'number',
        array: false,
        required: false,
        default: -1,
        description: 'The number of skips to print pages'
      },
      'default-class-name': {
        type: 'boolean',
        array: false,
        required: false,
        description: 'Set default name to class of each elements'
      },
      'save-dir': {
        type: 'string',
        array: false,
        required: false,
        description: 'Save content into specified directory'
      },
      'save-format': {
        choices: ['json', 'html', 'md'] as const,
        array: false,
        required: false,
        default: 'json' as const,
        description: 'Save content to files as specified format'
      },
      'output-target': {
        choices: ['both', 'props', 'content'] as const,
        array: false,
        required: false,
        default: 'both' as const,
        description: 'Select output trager'
      },
      'initial-index': {
        type: 'number',
        array: false,
        required: false,
        default: 1,
        description: 'Initial index value'
      },
      'index-name': {
        type: 'string',
        array: false,
        required: false,
        default: '',
        description: 'The name of index property'
      },
      'to-html': {
        type: 'boolean',
        array: false,
        required: false,
        description: 'Convert hast to html'
      }
    })
    .help().argv

  process.exit(
    await cli({
      apiKey: argv['api-key'],
      databaseId: argv['database-id'],
      defaultClassName: argv['default-class-name'],
      workersNum: argv['workers-num'],
      limit: argv['limit'],
      skip: argv['skip'],
      saveDir: argv['save-dir'],
      saveFormat: argv['save-format'],
      outputTarget: argv['output-target'],
      initialIndex: argv['initial-index'],
      indexName: argv['index-name'],
      toHtml: argv['to-html'],
      stdout: process.stdout,
      stderr: process.stderr
    })
  )
})()
