import { EventBus } from 'cube/dist/event-bus'
import { InSignal } from './InSignal'
import { signals } from './signals'

export interface WiredReceiver {
    getInSignal(name: string): InSignal
}

class InSignalImpl implements InSignal {
    private readonly onChangeCallbacks: Array<() => void> = []
    private readonly onOccupiedCallbacks: Array<() => void> = []
    private readonly onClearCallbacks: Array<() => void> = []

    constructor(
        private readonly signalName: string,
        boxName: string,
        private readonly box: DigitalReceiverBox,
        eventBus: EventBus
    ) {
        eventBus.subscribe(
            'aspect_changed',
            (
                eventBoxName: string,
                eventSignalName: string,
                eventAspect: number
            ) => {
                if (
                    eventBoxName === boxName &&
                    eventSignalName === signalName
                ) {
                    if (eventAspect === signals.green) {
                        this.onChangeCallbacks.forEach(cb => cb())
                        this.onClearCallbacks.forEach(cb => cb())
                    } else {
                        this.onChangeCallbacks.forEach(cb => cb())
                        this.onOccupiedCallbacks.forEach(cb => cb())
                    }
                }
            }
        )
    }

    onChange(cb: () => void): void {
        this.onChangeCallbacks.push(cb)
    }

    onOccupied(cb: () => void): void {
        this.onOccupiedCallbacks.push(cb)
    }

    onClear(cb: () => void): void {
        this.onClearCallbacks.push(cb)
    }

    isClear(): boolean {
        return this.box.getAspect(this.signalName) === 1
    }

    isOccupied(): boolean {
        return this.box.getAspect(this.signalName) !== 1
    }
}

export const getWiredReceiver = (
    boxName: string,
    box: DigitalReceiverBox,
    eventBus: EventBus
): WiredReceiver => new WiredReceiverImpl(boxName, box, eventBus)

class WiredReceiverImpl implements WiredReceiver {
    private readonly inSignals: Record<string, InSignal> = {}

    constructor(
        private readonly boxName: string,
        box: DigitalReceiverBox,
        eventBus: EventBus
    ) {
        box.getSignalNames().forEach(signalName => {
            this.inSignals[signalName] = new InSignalImpl(
                signalName,
                this.boxName,
                box,
                eventBus
            )
        })
    }

    getInSignal(name: string): InSignal {
        if (this.inSignals[name] !== undefined) {
            return this.inSignals[name]
        } else {
            throw `no such InSignal '${name}' in box '${this.boxName}'`
        }
    }
}
