export const epochToIso = (epoch: number): string =>
  new Date(epoch * 1000).toISOString()

export const isoToEpoch = (iso: string): number =>
  Math.floor(new Date(iso).getTime() / 1000)
