import 'hardhat/types/config'
import 'hardhat/types/runtime'

declare module 'hardhat/types/runtime' {
  // This is an example of an extension to the Hardhat Runtime Environment.
  // This new field will be available in tasks' actions, scripts, and tests.
  export interface Network {
    isDynamic: boolean
    noDeterministicDeployment: boolean
  }
}

declare module 'hardhat/types/config' {
  export interface HardhatNetworkConfig {
    url: string
  }
}
