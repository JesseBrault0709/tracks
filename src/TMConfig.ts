import { EventBus } from 'cube/dist/event-bus'
import { TimerManager } from 'cube/dist/timerManager'
import { Logger } from 'cube/dist/logger/Logger'
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
