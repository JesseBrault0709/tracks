import { InSignal } from './InSignal'
import { OutSignal } from './OutSignal'

export type Interlock = {
    name: string
    queueGreen: (outSignal: OutSignal, checkSignals: ReadonlyArray<InSignal>, cb?: () => void) => void
    setAllRed: () => void
}

export type InterlockConfig = {
    inSignals: ReadonlyArray<InSignal>
    outSignals: ReadonlyArray<OutSignal>
}

export const wireInterlocks = <C extends { [interlockName: string]: InterlockConfig }>(
    configs: C
): { [K in keyof C]: Interlock } => {
    const result: Record<string, Interlock> = {}

    Object.entries(configs).forEach(([interlockName, config]) => {
        result[interlockName] = new InterlockImpl(interlockName, config.inSignals, config.outSignals)
    })

    return result as { [K in keyof C]: Interlock }
}

type QueuedGreen = {
    outSignal: OutSignal
    checkSignals: ReadonlyArray<InSignal>
    cb?: () => void
}

class InterlockImpl implements Interlock {
    private greenQueue: QueuedGreen[] = []

    constructor(
        public readonly name: string,
        private readonly inSignals: ReadonlyArray<InSignal>,
        private readonly outSignals: ReadonlyArray<OutSignal>
    ) {
        this.inSignals.forEach(inSignal => {
            inSignal.onClear(() => {
                this.doQueue()
            })

            inSignal.onOccupied(() => this.setAllRed())
        })

        this.setAllRed()
    }

    private formatMsg(msg: any): string {
        return `Interlock ${this.name}: ${msg}`
    }

    private tryGreen(queuedGreen: QueuedGreen): boolean {
        const isClear = queuedGreen.checkSignals.reduce<boolean>(
            (prev, checkSignal) => prev && checkSignal.isClear(),
            true
        )
        if (isClear) {
            queuedGreen.outSignal.setGreen()
            if (queuedGreen.cb !== undefined) {
                queuedGreen.cb()
            }
            return true
        } else {
            return false
        }
    }

    private doQueue() {
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
    }

    queueGreen(outSignal: OutSignal, checkSignals: ReadonlyArray<InSignal>, cb?: () => void) {
        this.greenQueue = [...this.greenQueue, { outSignal, checkSignals, cb }]
        this.doQueue()
    }

    setAllRed() {
        this.outSignals.forEach(outSignal => {
            outSignal.setRed()
        })
    }
}
