import { ISpreadIndice, ISharedIndice } from './@types/indice';

interface IOptions<T, P> {
  id: string;
  baseUrl: string;
  deserializeShared: (
    options: { id: string; load(options: Record<string, unknown>): Promise<any> },
    deserialize: (data: any, options?: Record<string, unknown>) => ISpreadIndice<T, P>,
  ) => ISharedIndice<T, P>;
  deserialize: (options: Record<string, unknown>) => ISpreadIndice<T, P>;
}

export const restoreSharedIndices = async <T, P>({ id, baseUrl, deserialize, deserializeShared }: IOptions<T, P>) => {
  const loadChunk = async (options: { id: T }) => {
    const response = await fetch(`${baseUrl}/${id}/chunk_${options.id}.json`);
    return response.json();
  };
  const load = async (options: { id: T }) => {
    const response = await fetch(`${baseUrl}/${id}/index.json`, {
      method: 'GET',
      credentials: 'include',
      mode: 'no-cors',
    });
    return response.json();
  };
  return deserializeShared({ id, load }, options => deserialize({ ...options, load: loadChunk }));
};
