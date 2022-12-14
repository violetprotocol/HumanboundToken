import { BigNumber, providers } from "ethers";
import { useCallback, useEffect, useState } from "react";

import { AlchemyNetworkNames, Web3ChainReference, humanboundDeployments } from "./deployments";
import { IHumanboundToken, IHumanboundToken__factory } from "./types";

type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};
type AlchemyAPIKeyConfig = PartialRecord<
  | Web3ChainReference.EIP155_ETHEREUM_MAINNET
  | Web3ChainReference.EIP155_ETHEREUM_RINKEBY
  | Web3ChainReference.EIP155_ETHEREUM_KOVAN
  | Web3ChainReference.EIP155_OPTIMISM
  | Web3ChainReference.EIP155_OPTIMISM_GOERLI
  | Web3ChainReference.EIP155_ARBITRUM_ONE
  | Web3ChainReference.EIP155_ARBITRUM_GOERLI
  | Web3ChainReference.EIP155_POLYGON_MAINNET
  | Web3ChainReference.EIP155_POLYGON_MUMBAI,
  string
>;

export const useHumanbound = (alchemyConfig: AlchemyAPIKeyConfig) => {
  const [humanboundContract, setHumanboundContract] = useState<IHumanboundToken>();

  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("useHumanbound: your browser does not support injected web3 provider");

  const [chainId, setChainId] = useState<number>(ethereum.networkVersion);

  useEffect(() => {
    ethereum?.on("chainChanged", (chainId: string) => {
      setChainId(parseInt(chainId, 16));
    });
  }, []);

  useEffect(() => {
    if (ethereum.networkVersion === 0) return;
    if (!alchemyConfig[chainId as Web3ChainReference])
      throw new Error(`useHumanbound: missing apikey for chainId ${chainId}`);
    const provider = new providers.JsonRpcProvider(
      `https://${AlchemyNetworkNames[chainId as Web3ChainReference]}.g.alchemy.com/v2/${
        alchemyConfig[chainId as Web3ChainReference]
      }`,
    );

    const humanbound = IHumanboundToken__factory.connect(
      humanboundDeployments[chainId as Web3ChainReference],
      provider,
    );

    setHumanboundContract(humanbound);
  }, [chainId]);

  const hasHBT = useCallback(
    async (address: string) => {
      if (!humanboundContract) throw new Error("hasHBT: contract is null, check your usage of useHumanbound");
      return (await humanboundContract.callStatic.balanceOf(address)).gt(0);
    },
    [humanboundContract],
  );

  const getHBTIdOfOwner = useCallback(
    async (address: string) => {
      if (!humanboundContract) throw new Error("getHBTIdOfOwner: contract is null, check your usage of useHumanbound");

      const filter = humanboundContract.filters.Minted(address, null);
      const events = await humanboundContract.queryFilter(filter);

      if (events.length == 0) return BigNumber.from(null);
      return events[0].args[1];
    },
    [humanboundContract],
  );

  const getOwnerOf = useCallback(
    async (tokenId: BigNumber) => {
      if (!humanboundContract) throw new Error("getOwnerOf: contract is null, check your usage of useHumanbound");
      return await humanboundContract.callStatic.ownerOf(tokenId);
    },
    [humanboundContract],
  );

  return humanboundContract
    ? { hasHBT, getHBTIdOfOwner, getOwnerOf }
    : { hasHBT: undefined, getHBTIdOfOwner: undefined, getOwnerOf: undefined };
};
