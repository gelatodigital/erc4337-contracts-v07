import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const deployEntryPoint: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()

  const ret = await hre.deployments.deploy('EntryPoint', {
    from,
    args: [],
    gasLimit: 6e6,
    deterministicDeployment: process.env.SALT ?? true,
    log: true
  })
  console.log('==entrypoint addr=', ret.address)
}

export default deployEntryPoint
