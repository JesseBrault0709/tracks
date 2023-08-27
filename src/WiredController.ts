import { OutSignal } from './OutSignal'
import { signals } from './signals'

export interface WiredController {
    getOutSignal(name: string): OutSignal
}

class OutSignalImpl implements OutSignal {
    constructor(
        public readonly name: string,
        private readonly box: DigitalControllerBox
    ) {}

    setGreen(): void {
        this.box.setAspect(this.name, signals.green)
    }

    setRed(): void {
        this.box.setAspect(this.name, signals.red)
    }
}

export const getWiredController = (
    boxName: string,
    box: DigitalControllerBox
): WiredController => new WiredControllerImpl(boxName, box)

class WiredControllerImpl implements WiredController {
    private readonly outSignals: Record<string, OutSignal> = {}

    constructor(private readonly boxName: string, box: DigitalControllerBox) {
        box.getSignalNames().forEach(signalName => {
            this.outSignals[signalName] = new OutSignalImpl(signalName, box)
        })
    }

    getOutSignal(name: string): OutSignal {
        if (this.outSignals[name] !== undefined) {
            return this.outSignals[name]
        } else {
            throw `no such OutSignal '${name}' in box '${this.boxName}'`
        }
    }
}
