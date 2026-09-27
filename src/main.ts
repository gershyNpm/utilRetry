import '@gershy/clearing';
import defaultRetryable from './defaultRetryable.ts';

export type RetryInp<R> = {
  retry?: (err: any) => boolean,
  fn: (attempt: 1 | 2 | 3 | number) => R,
} & (
  | {
      attempts: number,
      delayMs?: (attempt: 1 | 2 | 3 | number) => number,
    }
  | {
      maxDelayMs: number,
      delayMs: (attempt: 1 | 2 | 3 | number) => number,
    }
)
export default async <R>(inp: RetryInp<R>): Promise<{ val: Awaited<R>, errs: any[] }> => {
  
  // Note that by default, errors are considered retryable if they have a true-ish "retry" property
  
  const { delayMs = null, retry: retryable = defaultRetryable, fn } = inp;
  
  let totalDelay = 0;
  const errs: any[] = [];
  while (true) {
    
    try { return { val: await fn(errs.length), errs }; } catch(err: any) {
      
      errs.push(err);
      if (!retryable(err)) throw err[cl.mod]({ errs });
      
      if (inp[cl.has]('attempts'))
        if (errs.length >= (inp as typeof inp & { attempts: number }).attempts)
          throw Error('retries exhausted')[cl.mod]({ errs });
      
      if (inp[cl.has]('maxDelayMs'))
        if (totalDelay >= (inp as typeof inp & { maxDelayMs: number }).maxDelayMs)
          throw Error('max delay exhausted')[cl.mod]({ errs });
      
      const ms = delayMs?.(errs.length) ?? 0;
      totalDelay += ms;
      if (ms) await new Promise(r => setTimeout(r, ms));
       
    }
    
  }
  
};