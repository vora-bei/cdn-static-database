/// <reference types="node" />

declare module 'n-gram' {
  export default function nGram(n: number): <T extends string | string[]>(value: T) => T[];
}
