import { deployContract, MockProvider } from 'ethereum-waffle'
import { BigNumber } from 'ethers'

import BuniCornFactory from '../src/abis/BuniCornFactory.json'
import BuniCornRouter02 from './artifacts/BuniCornRouter02.json'
import ERC20 from './artifacts/TestToken.json'
import WBNB from './artifacts/WBNB9.json'
import { Fetcher } from '../src'

describe('integration', () => {
  it('fetch', async () => {
    const provider = new MockProvider()

    const [wallet] = provider.getWallets()
    let factory = await deployContract(wallet, BuniCornFactory, [wallet.address])
    let wbnb = await deployContract(wallet, WBNB, [])
    let router = await deployContract(wallet, BuniCornRouter02, [factory.address, wbnb.address])
    await factory.setRouter(router.address)

    const tokens = []
    for (let i = 0; i < 3; i++) {
      let token = await deployContract(wallet, ERC20, ['test', 'TST', BigNumber.from(10).pow(18)])
      tokens.push(token)
      await token.approve(router.address, BigNumber.from(10).pow(18))
    }

    let token0 = await Fetcher.fetchTokenData(1, tokens[0].address, provider)
    let token1 = await Fetcher.fetchTokenData(1, tokens[1].address, provider)
    let pairs = await Fetcher.fetchPairData(token0, token1, factory.address, provider)
    expect(pairs.length === 0)

    await router.addLiquidityNewPool(
      tokens[0].address,
      tokens[1].address,
      BigNumber.from(10000),
      BigNumber.from(10).pow(6),
      BigNumber.from(10).pow(6),
      BigNumber.from(0),
      BigNumber.from(0),
      wallet.address,
      BigNumber.from(10).pow(18)
    )
    await router.addLiquidityNewPool(
      tokens[0].address,
      tokens[1].address,
      BigNumber.from(20000),
      BigNumber.from(10).pow(6),
      BigNumber.from(10).pow(6),
      BigNumber.from(0),
      BigNumber.from(0),
      wallet.address,
      BigNumber.from(10).pow(18)
    )

    pairs = await Fetcher.fetchPairData(token0, token1, factory.address, provider)
    expect(pairs.length === 2)
  })
})
