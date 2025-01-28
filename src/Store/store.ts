import { writable } from 'svelte/store';

const initialValue = typeof window !== 'undefined' 
  ? localStorage.getItem('gridLayout') === 'true'
  : false;

export const gridLayout = writable(initialValue);

if (typeof window !== 'undefined') {
  gridLayout.subscribe(value => {
    localStorage.setItem('gridLayout', value.toString());
  });
}

export const session = writable({
  user: null
});

export const theme = writable<'light' | 'dark'>('light');
