const prettyHrTime = require('pretty-hrtime')
const hrtime = process.hrtime

type HrTimeResult = [number, number]

type Markers = {
  [event: string]: Marker;
}

class Marker {
  private _start: HrTimeResult
  private _duration: HrTimeResult = [0, 0]

  constructor(public featureName, public name) {
    this._start = hrtime()
  }

  public end(): Marker {
    this._duration = hrtime(this._start)
    return this
  }

  public get start(): HrTimeResult {
    return this._start
  }

  public get duration(): number {
    return (this._duration[0] + this._duration[1] / 1e9) * 1000
  }

  public get durationString() {
    return prettyHrTime(this._duration)
  }

  public log(msg?: string): Marker {
    console.log(msg || `${this.featureName}:${this.name} took `, this.durationString)
    return this
  }
}

class HrtimeMarker {
  private _marker: Markers

  constructor(public featureName: string) {
    this._marker = {}
    this.mark('all')
  }

  mark(name: string): Marker {
    return this._marker[name] = new Marker(this.featureName, name)
  }

  end(): Marker {
    return this._marker['all']
      .end()
  }

  static create(featureName): HrtimeMarker {
    return new HrtimeMarker(featureName)
  }
}

export {
  HrtimeMarker, Marker
}