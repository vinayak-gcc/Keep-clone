import { writable , derived } from 'svelte/store';

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


export const notes = writable<Array<{
  id: number;
  title: string;
  content: string;
  color: string;
  image?: string | null;
  pinned: boolean;
  user_email: string;
  created_at?: string;
  trashed: boolean;
  archived: boolean;
}>>([]);

export const pinnedNotes = derived(notes, $notes => 
  $notes.filter(n => n.pinned && !n.trashed && !n.archived)
);

export const unpinnedNotes = derived(notes, $notes => 
  $notes.filter(n => !n.pinned && !n.trashed && !n.archived)
);