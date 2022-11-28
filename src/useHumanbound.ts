import { BigNumber, getDefaultProvider, providers } from "ethers";
import { useCallback, useEffect, useState } from "react";

import { Web3ChainReference, humanboundDeployments } from "./deployments";
import { GetterLogic__factory, IHumanboundToken, IHumanboundToken__factory } from "./types";

interface UseHumanboundInitializer {
  infuraKey?: string;
  alchemyKey?: string;
}

export const useHumanbound = ({ infuraKey, alchemyKey }: UseHumanboundInitializer) => {
  const [chainId, setChainId] = useState<number>(0);
  const [humanboundContract, setHumanboundContract] = useState<IHumanboundToken>();

  if (!infuraKey && !alchemyKey) throw new Error("useHumanbound: provide `infuraKey` or `alchemyKey`");

  const ethereum = (window as any).ethereum;

  if (!ethereum) throw new Error("useHumanbound: your browser does not support injected web3 provider");
  ethereum.on("chainChanged", (chainId: string) => {
    setChainId(parseInt(chainId));
  });
  ethereum.on("connect", ({ chainId }: { chainId: string }) => {
    setChainId(parseInt(chainId));
  });

  useEffect(() => {
    let provider: providers.Provider;
    if (infuraKey) provider = new providers.InfuraProvider(chainId, infuraKey);
    else provider = new providers.AlchemyProvider(chainId, alchemyKey);

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
    async (address: string, tokenId: BigNumber) => {
      if (!humanboundContract) throw new Error("hasHBT: contract is null, check your usage of useHumanbound");

      const filter = humanboundContract.filters.Minted(address, null);
      const events = await humanboundContract.queryFilter(filter);

      if (events.length == 0) return undefined;
      return events[0].args[1];
    },
    [humanboundContract],
  );

  const getOwnerOf = useCallback(
    async (tokenId: BigNumber) => {
      if (!humanboundContract) throw new Error("hasHBT: contract is null, check your usage of useHumanbound");
      return await humanboundContract.callStatic.ownerOf(tokenId);
    },
    [humanboundContract],
  );

  return { hasHBT, getHBTIdOfOwner, getOwnerOf };
};
