import { Logger } from '@jessebrault0709/cube'
import { InSignal } from './InSignal'
import { OutSignal } from './OutSignal'

export type Interlock = {
    name: string
    queueGreen: (
        outSignal: OutSignal,
        checkSignals: ReadonlyArray<InSignal>,
        cb?: () => void,
        debugName?: string
    ) => void
    setAllRed: () => void
}

export type InterlockConfig = {
    inSignals: ReadonlyArray<InSignal>
    outSignals: ReadonlyArray<OutSignal>
    logger: Logger
}

export const wireInterlocks = <C extends { [interlockName: string]: InterlockConfig }>(
    configs: C
): { [K in keyof C]: Interlock } => {
    const result: Record<string, Interlock> = {}

    Object.entries(configs).forEach(([interlockName, config]) => {
        result[interlockName] = new InterlockImpl(interlockName, config.inSignals, config.outSignals, config.logger)
    })

    return result as { [K in keyof C]: Interlock }
}

type QueuedGreen = {
    outSignal: OutSignal
    checkSignals: ReadonlyArray<InSignal>
    cb?: () => void
    debugName?: string
}

const formatGreenQueue = (greenQueue: ReadonlyArray<QueuedGreen>) => {
    let acc = ''
    for (let i = 0; i < greenQueue.length; i++) {
        if (i > 0) {
            acc += ', '
        }
        const { debugName, outSignal } = greenQueue[i]
        acc += debugName ?? outSignal.name
    }
    return acc
}

class InterlockImpl implements Interlock {
    private greenQueue: QueuedGreen[] = []

    constructor(
        public readonly name: string,
        private readonly inSignals: ReadonlyArray<InSignal>,
        private readonly outSignals: ReadonlyArray<OutSignal>,
        private readonly logger: Logger
    ) {
        this.inSignals.forEach(inSignal => {
            inSignal.onClear(() => {
                this.logDebug('inSignal cleared, running doQueue...')
                this.doQueue()
            })
            inSignal.onOccupied(() => this.setAllRed())
        })
        this.setAllRed()
    }

    private logDebug(msg: string) {
        this.logger.debug(this.name + ': ' + msg)
    }

    private tryGreen({ checkSignals, outSignal, cb }: QueuedGreen): boolean {
        this.logDebug(`trying green for ${outSignal.name}`)
        for (const checkSignal of checkSignals) {
            if (!checkSignal.isClear()) {
                this.logDebug(`${checkSignal.name} is not clear`)
                return false
            }
        }
        this.logDebug(`setting ${outSignal.name} to green`)
        outSignal.setGreen()
        if (cb !== undefined) {
            cb()
        }
        return true
    }

    private doQueue() {
        this.logDebug(`before doQueue: [${formatGreenQueue(this.greenQueue)}]`)
        const newGreenQueue: QueuedGreen[] = []
        let success = false
        for (const queuedGreen of this.greenQueue) {
            if (success) {
                newGreenQueue.push(queuedGreen)
            } else {
                success = this.tryGreen(queuedGreen)
                if (!success) {
                    newGreenQueue.push(queuedGreen)
                }
            }
        }
        this.greenQueue = newGreenQueue
        this.logDebug(`after doQueue: [${formatGreenQueue(this.greenQueue)}]`)
    }

    queueGreen(outSignal: OutSignal, checkSignals: ReadonlyArray<InSignal>, cb?: () => void, debugName?: string) {
        this.greenQueue = [...this.greenQueue, { outSignal, checkSignals, cb, debugName }]
        this.doQueue()
    }

    setAllRed() {
        this.outSignals.forEach(outSignal => {
            outSignal.setRed()
        })
    }
}
