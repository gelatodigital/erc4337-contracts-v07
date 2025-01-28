import '@matterlabs/hardhat-zksync-solc'
import '@matterlabs/hardhat-zksync-deploy'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import * as dotenv from 'dotenv'
import 'hardhat-deploy'
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from 'hardhat/builtin-tasks/task-names'
import { extendEnvironment, HardhatUserConfig, subtask, task } from 'hardhat/config'
import path from 'path'
import 'solidity-coverage'
import { verifyRequiredEnvVar } from './src/utils/index'

dotenv.config()

const SALT = '0x90d8084deab30c2a37c45e8d47f49f2f7965183cb6990a98943ef94940681de3'
process.env.SALT = process.env.SALT ?? SALT

task('deploy', 'Deploy contracts').addFlag(
  'simpleAccountFactory',
  'deploy sample factory (by default, enabled only on localhost)'
)

const DEPLOYER_PK = process.env.DEPLOYER_PK
if (DEPLOYER_PK === undefined) {
  throw new Error('DEPLOYER_PK is missing')
}

const accounts: string[] = [DEPLOYER_PK]

const optimizedComilerSettings = {
  version: '0.8.23',
  settings: {
    optimizer: { enabled: true, runs: 1000000 },
    viaIR: true
  }
}

extendEnvironment(hre => {
  if (hre.network.name === 'dynamic') {
    hre.network.isDynamic = true
    const networkName = process.env.HARDHAT_DYNAMIC_NETWORK_NAME as string | undefined
    const networkUrl = process.env.HARDHAT_DYNAMIC_NETWORK_URL as string | undefined
    const noDeterministicDeployment = process.env.HARDHAT_DYNAMIC_NETWORK_NO_DETERMINISTIC_DEPLOYMENT as
      | string
      | undefined

    verifyRequiredEnvVar('HARDHAT_DYNAMIC_NETWORK_NAME', networkName)
    verifyRequiredEnvVar('HARDHAT_DYNAMIC_NETWORK_URL', networkUrl)

    hre.network.name = networkName
    hre.network.config.url = networkUrl
    hre.network.noDeterministicDeployment = noDeterministicDeployment === 'true'
  } else {
    hre.network.isDynamic = false
    hre.network.noDeterministicDeployment = hre.network.config.zksync ?? false
  }
})

subtask(
  TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
  async (
    args: {
      solcVersion: string
    },
    hre,
    runSuper
  ) => {
    // Full list of solc versions: https://github.com/ethereum/solc-bin/blob/gh-pages/bin/list.json
    // Search by the version number in the list, there will be `nightly` versions as well along with the main in the list.json
    // Find the one that is NOT a nightly build, and copy the `path` field in the build object
    // The solidity compiler will be found at `https://github.com/ethereum/solc-bin/blob/gh-pages/bin/${path-field-in-the-build}`
    if (args.solcVersion === '0.8.23') {
      const compilerPath = path.join(__dirname, 'src/solc', 'soljson-v0.8.23+commit.f704f362.js')

      return {
        compilerPath,
        isSolcJs: true,
        version: args.solcVersion,
        longVersion: '0.8.23+commit.f704f362'
      }
    }

    // Only overrides the compiler for version 0.8.23,
    // the runSuper function allows us to call the default subtask.
    return runSuper()
  }
)

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.23',
        settings: {
          optimizer: { enabled: true, runs: 1000000 }
        }
      }
    ],
    overrides: {
      'contracts/core/EntryPoint.sol': optimizedComilerSettings,
      'contracts/samples/SimpleAccount.sol': optimizedComilerSettings
    }
  },

  namedAccounts: {
    deployer: {
      default: '0x7aD7b5F4F0E5Df7D6Aa5444516429AF77babc3A0'
    },
    hardhatDeployer: { default: 0 }
  },

  zksolc: {
    version: '1.5.7',
    compilerSource: 'binary',
    settings: {
      isSystem: false,
      forceEvmla: false,
      optimizer: {
        enabled: true,
        mode: '3'
      },
      suppressedErrors: ['sendtransfer'],
      libraries: {
        'contracts/samples/bls/lib/BLSOpen.sol': {
          BLSOpen: '0xE7265e90a6D5BEEDaE03b83504Cd305f87771C34'
        }
      }
    }
  },
  networks: {
    dev: { url: 'http://localhost:8545' },
    // github action starts localgeth service, for gas calculations
    dynamic: {
      accounts,
      url: ''
    },
    abstract: {
      accounts,
      zksync: true,
      url: 'https://solitary-ultra-emerald.abstract-mainnet.quiknode.pro/7e6af119737a70a9b3d9128931ecf0b72e5658c4/',
      chainId: 2741,
      ethNetwork: 'mainnet'
    }
  },
  mocha: {
    timeout: 10000
  },
  // @ts-ignore
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
}

// coverage chokes on the "compilers" settings
if (process.env.COVERAGE != null) {
  // @ts-ignore
  config.solidity = config.solidity.compilers[0]
}

export default config
