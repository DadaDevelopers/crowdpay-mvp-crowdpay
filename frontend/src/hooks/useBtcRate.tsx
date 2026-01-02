import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface BtcRate {
  btcToKes: number;
  kesToSats: number; // Sats per KES
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

// Fetch BTC to KES rate from CoinGecko
const fetchBtcToKesRate = async (): Promise<number> => {
  try {
    // CoinGecko API: Get BTC price in KES
    // Using simple API endpoint (no API key needed for basic usage)
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=kes",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch BTC rate");
    }

    const data = await response.json();
    const rate = data.bitcoin?.kes;

    if (!rate || rate <= 0) {
      throw new Error("Invalid rate received");
    }

    return rate;
  } catch (error) {
    console.error("Error fetching BTC rate:", error);
    // Fallback to approximate rate if API fails
    return 11634460.06;
  }
};

export const useBtcRate = (): BtcRate => {
  const { data: btcToKesRate, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["btcToKesRate"],
    queryFn: fetchBtcToKesRate,
    staleTime: 60000, // Consider data stale after 1 minute
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
    retryDelay: 1000,
  });

  // Calculate sats per KES (1 BTC = 100,000,000 sats)
  const kesToSats = btcToKesRate ? 100000000 / btcToKesRate : 0;

  return {
    btcToKes: btcToKesRate || 11634460.06, // Fallback rate
    kesToSats: kesToSats || 8.59, // Fallback: 100M / 11,634,460 ≈ 8.59 sats per KES
    loading: isLoading,
    error: error as Error | null,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
};

// Helper function to convert BTC to KES
export const btcToKes = (btc: number, rate: number): number => {
  return Math.round(btc * rate);
};

// Helper function to convert KES to Sats
export const kesToSats = (kes: number, rate: number): number => {
  // rate is sats per KES
  return Math.round(kes * rate);
};

// Helper function to convert Sats to KES
export const satsToKes = (sats: number, rate: number): number => {
  // rate is sats per KES
  return sats / rate;
};

