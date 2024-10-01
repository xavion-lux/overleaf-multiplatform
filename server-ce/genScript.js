const services = require('./services')

console.log('#!/bin/bash')
console.log('set -ex')

switch (process.argv.pop()) {
  case 'install':
    console.log('npm ci --omit=dev --maxsockets 1')
    break
  case 'compile':
    for (const service of services) {
      console.log('pushd', `services/${service.name}`)
      switch (service.name) {
        case 'web':
          // Avoid downloading of cypress
          console.log('export CYPRESS_INSTALL_BINARY=0')

          // install webpack and frontend dependencies
          console.log('npm ci --include=dev --maxsockets 1')
          // run webpack
          console.log('npm run webpack:production')
          // uninstall webpack and frontend dependencies
          console.log('npm ci --omit=dev --maxsockets 1')
          // precompile pug
          console.log('npm run precompile-pug')
          break
        default:
          console.log(`echo ${service.name} does not require a compilation`)
      }
      console.log('popd')
    }
    break
  default:
    console.error('unknown command')
    console.log('exit 101')
    process.exit(101)
}
