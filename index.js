const {EventEmitter} = require('events')


class Entry {

  constructor({device, processName, processID, level, message}) {
    this.device = device
    this.processName = processName
    this.processID = processID
    this.level = level
    this.message = message
  }

}


class Reader extends EventEmitter {

  constructor(stream, {processFilter, deviceFilter} = {}) {
    super()
    this.stream = stream
    this.deviceFilter = deviceFilter || {}
    this.processFilter = processFilter || {}
    this.buffer = new Buffer('')
  }

  start() {
    this.stream.on('data', data => {
      if (data.indexOf('[') == 0 || data.indexOf('Exiting') == 0) {
        return
      }
      let str = this.buffer.toString().replace(/\s*$/, '')
      if (data.toString().indexOf('Oct') == 0) {
        if (str.length > 25) {
          const month = str.substr(0, 3)
          str = str.slice(4)
          const day = str.substr(0, 2)
          str = str.slice(3)
          const hour = str.substr(0, 2)
          str = str.slice(3)
          const minute = str.substr(0, 2)
          str = str.slice(3)
          const second = str.substr(0, 2)
          str = str.slice(3)
          const device = str.split(' ', 1)[0]
          str = str.slice(device.length + 1)
          const process = str.split(' ', 1)[0]
          const processName = process.replace(/\[\d+\]$/, '')
          const processID = parseInt(/\[(\d+)\]$/.exec(process)[1])
          str = str.slice(process.length + 1)
          const level = str.split(' ', 1)[0].replace(/[<>:]/g, '')
          const message = str.slice(level.length + 4)
          const entry = new Entry({device, processName, processID, level, message})
          if (this._satisfyCondition(entry)) {
            this.emit('entry', entry)
          }
        }
        this.buffer = data
      } else {
        this.buffer = Buffer.concat([this.buffer, data])
      }
    })
  }

  _satisfyCondition(entry) {
    const deviceFilterKeys = Object.keys(this.deviceFilter)
    if (deviceFilterKeys.length > 0 && !deviceFilterKeys.includes(entry.device)) {
      return false
    }
    const processFilterKeys = Object.keys(this.processFilter)
    if (processFilterKeys.length > 0 && !processFilterKeys.includes(entry.processName)) {
      return false
    }
    return true
  }

}

module.exports = {Reader}