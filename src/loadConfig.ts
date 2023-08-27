import { TMConfigFile, ConfigureParams } from './TMConfig'

export const doTMConfig = (
    configName: string,
    params: ConfigureParams
): void => {
    try {
        const configure: TMConfigFile['configure'] =
            require(`tm-configs.${configName}`).configure
        configure(params)
    } catch (err) {
        throw `Error while loading tmConfig '${configName}': ${err}`
    }
}
