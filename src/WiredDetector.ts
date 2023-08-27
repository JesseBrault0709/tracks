import { EventBus, TimerManager } from '@jessebrault0709/cube'

const FILTER_TIMER_LENGTH = 3

export type DetectorEvent = {
    detectorName: string
    minecartType: string
    minecartName: string
    primaryColor: number
    secondaryColor: number
    destination: string
}

export type OnDetectParams = {
    event: DetectorEvent
}

export type DetectorConfig = {
    remoteId?: number
    onDetect: (this: void, params: OnDetectParams) => void
}

const wireDetector = (detectorName: string, config: DetectorConfig, eventBus: EventBus, timerManager: TimerManager) => {
    if (config.remoteId !== undefined) {
        eventBus.subscribe('rednet_message', (senderId: number, msg: string) => {
            if (senderId === config.remoteId) {
                const event = textutils.unserialize<DetectorEvent>(msg)
                config.onDetect({
                    event
                })
            }
        })
    }

    let filtering = false

    eventBus.subscribe(
        'minecart',
        (
            eventDetectorName: string,
            minecartType: string,
            minecartName: string,
            primaryColor: number,
            secondaryColor: number,
            destination: string
        ) => {
            if (
                !filtering &&
                eventDetectorName === detectorName &&
                minecartType === 'railcraft.cart.loco.steam.solid'
            ) {
                filtering = true
                timerManager.start(FILTER_TIMER_LENGTH, () => {
                    filtering = false
                })
                config.onDetect({
                    event: {
                        detectorName,
                        minecartType,
                        minecartName,
                        primaryColor,
                        secondaryColor,
                        destination
                    }
                })
            }
        }
    )
}

export const wireDetectors = (
    configs: Record<string, DetectorConfig>,
    eventBus: EventBus,
    timerManager: TimerManager
): void => {
    Object.entries(configs).forEach(([detectorName, config]) => {
        wireDetector(detectorName, config, eventBus, timerManager)
    })
}
