export enum Web3ChainReference {
  // Ethereum
  EIP155_ETHEREUM_MAINNET = 1,
  EIP155_ETHEREUM_RINKEBY = 4,
  EIP155_ETHEREUM_KOVAN = 42,
  // Optimism
  EIP155_OPTIMISM = 10,
  EIP155_OPTIMISM_GOERLI = 420,
  // Arbitrum
  EIP155_ARBITRUM_ONE = 42161,
  EIP155_ARBITRUM_GOERLI = 421613,
  // Polygon
  EIP155_POLYGON_MAINNET = 137,
  EIP155_POLYGON_MUMBAI = 80001,
}

export const humanboundDeployments: Record<Web3ChainReference, string> = {
  [Web3ChainReference.EIP155_ETHEREUM_MAINNET]: "0x594E5550ecE2c10e5d580e538871914F55884f5d",

  [Web3ChainReference.EIP155_ETHEREUM_RINKEBY]: "0x88339f95a4d7daaf868bd44eafac0559be946589",

  [Web3ChainReference.EIP155_ETHEREUM_KOVAN]: "0x6b591325Db5Bc220F98B6f09bD0C4E60B12821A6",

  [Web3ChainReference.EIP155_OPTIMISM]: "0xFF439bA52825Ffd65E39Fd2bF519566d0cd91827",

  [Web3ChainReference.EIP155_OPTIMISM_GOERLI]: "0x5e5007bdd3eb92575499e17eabdd411b42cf79c0",

  [Web3ChainReference.EIP155_ARBITRUM_ONE]: "0x5beB956A9Af054956c5C6c0aFac7b109236f86Aa",

  [Web3ChainReference.EIP155_ARBITRUM_GOERLI]: "0x8d39Fe83eD158F1B7e21A6434e0878D6c11F02B9",

  [Web3ChainReference.EIP155_POLYGON_MAINNET]: "0x41be3a6c17cf76442d9e7b150de4870027d36f52",

  [Web3ChainReference.EIP155_POLYGON_MUMBAI]: "0x1888649d566908e0a4ac17978740f6a04f600a51",
};

export const AlchemyNetworkNames: Record<Web3ChainReference, string> = {
  [Web3ChainReference.EIP155_ETHEREUM_MAINNET]: "eth-mainnet",

  [Web3ChainReference.EIP155_ETHEREUM_RINKEBY]: "deprecated",

  [Web3ChainReference.EIP155_ETHEREUM_KOVAN]: "deprecated",

  [Web3ChainReference.EIP155_OPTIMISM]: "opt-mainnet",

  [Web3ChainReference.EIP155_OPTIMISM_GOERLI]: "opt-goerli",

  [Web3ChainReference.EIP155_ARBITRUM_ONE]: "arb-mainnet",

  [Web3ChainReference.EIP155_ARBITRUM_GOERLI]: "arb-goerli",

  [Web3ChainReference.EIP155_POLYGON_MAINNET]: "polygon-mainnet",

  [Web3ChainReference.EIP155_POLYGON_MUMBAI]: "polygon-mumbai",
};
