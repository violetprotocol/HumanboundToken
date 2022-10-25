# Humanbound Token

An ERC721-based non-transferable token.

The Humanbound Token is bound to a wallet upon minting with a valid Ethereum Access Token (EAT). A valid issuer can issue the minting rights to a user through an EAT, where only the authorised user is able to mint and make use of the humanbound token. The token can be transferred only in the case of wallet rotation, where the user will authenticate his identity and be issued an EAT that authorises his rotation.

Built from the Extendable variant of ERC721 to allow dynamic modification of the contracts during runtime.

## Usage

### Pre Requisites

Before running any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
variable. Follow the example in `.env.example`. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

```sh
$ yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ yarn typechain
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deploy

To deploy an instance of the Humanbound contract, you first need to deploy or ensure deployment of all necessary Extensions:

- ExtendLogic
- HumanboundPermissionLogic
- HumanboundApproveLogic
- GetterLogic
- OnReceiveLogic
- HumanboundTransferLogic
- ERC721HooksLogic
- HumanboundMintLogic
- HumanboundBurnLogic
- HumanboundTokenURILogic
- GasRefundLogic
- EATVerifierConnector

To deploy all extensions use the hardhat task `deploy:all`:

```sh
$ yarn hardhat --network <network> deploy:all
```

With the deployed Extension addresses, populate the `humanboundConfig` object in the `tasks/deploy/humanbound.ts` file and deploy the Humanbound token:

```sh
$ yarn hardhat --network <network> deploy:humanboundtoken
```
