import AggressiveTokenizer from 'natural/lib/natural/tokenizers/aggressive_tokenizer';

let tokenizer;

export function getTokenizer() {
  if (!tokenizer) {
    tokenizer = new AggressiveTokenizer();
  }
  return tokenizer;
}