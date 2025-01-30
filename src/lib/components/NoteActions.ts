// noteService.ts
import { supabase } from './Supabase';
import { notes } from '../../Store/store';

export async function loadPinnedNotes(userEmail: string) {
  const { data } = await supabase.from('notes')
    .select('*')
    .eq('user_email', userEmail)
    .eq('pinned', true)
    .eq('trashed', false)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (data) {
    notes.update(current => {
      const otherNotes = current.filter(n =>
        !n.pinned || n.trashed || n.archived
      );
      return [...data, ...otherNotes]; // Combine pinned notes with non-pinned ones
    });
  }
}

export async function loadNotes(userEmail: string) {
  const { data } = await supabase.from('notes')
    .select('*')
    .eq('user_email', userEmail)
    .eq('trashed', false)
    .eq('archived', false)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (data) notes.set(data);
}

export async function addNote(newTitle: string, newContent: string, newColor: string, selectedImage: File | string | null, userEmail: string, newPinned: boolean) {
  if (newTitle.trim() && newContent.trim()) {
    let imageUrl: string | null = null;

    try {
      // Handle file upload
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

      // Optimistically update the store
      notes.update(current => [...current, data[0]]);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${(error as Error).message}`);
    }
  }
}

export async function updateNoteImage(id: number, file: File) {
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

    // Update the note in the store
    notes.update(current => 
      current.map(note => note.id === id ? { ...note, image: urlData.publicUrl } : note)
    );
  } catch (error) {
    console.error('Image update failed:', error);
    alert('Image update failed.');
  }
}

export async function removeNoteImage(id: number) {
  await supabase
    .from('notes')
    .update({ image: null })
    .eq('id', id);
  
  // Update the note in the store
  notes.update(current => 
    current.map(note => note.id === id ? { ...note, image: null } : note)
  );
}

export async function trashNote(id: number) {
  await supabase
    .from('notes')
    .update({ trashed: true })
    .eq('id', id);

  // Remove the trashed note from the store
  notes.update(current => current.filter(n => n.id !== id));
}

export async function archiveNote(id: number) {
  await supabase
    .from('notes')
    .update({ archived: true })
    .eq('id', id);

  // Remove the archived note from the store
  notes.update(current => current.filter(n => n.id !== id));
}

export async function updateNote(id: number, title: string, content: string, userEmail: string) {
  const { data, error } = await supabase
    .from('notes')
    .update({ title, content })
    .eq('id', id)
    .eq('user_email', userEmail)
    .select(); // Ensure data is returned after update

  if (error) {
    console.error("Update failed:", error);
    return;
  }

  console.log("Updated note:", data);

  notes.update(current => current.map(note => 
    note.id === id ? { ...note, title, content } : note
  ));
}


export async function changeNoteColor(id: number, color: string , userEmail: string) {
  await supabase
    .from('notes')
    .update({ color, image: null })
    .eq('id', id)
    .eq('user_email', userEmail);

  // Update the note color in the store
  notes.update(current => 
    current.map(note => note.id === id ? { ...note, color, image: null } : note)
  );
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

  console.log("Deleted note:", id);
  
  // Instead of updating manually, reload the notes
  await loadNotes(userEmail);
}


export async function togglePin(id: number, pinned: boolean , userEmail: string) {
  await supabase
    .from('notes')
    .update({ pinned: !pinned })
    .eq('id', id)
    .eq('user_email', userEmail);

  // Update the pinned state in the store
  notes.update(current => current.map(note => note.id === id ? { ...note, pinned: !pinned } : note));
}

export async function updateNoteImageUrl(id: number, imageUrl: string , userEmail: string) {
  await supabase
    .from('notes')
    .update({ image: imageUrl, color: 'transparent' })
    .eq('id', id)
    .eq('user_email', userEmail);

  // Update the image URL in the store
  notes.update(current => 
    current.map(note => note.id === id ? { ...note, image: imageUrl, color: 'transparent' } : note)
  );
}
