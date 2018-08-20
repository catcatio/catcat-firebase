import { EventEmitter } from 'events'
const { performance, PerformanceObserver } = require('perf_hooks')
const debug = require('debug')('stopwatch')

const startMarkName = (featureName) => `start:${featureName}`
const endMarkName = (featureName) => `end:${featureName}`

type LogWritter = (message?: any, ...params: any[]) => any

class StopWatch extends EventEmitter {
  private _logWriter: LogWritter
  private _obs
  static _instance: StopWatch
  constructor({ LogWritter: logWritter = null } = {}) {
    super()

    this._logWriter = logWritter || debug
    this._obs = this._initObserver()
  }

  _initObserver() {
    const obs = new PerformanceObserver((items) => {
      items.getEntries().forEach(item => this.emit(item.name, item))
    })
    obs.observe({ entryTypes: ['measure'], buffered: true })
    return obs
  }

  close() {
    this._obs.disconnect()
  }

  static create(featureName): StopWatchClient {
    if (!StopWatch._instance) {
      StopWatch._instance = new StopWatch()
    }

    return new StopWatchClient(StopWatch._instance, featureName, StopWatch._instance._logWriter)
  }

  static close() {
    StopWatch._instance && StopWatch._instance._obs.disconnect()
  }
}

interface IStopWatchClient {
  start(): StopWatchClient
  end(): StopWatchClient
  clear(): StopWatchClient
}

class StopWatchClient extends EventEmitter implements IStopWatchClient {
  private _featureName: string
  private _startMarkName: string
  private _endMarkName: string
  private _logWritter: LogWritter
  private _parent: EventEmitter

  constructor(parent: EventEmitter, featureName: string, logWritter: LogWritter) {
    super()
    this._featureName = featureName
    this._startMarkName = startMarkName(featureName)
    this._endMarkName = endMarkName(featureName)
    this._logWritter = logWritter
    this._parent = parent

    this.onMeasure = this.onMeasure.bind(this)
    this._parent.addListener(this._featureName, this.onMeasure)
  }

  private onMeasure(item) {
    this._logWritter(`${item.name} took ${item.duration.toFixed(3)} ms`)
    this.emit('measure', item)
  }

  start(): StopWatchClient {
    performance.mark(this._startMarkName)
    return this
  }

  end(): StopWatchClient {
    performance.mark(this._endMarkName)
    performance.measure(this._featureName, this._startMarkName, this._endMarkName)
    return this
  }

  clear(): StopWatchClient {
    setTimeout(() => {
      performance.clearMarks(this._startMarkName)
      performance.clearMarks(this._endMarkName)
      performance.clearMeasures(this._featureName)
      this._parent.removeListener(this._featureName, this.onMeasure)
    }, 5000)

    return this
  }
}

export {
  StopWatch, IStopWatchClient, LogWritter
}