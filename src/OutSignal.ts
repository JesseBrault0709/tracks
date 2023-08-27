import { WiredController } from './WiredController'

export interface OutSignal {
    name: string
    setGreen(): void
    setRed(): void
}

export const getOutSignals = <T extends Record<string, string>>(
    wiredController: WiredController,
    outSignals: T
): { [K in keyof T]: OutSignal } => {
    const result: Record<string, OutSignal> = {}
    Object.entries(outSignals).forEach(([keyName, outSignalName]) => {
        result[keyName] = wiredController.getOutSignal(outSignalName)
    })
    return result as { [K in keyof T]: OutSignal }
}
