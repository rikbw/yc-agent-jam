import { Metorial } from 'metorial';

const globalForMetorial = globalThis as unknown as {
  metorial: Metorial | undefined;
};

export const metorial = globalForMetorial.metorial ?? new Metorial({
  apiKey: process.env.METORIAL_API_KEY!
});

if (process.env.NODE_ENV !== "production") globalForMetorial.metorial = metorial;

