import { InSignal } from './InSignal'
import { Interlock, wireInterlocks } from './Interlock'
import { OutSignal } from './OutSignal'
import { Logger } from '@jessebrault0709/cube/dist/logger/Logger'

describe('Interlock', () => {
    const logger = new Logger(msg => {
        print(msg)
    }, 'trace')

    let inSignalClear: boolean
    let inSignalCallbacks: Array<() => void>
    let inSignalClearCallbacks: Array<() => void>
    let inSignalOccupiedCallbacks: Array<() => void>
    const inSignal = {
        name: 'inSignal',
        onChange: cb => {
            inSignalCallbacks.push(cb)
        },
        onClear: cb => {
            inSignalClearCallbacks.push(cb)
        },
        onOccupied: cb => {
            inSignalOccupiedCallbacks.push(cb)
        },
        isClear: () => inSignalClear,
        isOccupied: () => !inSignalClear,
        triggerCallbacks: () => {
            inSignalCallbacks.forEach(cb => cb())
            if (inSignalClear) {
                inSignalClearCallbacks.forEach(cb => cb())
            } else {
                inSignalOccupiedCallbacks.forEach(cb => cb())
            }
        }
    } satisfies InSignal & { triggerCallbacks: () => void }

    let outSignalGreen: boolean
    const outSignal: OutSignal = {
        name: 'outSignal',
        setGreen: () => {
            outSignalGreen = true
        },
        setRed: () => {
            outSignalGreen = false
        }
    }

    let underTest: Interlock

    before_each(() => {
        inSignalClear = true
        outSignalGreen = false

        inSignalCallbacks = []
        inSignalClearCallbacks = []
        inSignalOccupiedCallbacks = []

        const interlocks = wireInterlocks({
            underTest: {
                inSignals: [inSignal],
                outSignals: [outSignal],
                logger
            }
        })
        underTest = interlocks.underTest
    })

    test('it queues and immediately dispatches train', () => {
        const setGreenSpy = spy.on(outSignal, 'setGreen')
        assert.is_false(outSignalGreen)
        underTest.queueGreen(outSignal, [inSignal])
        assert.is_true(outSignalGreen)
        assert.spy(setGreenSpy).was.called(1)
    })

    test('it queues but does not dispatch train if not clear', () => {
        inSignalClear = false
        assert.is_false(outSignalGreen)
        underTest.queueGreen(outSignal, [inSignal])
        assert.is_false(outSignalGreen)
    })

    test('it queues, does not immediately dispatch, but does after clearing', () => {
        const setGreenSpy = spy.on(outSignal, 'setGreen')

        inSignalClear = false
        assert.is_false(outSignalGreen)
        underTest.queueGreen(outSignal, [inSignal])
        assert.is_false(outSignalGreen)
        inSignalClear = true
        inSignal.triggerCallbacks()
        assert.is_true(outSignalGreen)
        assert.spy(setGreenSpy).was.called(1)
    })

    test('it queues, immediately dispatches, then sets red after no longer clear (train entered)', () => {
        const setGreenSpy = spy.on(outSignal, 'setGreen')
        const setRedSpy = spy.on(outSignal, 'setRed')

        assert.is_false(outSignalGreen)
        underTest.queueGreen(outSignal, [inSignal])
        assert.is_true(outSignalGreen)
        assert.spy(setGreenSpy).was.called(1)

        inSignalClear = false
        inSignal.triggerCallbacks()

        assert.is_false(outSignalGreen)
        assert.spy(setRedSpy).was.called(1)
    })

    test('it queues, immediatley dispatches, sets red on train enter, then stays red when clear', () => {
        const setGreenSpy0 = spy.on(outSignal, 'setGreen')
        const setRedSpy = spy.on(outSignal, 'setRed')

        assert.is_false(outSignalGreen)
        underTest.queueGreen(outSignal, [inSignal])
        assert.is_true(outSignalGreen)
        assert.spy(setGreenSpy0).was.called(1)

        inSignalClear = false
        inSignal.triggerCallbacks()

        assert.is_false(outSignalGreen)
        assert.spy(setRedSpy).was.called(1)

        const setGreenSpy1 = spy.on(outSignal, 'setGreen')
        inSignalClear = true
        inSignal.triggerCallbacks()
        assert.is_false(outSignalGreen)
        assert.spy(setGreenSpy1).was.called(0)
    })
})
