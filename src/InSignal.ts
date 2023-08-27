import { WiredReceiver } from './WiredReceiver'

export interface InSignal {
    onChange(cb: () => void): void
    onClear(cb: () => void): void
    onOccupied(cb: () => void): void

    isClear(): boolean
    isOccupied(): boolean
}

export const getInSignals = <T extends Record<string, string>>(
    wiredReceiver: WiredReceiver,
    inSignals: T
): { [K in keyof T]: InSignal } => {
    const result: Record<string, InSignal> = {}
    Object.entries(inSignals).forEach(([keyName, inSignalName]) => {
        result[keyName] = wiredReceiver.getInSignal(inSignalName)
    })
    return result as { [K in keyof T]: InSignal }
}
