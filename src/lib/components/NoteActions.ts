import { supabase } from './Supabase';
import { notes } from '../../Store/store';
import { cache } from './Cache';

export async function loadPinnedNotes(userEmail: string) {
  const cacheKey = `notes:${userEmail}:pinned`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    notes.update(current => {
      const otherNotes = current.filter(n => !n.pinned || n.trashed || n.archived);
      return [...cachedData, ...otherNotes];
    });
  }

  const { data } = await supabase.from('notes')
    .select('*')
    .eq('user_email', userEmail)
    .eq('pinned', true)
    .eq('trashed', false)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (data) {
    notes.update(current => {
      const otherNotes = current.filter(n => !n.pinned || n.trashed || n.archived);
      const newData = [...data, ...otherNotes];
      cache.set(cacheKey, data);
      return newData;
    });
  }
}

export async function loadNotes(userEmail: string) {
  const cacheKey = `notes:${userEmail}:active`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    notes.set(cachedData);
    return;
  }

  const { data } = await supabase.from('notes')
    .select('*')
    .eq('user_email', userEmail)
    .eq('trashed', false)
    .eq('archived', false)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (data) {
    notes.set(data);
    cache.set(cacheKey, data);
  }
}

export async function addNote(newTitle: string, newContent: string, newColor: string, selectedImage: File | string | null, userEmail: string, newPinned: boolean) {
  if (newTitle.trim() && newContent.trim()) {
    let imageUrl: string | null = null;

    try {
      if (selectedImage instanceof File) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage
          .from('note_images')
          .upload(fileName, selectedImage);
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('note_images')
          .getPublicUrl(fileName);
          
        imageUrl = urlData.publicUrl;
      } else if (typeof selectedImage === 'string') {
        imageUrl = selectedImage;
      }

      const { data, error } = await supabase.from('notes')
        .insert([{ 
          title: newTitle, 
          content: newContent, 
          color: newColor,
          image: imageUrl,
          pinned: newPinned,
          user_email: userEmail,
          trashed: false,
          archived: false
        }])
        .select();

      if (error) throw error;

      notes.update(current => [...current, data[0]]);
      cache.invalidateUser(userEmail);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${(error as Error).message}`);
    }
  }
}

export async function updateNoteImage(id: number, file: File, userEmail: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('note_images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('note_images')
      .getPublicUrl(fileName);

    await supabase
      .from('notes')
      .update({ image: urlData.publicUrl })
      .eq('id', id);

    notes.update(current => 
      current.map(note => note.id === id ? { ...note, image: urlData.publicUrl } : note)
    );
    cache.invalidateUser(userEmail);
  } catch (error) {
    console.error('Image update failed:', error);
    alert('Image update failed.');
  }
}

export async function removeNoteImage(id: number, userEmail: string) {
  await supabase
    .from('notes')
    .update({ image: null })
    .eq('id', id);
  
  notes.update(current => 
    current.map(note => note.id === id ? { ...note, image: null } : note)
  );
  cache.invalidateUser(userEmail);
}

export async function trashNote(id: number, userEmail: string) {
  await supabase
    .from('notes')
    .update({ trashed: true })
    .eq('id', id);

  notes.update(current => current.filter(n => n.id !== id));
  cache.invalidateUser(userEmail);
}

export async function archiveNote(id: number, userEmail: string) {
  await supabase
    .from('notes')
    .update({ archived: true })
    .eq('id', id);

  notes.update(current => current.filter(n => n.id !== id));
  cache.invalidateUser(userEmail);
}

export async function updateNote(id: number, title: string, content: string, userEmail: string) {
  const { error } = await supabase
    .from('notes')
    .update({ title, content })
    .eq('id', id)
    .eq('user_email', userEmail)
    .select();

  if (error) {
    console.error("Update failed:", error);
    return;
  }

  notes.update(current => current.map(note => 
    note.id === id ? { ...note, title, content } : note
  ));
  cache.invalidateUser(userEmail);
}

export async function changeNoteColor(id: number, color: string, userEmail: string) {
  await supabase
    .from('notes')
    .update({ color, image: null })
    .eq('id', id)
    .eq('user_email', userEmail);

  notes.update(current => 
    current.map(note => note.id === id ? { ...note, color, image: null } : note)
  );
  cache.invalidateUser(userEmail);
}

export async function deleteNote(id: number, userEmail: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail);

  if (error) {
    console.error("Delete failed:", error);
    return;
  }

  notes.update(current => current.filter(n => n.id !== id));
  cache.invalidateUser(userEmail);
}

export async function togglePin(id: number, pinned: boolean, userEmail: string) {
  await supabase
    .from('notes')
    .update({ pinned: !pinned })
    .eq('id', id)
    .eq('user_email', userEmail);

  notes.update(current => current.map(note => note.id === id ? { ...note, pinned: !pinned } : note));
  cache.invalidateUser(userEmail);
}

export async function updateNoteImageUrl(id: number, imageUrl: string, userEmail: string) {
  await supabase
    .from('notes')
    .update({ image: imageUrl, color: 'transparent' })
    .eq('id', id)
    .eq('user_email', userEmail);

  notes.update(current => 
    current.map(note => note.id === id ? { ...note, image: imageUrl, color: 'transparent' } : note)
  );
  cache.invalidateUser(userEmail);
}

