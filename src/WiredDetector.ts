import { EventBus, TimerManager } from '@jessebrault0709/cube'

export interface DetectorEvent {
    detectorName: string
    minecartType: string
    minecartName: string
    primaryColor: number
    secondaryColor: number
    destination: string
}

export interface OnDetectParams {
    event: DetectorEvent
}

export interface DetectorConfig {
    onDetect(params: OnDetectParams): void
}

export interface LocalDetectorConfig extends DetectorConfig {
    detectorName: string
    filterTimerLength: number
}

export const isLocalDetectorConfig = (config: DetectorConfig): config is LocalDetectorConfig =>
    'detectorName' in config &&
    typeof config.detectorName === 'string' &&
    'filterTimerLength' in config &&
    typeof config.filterTimerLength === 'number'

export interface RemoteDetectorConfig extends DetectorConfig {
    remoteId: number
}

export const isRemoteDetectorConfig = (config: DetectorConfig): config is RemoteDetectorConfig =>
    'remoteId' in config && typeof config.remoteId === 'number'

export const wireDetector = (config: DetectorConfig, eventBus: EventBus, timerManager: TimerManager) => {
    if (isRemoteDetectorConfig(config)) {
        eventBus.subscribe('rednet_message', (senderId: number, msg: string) => {
            if (senderId === config.remoteId) {
                const event = textutils.unserialize<DetectorEvent>(msg)
                config.onDetect({
                    event
                })
            }
        })
    } else if (isLocalDetectorConfig(config)) {
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
                    eventDetectorName === config.detectorName &&
                    minecartType === 'railcraft.cart.loco.steam.solid'
                ) {
                    filtering = true
                    timerManager.start(config.filterTimerLength, () => {
                        filtering = false
                    })
                    config.onDetect({
                        event: {
                            detectorName: config.detectorName,
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
}
