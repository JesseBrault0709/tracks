import { EventBus, TimerManager, Logger } from '@jessebrault0709/cube'
import { WiredController } from './WiredController'
import { WiredReceiver } from './WiredReceiver'

export type ConfigureParams = {
    wiredController: WiredController
    wiredReceiver: WiredReceiver
    eventBus: EventBus
    timerManager: TimerManager
    logger: Logger
}

export type TMConfigFile = {
    configure: (this: void, params: ConfigureParams) => void
}
