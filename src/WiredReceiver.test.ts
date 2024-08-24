import { EventBus } from '@jessebrault0709/cube/dist/event-bus/index'
import { TimerManager } from '@jessebrault0709/cube/dist/timerManager/index'
import { signals } from './signals'
import { getWiredReceiver } from './WiredReceiver'

describe('InSignal tests', () => {
    let box: DigitalReceiverBox
    let eventBus: EventBus
    let timerManager: TimerManager

    setup(() => {
        const signalStates = {
            testSignal: signals.green
        }
        box = {
            getAspect(signalName) {
                if (signalName === 'testSignal') {
                    return signalStates.testSignal
                } else {
                    throw `No such signal: ${signalName}`
                }
            },
            getMostRestrictiveAspect() {
                return signalStates.testSignal
            },
            getSignalNames() {
                return ['testSignal']
            }
        }

        eventBus = new EventBus()
        timerManager = new TimerManager(() => 0, eventBus)
    })

    it('filters spurious aspect_changed events', () => {
        const receiver = getWiredReceiver('testReceiverBox', box, timerManager, 1, eventBus)

        const inSignal = receiver.getInSignal('testSignal')
        const spyCb = spy.new(() => {})
        inSignal.onChange(spyCb)

        eventBus.dispatch('aspect_changed', 'testReceiverBox', 'testSignal', signals.red)
        eventBus.dispatch('aspect_changed', 'testReceiverBox', 'testSignal', signals.red)
        eventBus.dispatch('timer', 0)
        eventBus.dispatch('aspect_changed', 'testReceiverBox', 'testSignal', signals.green)
        assert.spy(spyCb).was.called(2)
    })
})
