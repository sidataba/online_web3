import { useState, useEffect } from 'react';
import { useEnsName, useEnsAddress, useEnsAvatar } from 'wagmi';

/**
 * Custom hook for ENS resolution
 */
export function useENS(addressOrName) {
  const [resolvedData, setResolvedData] = useState({
    address: null,
    name: null,
    avatar: null,
    isLoading: true
  });

  // Check if input is an address or name
  const isAddress = addressOrName?.startsWith('0x');

  // Resolve ENS name from address
  const { data: ensName, isLoading: nameLoading } = useEnsName({
    address: isAddress ? addressOrName : undefined,
    enabled: isAddress
  });

  // Resolve address from ENS name
  const { data: ensAddress, isLoading: addressLoading } = useEnsAddress({
    name: !isAddress ? addressOrName : undefined,
    enabled: !isAddress
  });

  // Get avatar
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || (!isAddress ? addressOrName : undefined)
  });

  useEffect(() => {
    if (isAddress) {
      setResolvedData({
        address: addressOrName,
        name: ensName || null,
        avatar: ensAvatar || null,
        isLoading: nameLoading
      });
    } else {
      setResolvedData({
        address: ensAddress || null,
        name: addressOrName,
        avatar: ensAvatar || null,
        isLoading: addressLoading
      });
    }
  }, [addressOrName, ensName, ensAddress, ensAvatar, isAddress, nameLoading, addressLoading]);

  return resolvedData;
}

/**
 * Format address or ENS name for display
 */
export function formatAddressOrENS(addressOrName, ensName) {
  if (ensName) return ensName;
  if (!addressOrName) return '';
  return `${addressOrName.slice(0, 6)}...${addressOrName.slice(-4)}`;
}
